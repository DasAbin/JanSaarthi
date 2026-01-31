export function truncateText(text: string, maxChars = 4000): string {
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "…";
}

