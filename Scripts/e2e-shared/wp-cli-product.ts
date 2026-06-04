import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

function resolveWpEnvBin(repoRoot: string): string {
  const require = createRequire(path.join(repoRoot, 'package.json'));
  return path.join(path.dirname(require.resolve('@wordpress/env/package.json')), 'bin', 'wp-env');
}

/** Rename a WooCommerce product via wp-env wp-cli (requires Docker + `pnpm wp:setup`). */
export function updateProductTitleViaWpCli(
  repoRoot: string,
  productId: string,
  title: string,
): void {
  const wpEnvBin = resolveWpEnvBin(repoRoot);
  const res = spawnSync(
    process.execPath,
    [
      wpEnvBin,
      'run',
      'cli',
      'wp',
      'wc',
      'product',
      'update',
      productId,
      `--name=${title}`,
      '--user=1',
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  if (res.error) {
    throw res.error;
  }
  if (res.status !== 0) {
    process.stderr.write(res.stdout ?? '');
    process.stderr.write(res.stderr ?? '');
    throw new Error(`wp wc product update ${productId} exited with ${res.status}`);
  }

  const flush = spawnSync(
    process.execPath,
    [wpEnvBin, 'run', 'cli', 'wp', 'cache', 'flush', '--user=1'],
    { cwd: repoRoot, encoding: 'utf8' },
  );
  if (flush.status !== 0) {
    process.stderr.write(flush.stdout ?? '');
    process.stderr.write(flush.stderr ?? '');
    throw new Error(`wp cache flush exited with ${flush.status}`);
  }
}
