/**
 * Design token formatters.
 *
 * Source tokens follow the W3C Design Tokens (DTCG) shape: nested groups whose
 * leaves carry `$type` and `$value`. Each formatter renders the same flat list
 * for one platform; `scripts/build-tokens.ts` writes the results to `dist/tokens/`.
 */

export interface ColorToken {
  /** Path from the root group, e.g. `['color', 'brand', 'primary']`. */
  path: string[];
  /** Hex color, always `#RRGGBB` upper case. */
  value: string;
}

export interface BuildContext {
  version: string;
}

export interface TokenOutput {
  platform: 'web' | 'android' | 'ios';
  file: string;
  render: (tokens: readonly ColorToken[], context: BuildContext) => string;
}

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function flattenColorTokens(tree: unknown, path: string[] = []): ColorToken[] {
  if (!isRecord(tree)) {
    throw new TypeError(`Invalid token group at "${path.join('.') || '<root>'}"`);
  }

  if ('$value' in tree) {
    const value = tree.$value;
    if (tree.$type !== 'color' || typeof value !== 'string' || !HEX_COLOR.test(value)) {
      throw new TypeError(`Token "${path.join('.')}" must be a color in #RRGGBB format`);
    }
    return [{ path, value: value.toUpperCase() }];
  }

  return Object.entries(tree)
    .filter(([key]) => !key.startsWith('$'))
    .flatMap(([key, child]) => flattenColorTokens(child, [...path, key]));
}

export const toKebabCase = (path: readonly string[]): string => path.join('-');

export const toSnakeCase = (path: readonly string[]): string => path.join('_');

export const toCamelCase = (path: readonly string[]): string =>
  path
    .map((segment, index) => (index === 0 ? segment : segment[0]!.toUpperCase() + segment.slice(1)))
    .join('');

const header = (comment: string, { version }: BuildContext): string =>
  `${comment} Design tokens v${version} — gerado automaticamente por cicd-create-tokens. Não edite à mão.`;

export function toCss(tokens: readonly ColorToken[], context: BuildContext): string {
  const lines = tokens.map((token) => `  --${toKebabCase(token.path)}: ${token.value};`);
  return `/* ${header('', context).trim()} */\n:root {\n${lines.join('\n')}\n}\n`;
}

export function toJson(tokens: readonly ColorToken[], { version }: BuildContext): string {
  const values = Object.fromEntries(tokens.map((token) => [toKebabCase(token.path), token.value]));
  return `${JSON.stringify({ version, tokens: values }, null, 2)}\n`;
}

export function toAndroidXml(tokens: readonly ColorToken[], context: BuildContext): string {
  const lines = tokens.map((token) => `    <color name="${toSnakeCase(token.path)}">${token.value}</color>`);
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    `<!-- ${header('', context).trim()} -->`,
    '<resources>',
    ...lines,
    '</resources>',
    '',
  ].join('\n');
}

const toUnitChannel = (hex: string): string => (parseInt(hex, 16) / 255).toFixed(3);

export function toSwift(tokens: readonly ColorToken[], context: BuildContext): string {
  const lines = tokens.map((token) => {
    const [r, g, b] = [1, 3, 5].map((start) => toUnitChannel(token.value.slice(start, start + 2)));
    return `    public static let ${toCamelCase(token.path)} = Color(red: ${r!}, green: ${g!}, blue: ${b!})`;
  });
  return [
    header('//', context),
    '',
    'import SwiftUI',
    '',
    'public enum DesignTokens {',
    ...lines,
    '}',
    '',
  ].join('\n');
}

export const outputs: readonly TokenOutput[] = [
  { platform: 'web', file: 'web/tokens.css', render: toCss },
  { platform: 'web', file: 'web/tokens.json', render: toJson },
  { platform: 'android', file: 'android/values/colors.xml', render: toAndroidXml },
  { platform: 'ios', file: 'ios/DesignTokens.swift', render: toSwift },
];
