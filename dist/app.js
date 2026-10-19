import { validateAge, validateDataset, estimateByAge, annualToDaily, weeklyBudget, percent, compactRange } from './model.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
let datasetPromise;
let dataset;
let currentAge;
let currentScreen = 'start';
let returnScreen = 'start';
let storyIndex = 0;
let dataPage = 0;
const storyPages = [
  ['start', 'A LITTLE PERSPECTIVE'], ['tomorrow', 'THE ODDS'],
  ['annual', 'START WITH A YEAR'], ['assumption', 'ONE ASSUMPTION'],
  ['daily', 'SOLVE FOR ONE DAY'], ['curve', 'A LONGER VIEW'],
  ['time', 'YOUR NEXT WEEK'], ['today', 'ONE GOOD HOUR']
];
const methodPages = ['source', 'assumptions', 'deeper', 'boundaries', 'privacy'];

function loadData() {
  if (!datasetPromise) datasetPromise = fetch('./data/ssa-2023.json', { cache: 'force-cache' })
    .then(response => { if (!response.ok) throw new Error('Data unavailable'); return response.json(); })
    .then(validateDataset)
    .catch(error => { datasetPromise = undefined; throw error; });
  return datasetPromise;
}

function sliderStyle(input) {
  const fraction = (Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min));
  input.style.setProperty('--fill', `${fraction * 100}%`);
}

function setAgeError(message) {
  $('#age-error').textContent = message;
  if (message) $('#age').setAttribute('aria-invalid', 'true');
  else $('#age').removeAttribute('aria-invalid');
}

$('#age').addEventListener('input', () => setAgeError(''));
$('#age-form').addEventListener('submit', async event => {
  event.preventDefault();
  const validation = validateAge($('#age').value);
  if (!validation.valid) { setAgeError(validation.message); $('#age').focus(); return; }
  setAgeError('');
  const button = $('#begin');
  button.disabled = true;
  $('#story-next').disabled = true;
  button.setAttribute('aria-label', 'Loading the published mortality table');
  try {
    dataset = await loadData();
    currentAge = validation.age;
    renderEstimate(currentAge);
    showScreen('tomorrow');
  } catch (error) {
    setAgeError('The data couldn’t load. Check your connection, then try again.');
    $('#age').focus();
  } finally {
    button.disabled = false;
    $('#story-next').disabled = false;
    button.setAttribute('aria-label', 'Explore my age-based estimate');
  }
});

function renderEstimate(age) {
  const result = estimateByAge(dataset, age);
  $$('[data-age]').forEach(element => { element.textContent = age; });
  $('#daily-low').textContent = percent(result.daily[0]);
  $('#daily-high').textContent = percent(result.daily[1]);
  $('#million-description').textContent = `About ${compactRange(result.daily.map(p => p * 1_000_000))} deaths per million people over one day.`;
  $('#survival-percent').textContent = `${percent(result.survival[0], 3)}–${percent(result.survival[1], 3)}%`;
  // Adaptive precision keeps the survival readout from displaying a misleading 100%.
  if (percent(result.survival[0], 3) === percent(result.survival[1], 3)) {
    $('#survival-percent').textContent = `${percent(result.survival[0])}–${percent(result.survival[1])}%`;
  }
  $('#next-age').textContent = age + 1;
  $('#annual-range').textContent = `${compactRange(result.annual.map(p => p * 100), 4)}%`;
  $('#math-daily-range').textContent = `${percent(result.daily[0])}–${percent(result.daily[1])}%`;
  $('#expectancy-note').textContent = `At exact age ${age}, average remaining life expectancy in these tables is ${compactRange(result.remainingYears, 2)} years under fixed 2023 rates. This already accounts for reaching ${age}. An average is not a deadline or a personal prediction.`;
  $('#chart-age').value = age;
  dataPage = 0;
  renderDataPage();
  renderChart(age);
}

function svgElement(tag, attributes = {}, content) {
  const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
  if (content !== undefined) element.textContent = content;
  return element;
}

