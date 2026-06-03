/**
 * `<ImageControl>` — the WP Media Library image picker (WEAVE-WP-08, UI-SPEC §Image Control Spec).
 *
 * Wraps `MediaUploadCheck` + `MediaUpload` (`@wordpress/media-utils`) and persists the richer
 * `{ id, url }` attachment shape (D-11 / OQ2 — the value shape made first-class in `@weave/react`'s
 * input-registry in Plan 05) via `onChange`:
 *   - select  → `onChange({ id: media.id, url: media.url })`
 *   - remove  → `onChange({ id: null, url: '' })`
 *
 * Affordances follow the UI-SPEC Copywriting Contract verbatim: a preview `<img>` + 'Replace Image'
 * + 'Remove' when a url is present; 'Select Image' alone when empty. The outer `<BaseControl>`
 * carries `input.label` for a visible field label consistent with the other FieldControl widgets.
 *
 * The live Media Library modal is a WP runtime feature — automated coverage mocks `MediaUpload`
 * (see __tests__/__mocks__/wordpress.ts) and asserts only this value contract; the real picker is
 * manual / wp-env verification (04B-VALIDATION).
 */

import type { ReactNode } from 'react';
import type { WeaveInput } from '@weave/react';
import { BaseControl, Button } from '@wordpress/components';
// `MediaUpload` + `MediaUploadCheck` are provided by WP at runtime and aliased to the jsdom stub
// under test. The published `@wordpress/media-utils@5.x` `.d.ts` is incomplete — `MediaUpload` is a
// bare `Component` with no typed props and `MediaUploadCheck` isn't re-exported there — so we import
// the runtime values and apply our own prop contracts (the WEAVE-WP-08 surface) below. This keeps
// strict typing on the props WE pass without leaking `any` into the JSX.
import * as MediaUtils from '@wordpress/media-utils';

/** The stored image value: attachment id + full URL (cleared = `{ id: null, url: '' }`). */
export interface ImageValue {
  id: number | null;
  url: string;
}

/** Minimal selected-media shape MediaUpload hands to `onSelect` (id + url is all Weave stores). */
interface SelectedMedia {
  id: number;
  url: string;
}

/** The subset of the WP `MediaUpload` prop surface this control uses (WEAVE-WP-08). */
interface MediaUploadProps {
  onSelect: (media: SelectedMedia) => void;
  allowedTypes: string[];
  value?: number;
  render: (args: { open: () => void }) => ReactNode;
}

const MediaUpload = MediaUtils.MediaUpload as unknown as (props: MediaUploadProps) => ReactNode;
const MediaUploadCheck = (
  MediaUtils as unknown as { MediaUploadCheck: (props: { children: ReactNode }) => ReactNode }
).MediaUploadCheck;

export interface ImageControlProps {
  input: WeaveInput;
  value: ImageValue | undefined;
  onChange: (value: ImageValue) => void;
}

/** Render the Media Library picker for one `image` field, persisting `{ id, url }`. */
export function ImageControl({ input, value, onChange }: ImageControlProps) {
  const url = value?.url ?? '';

  return (
    <BaseControl label={input.label}>
      <MediaUploadCheck>
        <MediaUpload
          onSelect={(media) => onChange({ id: media.id, url: media.url })}
          allowedTypes={['image']}
          value={value?.id ?? undefined}
          render={({ open }) => (
            <>
              {url && (
                <img
                  src={url}
                  alt=""
                  style={{ maxWidth: '100%', height: 'auto', marginBottom: 8 }}
                />
              )}
              <Button variant="secondary" onClick={open}>
                {url ? 'Replace Image' : 'Select Image'}
              </Button>
              {url && (
                <Button
                  variant="link"
                  isDestructive
                  onClick={() => onChange({ id: null, url: '' })}
                  style={{ marginLeft: 8 }}
                >
                  Remove
                </Button>
              )}
            </>
          )}
        />
      </MediaUploadCheck>
    </BaseControl>
  );
}
