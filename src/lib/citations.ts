// Stored citations are produced by formatAmaCitation() in app/actions/sessions.ts
// as "Authors. Title. Journal. Year;Vol(Issue):pages.", but admins may also
// paste custom strings. Parse best-effort and fall back to the original.
export function formatShortCitation(
  full: string | null | undefined,
  title: string | null | undefined,
): string | null {
  if (!full) return null;

  const authorChunk = full.split(".")[0]?.trim() ?? "";
  const firstAuthorToken = authorChunk.split(",")[0]?.trim() ?? "";
  const firstAuthor = firstAuthorToken.split(/\s+/)[0] ?? "";
  const hasMultiple =
    authorChunk.includes(",") || /et al/i.test(authorChunk);

  const yearMatch = full.match(/\b(19|20)\d{2}\b/);
  const year = yearMatch ? yearMatch[0] : "";

  let journal = "";
  if (title) {
    const cleanTitle = title.replace(/\.\s*$/, "");
    const idx = full.indexOf(cleanTitle);
    if (idx >= 0) {
      const after = full.slice(idx + cleanTitle.length);
      const match = after.match(/\.\s*([^.]+?)\./);
      if (match) journal = match[1].trim();
    }
  }

  const parts: string[] = [];
  if (firstAuthor) parts.push(hasMultiple ? `${firstAuthor} et al.` : firstAuthor);
  if (journal && year) parts.push(`${journal} ${year}`);
  else if (journal) parts.push(journal);
  else if (year) parts.push(year);

  return parts.length ? parts.join(", ") : full;
}
