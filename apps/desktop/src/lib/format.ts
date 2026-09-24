const dateFormat = new Intl.DateTimeFormat("nl-NL", { weekday: "long", day: "numeric", month: "long" });

export function formatDate(iso: string | null): string {
  return iso ? dateFormat.format(new Date(`${iso}T00:00:00`)) : "Zonder datum";
}

export function humanise(slug: string): string {
  const words = slug.replace(/-/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}
