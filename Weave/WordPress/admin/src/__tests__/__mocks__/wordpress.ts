/**
 * Single-file stub for ALL `@wordpress/*` imports under the jsdom test harness.
 *
 * vitest.config.ts aliases every `@wordpress/*` specifier
 * (`components`, `element`, `api-fetch`, `media-utils`, `icons`, `i18n`)
 * to THIS module. Because every specifier resolves here, the file exports the UNION
 * of every name those packages provide plus a `default` export (for `@wordpress/api-fetch`,
 * whose real shape is a default-exported function). Each component stub renders predictable
 * DOM (carrying its label/value as text or data-attributes) so tests can assert which control
 * rendered without the real WP runtime, which is provided by WordPress in production and is
 * absent in jsdom.
 *
 * These are deliberately light: they cover the surface the Plan 06–08 form-mapping and store
 * code touches. Extend here (not in individual tests) when a new `@wordpress/*` export is used.
 */

import {
  type ChangeEvent,
  createElement,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { vi } from 'vitest';

// ---------------------------------------------------------------------------
// @wordpress/element — WP re-exports React. Mirror the surface the editor uses.
// ---------------------------------------------------------------------------
export {
  createElement,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
export { Fragment, StrictMode } from 'react';
export { createRoot } from 'react-dom/client';

// ---------------------------------------------------------------------------
// @wordpress/components — light DOM-rendering stubs.
// Each renders an element carrying its label/value so tests can assert presence.
// ---------------------------------------------------------------------------
interface ControlProps {
  label?: string;
  value?: unknown;
  checked?: boolean;
  help?: string;
  onChange?: (value: unknown) => void;
  options?: { label: string; value: string }[];
  children?: ReactNode;
  [key: string]: unknown;
}

export function TextControl({ label, value, onChange }: ControlProps) {
  return createElement('input', {
    type: 'text',
    'aria-label': label,
    'data-wp-control': 'TextControl',
    value: (value as string) ?? '',
    onChange: (e: ChangeEvent<HTMLInputElement>) => onChange?.(e.target.value),
  });
}

export function TextareaControl({ label, value, onChange }: ControlProps) {
  return createElement('textarea', {
    'aria-label': label,
    'data-wp-control': 'TextareaControl',
    value: (value as string) ?? '',
    onChange: (e: ChangeEvent<HTMLTextAreaElement>) => onChange?.(e.target.value),
  });
}

export function SelectControl({ label, value, options, onChange }: ControlProps) {
  return createElement(
    'select',
    {
      'aria-label': label,
      'data-wp-control': 'SelectControl',
      value: (value as string) ?? '',
      onChange: (e: ChangeEvent<HTMLSelectElement>) => onChange?.(e.target.value),
    },
    (options ?? []).map((o) =>
      createElement('option', { key: o.value, value: o.value }, o.label),
    ),
  );
}

export function ToggleControl({ label, checked, onChange }: ControlProps) {
  return createElement('input', {
    type: 'checkbox',
    'aria-label': label,
    'data-wp-control': 'ToggleControl',
    checked: Boolean(checked),
    onChange: (e: ChangeEvent<HTMLInputElement>) => onChange?.(e.target.checked),
  });
}

export function RangeControl({ label, value, onChange }: ControlProps) {
  return createElement('input', {
    type: 'range',
    'aria-label': label,
    'data-wp-control': 'RangeControl',
    value: (value as number) ?? 0,
    onChange: (e: ChangeEvent<HTMLInputElement>) => onChange?.(Number(e.target.value)),
  });
}

export function NumberControl({ label, value, onChange }: ControlProps) {
  return createElement('input', {
    type: 'number',
    'aria-label': label,
    'data-wp-control': 'NumberControl',
    value: (value as number) ?? 0,
    onChange: (e: ChangeEvent<HTMLInputElement>) => onChange?.(Number(e.target.value)),
  });
}

/** WP exposes the experimental alias too — point it at the same stub. */
export const __experimentalNumberControl = NumberControl;

export function ColorPalette({ value, onChange }: ControlProps) {
  return createElement('div', {
    'data-wp-control': 'ColorPalette',
    'data-value': (value as string) ?? '',
    onClick: () => onChange?.('#000000'),
  });
}

export function Button({ children, onClick, ...rest }: ControlProps) {
  return createElement(
    'button',
    { type: 'button', 'data-wp-control': 'Button', onClick, ...filterDomProps(rest) },
    children,
  );
}

export function BaseControl({ label, children }: ControlProps) {
  return createElement(
    'div',
    { 'data-wp-control': 'BaseControl', 'data-label': label ?? '' },
    children,
  );
}

export function Panel({ children }: ControlProps) {
  return createElement('div', { 'data-wp-control': 'Panel' }, children);
}

export function PanelBody({ title, children }: ControlProps & { title?: string }) {
  return createElement(
    'section',
    { 'data-wp-control': 'PanelBody', 'data-title': title ?? '' },
    children,
  );
}

export function PanelRow({ children }: ControlProps) {
  return createElement('div', { 'data-wp-control': 'PanelRow' }, children);
}

export function Spinner() {
  return createElement('span', { 'data-wp-control': 'Spinner', role: 'progressbar' });
}

export function Notice({
  children,
  status,
}: ControlProps & { status?: string }) {
  return createElement(
    'div',
    { 'data-wp-control': 'Notice', 'data-status': status ?? '', role: 'status' },
    children,
  );
}

export function Icon({ icon }: { icon?: unknown }) {
  return createElement('span', { 'data-wp-control': 'Icon', 'data-icon': String(icon ?? '') });
}

/** Strip non-DOM props so React doesn't warn when spreading WP-only props onto <button>. */
function filterDomProps(props: Record<string, unknown>): Record<string, unknown> {
  const {
    variant: _variant,
    isBusy: _isBusy,
    isDestructive: _isDestructive,
    icon: _icon,
    label: _label,
    __next40pxDefaultSize: _size,
    ...dom
  } = props;
  return dom;
}

// ---------------------------------------------------------------------------
// @wordpress/media-utils — MediaUpload calls render({ open }); open is a vi.fn.
// ---------------------------------------------------------------------------
interface MediaUploadProps {
  render: (args: { open: () => void }) => ReactNode;
  onSelect?: (media: { id: number; url: string }) => void;
}

export function MediaUpload({ render }: MediaUploadProps) {
  const open = vi.fn();
  return createElement('div', { 'data-wp-control': 'MediaUpload' }, render({ open }));
}

export function MediaUploadCheck({ children }: { children?: ReactNode }) {
  return createElement('div', { 'data-wp-control': 'MediaUploadCheck' }, children);
}

// ---------------------------------------------------------------------------
// @wordpress/icons — inert exports (only their identity matters to the editor).
// ---------------------------------------------------------------------------
export const chevronUp = 'chevronUp';
export const chevronDown = 'chevronDown';

// ---------------------------------------------------------------------------
// @wordpress/i18n — identity translators.
// ---------------------------------------------------------------------------
export const __ = (s: string) => s;
export const _x = (s: string) => s;
export const _n = (single: string, plural: string, n: number) => (n === 1 ? single : plural);
export const sprintf = (fmt: string, ...args: unknown[]) =>
  fmt.replace(/%[sd]/g, () => String(args.shift() ?? ''));

// ---------------------------------------------------------------------------
// @wordpress/api-fetch — default-exported function. Stubbed as a vi.fn so the
// editor's load/save calls can be asserted/mocked per test.
// ---------------------------------------------------------------------------
const apiFetch = vi.fn();
export default apiFetch;
