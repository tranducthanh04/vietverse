import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Whether the app has already rendered its first route.
 *
 * Shared across every layout instance so that a client-side navigation into a
 * *different* layout (e.g. public → kids) still counts as a navigation, while
 * the very first page load does not. A per-component ref could not tell these
 * apart because a fresh layout mount always looks like a "first render".
 *
 * Reset only from tests via {@link resetMainFocusTracking}.
 */
let hasRenderedInitialRoute = false;

/** Test-only: forget that the first route has rendered. */
export function resetMainFocusTracking(): void {
  hasRenderedInitialRoute = false;
}

/**
 * After a client-side route change, move keyboard focus to
 * `<main id="main-content">` — which every layout renders with `tabIndex={-1}`
 * and `focus:outline-none` — so screen-reader and keyboard users start at the
 * new page instead of staying wherever the previous page left them.
 *
 * Deliberately skips:
 * - the first page load (focus belongs at the top / skip-link, and the browser
 *   must not scroll on load);
 * - query-string/hash-only changes within the same page (the effect only reruns
 *   when `pathname` changes);
 * - any moment a modal dialog is open, so it never pulls focus out of a dialog.
 *
 * If no `#main-content` exists (standalone pages such as onboarding or the
 * lesson player), the call is a harmless no-op.
 */
export function useFocusMainOnRouteChange(): void {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!hasRenderedInitialRoute) {
      hasRenderedInitialRoute = true;
      return;
    }
    // A modal traps focus; never yank it out mid-dialog.
    if (document.querySelector('[aria-modal="true"]')) return;
    document.getElementById('main-content')?.focus();
  }, [pathname]);
}
