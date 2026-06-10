'use client';

import { SectionRenderer, type WeavePageConfig } from '@weave-platform/react';

import '../lib/register-weave-sections';

export function WeaveInputMatrixSections({ config }: { config: WeavePageConfig }) {
  return <SectionRenderer config={config} />;
}
