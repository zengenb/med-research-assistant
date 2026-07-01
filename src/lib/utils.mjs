export function cleanText(value) {
  if (value == null) return null;
  const text = String(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  return text || null;
}

export function normalizeDoi(value) {
  const text = cleanText(value)?.toLowerCase();
  if (!text) return null;
  return text
    .replace(/^https?:\/\/(?:dx\.)?doi\.org\//, "")
    .replace(/^doi:\s*/, "")
    .replace(/[\s.,;]+$/, "") || null;
}

export function normalizeTitle(value) {
  return cleanText(value)
    ?.normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim() || null;
}

export function publicationYear(value) {
  const match = String(value || "").match(/(?:19|20)\d{2}/);
  return match ? Number(match[0]) : null;
}

export function identifierKey(item) {
  if (item.doi) return `doi:${normalizeDoi(item.doi)}`;
  if (item.pmid) return `pmid:${item.pmid}`;
  if (item.nct_id) return `nct:${item.nct_id}`;
  return `title:${normalizeTitle(item.title)}`;
}

function lexicalRelevance(item, query) {
  const stop = new Set(["and", "or", "not", "the", "a", "an", "of", "in", "on", "for", "to", "with"]);
  const terms = [...new Set(
    String(query || "")
      .normalize("NFKC")
      .toLowerCase()
      .match(/[\p{L}\p{N}]+/gu)
      ?.filter((term) => term.length > 1 && !stop.has(term)) || [],
  )];
  if (!terms.length) return 0;
  const title = normalizeTitle(item.title) || "";
  const abstract = normalizeTitle(item.abstract) || "";
  let weightedHits = 0;
  for (const term of terms) {
    if (title.includes(term)) weightedHits += 2;
    else if (abstract.includes(term)) weightedHits += 1;
  }
  return weightedHits / (terms.length * 2);
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function mergeItem(existing, incoming) {
  const merged = { ...existing };
  for (const [key, value] of Object.entries(incoming)) {
    if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) continue;
    if (Array.isArray(value)) merged[key] = unique([...(merged[key] || []), ...value]);
    else if (merged[key] == null || merged[key] === "") merged[key] = value;
    else if (key === "abstract" && String(value).length > String(merged[key]).length) merged[key] = value;
  }
  merged.sources = unique([...(existing.sources || [existing.source]), ...(incoming.sources || [incoming.source])]);
  return merged;
}

export function dedupeAndRank(sourceLists, limit = 20, query = "") {
  const map = new Map();
  for (const { source, results } of sourceLists) {
    results.forEach((raw, index) => {
      const item = {
        ...raw,
        source,
        sources: unique([...(raw.sources || []), source]),
      };
      const key = identifierKey(item);
      const rrf = 1 / (60 + index + 1);
      if (!map.has(key)) map.set(key, { item, score: rrf });
      else {
        const current = map.get(key);
        current.item = mergeItem(current.item, item);
        current.score += rrf;
      }
    });
  }
  return [...map.values()]
    .map((entry) => ({ ...entry, score: entry.score + lexicalRelevance(entry.item, query) * 0.05 }))
    .sort((a, b) => b.score - a.score || (b.item.year || 0) - (a.item.year || 0))
    .slice(0, limit)
    .map(({ item, score }, index) => ({
      ...item,
      rank: index + 1,
      retrieval_score: Number(score.toFixed(6)),
    }));
}

export function compactObject(value) {
  if (Array.isArray(value)) return value.map(compactObject).filter((item) => item != null);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .map(([key, item]) => [key, compactObject(item)])
        .filter(([, item]) => item != null && item !== "" && (!Array.isArray(item) || item.length > 0)),
    );
  }
  return value == null ? null : value;
}
