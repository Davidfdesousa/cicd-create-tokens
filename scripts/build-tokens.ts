/**
 * Builds the platform files from `tokens/` into `dist/tokens/<platform>/`.
 *
 *   node scripts/build-tokens.ts [--version 1.2.3]
 *
 * Without `--version` it uses the version in package.json. The release pipeline
 * passes the version semantic-release is about to publish.
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { flattenColorTokens, outputs } from '../src/tokens/formatters.ts';

const root = join(import.meta.dirname, '..');
const outDir = join(root, 'dist', 'tokens');

const readJson = async (path: string): Promise<unknown> =>
  JSON.parse(await readFile(path, 'utf8')) as unknown;

const { values } = parseArgs({ options: { version: { type: 'string' } } });
const pkg = (await readJson(join(root, 'package.json'))) as { version: string };
const version = values.version ?? pkg.version;

const tokens = flattenColorTokens(await readJson(join(root, 'tokens', 'colors.json')));

await rm(outDir, { recursive: true, force: true });
for (const output of outputs) {
  const target = join(outDir, output.file);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, output.render(tokens, { version }));
}

console.log(`Design tokens v${version}: ${tokens.length} tokens → ${outputs.length} files in dist/tokens/`);