function renderChart(age) {
  const chart = $('#risk-chart');
  chart.querySelectorAll('[data-chart]').forEach(node => node.remove());
  const group = svgElement('g', { 'data-chart': '', 'aria-hidden': 'true' });
  const box = { left: 52, top: 20, width: 584, height: 235 };
  const yMax = 0.0015;
  const x = a => box.left + ((a - 18) / 82) * box.width;
  const y = p => box.top + box.height * (1 - p / yMax);
  const textStyle = { fill: '#696966', 'font-size': 11, 'font-family': '-apple-system, BlinkMacSystemFont, sans-serif' };
  [0, .0005, .001, .0015].forEach(p => {
    group.append(svgElement('line', { x1: box.left, y1: y(p), x2: box.left + box.width, y2: y(p), stroke: '#dcdcd7', 'stroke-width': 1 }));
    group.append(svgElement('text', { x: box.left - 10, y: y(p) + 4, 'text-anchor': 'end', ...textStyle }, `${(p * 100).toFixed(2)}%`));
  });
  [18, 40, 60, 80, 100].forEach(a => group.append(svgElement('text', { x: x(a), y: 282, 'text-anchor': 'middle', ...textStyle }, `${a}`)));
  group.append(svgElement('text', { x: box.left, y: 9, ...textStyle, 'font-size': 9 }, 'DAILY RISK'));
  group.append(svgElement('text', { x: box.left + box.width, y: 299, 'text-anchor': 'end', ...textStyle, 'font-size': 9 }, 'AGE'));
  const paths = {};
  for (const key of ['male', 'female']) paths[key] = dataset.rows.map(row => `${x(row.age)},${y(annualToDaily(row[key].qx))}`);
  group.append(svgElement('path', { d: `M ${paths.male.join(' L ')} L ${[...paths.female].reverse().join(' L ')} Z`, fill: '#e7e7e0' }));
  group.append(svgElement('path', { d: `M ${paths.male.join(' L ')}`, fill: 'none', stroke: '#171717', 'stroke-width': 2 }));
  group.append(svgElement('path', { d: `M ${paths.female.join(' L ')}`, fill: 'none', stroke: '#777771', 'stroke-width': 2, 'stroke-dasharray': '5 4' }));
  group.append(svgElement('line', { x1: x(age), x2: x(age), y1: box.top, y2: box.top + box.height, stroke: '#696966', 'stroke-width': 1, 'stroke-dasharray': '3 4' }));
  const result = estimateByAge(dataset, age);
  result.series.forEach(series => group.append(svgElement('circle', { cx: x(age), cy: y(series.daily), r: 4, fill: '#171717', stroke: '#fafaf7', 'stroke-width': 2 })));
  chart.append(group);
  $('#chart-age-value').textContent = age;
  $('#chart-readout').textContent = `${percent(result.daily[0])}–${percent(result.daily[1])}% per day, conditional on reaching ${age}.`;
  $('#chart-age').setAttribute('aria-valuetext', `Age ${age}. Daily mortality estimate ${percent(result.daily[0])} to ${percent(result.daily[1])} percent.`);
  sliderStyle($('#chart-age'));
}

$('#chart-age').addEventListener('input', event => renderChart(Number(event.target.value)));

