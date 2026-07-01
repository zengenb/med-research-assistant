# Evidence workflow reference

## Search record

Record the database/source, exact query, date and timezone, filters, result count, export count, deduplication rule, and access limitations. Preserve raw exports when the work must be reproducible.

## Minimum evidence table

| Field | Required content |
|---|---|
| Identifier | DOI, PMID, PMCID, NCT ID, or stable URL |
| Citation | Title, authors, year, journal/source |
| Design | RCT, cohort, case-control, cross-sectional, diagnostic, qualitative, review, guideline, preprint |
| Population | Inclusion criteria, setting, sample size, baseline features |
| Intervention/exposure | Operational definition, dose/intensity, duration |
| Comparator | Control or reference condition |
| Outcomes | Prespecified outcome and measurement time |
| Effect | Effect estimate, confidence/credible interval, exact denominator |
| Validity | Bias concerns, missing data, confounding, multiplicity, applicability |
| Location | Page, table, figure, supplement, registry section |

## Appraisal routing

- Randomized trials: examine allocation, concealment, deviations, missing data, outcome measurement, and selective reporting.
- Nonrandomized intervention studies: examine confounding, participant selection, intervention classification, deviations, missing data, measurement, and reporting.
- Diagnostic studies: examine patient selection, index test, reference standard, flow, and timing.
- Systematic reviews: examine protocol, search coverage, duplicate assessment, exclusions, bias appraisal, synthesis choice, heterogeneity, and reporting bias.
- Guidelines: examine scope, stakeholder involvement, evidence methods, recommendation development, applicability, editorial independence, and update status.

Do not assign a formal tool score unless the required fields are present. State `insufficient information` instead of guessing.

## Synthesis rules

1. Group studies by question, design, population, intervention/exposure, and outcome definition before comparing results.
2. Report direction, magnitude, uncertainty, heterogeneity, and study limitations separately.
3. Distinguish absence of evidence from evidence of no effect.
4. Label post hoc, subgroup, surrogate, observational, and preprint evidence.
5. Reconcile registry and publication discrepancies explicitly.
6. End with what is known, what remains uncertain, and what additional evidence would change the conclusion.
