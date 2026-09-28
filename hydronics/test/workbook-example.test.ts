import { describe, expect, it } from 'vitest';
import { workbookExampleInputReference, workbookExampleProvisional100GpmPath, workbookReferenceRecords } from '../src/app/workbookExample.js';
import { evaluateHydronicSystem } from '../src/engine/index.js';
import { validateProject } from '../src/app/persistence.js';

describe('workbook example input-reference factory', () => {
  it('creates a fresh, sanitized 31-section draft input reference', () => {
    const first = workbookExampleInputReference();
    const second = workbookExampleInputReference();
    const system = first.systems[0]!;

    expect(second).not.toBe(first);
    expect(first.name).toBe('Workbook example input reference');
    expect(system.name).toBe('Legacy equivalent-length input trace');
    expect(system.meanTemperatureF).toBe(49);
    expect(system.sections).toHaveLength(31);
    expect(system.sections.reduce((count, section) => count + section.elements.length, 0)).toBe(61);
    expect(validateProject(first)).toEqual(expect.objectContaining({ value: first }));
    expect(system.circuits).toEqual([]);
    expect(system.sections.every((section) => section.elements.every((loss) => loss.applicability.status === 'unconfirmed'))).toBe(true);

    const serialized = JSON.stringify(first);
    expect(serialized).not.toMatch(/175 water street|new york, ny|22-005589|c\. wescott/i);
  });

  it('exposes sanitized workbook-stored reference rows without treating them as engine inputs', () => {
    expect(workbookReferenceRecords).toHaveLength(31);
    expect(workbookReferenceRecords[0]).toMatchObject({ sectionId: 'section-01', stream: 'CHWR', workbookStoredReferenceFlowGpm: 1800 });
    expect(workbookReferenceRecords[13]).toMatchObject({ sectionId: 'section-14', stream: 'CHWS', workbookStoredReferenceFlowGpm: 300 });
    expect(workbookReferenceRecords[30]).toMatchObject({ sectionId: 'section-31', workbookStoredReferenceFlowGpm: 1800 });
  });

  it('creates the deliberately limited 100 GPM path without making it eligible', () => {
    const system = workbookExampleProvisional100GpmPath().systems[0]!;
    expect(system.circuits).toHaveLength(1);
    expect(system.circuits[0]).toMatchObject({ id: 'provisional-selected-100-gpm-path', terminalDesignGpm: 100, terminalSectionId: 'section-17' });
    expect(system.circuits[0]!.supplySectionIds).toEqual(['section-07','section-08','section-09','section-10','section-11','section-12','section-13','section-14','section-15','section-16']);
    expect(system.circuits[0]!.returnSectionIds).toEqual(['section-18','section-19','section-20','section-21','section-22','section-23','section-24','section-25','section-26','section-27','section-28','section-29','section-30','section-31']);
    const result = evaluateHydronicSystem(system);
    expect(result.activeTerminalFlowGpm).toBe(100);
    expect(result.governingHeadFt).toBeUndefined();
    expect(result.designEligible).toBe(false);
  });

  it('maps representative portable input primitives without copying workbook results', () => {
    const system = workbookExampleInputReference().systems[0]!;
    const section02 = system.sections.find((section) => section.id === 'section-02')!;
    const section01 = system.sections.find((section) => section.id === 'section-01')!;
    const section05 = system.sections.find((section) => section.id === 'section-05')!;

    expect(section02.geometry).toEqual({ kind: 'custom', actualInsideDiameterIn: 13.25, roughnessFt: .00015 });
    expect(section01.elements).toContainEqual(expect.objectContaining({ type: 'equivalent-length', category: 'fitting', quantity: 1, equivalentLengthFt: 13.4, basis: 'section-inside-diameter' }));
    expect(section01.elements).toContainEqual(expect.objectContaining({ type: 'direct-psi', category: 'equipment', quantity: 1, pressureLossPsi: 1 }));
    expect(section05.elements).toContainEqual(expect.objectContaining({ type: 'k', category: 'fitting', quantity: 1, k: .21, basis: 'section-inside-diameter' }));

    const result = evaluateHydronicSystem(system);
    expect(result.activeTerminalFlowGpm).toBeUndefined();
    expect(result.governingHeadFt).toBeUndefined();
  });
});
