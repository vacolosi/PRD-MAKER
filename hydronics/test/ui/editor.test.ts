import { describe, expect, it } from 'vitest';
import { formatNumber, parseEditorNumber, withoutDraftKeys } from '../../src/app/editor.js';
describe('raw numeric editor parsing', () => {
  it.each(['', ' ', '1e', '12junk', 'Infinity', '-Infinity', '0x10', '1e-9999'])('diagnoses invalid text %j', (text) => expect(parseEditorNumber(text).error).toBeDefined());
  it.each(['0', '0e10', '-0e-10', '0.00E+100'])('accepts genuine scientific zero %s', (text) => expect(parseEditorNumber(text).value).toBe(0));
  it('accepts complete scientific notation and preserves tiny nonzero display', () => { expect(parseEditorNumber('2.5e1').value).toBe(25); expect(formatNumber(.00000012)).toContain('e'); });
  it('does not render unavailable as false zero', () => expect(formatNumber(undefined)).toBe('unavailable'));
  it('purges only obsolete entity/type draft keys', () => expect(withoutDraftKeys({ 'loss:a:k':'junk', 'loss:a:quantity':'3', 'section:b:length':'1e' }, ['loss:a:'])).toEqual({ 'section:b:length':'1e' }));
});
