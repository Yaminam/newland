// Text normalization helpers for LLM-generated and scraped content.
//
// These are a defensive layer. LLM system prompts throughout the backend are
// told not to emit markdown / em-dashes / asterisks, but the model is not
// perfectly reliable and some rows in the DB were written before the rules
// existed. Anywhere we render untrusted prose into the UI, we run it through
// one of these first so `**foo**`, `# heading`, and `—` never leak onto the
// screen as raw glyphs.

/**
 * Clean LLM/scraped text: strip the markdown artifacts that are almost never
 * intended as literal glyphs (em/en dashes, hashtag headings, backticks, code
 * fences). Preserves `**bold**` markers because some renderers intentionally
 * upgrade them to `<strong>` — if you want plain text out, use stripMarkdown.
 */
export function sanitizeReply(raw: string | null | undefined): string {
  if (!raw) return ''
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/[—–]/g, '-')                                    // em/en dash -> hyphen
    .replace(/^\s*#{1,6}\s+/gm, '')                           // strip leading "# " headings
    .replace(/`{3}[\s\S]*?`{3}/g, m => m.replace(/`/g, ''))   // strip code fences
    .replace(/`([^`]+)`/g, '$1')                              // strip inline backticks
}

/**
 * Plain-text variant: sanitizeReply, plus strips `**bold**` and `*italic*`
 * markers since most non-chat surfaces don't convert them. Use this for
 * descriptions, summaries, theses, and bios inline in cards.
 */
export function stripMarkdown(raw: string | null | undefined): string {
  if (!raw) return ''
  return sanitizeReply(raw)
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '$1')
}
