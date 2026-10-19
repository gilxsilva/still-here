import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateAge, validateDataset, annualToDaily, estimateByAge, weeklyBudget, percent } from '../src/model.js';
const dataset = validateDataset(JSON.parse(await readFile(new URL('../src/data/ssa-2023.json', import.meta.url), 'utf8')));

test('supported ages include both boundaries and reject incomplete or nonsensical entries', () => {
  for (const value of [18, 25, '100']) assert.equal(validateAge(value).valid, true);
  for (const value of ['', ' ', null, undefined, true, 'twenty', NaN, Infinity, 17, 101, 25.5, -1]) assert.equal(validateAge(value).valid, false, String(value));
});
test('daily survival compounds back to the published annual survival at every supported age', () => {
  for (const row of dataset.rows) for (const key of ['female', 'male']) {
    const daily = annualToDaily(row[key].qx);
    assert.ok(Math.abs(Math.exp(365 * Math.log1p(-daily)) - (1 - row[key].qx)) < 1e-14);
  }
});
test('the conversion is stable for tiny probabilities and handles its mathematical boundaries', () => {
  assert.equal(annualToDaily(0), 0);
  assert.ok(Math.abs(annualToDaily(1e-14) / (1e-14 / 365) - 1) < 1e-12);
  for (const q of [-1, 1, 2, NaN, Infinity]) assert.throws(() => annualToDaily(q), RangeError);
});
test('source fixtures agree with the official SSA table, including older ages', () => {
  const fixtures = [
    [18, .000999, 58.56, .000372, 63.69],
    [25, .001595, 52.06, .000609, 56.90],
    [50, .005126, 29.90, .003030, 33.45],
    [75, .033802, 11.42, .023846, 13.10],
    [100, .366568, 2.04, .329680, 2.23]
  ];
  for (const [age, mq, me, fq, fe] of fixtures) {
    const row = dataset.rows.find(item => item.age === age);
    assert.deepEqual(row, { age, male: { qx: mq, ex: me }, female: { qx: fq, ex: fe } });
  }
});
test('age 25 produces expected daily percentages and conditional remaining years', () => {
  const result = estimateByAge(dataset, 25);
  assert.equal(percent(result.daily[0]), '0.00017');
  assert.equal(percent(result.daily[1]), '0.00044');
  assert.deepEqual(result.remainingYears, [52.06, 56.9]);
  assert.equal(result.survival[0], 1 - result.daily[1]);
  assert.equal(result.survival[1], 1 - result.daily[0]);
  assert.throws(() => estimateByAge(dataset, 101), RangeError);
});
test('all supported results are finite, ordered, nonzero, and never displayed as zero', () => {
  for (const row of dataset.rows) {
    const result = estimateByAge(dataset, row.age);
    assert.ok(result.daily[0] > 0 && result.daily[0] <= result.daily[1] && result.daily[1] < 1);
    assert.ok(Number(percent(result.daily[0])) > 0);
    assert.ok(result.survival[0] <= result.survival[1]);
  }
});
test('incomplete or malformed data is rejected instead of generating estimates', () => {
  assert.throws(() => validateDataset({ ...dataset, rows: dataset.rows.slice(1) }));
  const broken = structuredClone(dataset); broken.rows[0].female.qx = 1;
  assert.throws(() => validateDataset(broken));
});
test('the weekly budget respects 168 hours, fractional sleep, zero remaining, and oversubscription', () => {
  const budget = weeklyBudget({ sleepPerNight: 8, workPerWeek: 40, carePerWeek: 21 });
  assert.equal(budget.open, 51); assert.equal(budget.allocated, 117); assert.equal(budget.valid, true);
  assert.equal(weeklyBudget({ sleepPerNight: 7.5, workPerWeek: 40, carePerWeek: 21 }).open, 54.5);
  assert.equal(weeklyBudget({ sleepPerNight: 8, workPerWeek: 100, carePerWeek: 12 }).open, 0);
  const over = weeklyBudget({ sleepPerNight: 12, workPerWeek: 100, carePerWeek: 100 });
  assert.equal(over.valid, false); assert.equal(over.over, 116); assert.equal(over.open, 0);
  assert.throws(() => weeklyBudget({ sleepPerNight: NaN, workPerWeek: 40, carePerWeek: 21 }), RangeError);
});
