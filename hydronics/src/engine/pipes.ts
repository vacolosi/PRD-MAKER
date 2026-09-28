/** Bounded nominal-reference catalog. Dimensions are source-table nominal values, not installed bores/tolerances. */
export interface PipeCatalogEntry {
  readonly id: string;
  readonly material: 'steel' | 'copper';
  readonly designation: string;
  readonly nominalIn: number;
  readonly outsideDiameterIn: number;
  readonly wallThicknessIn: number;
  readonly actualInsideDiameterIn: number;
  /** Approved legacy engineering assumption, visibly editable through PipeCatalogSelection. Not a material guarantee. */
  readonly defaultRoughnessFt: number;
  readonly roughnessBasis: string;
  readonly provenance: string;
  readonly qualification: 'source-reviewed-nominal-reference';
}
type DimensionRow = readonly [nominalIn: number, outsideDiameterIn: number, wallThicknessIn: number];
const steel10: readonly DimensionRow[] = [[.5,.840,.083],[.75,1.050,.083],[1,1.315,.109],[1.25,1.660,.109],[1.5,1.900,.109],[2,2.375,.109],[2.5,2.875,.120],[3,3.500,.120],[3.5,4,.120],[4,4.500,.120],[5,5.563,.134],[6,6.625,.134],[8,8.625,.148],[10,10.750,.165],[12,12.750,.180]];
const steel40: readonly DimensionRow[] = [[.5,.840,.109],[.75,1.050,.113],[1,1.315,.133],[1.25,1.660,.140],[1.5,1.900,.145],[2,2.375,.154],[2.5,2.875,.203],[3,3.500,.216],[3.5,4,.226],[4,4.500,.237],[5,5.563,.258],[6,6.625,.280],[8,8.625,.322],[10,10.750,.365],[12,12.750,.406]];
const steel80: readonly DimensionRow[] = [[.5,.840,.147],[.75,1.050,.154],[1,1.315,.179],[1.25,1.660,.191],[1.5,1.900,.200],[2,2.375,.218],[2.5,2.875,.276],[3,3.500,.300],[3.5,4,.318],[4,4.500,.337],[5,5.563,.375],[6,6.625,.432],[8,8.625,.500],[10,10.750,.594],[12,12.750,.688]];
const copperK: readonly DimensionRow[] = [[.5,.625,.049],[.75,.875,.065],[1,1.125,.065],[1.25,1.375,.065],[1.5,1.625,.072],[2,2.125,.083],[2.5,2.625,.095],[3,3.125,.109],[3.5,3.625,.120],[4,4.125,.134],[5,5.125,.160],[6,6.125,.192],[8,8.125,.271],[10,10.125,.338],[12,12.125,.405]];
const copperL: readonly DimensionRow[] = [[.5,.625,.040],[.75,.875,.045],[1,1.125,.050],[1.25,1.375,.055],[1.5,1.625,.060],[2,2.125,.070],[2.5,2.625,.080],[3,3.125,.090],[3.5,3.625,.100],[4,4.125,.110],[5,5.125,.125],[6,6.125,.140],[8,8.125,.200],[10,10.125,.250],[12,12.125,.280]];
const copperM: readonly DimensionRow[] = [[.5,.625,.028],[.75,.875,.032],[1,1.125,.035],[1.25,1.375,.042],[1.5,1.625,.049],[2,2.125,.058],[2.5,2.625,.065],[3,3.125,.072],[3.5,3.625,.083],[4,4.125,.095],[5,5.125,.109],[6,6.125,.122],[8,8.125,.170],[10,10.125,.212],[12,12.125,.254]];
const steelSource = 'Sch10: Botop plain-end Schedule 10 + APP v7; Sch40/80: TPS Tube & Pipe Sizes 7th ed. + APP v7; literal schedule values only. Underlying standard edition unspecified by the publishers.';
const copperSource = 'CDA Copper Tube Handbook (2006), Tables 2a–c pp.21–22; Mueller cross-publication through 8 in; Engineers Edge secondary corroboration for 10/12 in. Underlying ASTM edition unspecified by the sources.';
const ROUGHNESS_STEEL = 'Approved legacy engineering assumption: 0.00015 ft; not a claim for every installed pipe.';
const ROUGHNESS_COPPER = 'Approved legacy engineering assumption: 0.000033 ft; not a claim for every installed pipe.';
const nominalId = (nominalIn: number): string => String(nominalIn).replace('.', '-');
function buildEntries(material: PipeCatalogEntry['material'], designation: string, prefix: string, rows: readonly DimensionRow[], provenance: string, defaultRoughnessFt: number, roughnessBasis: string): readonly PipeCatalogEntry[] {
  return rows.map(([nominalIn, outsideDiameterIn, wallThicknessIn]) => Object.freeze({
    id: `${prefix}-${nominalId(nominalIn)}`, material, designation, nominalIn, outsideDiameterIn, wallThicknessIn,
    actualInsideDiameterIn: outsideDiameterIn - 2 * wallThicknessIn, defaultRoughnessFt, roughnessBasis, provenance,
    qualification: 'source-reviewed-nominal-reference' as const,
  }));
}
const entries = [
  ...buildEntries('steel', 'Steel Schedule 10 (literal; no STD/XS/S alias)', 'steel-sch10', steel10, steelSource, .00015, ROUGHNESS_STEEL),
  ...buildEntries('steel', 'Steel Schedule 40 (literal; no STD/XS/S alias)', 'steel-sch40', steel40, steelSource, .00015, ROUGHNESS_STEEL),
  ...buildEntries('steel', 'Steel Schedule 80 (literal; no STD/XS/S alias)', 'steel-sch80', steel80, steelSource, .00015, ROUGHNESS_STEEL),
  ...buildEntries('copper', 'Copper Type K', 'copper-type-k', copperK, copperSource, .000033, ROUGHNESS_COPPER),
  ...buildEntries('copper', 'Copper Type L', 'copper-type-l', copperL, copperSource, .000033, ROUGHNESS_COPPER),
  ...buildEntries('copper', 'Copper Type M', 'copper-type-m', copperM, copperSource, .000033, ROUGHNESS_COPPER),
];
export const pipeCatalog: readonly PipeCatalogEntry[] = Object.freeze(entries);
export function getPipeCatalogEntry(id: string): PipeCatalogEntry {
  const entry = pipeCatalog.find((candidate) => candidate.id === id);
  if (!entry) throw new RangeError(`Unsupported pipe catalog ID ${id}; enter actual ID and roughness explicitly.`);
  return entry;
}
export function assertPipeDimensions(entry: PipeCatalogEntry): void {
  const values = [entry.nominalIn, entry.outsideDiameterIn, entry.wallThicknessIn, entry.actualInsideDiameterIn];
  if (!values.every((value) => typeof value === 'number' && Number.isFinite(value) && value > 0) || !Number.isFinite(entry.defaultRoughnessFt) || entry.defaultRoughnessFt < 0 || entry.actualInsideDiameterIn > entry.outsideDiameterIn) {
    throw new Error(`Pipe dimensions must be finite positive geometry with nonnegative roughness for ${entry.id}`);
  }
  if (Math.abs(entry.actualInsideDiameterIn - (entry.outsideDiameterIn - 2 * entry.wallThicknessIn)) > 1e-12) throw new Error(`Pipe ID identity failed for ${entry.id}`);
}
pipeCatalog.forEach(assertPipeDimensions);
