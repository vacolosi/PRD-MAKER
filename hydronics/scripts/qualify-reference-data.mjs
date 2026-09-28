#!/usr/bin/env node
/** Qualification-only harness: reads Astra's independently extracted fixtures, never engine datasets. */
import { readFileSync } from 'node:fs';
const here = new URL('../test/fixtures/', import.meta.url);
const source = JSON.parse(readFileSync(new URL('independent-source-nodes.json', here), 'utf8'));
const expected = JSON.parse(readFileSync(new URL('independent-qualification.json', here), 'utf8'));
const LB_FT3_TO_KG_M3 = 0.45359237 / 0.3048 ** 3;
const Q = expected.conventions.gpm * 0.003785411784 / 60;
const D = expected.conventions.actualInsideDiameterIn * .0254;
const L = expected.conventions.lengthFt * .3048;
const EPS = expected.conventions.roughnessFt * .3048;
const G = expected.conventions.gravityMS2;
const V = Q / (Math.PI * D ** 2 / 4);
const relativePercent = (predicted, actual) => 100 * (predicted / actual - 1);
const rms = (values) => Math.sqrt(values.reduce((sum, value) => sum + value ** 2, 0) / values.length);
function interpolate(lower, upper, temperatureF) {
  const weight = (temperatureF - lower[0]) / (upper[0] - lower[0]);
  return [lower[1] + weight * (upper[1] - lower[1]), Math.exp(Math.log(lower[2]) + weight * Math.log(upper[2] / lower[2]))];
}
function hydraulic(densityLbFt3, viscosityCp) {
  const re = densityLbFt3 * LB_FT3_TO_KG_M3 * V * D / (viscosityCp * .001);
  if (re <= 4000) throw new Error(`Qualification state must be turbulent, got Re=${re}`);
  let lower = .001; let upper = .15;
  for (let iteration = 0; iteration < 100; iteration += 1) {
    const friction = (lower + upper) / 2;
    const residual = 1 / Math.sqrt(friction) + 2 * Math.log10(EPS / (3.7 * D) + 2.51 / (re * Math.sqrt(friction)));
    if (residual > 0) lower = friction; else upper = friction;
  }
  const headFt = ((lower + upper) / 2) * L / D * V ** 2 / (2 * G) / .3048;
  return [re, headFt];
}
function metrics(nodes) {
  const errors = { density: [], viscosity: [], Re: [], head: [] };
  for (let index = 1; index < nodes.length - 1; index += 1) {
    const [temperatureF, density, viscosity] = nodes[index];
    const [predictedDensity, predictedViscosity] = interpolate(nodes[index - 1], nodes[index + 1], temperatureF);
    const [re, head] = hydraulic(density, viscosity);
    const [predictedRe, predictedHead] = hydraulic(predictedDensity, predictedViscosity);
    errors.density.push(relativePercent(predictedDensity, density));
    errors.viscosity.push(relativePercent(predictedViscosity, viscosity));
    errors.Re.push(relativePercent(predictedRe, re));
    errors.head.push(relativePercent(predictedHead, head));
  }
  return Object.fromEntries(Object.entries(errors).map(([key, values]) => [key, { maxAbsPercent: Math.max(...values.map(Math.abs)), rmsPercent: rms(values) }]));
}
let failures = 0;
for (const [referenceId, nodes] of Object.entries(source.nodes)) {
  const actual = metrics(nodes);
  const expectedMetrics = expected.results[referenceId].leaveOneOut;
  for (const key of ['density', 'viscosity', 'Re', 'head']) {
    const limit = expected.acceptanceLimitsPercent[key];
    const actualMetric = actual[key]; const expectedMetric = expectedMetrics[key];
    if (Math.abs(actualMetric.maxAbsPercent - expectedMetric.maxAbsPercent) > 1e-10 || Math.abs(actualMetric.rmsPercent - expectedMetric.rmsPercent) > 1e-10 || actualMetric.maxAbsPercent > limit) failures += 1;
  }
  const at104F = interpolate(nodes[7], nodes[8], 104);
  console.log(`${referenceId}: ${JSON.stringify(actual)}; 40C English prediction kg/m3=${(at104F[0] * LB_FT3_TO_KG_M3).toFixed(6)}, mPa·s=${at104F[1].toFixed(6)}`);
}
if (failures) throw new Error(`${failures} independent qualification regression(s) failed.`);
console.log('Independent fixture qualification passed all approved regression limits. Full same-guide SI diagnostic rows are retained in independent-qualification.json.');
