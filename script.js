import { computeDistribution } from './models/mapping.js';

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

  // compute distribution for selected gender and update inline SVG regions
  const gender = qs('gender') ? qs('gender').value : 'male';
  const { distribution } = computeDistribution(hormones, gender);
  // read baseline slider (if present) and update displays
  const baselineEl = qs('baselineSlider');
  const baselinePercent = baselineEl ? Number(baselineEl.value) : defaultBaseline;
  const baselineOut = qs('baselineSliderVal');
  if(baselineOut) baselineOut.textContent = String(baselinePercent);
  qs('baselineVal').textContent = baselinePercent + '%';

  // show/hide the correct SVG
  // update bars and list numbers for the ordered zones
  console.log('distribution', distribution);
  const ordered = ['arms','shoulders','chest','abdomen','hips','thighs'];
  ordered.forEach(r=>{
    const pct = distribution[r] != null ? distribution[r] : 0;
    // update numeric list if present
    const el = qs('r-' + r);
    if(el) el.textContent = pct + '%';

    // update bar fills
    const zone = document.querySelector(`.zone[data-region="${r}"]`);
    if(zone){
      const left = zone.querySelector('.bar-fill-left');
      const right = zone.querySelector('.bar-fill-right');
      const valEl = zone.querySelector('.bar-value');
      // compute fill fraction 0..1 where 0 means balanced (50) and 1 means extreme (0 or 100)
      const fillFrac = Math.min(1, Math.max(0, Math.abs(pct - 50) / 50));
      if(pct >= 50){
        // right side filled from center
        if(right){
          right.style.width = '50%';
          right.style.transform = `scaleX(${fillFrac})`;
          right.style.background = 'linear-gradient(90deg, rgba(228,68,68,0.95), rgba(228,68,68,0.6))';
        }
        if(left){
          left.style.width = '50%';
          left.style.transform = 'scaleX(0)';
        }
      } else {
        // left side filled from center
        if(left){
          left.style.width = '50%';
          left.style.transform = `scaleX(${fillFrac})`;
          left.style.background = 'linear-gradient(90deg, rgba(228,68,68,0.95), rgba(228,68,68,0.6))';
        }
        if(right){
          right.style.width = '50%';
          right.style.transform = 'scaleX(0)';
        }
      }
      if(valEl) valEl.textContent = pct + '%';
    }

    // compute absolute region body-fat (percentage points of total body weight)
    const absEl = qs('r-' + r + '-abs');
    if(absEl){
      const regionAbs = Math.round((baselinePercent * (pct / 100)) * 10) / 10; // one decimal
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

  // gender change => redraw
  const genderSel = qs('gender');
  if(genderSel){
    genderSel.addEventListener('change', updateOutputs);
  }

  const resetBtn = qs('resetBtn');
  if(resetBtn) resetBtn.addEventListener('click', reset);
  const randomBtn = qs('randomBtn');
  if(randomBtn) randomBtn.addEventListener('click', randomize);

  // Initial draw
  updateOutputs();
}

document.addEventListener('DOMContentLoaded', init);
