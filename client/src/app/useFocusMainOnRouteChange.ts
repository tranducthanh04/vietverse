import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * The pathname the app first rendered, and whether the user has navigated since.
 *
 * Shared across every layout instance so that a client-side navigation into a
 * *different* layout (e.g. public → kids) still counts as a navigation, while
 * the very first page load does not. Remembering the first pathname (instead of
 * a plain "already rendered" flag) keeps React StrictMode's double-run of the
 * mount effect in dev from being mistaken for a navigation.
 *
 * Reset only from tests via {@link resetMainFocusTracking}.
 */
let initialPathname: string | null = null;
let hasNavigated = false;

/** Test-only: forget that the first route has rendered. */
export function resetMainFocusTracking(): void {
  initialPathname = null;
  hasNavigated = false;
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
 * - any moment a modal dialog is open, so it never pulls focus out of a dialog;
 * - a page that already focused an element inside `<main>` on mount.
 *
 * If no `#main-content` exists (standalone pages such as onboarding or the
 * lesson player), the call is a harmless no-op.
 */
export function useFocusMainOnRouteChange(): void {
  const { pathname } = useLocation();

  useEffect(() => {
    if (initialPathname === null) {
      initialPathname = pathname;
      return;
    }
    if (!hasNavigated && pathname === initialPathname) return;
    hasNavigated = true;
    // A modal traps focus; never yank it out mid-dialog.
    if (document.querySelector('[aria-modal="true"]')) return;
    const main = document.getElementById('main-content');
    // Layout effects run after the page's own effects, so respect a page that
    // already moved focus to something inside <main> when it mounted.
    const active = document.activeElement;
    if (!main || (active && active !== main && main.contains(active))) return;
    main.focus();
  }, [pathname]);
}
