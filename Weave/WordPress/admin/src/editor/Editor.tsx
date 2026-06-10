/**
 * `<Editor>` — the WP Admin editor shell (WEAVE-WP-07, D-08).
 *
 * Wires the D-08 server/local state split:
 *   - TanStack Query `useQuery(['weave-page', slug], () => loadPage(slug))` loads the config on
 *     mount; on success the config's sections are synced into the zustand store (`setSections`,
 *     which clears `dirty`). TanStack Query v5 has no `onSuccess` on `useQuery`, so the sync runs
 *     in an effect keyed on the resolved data.
 *   - `useMutation` PUTs the assembled `WeavePageConfig` on Save; `onMutate` flips `saving`,
 *     `onSuccess` clears `dirty` + shows a 3s success notice, `onError` shows an error notice.
 *
 * Renders the UI-SPEC §States: loading → `<Spinner>`; load error → error `<Notice>` + Retry;
 * otherwise a `<Panel>` with the dirty warning notice, the `<SectionList>`, and the Save button.
 * Copy is verbatim from the UI-SPEC Copywriting Contract.
 */

import type { WeavePageConfig } from '@weave-platform/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Button, Notice, Panel, Spinner } from '@wordpress/components';
import { useEffect } from 'react';
import { loadPage, savePage } from '../api/page-config';
import { useEditorStore } from '../store/editor-store';
import { SectionList } from './SectionList';

/** Editor shell props — the page slug resolved from `?slug=` by the bootstrap (OQ3). */
export interface EditorProps {
  slug: string;
}

/** Pull `error.message` (or a String fallback) for a user-facing notice. */
function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function Editor({ slug }: EditorProps) {
  const sections = useEditorStore((s) => s.sections);
  const dirty = useEditorStore((s) => s.dirty);
  const saving = useEditorStore((s) => s.saving);
  const notice = useEditorStore((s) => s.notice);
  const setSections = useEditorStore((s) => s.setSections);
  const setDirty = useEditorStore((s) => s.setDirty);
  const setSaving = useEditorStore((s) => s.setSaving);
  const setNotice = useEditorStore((s) => s.setNotice);

  const query = useQuery<WeavePageConfig>({
    queryKey: ['weave-page', slug],
    queryFn: () => loadPage(slug),
  });

  // v5 has no useQuery onSuccess — sync the loaded config into the store via an effect.
  useEffect(() => {
    if (query.data) {
      setSections(query.data.sections);
    }
  }, [query.data, setSections]);

  const mutation = useMutation({
    mutationFn: (config: WeavePageConfig) => savePage(slug, config),
    onMutate: () => {
      setSaving(true);
      setNotice(null);
    },
    onSuccess: () => {
      setDirty(false);
      setSaving(false);
      setNotice({ status: 'success', message: 'Page saved.' });
      setTimeout(() => setNotice(null), 3000);
    },
    onError: (error: unknown) => {
      setSaving(false);
      setNotice({
        status: 'error',
        message: `Save failed — ${messageOf(error)}. Try again.`,
      });
    },
  });

  function handleSave() {
    const config: WeavePageConfig = {
      schemaVersion: 1,
      slug,
      sections,
      updatedAt: new Date().toISOString(),
    };
    mutation.mutate(config);
  }

  if (query.isPending) {
    return (
      <Panel>
        <Spinner />
      </Panel>
    );
  }

  if (query.isError) {
    return (
      <Panel>
        <Notice status="error" isDismissible={false}>
          Could not load page config — {messageOf(query.error)}.{' '}
          <Button variant="link" onClick={() => query.refetch()}>
            Retry
          </Button>
        </Notice>
      </Panel>
    );
  }

  return (
    <Panel>
      {notice && (
        <Notice status={notice.status as 'success' | 'error' | 'warning' | 'info'} isDismissible>
          {notice.message}
        </Notice>
      )}
      {dirty && (
        <Notice status="warning" isDismissible={false}>
          You have unsaved changes.
        </Notice>
      )}
      <SectionList />
      <div style={{ marginTop: 24 }}>
        <Button variant="primary" isBusy={saving} disabled={saving} onClick={handleSave}>
          Save Page
        </Button>
      </div>
    </Panel>
  );
}
