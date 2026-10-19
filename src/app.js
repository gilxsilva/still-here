import { validateAge, validateDataset, estimateByAge, weeklyBudget, lifeWeeks, percent, compactRange } from './model.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
let datasetPromise;
let dataset;
let result;
let currentScreen = 'start';
let plannerOnly = false;
let gridZoom = false;
let gridDecade = 0;
let navigationAnimation;
let navigationVersion = 0;
let requestGeneration = 0;
const chapters = ['start', 'working', 'odds', 'weeks', 'week'];
const labels = ['THE QUESTION', 'THE WORKING', 'THE ODDS', 'A LIFE IN WEEKS', 'THIS WEEK'];
const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let motion = !motionQuery.matches;
let motionChosen = false;
let beat = 0;
let timer;
let due = 0;
let remaining = 3400;
let paused = true;
const beatDuration = 3400;

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
  $('#age').setAttribute('aria-invalid', String(Boolean(message)));
}
$('#age').addEventListener('input', () => setAgeError(''));
$('#age-form').addEventListener('submit', async event => {
  event.preventDefault();
  const validation = validateAge($('#age').value);
  if (!validation.valid) { setAgeError(validation.message); $('#age').focus(); return; }
  setAgeError('');
  const generation = ++requestGeneration;
  $('#begin').disabled = true;
  $('#age-form').setAttribute('aria-busy', 'true');
  try {
    dataset = await loadData();
    if (generation !== requestGeneration) return;
    result = estimateByAge(dataset, validation.age);
    plannerOnly = false;
    gridZoom = false;
    gridDecade = Math.floor(result.age / 10);
    renderEstimate();
    setBeat(motion ? 0 : 2);
    showScreen('working', true, startWalkthrough);
  } catch {
    if (generation !== requestGeneration) return;
    setAgeError('The numbers didn’t load. Please try again.');
    $('#age').focus();
  } finally {
    $('#begin').disabled = false;
    $('#age-form').removeAttribute('aria-busy');
  }
});

function renderEstimate() {
  $$('[data-age]').forEach(node => { node.textContent = result.age; });
  $('#annual-range').textContent = `${compactRange(result.annual.map(q => q * 100), 4)}%`;
  $('#daily-low').textContent = percent(result.daily[0]);
  $('#daily-high').textContent = percent(result.daily[1]);
  $('#math-daily-range').textContent = `${percent(result.daily[0])}–${percent(result.daily[1])}%`;
  $('#million-range').textContent = compactRange(result.daily.map(p => p * 1_000_000));
  $('#axis-low').style.left = `${result.daily[0] * 100}%`;
  $('#axis-high').style.left = `${result.daily[1] * 100}%`;
  $('#survival-percent').textContent = `${percent(result.survival[0])}–${percent(result.survival[1])}%`;
  $('#inspect-age').value = result.age;
  renderValues(result.age);
  renderLifeGrid();
}

