import 'server-only';

/**
 * `@weave/next/server-page` — async Server Component entry (WEAVE-NEXT-02).
 *
 * Re-exports `<WeavePage slug>` which awaits `loadPageConfig` and renders via
 * `@weave/react`'s `<SectionRenderer>`. This subpath pulls the `@weave/react`
 * package barrel (`import 'client-only'`) and must NOT be imported from the
 * same module graph as `@weave/next/server` loader-only APIs in a Server
 * Component — use `loadPageConfig` + a Client Component wrapper instead
 * (see examples/minimal-app/components/weave-page-sections.tsx).
 *
 * Pilot/templates that want the all-in-one server component import from here.
 */

export { WeavePage } from './weave-page.js';