function showScreen(id, focus = true) {
  const target = $(`[data-screen="${id}"]`);
  if (!target) return;
  const nextIndex = storyPages.findIndex(page => page[0] === id);
  const previousIndex = storyPages.findIndex(page => page[0] === currentScreen);
  $('#main').dataset.direction = nextIndex >= 0 && previousIndex >= 0 && nextIndex < previousIndex ? 'back' : 'next';
  $$('[data-screen]').forEach(screen => { screen.hidden = screen !== target; });
  currentScreen = id;
  if (nextIndex >= 0) storyIndex = nextIndex;
  const noteIndex = methodPages.indexOf(id);
  const isExtra = noteIndex >= 0 || id === 'data';
  $('#method-button').textContent = isExtra ? 'Back to story ↙' : 'The method ↗';
  $('#story-step').textContent = noteIndex >= 0 ? `${String(noteIndex + 1).padStart(2, '0')} / 05` : id === 'data' ? `${String(dataPage + 1).padStart(2, '0')} / 17` : `${String(storyIndex + 1).padStart(2, '0')} / 08`;
  $('#story-label').textContent = noteIndex >= 0 ? 'THE METHOD' : id === 'data' ? 'CHART VALUES' : storyPages[storyIndex][1];
  $('#story-back').disabled = !isExtra && storyIndex === 0;
  $('#next-label').textContent = id === 'start' ? 'Begin' : id === 'today' ? 'Start again' : id === 'data' || noteIndex === methodPages.length - 1 ? 'Return' : 'Next';
  $('#story-progress').style.width = `${(storyIndex + 1) / storyPages.length * 100}%`;
  if (focus) target.querySelector('h1, h2')?.focus({ preventScroll: true });
}

function nextScreen() {
  if (currentScreen === 'start') { $('#age-form').requestSubmit(); return; }
  if (currentScreen === 'data') { showScreen(returnScreen); return; }
  const noteIndex = methodPages.indexOf(currentScreen);
  if (noteIndex >= 0) { showScreen(methodPages[noteIndex + 1] || returnScreen); return; }
  showScreen(storyPages[(storyIndex + 1) % storyPages.length][0]);
}

function previousScreen() {
  if (currentScreen === 'data') { showScreen(returnScreen); return; }
  const noteIndex = methodPages.indexOf(currentScreen);
  if (noteIndex >= 0) { showScreen(noteIndex ? methodPages[noteIndex - 1] : returnScreen); return; }
  if (storyIndex > 0) showScreen(storyPages[storyIndex - 1][0]);
}

$('#story-next').addEventListener('click', nextScreen);
$('#story-back').addEventListener('click', previousScreen);
$$('[data-go]').forEach(button => button.addEventListener('click', () => showScreen(button.dataset.go)));
$('#method-button').addEventListener('click', () => {
  if (methodPages.includes(currentScreen) || currentScreen === 'data') showScreen(returnScreen);
  else { returnScreen = currentScreen; showScreen('source'); }
});
document.addEventListener('keydown', event => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.key === 'Escape' && (methodPages.includes(currentScreen) || currentScreen === 'data')) { showScreen(returnScreen); return; }
  if (['INPUT', 'TEXTAREA', 'BUTTON', 'A'].includes(event.target.tagName) || event.target.isContentEditable) return;
  if (event.key === 'ArrowRight') { event.preventDefault(); nextScreen(); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); previousScreen(); }
});

function renderDataPage() {
  if (!dataset) return;
  const rows = dataset.rows.slice(dataPage * 5, dataPage * 5 + 5);
  $('#chart-table').replaceChildren(...rows.map(row => {
    const tr = document.createElement('tr');
    [row.age, `${percent(annualToDaily(row.female.qx))}%`, `${percent(annualToDaily(row.male.qx))}%`].forEach((value, index) => {
      const cell = document.createElement(index === 0 ? 'th' : 'td');
      if (index === 0) cell.scope = 'row';
      cell.textContent = value;
      tr.append(cell);
    });
    return tr;
  }));
  $('#data-caption').textContent = `Ages ${rows[0].age}–${rows.at(-1).age} · 2023 rates held fixed`;
  $('#data-page-count').textContent = `${dataPage + 1} / 17`;
  $('#data-prev').disabled = dataPage === 0;
  $('#data-next').disabled = dataPage === 16;
  if (currentScreen === 'data') $('#story-step').textContent = `${String(dataPage + 1).padStart(2, '0')} / 17`;
}
$('#view-chart-data').addEventListener('click', () => {
  returnScreen = 'curve';
  dataPage = Math.floor((Number($('#chart-age').value) - 18) / 5);
  renderDataPage();
  showScreen('data');
});
$('#data-prev').addEventListener('click', () => { if (dataPage > 0) { dataPage--; renderDataPage(); } });
$('#data-next').addEventListener('click', () => { if (dataPage < 16) { dataPage++; renderDataPage(); } });

