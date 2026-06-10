'use client';
import 'client-only';

/**
 * @weave-platform/react/client — the client-only subpath (D-08, D-13).
 *
 * The ONLY client component in @weave-platform/react lives here: <SectionErrorBoundary>.
 * Importing this barrel from a Server Component throws at build time via the
 * `client-only` guard, keeping the RSC-safe main barrel (`@weave-platform/react`) free of
 * client code. <SectionRenderer> (Plan 06) imports the boundary from this subpath
 * and MUST NOT re-export it from the main barrel (RESEARCH §Pitfall 4).
 */
export { SectionErrorBoundary } from './SectionErrorBoundary';
export type {
  SectionErrorBoundaryProps,
  SectionErrorInfo,
  SectionErrorMode,
} from './SectionErrorBoundary';
