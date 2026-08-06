export function parsePageRanges(input: string, pageCount: number): number[] {
  const selected = new Set<number>();
  const parts = input
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    throw new Error("Enter pages, for example 1-3, 5.");
  }

  for (const part of parts) {
    if (part.includes("-")) {
      const [startRaw, endRaw] = part.split("-");
      const start = Number(startRaw);
      const end = Number(endRaw);

      if (
        !Number.isInteger(start) ||
        !Number.isInteger(end) ||
        start < 1 ||
        end < start ||
        end > pageCount
      ) {
        throw new Error(`Invalid page range: ${part}`);
      }

      for (let page = start; page <= end; page += 1) {
        selected.add(page - 1);
      }
      continue;
    }

    const page = Number(part);
    if (!Number.isInteger(page) || page < 1 || page > pageCount) {
      throw new Error(`Invalid page number: ${part}`);
    }
    selected.add(page - 1);
  }

  return Array.from(selected).sort((a, b) => a - b);
}
