// Inlined computeDistribution and computeBodyFatImpact from models/mapping.js
function computeBodyFatImpact(hormones, baselinePercent = 25) {
  const norm = v => (v - 50) / 50;
  const i = norm(hormones.insulin || 50);
  const c = norm(hormones.cortisol || 50);
  const t = norm(hormones.testosterone || 50);
  const e = norm(hormones.estrogen || 50);
  const coeff = { insulin: 1.0, cortisol: 0.6, testosterone: -0.7, estrogen: 0.1 };
  let delta = i * coeff.insulin + c * coeff.cortisol + t * coeff.testosterone + e * coeff.estrogen;
  delta = delta * 1.8;
  delta = Math.max(-6, Math.min(6, delta));
  const newBodyFat = Math.max(1, Math.min(60, baselinePercent + delta));
  return { deltaPercent: Number(delta.toFixed(2)), newBodyFat: Number(newBodyFat.toFixed(2)) };
}

function computeDistribution(hormones, gender = 'male'){
  const norm = v => (v - 50) / 50; // -1..+1
  const i = norm(hormones.insulin || 50);
  const c = norm(hormones.cortisol || 50);
  const t = norm(hormones.testosterone || 50);
  const e = norm(hormones.estrogen || 50);
  const base = {
    male:   {abdomen:40, hips:10, thighs:15, arms:15, chest:20},
    female: {abdomen:20, hips:32, thighs:28, arms:10, chest:10}
  };
  const b = base[gender] || base.male;
  const effects = {
    abdomen: {insulin: +1.3, cortisol: +1.0, testosterone: -0.7, estrogen: -0.2},
    hips:    {insulin: -0.2, cortisol: -0.25, testosterone: -0.4, estrogen: +0.9},
    thighs:  {insulin: -0.2, cortisol: -0.2, testosterone: -0.35, estrogen: +0.8},
    arms:    {insulin: -0.1, cortisol: +0.1, testosterone: +0.0, estrogen: 0},
    chest:   {insulin: +0.35, cortisol: +0.2, testosterone: -0.25, estrogen: 0}
  };
  let raw = {};
  Object.keys(b).forEach(region=>{
    const baseVal = b[region];
    const eff = effects[region];
    const offset = (i * (eff.insulin||0)) + (c * (eff.cortisol||0)) + (t * (eff.testosterone||0)) + (e * (eff.estrogen||0));
    const factor = 1 + offset * 0.12;
    const val = Math.max(0.1, baseVal * factor);
    raw[region] = val;
  });
  const chest0 = raw.chest || 0;
  const arms0 = raw.arms || 0;
  const abdomen0 = raw.abdomen || 0;
  const hips0 = raw.hips || 0;
  const thighs0 = raw.thighs || 0;
  const derived = {
    arms: Math.max(0.1, arms0 * 0.9 + chest0 * 0.05),
    shoulders: Math.max(0.1, chest0 * 0.35 + arms0 * 0.15),
    chest: Math.max(0.1, chest0 * 0.6 + arms0 * 0.05),
    abdomen: Math.max(0.1, abdomen0),
    hips: Math.max(0.1, hips0),
    thighs: Math.max(0.1, thighs0)
  };
  let total = 0; Object.keys(derived).forEach(k => total += derived[k]);
  const distribution = {}; Object.keys(derived).forEach(k => distribution[k] = Number(((derived[k] / total) * 100).toFixed(1)) );
  const baseDerived = {
    arms: Math.max(0.1, b.arms * 0.9 + b.chest * 0.05),
    shoulders: Math.max(0.1, b.chest * 0.35 + b.arms * 0.15),
    chest: Math.max(0.1, b.chest * 0.6 + b.arms * 0.05),
    abdomen: Math.max(0.1, b.abdomen),
    hips: Math.max(0.1, b.hips),
    thighs: Math.max(0.1, b.thighs)
  };
  let baseTotal = 0; Object.keys(baseDerived).forEach(k=> baseTotal += baseDerived[k]);
  const basePct = {}; Object.keys(baseDerived).forEach(k=> basePct[k] = Number(((baseDerived[k]/baseTotal)*100).toFixed(1)));
  const delta = {}; Object.keys(distribution).forEach(k=> delta[k] = Number((distribution[k] - basePct[k]).toFixed(1)));
  return { distribution, delta, gender };
}

const defaultBaseline = 25;

function qs(id){ return document.getElementById(id); }

const sliders = ['insulin','cortisol','testosterone','estrogen'];

function readValues(){
  const obj = {};
  sliders.forEach(s=> obj[s] = Number(qs(s).value));
  return obj;
}

