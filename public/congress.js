// Only official, identity-verified fields may supplement the curated tracker.
export function applyCongressData(rows, snapshot) {
  if (snapshot?.schemaVersion !== 1 || !snapshot.records) return rows;
  return rows.map((row) => {
    const official = snapshot.records[row.id];
    if (
      official?.status !== "verified" ||
      official.sourceTitle !== row.title ||
      official.id !== row.id
    )
      return row;
    const merged = { ...row, congressData: official };
    if (
      typeof official.officialTitle === "string" &&
      official.officialTitle.trim()
    ) {
      merged.originalTitle = row.originalTitle || row.title;
      merged.title = official.officialTitle.trim();
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(official.introduced || ""))
      merged.introduced = official.introduced;
    for (const field of ["sponsor", "action"])
      if (typeof official[field] === "string" && official[field])
        merged[field] = official[field];
    if (
      Number.isInteger(official.cosponsorCount) &&
      official.cosponsorCount >= 0
    ) {
      merged.cosponsorCount = String(official.cosponsorCount);
      merged.cosponsors =
        typeof official.cosponsors === "string"
          ? official.cosponsors
          : row.cosponsors;
    }
    return merged;
  });
}
