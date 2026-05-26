/** Reset window/document scroll — reliable on iOS native scroll after route changes. */
export function scrollToDocumentTop() {
  if (typeof window === 'undefined') return

  try {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  } catch {
    window.scrollTo(0, 0)
  }

  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0

  const content = document.getElementById('smooth-content')
  if (content && content.scrollTop !== 0) {
    content.scrollTop = 0
  }
}
