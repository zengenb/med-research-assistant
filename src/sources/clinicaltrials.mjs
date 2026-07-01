import { requestJson } from "../lib/http.mjs";
import { cleanText } from "../lib/utils.mjs";

export function mapClinicalTrial(study) {
  const protocol = study.protocolSection || {};
  const identification = protocol.identificationModule || {};
  const status = protocol.statusModule || {};
  const design = protocol.designModule || {};
  const conditions = protocol.conditionsModule || {};
  const nctId = identification.nctId;
  return {
    id: nctId,
    nct_id: nctId,
    title: cleanText(identification.officialTitle || identification.briefTitle),
    status: status.overallStatus || null,
    study_type: design.studyType || null,
    phases: design.phases || [],
    conditions: conditions.conditions || [],
    interventions: (protocol.armsInterventionsModule?.interventions || []).map((item) => cleanText(item.name)).filter(Boolean),
    start_date: status.startDateStruct?.date || null,
    completion_date: status.completionDateStruct?.date || null,
    sponsor: cleanText(protocol.sponsorCollaboratorsModule?.leadSponsor?.name),
    url: nctId ? `https://clinicaltrials.gov/study/${nctId}` : null,
  };
}

export async function searchClinicalTrials(query, options = {}) {
  const limit = Math.min(Math.max(Number(options.limit || 10), 1), 100);
  const params = new URLSearchParams({
    "query.term": query,
    pageSize: String(limit),
    format: "json",
    countTotal: "true",
  });
  const data = await requestJson(`https://clinicaltrials.gov/api/v2/studies?${params}`);
  return {
    total_count: data.totalCount ?? null,
    studies: (data.studies || []).map(mapClinicalTrial),
  };
}
