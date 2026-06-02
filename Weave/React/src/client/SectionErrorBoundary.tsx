'use client';
import 'client-only';

import { Component, type CSSProperties, type ReactNode } from 'react';

/**
 * SectionErrorBoundary — the ONE client-only piece of @weave/react (D-08).
 *
 * Isolates a single broken section so one failure never crashes the page
 * (WEAVE-SDK-09, Success Criterion #4). Three failure kinds route to the same
 * fallback (D-09, D-10):
 *   - render-throw   → caught via getDerivedStateFromError
 *   - validation     → passed as kind="validation" + issues by <SectionRenderer>
 *   - unknown-type   → passed as kind="unknown-type" by <SectionRenderer>
 *
 * Dev mode renders a self-contained, inline-styled error card (no imported CSS,
 * no className tied to a stylesheet — UI-SPEC §Critical Constraint). Prod mode
 * renders null (graceful silent skip — D-09).
 *
 * `mode` is a serializable prop derived from process.env.NODE_ENV on the server
 * (Plan 06) and passed in — the boundary never reads env itself (RESEARCH §Pattern 7).
 */

export type SectionErrorMode = 'dev' | 'prod';

export interface SectionErrorInfo {
  sectionType: string;
  sectionId: string;
  mode: SectionErrorMode;
  /** Pre-known failure set by <SectionRenderer> (Zod validation / unknown type). */
  kind?: 'validation' | 'unknown-type';
  /** Zod issues, present when kind === 'validation'. */
  issues?: { path: string; message: string }[];
}

export interface SectionErrorBoundaryProps extends SectionErrorInfo {
  children?: ReactNode;
}

interface State {
  caughtMessage: string | null;
}

// --- LOCKED UI-SPEC values (source of truth: 03-UI-SPEC.md) ---------------
// Colors. `var(--token, <hex>)` is an optional cosmetic upgrade that adopts Arc
// tokens when present but never breaks when Arc CSS is absent.
const COLOR_DANGER = 'var(--color-danger, #c61e6c)'; // accent / border / heading / glyph
const COLOR_SURFACE = 'var(--color-danger-surface, #fdecf3)'; // 10% danger tint
const COLOR_TEXT = 'var(--color-text-primary, #1a2332)'; // body text
const COLOR_MUTED = 'var(--color-text-muted, #5a6b82)'; // muted label text

const FONT_SANS = 'ui-sans-serif, system-ui, sans-serif';
const FONT_MONO = 'ui-monospace, "SFMono-Regular", Menlo, monospace';

const cardStyle: CSSProperties = {
  padding: 16,
  background: COLOR_SURFACE,
  border: `1px solid ${COLOR_DANGER}`,
  borderLeft: `4px solid ${COLOR_DANGER}`,
  borderRadius: 6,
  color: COLOR_TEXT,
  fontFamily: FONT_MONO,
  fontSize: 13,
  fontWeight: 400,
  lineHeight: 1.5,
};

const headingStyle: CSSProperties = {
  margin: 0,
  marginBottom: 8,
  color: COLOR_DANGER,
  fontFamily: FONT_SANS,
  fontSize: 14,
  fontWeight: 600,
  lineHeight: 1.2,
};

const rowStyle: CSSProperties = {
  marginBottom: 8,
};

const labelStyle: CSSProperties = {
  marginRight: 4,
  color: COLOR_MUTED,
};

const messageBlockStyle: CSSProperties = {
  marginTop: 12,
};

const issueListStyle: CSSProperties = {
  margin: 0,
  marginTop: 4,
  paddingLeft: 16,
};

const footerStyle: CSSProperties = {
  marginTop: 12,
  color: COLOR_MUTED,
  fontSize: 12,
};

const FOOTER_HINT = 'This card renders in development only. In production this section is skipped.';

export class SectionErrorBoundary extends Component<SectionErrorBoundaryProps, State> {
  state: State = { caughtMessage: null };

  static getDerivedStateFromError(err: unknown): State {
    const message = err instanceof Error ? err.message : String(err);
    return { caughtMessage: message };
  }

  componentDidCatch(): void {
    // No rethrow — the boundary absorbs the error (page-level resilience, D-08).
    // Intentionally a no-op; React already logs the error in dev.
  }

  private renderCard(): ReactNode {
    const { sectionType, sectionId, kind, issues } = this.props;
    const { caughtMessage } = this.state;

    // Resolve message + whether the id / path rows apply, per failure kind.
    if (kind === 'unknown-type') {
      return (
        <div style={cardStyle} role="alert">
          <p style={headingStyle}>⚠ Weave section error</p>
          <div style={rowStyle}>
            <span style={labelStyle}>type:</span>
            <span>{sectionType}</span>
          </div>
          <div style={messageBlockStyle}>Unknown section type: {sectionType}</div>
          <div style={footerStyle}>{FOOTER_HINT}</div>
        </div>
      );
    }

    if (kind === 'validation') {
      const list = issues ?? [];
      const firstPath = list[0]?.path;
      return (
        <div style={cardStyle} role="alert">
          <p style={headingStyle}>⚠ Weave section error</p>
          <div style={rowStyle}>
            <span style={labelStyle}>type:</span>
            <span>{sectionType}</span>
          </div>
          <div style={rowStyle}>
            <span style={labelStyle}>id:</span>
            <span>{sectionId}</span>
          </div>
          {firstPath !== undefined ? (
            <div style={rowStyle}>
              <span style={labelStyle}>path:</span>
              <span>{firstPath}</span>
            </div>
          ) : null}
          <div style={messageBlockStyle}>
            Section data failed validation.
            {list.length > 0 ? (
              <ul style={issueListStyle}>
                {list.map((issue) => (
                  <li key={`${issue.path}:${issue.message}`}>
                    {issue.path}: {issue.message}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div style={footerStyle}>{FOOTER_HINT}</div>
        </div>
      );
    }

    // Caught render-throw (no pre-known kind).
    return (
      <div style={cardStyle} role="alert">
        <p style={headingStyle}>⚠ Weave section error</p>
        <div style={rowStyle}>
          <span style={labelStyle}>type:</span>
          <span>{sectionType}</span>
        </div>
        <div style={rowStyle}>
          <span style={labelStyle}>id:</span>
          <span>{sectionId}</span>
        </div>
        <div style={messageBlockStyle}>Section threw during render: {caughtMessage}</div>
        <div style={footerStyle}>{FOOTER_HINT}</div>
      </div>
    );
  }

  render(): ReactNode {
    const { mode, kind, children } = this.props;
    const { caughtMessage } = this.state;

    const hasFailure = caughtMessage !== null || kind !== undefined;

    if (mode === 'prod') {
      // Graceful silent skip on any failure; otherwise render the section (D-09).
      return hasFailure ? null : children;
    }

    // Dev mode.
    if (!hasFailure) {
      return children;
    }
    return this.renderCard();
  }
}
