export function countWordsFromHtml(html: string): number {
  const text = html.replace(/<[^>]*>/g, " ").trim();
  return text.length === 0 ? 0 : text.split(/\s+/).length;
}

export function countWordsFromText(text: string): number {
  const trimmed = text.trim();
  return trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;
}