function renderBudget() {
  const inputs = { sleepPerNight: Number($('#sleep').value), workPerWeek: Number($('#work').value), carePerWeek: Number($('#care').value) };
  const budget = weeklyBudget(inputs);
  $('#sleep-value').textContent = `${inputs.sleepPerNight} h / night`;
  $('#work-value').textContent = `${inputs.workPerWeek} h / week`;
  $('#care-value').textContent = `${inputs.carePerWeek} h / week`;
  $('#sleep').setAttribute('aria-valuetext', `${inputs.sleepPerNight} hours per night`);
  $('#work').setAttribute('aria-valuetext', `${inputs.workPerWeek} hours per week`);
  $('#care').setAttribute('aria-valuetext', `${inputs.carePerWeek} hours per week`);
  $('#open-hours').textContent = compactRange([budget.valid ? budget.open : budget.over, budget.valid ? budget.open : budget.over]);
  $('#open-hours-label').textContent = budget.valid ? 'hours unallocated' : 'hours over budget';
  $('#budget-note').textContent = budget.valid ? (budget.open === 0 ? 'Every hour is accounted for. Rest can matter wherever you find it.' : 'Room for rest, people, or a small beginning.') : 'Over 168 hours. Reduce a slider or check for overlap.';
  $('.time-total').classList.toggle('over-budget', !budget.valid);
  const grid = $('#week-grid');
  const categories = [{ key: 'sleep', hours: budget.sleep, color: '#252525' }, { key: 'work', hours: budget.work, color: '#8a8a83' }, { key: 'care', hours: budget.care, color: '#c8c8bf' }];
  const cells = Array.from({ length: 168 }, (_, index) => {
    const cell = document.createElement('span');
    cell.className = 'hour-cell open';
    cell.setAttribute('aria-hidden', 'true');
    let start = 0;
    const stops = [];
    let hasOpen = false;
    for (const item of categories) {
      const end = start + item.hours;
      const left = Math.max(index, start);
      const right = Math.min(index + 1, end);
      const coverage = Math.max(0, right - left);
      if (coverage > 0) {
        stops.push(`${item.color} ${(left - index) * 100}% ${(right - index) * 100}%`);
      }
      start = end;
    }
    if (budget.allocated < index + 1) {
      const left = Math.max(index, budget.allocated);
      stops.push(`transparent ${(left - index) * 100}% 100%`);
      hasOpen = true;
    }
    cell.className = `hour-cell${hasOpen ? ' open' : ''}`;
    cell.style.background = `linear-gradient(to right, ${stops.join(', ')})`;
    return cell;
  });
  grid.replaceChildren(...cells);
  grid.setAttribute('aria-label', `168-hour week: ${budget.sleep} hours sleep, ${budget.work} work and study, ${budget.care} essentials. ${budget.valid ? `${budget.open} hours unallocated.` : `Over budget by ${budget.over} hours; the grid is capped at 168.`}`);
  for (const id of ['sleep', 'work', 'care']) sliderStyle(document.getElementById(id));
}
for (const id of ['sleep', 'work', 'care']) document.getElementById(id).addEventListener('input', renderBudget);
renderBudget();

function setIntention() {
  const value = $('#intention').value.trim();
  $('#intention-result').textContent = value ? `One good hour for: ${value}. That’s a place to start.` : 'A quiet hour with no plan counts, too.';
  $$('[data-intention]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.intention === value)));
}
$('#set-intention').addEventListener('click', setIntention);
$('#intention').addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); setIntention(); } });
$$('[data-intention]').forEach(button => button.addEventListener('click', () => { $('#intention').value = button.dataset.intention; setIntention(); }));

showScreen('start', false);
