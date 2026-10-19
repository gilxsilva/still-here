/** Pure calculations. No DOM, network, tracking, or personal input persistence. */
export const MODEL = Object.freeze({ id: 'age-only-constant-hazard-v1', daysPerYear: 365, minAge: 18, maxAge: 100 });

export function validateAge(value) {
  if (value === '' || value === null || value === undefined || typeof value === 'boolean' || (typeof value === 'string' && !value.trim())) {
    return { valid: false, message: 'Enter your age as a whole number from 18 to 100.' };
  }
  const age = Number(value);
  if (!Number.isInteger(age) || age < MODEL.minAge || age > MODEL.maxAge) {
    return { valid: false, message: 'Use a whole-number age from 18 to 100 for this prototype.' };
  }
  return { valid: true, age };
}

export function annualToDaily(q) {
  if (!Number.isFinite(q) || q < 0 || q >= 1) throw new RangeError('Annual probability must be finite and in [0, 1).');
  // This form avoids loss of precision for small probabilities.
  return q === 0 ? 0 : -Math.expm1(Math.log1p(-q) / MODEL.daysPerYear);
}

export function validateDataset(data) {
  if (data.schemaVersion !== 1 || data.id !== 'ssa-us-area-2023' || data.rows?.length !== 83) throw new Error('Unsupported mortality dataset.');
  for (let age = MODEL.minAge; age <= MODEL.maxAge; age++) {
    const row = data.rows[age - MODEL.minAge];
    if (row?.age !== age) throw new Error('Missing or unordered mortality age.');
    for (const series of ['female', 'male']) {
      const item = row[series];
      if (!item || !Number.isFinite(item.qx) || item.qx <= 0 || item.qx >= 1 || !Number.isFinite(item.ex) || item.ex <= 0) throw new Error('Invalid mortality row.');
    }
  }
  return data;
}

/** Stable result contract: a new evidence-backed model can return the same shape. */
export function estimateByAge(dataset, value) {
  const validation = validateAge(value);
  if (!validation.valid) throw new RangeError(validation.message);
  const row = dataset.rows.find(item => item.age === validation.age);
  if (!row) throw new RangeError('This age is missing from the source table.');
  const series = ['female', 'male'].map(key => ({ key, annual: row[key].qx, daily: annualToDaily(row[key].qx), remainingYears: row[key].ex }));
  const range = key => [Math.min(...series.map(item => item[key])), Math.max(...series.map(item => item[key]))];
  const daily = range('daily');
  return { modelId: MODEL.id, datasetId: dataset.id, age: validation.age, series, annual: range('annual'), daily, survival: [1 - daily[1], 1 - daily[0]], remainingYears: range('remainingYears') };
}

export function weeklyBudget({ sleepPerNight, workPerWeek, carePerWeek }) {
  const values = [sleepPerNight, workPerWeek, carePerWeek];
  if (values.some(n => !Number.isFinite(n) || n < 0) || sleepPerNight > 24) throw new RangeError('Time inputs must be finite, nonnegative hours.');
  const sleep = sleepPerNight * 7;
  const allocated = sleep + workPerWeek + carePerWeek;
  return { sleep, work: workPerWeek, care: carePerWeek, allocated, open: Math.max(0, 168 - allocated), over: Math.max(0, allocated - 168), valid: allocated <= 168 };
}

export function percent(value, digits = 5) {
  return (value * 100).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits, useGrouping: false });
}

export function compactRange(values, digits = 1) {
  const format = value => value.toLocaleString('en-US', { maximumFractionDigits: digits });
  const low = format(values[0]);
  const high = format(values[1]);
  return low === high ? low : `${low}–${high}`;
}
