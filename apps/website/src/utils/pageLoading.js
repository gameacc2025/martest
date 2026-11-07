const DEFAULT_MINIMUM_VISIBLE_MS = 420

export function createPageLoadingController({
  documentRef = typeof document === 'undefined' ? null : document,
  minimumVisibleMs = DEFAULT_MINIMUM_VISIBLE_MS,
} = {}) {
  const overlay = documentRef?.getElementById('page-loading')
  let visibleSince = Date.now()
  let hideTimer = null

  function show() {
    if (!overlay) return
    if (hideTimer !== null) {
      clearTimeout(hideTimer)
      hideTimer = null
    }

    visibleSince = Date.now()
    overlay.classList.remove('is-hidden')
    overlay.setAttribute('aria-hidden', 'false')
    documentRef.getElementById('app')?.setAttribute('aria-busy', 'true')
  }

  function hide({ immediate = false } = {}) {
    if (!overlay) return
    if (hideTimer !== null) clearTimeout(hideTimer)

    const elapsed = Date.now() - visibleSince
    const delay = immediate ? 0 : Math.max(0, minimumVisibleMs - elapsed)

    hideTimer = setTimeout(() => {
      overlay.classList.add('is-hidden')
      overlay.setAttribute('aria-hidden', 'true')
      documentRef.getElementById('app')?.setAttribute('aria-busy', 'false')
      hideTimer = null
    }, delay)
  }

  return { show, hide }
}
