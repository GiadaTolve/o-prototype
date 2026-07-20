/** Inserisce tag BBCode attorno alla selezione corrente di una textarea. */
export function insertBbcodeTag(
  textarea: HTMLTextAreaElement,
  value: string,
  openTag: string,
  closeTag: string,
): string {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.substring(start, end);
  const next = value.substring(0, start) + openTag + selected + closeTag + value.substring(end);

  const cursorStart = start + openTag.length;
  const cursorEnd = cursorStart + selected.length;

  requestAnimationFrame(() => {
    textarea.focus();
    textarea.setSelectionRange(cursorStart, cursorEnd);
  });

  return next;
}