function updateOutputs(){
  const hormones = readValues();
  sliders.forEach(s=> qs(s + 'Val').textContent = qs(s).value);

  // compute distributions for both genders (we render two columns)
  const maleRes = computeDistribution(hormones, 'male');
  const femaleRes = computeDistribution(hormones, 'female');

  // compute per-region min/max by simulating extreme hormone values
  const hormonesMin = { insulin: 0, cortisol: 0, testosterone: 0, estrogen: 0 };
  const hormonesMax = { insulin: 100, cortisol: 100, testosterone: 100, estrogen: 100 };
  const maleMin = computeDistribution(hormonesMin, 'male').distribution;
  const maleMax = computeDistribution(hormonesMax, 'male').distribution;
  const femaleMin = computeDistribution(hormonesMin, 'female').distribution;
  const femaleMax = computeDistribution(hormonesMax, 'female').distribution;
  // read baseline slider (if present) and update displays
  const baselineEl = qs('baselineSlider');
  const baselinePercent = baselineEl ? Number(baselineEl.value) : defaultBaseline;
  const baselineOut = qs('baselineSliderVal');
  if(baselineOut) baselineOut.textContent = String(baselinePercent);
  const baselineValEl = qs('baselineVal');
  if(baselineValEl) baselineValEl.textContent = baselinePercent + '%';

  // show/hide the correct SVG
  // update bars and list numbers for the ordered zones
  console.log('maleDist', maleRes.distribution, 'femaleDist', femaleRes.distribution);
  const ordered = ['arms','shoulders','chest','abdomen','hips','thighs'];
  ordered.forEach(r=>{
    // male values (we use the delta returned by the model so "50" means neutral)
    const maleDist = maleRes.distribution[r] != null ? maleRes.distribution[r] : 0;
    const maleMinVal = Math.min(maleMin[r] || 0, maleMax[r] || 0);
    const maleMaxVal = Math.max(maleMin[r] || 0, maleMax[r] || 0);
    const maleRange = (maleMaxVal - maleMinVal) || 1;
    const fillFracMale = Math.min(1, Math.max(0, (maleDist - maleMinVal) / maleRange));

    const zoneMale = document.querySelector(`.zone[data-region="${r}"][data-gender="male"]`);
    if(zoneMale){
      const left = zoneMale.querySelector('.bar-fill-left');
      const valEl = zoneMale.querySelector('.bar-value');
      if(left){ left.style.width = '100%'; left.style.transform = `scaleX(${fillFracMale})`; left.style.background = 'linear-gradient(90deg, rgba(228,68,68,0.95), rgba(228,68,68,0.6))'; }
      if(valEl) { valEl.textContent = (Number(maleDist).toFixed(1) + '%'); zoneMale.querySelector('.bar-track').title = `Range: ${maleMinVal.toFixed(1)}% — ${maleMaxVal.toFixed(1)}%`; }
    }

    // female values
    const femaleDist = femaleRes.distribution[r] != null ? femaleRes.distribution[r] : 0;
    const femaleMinVal = Math.min(femaleMin[r] || 0, femaleMax[r] || 0);
    const femaleMaxVal = Math.max(femaleMin[r] || 0, femaleMax[r] || 0);
    const femaleRange = (femaleMaxVal - femaleMinVal) || 1;
    const fillFracFemale = Math.min(1, Math.max(0, (femaleDist - femaleMinVal) / femaleRange));
    const zoneFemale = document.querySelector(`.zone[data-region="${r}"][data-gender="female"]`);
    if(zoneFemale){
      const left = zoneFemale.querySelector('.bar-fill-left');
      const valEl = zoneFemale.querySelector('.bar-value');
      if(left){ left.style.width = '100%'; left.style.transform = `scaleX(${fillFracFemale})`; left.style.background = 'linear-gradient(90deg, rgba(228,68,68,0.95), rgba(228,68,68,0.6))'; }
      if(valEl) { valEl.textContent = (Number(femaleDist).toFixed(1) + '%'); zoneFemale.querySelector('.bar-track').title = `Range: ${femaleMinVal.toFixed(1)}% — ${femaleMaxVal.toFixed(1)}%`; }
    }

    // compute absolute region body-fat (percentage points of total body weight)
    const absEl = qs('r-' + r + '-abs');
    if(absEl){
      const regionAbs = Math.round((baselinePercent * (maleDist / 100)) * 10) / 10; // one decimal (uses maleDist as representative)
      absEl.textContent = regionAbs + '%';
    }
  });
}

function randomize(){
  sliders.forEach(s=> qs(s).value = Math.floor(30 + Math.random()*40));
  updateOutputs();
}

function reset(){
  sliders.forEach(s=> qs(s).value = 50);
  updateOutputs();
}

function init(){
  sliders.forEach(s=>{
    const el = qs(s);
    if(el) el.addEventListener('input', updateOutputs);
  });

  // baseline slider wiring
  const baselineEl = qs('baselineSlider');
  if(baselineEl) baselineEl.addEventListener('input', updateOutputs);

  // gender selector removed; both genders update together

  const resetBtn = qs('resetBtn');
  if(resetBtn) resetBtn.addEventListener('click', reset);
  const randomBtn = qs('randomBtn');
  if(randomBtn) randomBtn.addEventListener('click', randomize);

  // Initial draw
  updateOutputs();
}

document.addEventListener('DOMContentLoaded', init);
