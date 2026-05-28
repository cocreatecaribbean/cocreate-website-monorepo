export function insertAtTextareaCursor(
  textarea: HTMLTextAreaElement | null,
  snippet: string,
  value: string,
  setValue: (next: string) => void,
) {
  if (!textarea) {
    setValue(value + snippet)
    return
  }
  const start = textarea.selectionStart ?? value.length
  const end = textarea.selectionEnd ?? value.length
  const next = value.slice(0, start) + snippet + value.slice(end)
  setValue(next)
  const caret = start + snippet.length
  requestAnimationFrame(() => {
    textarea.focus()
    textarea.setSelectionRange(caret, caret)
  })
}