function applyScreen(id, focus = true) {
  if (!chapters.includes(id)) return;
  if (['working', 'odds', 'weeks'].includes(id) && !result) return;
  if (id !== 'working') stopTimer();
  currentScreen = id;
  document.body.dataset.scene = id;
  $('.header').inert = id !== 'start';
  $$('[data-screen]').forEach(node => { node.hidden = node.dataset.screen !== id; });
  const index = chapters.indexOf(id);
  $('#story-step').textContent = `${String(index + 1).padStart(2, '0')} / 05`;
  $('#story-label').textContent = plannerOnly && id === 'week' ? 'YOUR WEEK' : labels[index];
  $$('.chapter-dots i').forEach((dot, i) => dot.classList.toggle('active', i === index));
  $('#story-back').hidden = id === 'start';
  $('#story-back').textContent = id === 'working' || id === 'odds' ? '← Edit age' : '← Back';
  $('#story-next').hidden = id === 'start';
  const next = { working: 'See result now', odds: 'Zoom out to weeks', weeks: 'Look at this week', week: 'Start again' };
  $('#story-next').replaceChildren(document.createTextNode(`${next[id] || ''} `));
  const arrow = document.createElement('span'); arrow.setAttribute('aria-hidden', 'true'); arrow.textContent = '→';
  $('#story-next').append(arrow);
  if (focus) $(`[data-screen="${id}"]`).querySelector('h1, h2').focus({ preventScroll: true });
}
function showScreen(id, focus = true, afterUpdate) {
  if (!chapters.includes(id) || (['working', 'odds', 'weeks'].includes(id) && !result)) return Promise.resolve();
  const version = ++navigationVersion;
  navigationAnimation?.cancel();
  const update = () => {
    if (version !== navigationVersion) return;
    applyScreen(id, focus);
    afterUpdate?.();
  };
  const outgoing = $(`[data-screen="${currentScreen}"]`);
  if (motion && currentScreen !== id && outgoing.animate) {
    navigationAnimation = outgoing.animate(
      [{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(-6px)' }],
      { duration: 160, easing: 'ease-out', fill: 'forwards' }
    );
    const animation = navigationAnimation;
    return animation.finished.catch(() => {}).then(() => {
      animation.cancel();
      update();
    });
  }
  update();
  return Promise.resolve();
}
function nextScreen() {
  if (currentScreen === 'start') { $('#age-form').requestSubmit(); return; }
  const next = { working: 'odds', odds: 'weeks', weeks: 'week', week: 'start' };
  showScreen(next[currentScreen]);
}
function previousScreen() {
  if (currentScreen === 'working' || currentScreen === 'odds') showScreen('start');
  else if (currentScreen === 'weeks') showScreen('odds');
  else if (currentScreen === 'week') showScreen(plannerOnly ? 'start' : 'weeks');
}
$('#story-next').addEventListener('click', nextScreen);
$('#story-back').addEventListener('click', previousScreen);
$$('[data-home]').forEach(button => button.addEventListener('click', () => { requestGeneration++; showScreen('start'); }));
$('#skip-mortality').addEventListener('click', () => { requestGeneration++; plannerOnly = true; showScreen('week'); });

// The arithmetic is immediate. This timer paces the explanation, never a pretend calculation.
function stopTimer() { clearTimeout(timer); timer = undefined; }
function setBeat(value) {
  beat = value;
  $('#formula-stage').dataset.beat = value;
  $$('[data-formula]').forEach(node => { node.hidden = Number(node.dataset.formula) !== value; });
  $$('.math-steps li').forEach((node, i) => {
    node.classList.toggle('active', i === value);
    node.classList.toggle('complete', i < value);
    if (i === value) node.setAttribute('aria-current', 'step'); else node.removeAttribute('aria-current');
  });
  $$('.beat-progress span').forEach((node, i) => { node.className = i === value ? 'active' : i < value ? 'complete' : ''; });
  $('#math-counter').textContent = `${String(value + 1).padStart(2, '0')} / 03`;
  $('#formula-label').textContent = ['THE YEARLY PROBABILITY', 'SURVIVAL, DAY AFTER DAY', 'THE DAILY PROBABILITY'][value];
}
function scheduleBeat() {
  stopTimer();
  if (paused || !motion || currentScreen !== 'working' || $('#method-dialog').open) return;
  due = performance.now() + remaining;
  timer = setTimeout(() => {
    if (paused || currentScreen !== 'working') return;
    if (beat === 2) { showScreen('odds'); return; }
    setBeat(beat + 1); remaining = beatDuration; scheduleBeat();
  }, remaining);
}
function updatePlayback() {
  $('.working-screen').classList.toggle('paused', paused);
  $('#math-pause').textContent = paused ? 'Resume walkthrough ▷' : 'Pause walkthrough Ⅱ';
  $('#math-pause').hidden = !motion;
  $('#math-replay').hidden = !motion;
}
function startWalkthrough() {
  stopTimer(); remaining = beatDuration; paused = !motion;
  setBeat(motion ? 0 : 2); updatePlayback(); scheduleBeat();
  $('.working-heading > .body-copy').textContent = motion ? 'Your result is ready. The walkthrough plays automatically. Pause or skip it anytime.' : 'Motion is off. Read the steps, then see your result.';
  $('#math-announcement').textContent = motion ? 'The math walkthrough advances automatically. Pause it or see your result now. A complete transcript is available in Sources and math.' : 'Motion is off. All three steps are visible. Continue to your result when you’re ready.';
}
function pauseWalkthrough() {
  if (paused) return;
  remaining = Math.max(0, due - performance.now()); paused = true; stopTimer(); updatePlayback();
}
$('#math-pause').addEventListener('click', () => {
  if (paused) { paused = false; updatePlayback(); scheduleBeat(); }
  else pauseWalkthrough();
});
$('#math-replay').addEventListener('click', startWalkthrough);
$('#replay-from-result').addEventListener('click', () => { setBeat(motion ? 0 : 2); showScreen('working', true, startWalkthrough); });
// No auto-advancing a hidden tab, and no surprise restart when the visitor returns.
document.addEventListener('visibilitychange', () => { if (document.hidden && currentScreen === 'working') pauseWalkthrough(); });
function applyMotion() {
  document.body.dataset.motion = motion ? 'on' : 'off';
  if (!motion) navigationAnimation?.cancel();
  $('#motion-toggle').textContent = motion ? 'Motion on' : 'Motion off';
  $('#motion-toggle').setAttribute('aria-label', 'Reduce motion');
  $('#motion-toggle').setAttribute('aria-pressed', String(!motion));
  if (currentScreen === 'working') {
    pauseWalkthrough();
    if (!motion) setBeat(2);
    updatePlayback();
  }
}
$('#motion-toggle').addEventListener('click', () => { motionChosen = true; motion = !motion; applyMotion(); });
motionQuery.addEventListener('change', event => { if (!motionChosen) { motion = !event.matches; applyMotion(); } });
applyMotion();

function svgElement(tag, attributes = {}) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
  return node;
}
function renderLifeGrid() {
  const weeks = lifeWeeks(result);
  $('#remaining-weeks').textContent = compactRange(weeks.remaining, 0);
  $('#remaining-years').textContent = compactRange(result.remainingYears, 1);
  const grid = $('#life-grid');
  grid.querySelectorAll('[data-grid]').forEach(node => node.remove());
  const lastDecade = Math.floor((weeks.total - 1) / 520);
  gridDecade = Math.max(0, Math.min(lastDecade, gridDecade));
  $('#grid-zoom').textContent = gridZoom ? 'Whole life −' : 'Look closer +';
  $('#grid-zoom').setAttribute('aria-pressed', String(gridZoom));
  $('#life-decade-prev').hidden = !gridZoom;
  $('#life-decade-next').hidden = !gridZoom;
  $('#life-decade-prev').disabled = gridDecade === 0;
  $('#life-decade-next').disabled = gridDecade === lastDecade;
  const lowerYear = gridDecade * 10;
  const upperYear = Math.min(lowerYear + 9, Math.ceil(weeks.total / 52) - 1);
  $('#life-end-label').textContent = gridZoom ? `AGES ${lowerYear}–${upperYear}` : 'A LIFE, IN DECADES';
  $('#life-grid-description').textContent = `${gridZoom ? `Close view of ages ${lowerYear} to ${upperYear}.` : 'Weeks grouped into ten-year chapters.'} Approximately ${weeks.lived} weeks lived and ${weeks.remaining[0]} to ${weeks.remaining[1]} average weeks ahead in the two tables. Each square is a week; each row is a year. The endpoints compare means, not lifespan bounds. The diamond marks your approximate current age.`;
  const defs = svgElement('defs', { 'data-grid': '' });
  const hatch = svgElement('pattern', { id: 'week-hatch', width: 4, height: 4, patternUnits: 'userSpaceOnUse' });
  hatch.append(svgElement('rect', { width: 4, height: 4, fill: '#fff' }), svgElement('path', { d: 'M-1 1L1-1M0 4L4 0M3 5L5 3', stroke: '#888', 'stroke-width': 1 }));
  defs.append(hatch); grid.append(defs);
  const columns = gridZoom ? 1 : window.matchMedia('(max-width:760px)').matches ? 2 : 3;
  const first = gridZoom ? gridDecade : 0;
  const count = gridZoom ? 1 : lastDecade + 1;
  const pitchX = gridZoom ? 12 : 7;
  const pitchY = gridZoom ? 22 : 7;
  const size = gridZoom ? 8 : 4.7;
  const labelWidth = gridZoom ? 44 : 0;
  const panelWidth = 52 * pitchX + labelWidth;
  const panelHeight = gridZoom ? 10 * pitchY + 10 : 10 * pitchY + 42;
  const gutter = gridZoom ? 0 : 34;
  grid.setAttribute('viewBox', `0 0 ${columns * panelWidth + (columns - 1) * gutter} ${Math.ceil(count / columns) * panelHeight}`);
  const group = svgElement('g', { 'data-grid': '', 'aria-hidden': 'true' });
  for (let panel = 0; panel < count; panel++) {
    const decade = first + panel;
    const offsetX = (panel % columns) * (panelWidth + gutter);
    const offsetY = Math.floor(panel / columns) * panelHeight;
    const chapter = svgElement('g', { transform: `translate(${offsetX} ${offsetY})` });
    if (!gridZoom) {
      const endAge = Math.min(decade * 10 + 9, Math.ceil(weeks.total / 52) - 1);
      const label = svgElement('text', { x: 0, y: 15, fill: '#555', 'font-size': 14, 'font-family': 'monospace' });
      label.textContent = `${String(decade * 10).padStart(2, '0')}–${String(endAge).padStart(2, '0')}`;
      chapter.append(label);
      if (Math.floor(result.age / 10) === decade) {
        const current = svgElement('text', { x: panelWidth - 1, y: 15, fill: '#111', 'font-size': 12, 'font-family': 'monospace', 'text-anchor': 'end' });
        current.textContent = `AGE ${result.age}`; chapter.append(current);
      }
    }
    const top = gridZoom ? 5 : 28;
    const paths = ['', '', ''];
    for (let year = 0; year < 10; year++) {
      const yearStart = decade * 520 + year * 52;
      if (yearStart >= weeks.total) break;
      if (gridZoom) {
        const label = svgElement('text', { x: 0, y: top + year * pitchY + size, fill: '#555', 'font-size': 16, 'font-family': 'monospace' });
        label.textContent = decade * 10 + year; chapter.append(label);
      }
      for (let week = 0; week < 52; week++) {
        const index = yearStart + week;
        if (index >= weeks.total) break;
        const kind = index < weeks.lived ? 0 : index < weeks.lived + weeks.remaining[0] ? 1 : 2;
        const x = labelWidth + week * pitchX, y = top + year * pitchY;
        paths[kind] += `M${x},${y}h${size}v${size}h-${size}z`;
      }
    }
    paths.forEach((d, kind) => {
      if (!d) return;
      chapter.append(svgElement('path', { d, fill: ['#151515', '#fff', 'url(#week-hatch)'][kind], stroke: kind === 1 ? '#999' : 'none', 'stroke-width': .6 }));
    });
    if (Math.floor(result.age / 10) === decade) {
      const local = weeks.lived - decade * 520;
      const x = labelWidth + (local % 52) * pitchX + size / 2;
      const y = top + Math.floor(local / 52) * pitchY + size / 2;
      const mark = size + 2;
      chapter.append(svgElement('rect', { x: x - mark / 2, y: y - mark / 2, width: mark, height: mark, transform: `rotate(45 ${x} ${y})`, fill: '#111', stroke: '#fff', 'stroke-width': 1.1 }));
    }
    group.append(chapter);
  }
  grid.append(group);
}
$('#grid-zoom').addEventListener('click', () => { gridZoom = !gridZoom; if (gridZoom) gridDecade = Math.floor(result.age / 10); renderLifeGrid(); });
$('#life-decade-prev').addEventListener('click', () => { if (gridDecade > 0) { gridDecade--; renderLifeGrid(); } });
$('#life-decade-next').addEventListener('click', () => { gridDecade++; renderLifeGrid(); });
window.addEventListener('resize', () => { if (result) renderLifeGrid(); });

const dayCells = Array.from({ length: 365 }, (_, i) => {
  const cell = document.createElement('i'); cell.style.setProperty('--row', Math.floor(i / 73)); return cell;
});
$('#day-grid').replaceChildren(...dayCells);
$('#year-ruler').replaceChildren(...Array.from({ length: 365 }, () => document.createElement('i')));

function renderBudget() {
  const inputs = { sleepPerNight: Number($('#sleep').value), workPerWeek: Number($('#work').value), carePerWeek: Number($('#care').value) };
  const budget = weeklyBudget(inputs);
  $('#sleep-value').textContent = `${inputs.sleepPerNight} h / night`;
  $('#work-value').textContent = `${inputs.workPerWeek} h / week`;
  $('#care-value').textContent = `${inputs.carePerWeek} h / week`;
  for (const [id, value, unit] of [['sleep', inputs.sleepPerNight, 'night'], ['work', inputs.workPerWeek, 'week'], ['care', inputs.carePerWeek, 'week']]) {
    $(`#${id}`).setAttribute('aria-valuetext', `${value} hours per ${unit}`); sliderStyle($(`#${id}`));
  }
  $('#open-hours').textContent = compactRange([budget.valid ? budget.open : budget.over, budget.valid ? budget.open : budget.over]);
  $('#open-hours-label').textContent = budget.valid ? 'hours unallocated' : 'hours over budget';
  $('#budget-note').textContent = budget.valid ? (budget.open === 0 ? 'All 168 hours are allocated. Check for overlap.' : 'These are starting values. Count each hour once.') : 'Over 168 hours. Reduce a slider or check for overlap. The grid stops at 168.';
  $('#budget-note').classList.toggle('over', !budget.valid);
  $('.budget-visual').classList.toggle('over-budget', !budget.valid);
  const categories = [{ hours: budget.sleep, color: '#151515' }, { hours: budget.work, color: '#777' }, { hours: budget.care, color: '#c9c9c9' }];
  const grid = $('#week-grid');
  // Reuse cells so slider input doesn't replay the entrance animation 168 times.
  if (!grid.children.length) grid.replaceChildren(...Array.from({ length: 168 }, (_, index) => {
    const cell = document.createElement('span'); cell.className = 'hour-cell'; cell.setAttribute('aria-hidden', 'true'); cell.style.setProperty('--row', Math.floor(index / 24)); return cell;
  }));
  [...grid.children].forEach((cell, index) => {
    let start = 0; const stops = [];
    for (const item of categories) {
      const end = start + item.hours;
      const left = Math.max(index, start), right = Math.min(index + 1, end);
      if (right > left) stops.push(`${item.color} ${(left - index) * 100}% ${(right - index) * 100}%`);
      start = end;
    }
    if (budget.allocated < index + 1) stops.push(`#fff ${(Math.max(index, budget.allocated) - index) * 100}% 100%`);
    cell.style.background = `linear-gradient(to right, ${stops.join(', ')})`;
  });
  grid.setAttribute('aria-label', `168-hour week: ${budget.sleep} hours sleep, ${budget.work} work and study, ${budget.care} essentials. ${budget.valid ? `${budget.open} hours unallocated.` : `Over budget by ${budget.over} hours. Grid capped at 168.`}`);
}
['sleep', 'work', 'care'].forEach(id => $(`#${id}`).addEventListener('input', renderBudget));
$('#intention-form').addEventListener('submit', event => {
  event.preventDefault();
  const intention = $('#intention').value.trim();
  $('#intention-result').textContent = intention ? `This week: ${intention}. Take that thought with you. It isn’t saved.` : 'Write one thing you’d like to make time for.';
  if (!intention) $('#intention').focus();
});

function renderValues(age) {
  const comparison = estimateByAge(dataset, age);
  $('#values-content').hidden = false; $('#values-hint').hidden = true;
  $('#inspect-age-value').textContent = age;
  $('#values-caption').textContent = `Exact age ${age} · SSA 2023 period life table`;
  $('#source-values').replaceChildren(...comparison.series.map(item => {
    const row = document.createElement('tr');
    [item.key === 'female' ? 'Female' : 'Male', item.annual.toFixed(6), item.daily.toPrecision(7), item.remainingYears.toFixed(2)].forEach((value, i) => {
      const cell = document.createElement(i ? 'td' : 'th'); if (!i) cell.scope = 'row'; cell.textContent = value; row.append(cell);
    }); return row;
  }));
  $('#inspect-age').setAttribute('aria-valuetext', `Age ${age}`); sliderStyle($('#inspect-age'));
}
$('#inspect-age').addEventListener('input', event => { if (dataset) renderValues(Number(event.target.value)); });
function selectTab(name, focus = false) {
  $$('.method-tabs [role="tab"]').forEach(tab => { const selected = tab.dataset.tab === name; tab.setAttribute('aria-selected', String(selected)); tab.tabIndex = selected ? 0 : -1; if (selected && focus) tab.focus(); });
  $$('[data-panel]').forEach(panel => { panel.hidden = panel.dataset.panel !== name; });
}
function openMethod(name) {
  if (currentScreen === 'working') pauseWalkthrough();
  selectTab(name);
  $('#method-dialog').showModal();
  $('#close-method').focus();
}
$$('[data-method]').forEach(button => button.addEventListener('click', () => openMethod(button.dataset.method)));
$('#close-method').addEventListener('click', () => $('#method-dialog').close());
$$('[data-tab]').forEach(tab => tab.addEventListener('click', () => selectTab(tab.dataset.tab)));
$('.method-tabs').addEventListener('keydown', event => {
  const tabs = $$('[data-tab]'); const current = tabs.indexOf(event.target);
  if (current < 0) return;
  const offsets = { ArrowRight: 1, ArrowLeft: -1 };
  let index;
  if (event.key in offsets) index = (current + offsets[event.key] + tabs.length) % tabs.length;
  else if (event.key === 'Home') index = 0;
  else if (event.key === 'End') index = tabs.length - 1;
  else return;
  event.preventDefault(); selectTab(tabs[index].dataset.tab, true);
});
document.addEventListener('keydown', event => {
  if ($('#method-dialog').open || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (['INPUT', 'TEXTAREA', 'BUTTON', 'A'].includes(event.target.tagName) || event.target.isContentEditable) return;
  if (event.key === 'ArrowRight') { event.preventDefault(); nextScreen(); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); previousScreen(); }
});
renderBudget();
showScreen('start', false);
