const escape = (term: string) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (terms.length === 0) return text;
  const pattern = new RegExp(`(${terms.map(escape).join("|")})`, "gi");

  return text.split(pattern).map((part, i) =>
    i % 2 === 1 ? (
      <mark key={i} className="rounded-sm bg-yellow-200/70 text-inherit dark:bg-yellow-500/30">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}
