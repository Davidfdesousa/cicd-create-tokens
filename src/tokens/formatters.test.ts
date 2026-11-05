import { describe, expect, it } from 'vitest';
import source from '../../tokens/colors.json';
import {
  flattenColorTokens,
  toAndroidXml,
  toCamelCase,
  toCss,
  toJson,
  toSwift,
  type ColorToken,
} from './formatters.ts';

const context = { version: '1.2.3' };
const tokens: ColorToken[] = [
  { path: ['color', 'brand', 'primary'], value: '#6C5CE7' },
  { path: ['color', 'neutral', '0'], value: '#FFFFFF' },
];

describe('flattenColorTokens', () => {
  it('reads every leaf of the source file', () => {
    const result = flattenColorTokens(source);
    expect(result).toHaveLength(10);
    expect(result[0]).toEqual({ path: ['color', 'brand', 'primary'], value: '#6C5CE7' });
  });

  it('normalizes hex values to upper case', () => {
    const result = flattenColorTokens({ a: { $type: 'color', $value: '#abcdef' } });
    expect(result).toEqual([{ path: ['a'], value: '#ABCDEF' }]);
  });

  it('rejects values that are not #RRGGBB colors', () => {
    expect(() => flattenColorTokens({ a: { $type: 'color', $value: 'red' } })).toThrow('"a"');
    expect(() => flattenColorTokens({ a: { $type: 'dimension', $value: '#000000' } })).toThrow();
    expect(() => flattenColorTokens({ a: 'oops' })).toThrow('"a"');
  });
});

describe('formatters', () => {
  it('renders CSS custom properties', () => {
    expect(toCss(tokens, context)).toContain('  --color-brand-primary: #6C5CE7;');
    expect(toCss(tokens, context)).toContain('v1.2.3');
  });

  it('renders flat JSON with the version', () => {
    expect(JSON.parse(toJson(tokens, context))).toEqual({
      version: '1.2.3',
      tokens: { 'color-brand-primary': '#6C5CE7', 'color-neutral-0': '#FFFFFF' },
    });
  });

  it('renders Android color resources', () => {
    const xml = toAndroidXml(tokens, context);
    expect(xml).toMatch(/^<\?xml version="1.0" encoding="utf-8"\?>/);
    expect(xml).toContain('<color name="color_brand_primary">#6C5CE7</color>');
  });

  it('renders a Swift enum with unit RGB channels', () => {
    const swift = toSwift(tokens, context);
    expect(swift).toContain(
      'public static let colorBrandPrimary = Color(red: 0.424, green: 0.361, blue: 0.906)',
    );
    expect(swift).toContain('public static let colorNeutral0 = Color(red: 1.000, green: 1.000, blue: 1.000)');
  });

  it('builds camelCase identifiers', () => {
    expect(toCamelCase(['color', 'feedback', 'info'])).toBe('colorFeedbackInfo');
  });
});
