/**
 * HORMONE & FAT DISTRIBUTION MODEL
 * ================================
 * This application models how hormone levels affect body fat distribution
 * across different body regions for both male and female bodies.
 * 
 * Key Concepts:
 * - Hormones range from 0-100 (displayed as sliders)
 * - Value 50 represents the neutral/baseline state
 * - Values < 50 decrease the hormone, values > 50 increase it
 * - Each hormone affects fat distribution independently
 * - The model is purely educational and simplified for clarity
 */

/**
 * Calculates total body fat percentage change based on hormone values.
 * Used for informational metrics about overall body composition impact.
 * 
 * @param {Object} hormones - Object with keys: insulin, cortisol, testosterone, estrogen (0-100)
 * @param {number} baselinePercent - Starting body fat percentage (default 25%)
 * @returns {Object} { deltaPercent: change in body fat %, newBodyFat: total body fat % }
 */
function computeBodyFatImpact(hormones, baselinePercent = 25) {
  // Normalize hormone values from 0-100 range to -1 to +1 range
  // This centers the calculation at 50 (neutral baseline)
  const norm = v => (v - 50) / 50;
  
  // Extract and normalize each hormone (using explicit undefined checks to handle value of 0)
  const i = norm(hormones.insulin !== undefined ? hormones.insulin : 50);
  const c = norm(hormones.cortisol !== undefined ? hormones.cortisol : 50);
  const t = norm(hormones.testosterone !== undefined ? hormones.testosterone : 50);
  const e = norm(hormones.estrogen !== undefined ? hormones.estrogen : 50);
  
  // Effect coefficients: how strongly each hormone influences total body fat
  const coeff = { insulin: 1.0, cortisol: 0.6, testosterone: -0.7, estrogen: 0.1 };
  
  // Calculate weighted sum of hormone effects
  let delta = i * coeff.insulin + c * coeff.cortisol + t * coeff.testosterone + e * coeff.estrogen;
  
  // Scale the combined effect
  delta = delta * 1.8;
  
  // Clamp to reasonable range (-6% to +6% change)
  delta = Math.max(-6, Math.min(6, delta));
  
  // Calculate new total body fat percentage (clamped 1-60%)
  const newBodyFat = Math.max(1, Math.min(60, baselinePercent + delta));
  
  return { 
    deltaPercent: Number(delta.toFixed(2)), 
    newBodyFat: Number(newBodyFat.toFixed(2)) 
  };
}


/**
 * Calculates how hormones affect fat distribution across body regions.
 * 
 * How it works:
 * 1. Normalizes each hormone value to -1 to +1 range (50 = neutral)
 * 2. Applies region-specific effect coefficients for each hormone
 * 3. Combines effects into a scaling factor per region (0.65 to 1.35 range)
 * 4. Applies factor to baseline distribution
 * 5. Normalizes all regions to sum to 100% (relative distribution)
 * 
 * @param {Object} hormones - { insulin, cortisol, testosterone, estrogen } 0-100
 * @param {string} gender - 'male' or 'female' (different base distributions)
 * @returns {Object} { distribution: {region: percentage}, delta: {region: change}, gender }
 */
function computeDistribution(hormones, gender = 'male'){
  // Normalize hormone values from 0-100 to -1 to +1 range
  const norm = v => (v - 50) / 50; // -1..+1
  const i = norm(hormones.insulin !== undefined ? hormones.insulin : 50);
  const c = norm(hormones.cortisol !== undefined ? hormones.cortisol : 50);
  const t = norm(hormones.testosterone !== undefined ? hormones.testosterone : 50);
  const e = norm(hormones.estrogen !== undefined ? hormones.estrogen : 50);
  
  // BASELINE FAT DISTRIBUTIONS (by gender)
  // These represent the relative fat percentages at neutral hormone state (all at 50)
  // Male: tends to accumulate more abdominal fat
  // Female: tends to accumulate more hip and thigh fat
  const base = {
    male:   { abdomen: 40, hips: 10, thighs: 15, arms: 15, chest: 20 },
    female: { abdomen: 20, hips: 32, thighs: 28, arms: 10, chest: 10 }
  };
  const b = base[gender] || base.male;
  
  // HORMONE EFFECT COEFFICIENTS
  // These define how each hormone influences fat distribution in each region
  // Positive = hormone increases fat in that region
  // Negative = hormone decreases fat in that region
  // 0 = hormone has no effect on that region
  const effects = {
    abdomen: { insulin: +1.3, cortisol: +1.0, testosterone: -0.7, estrogen: -0.2 },
    hips:    { insulin: -0.2, cortisol: -0.25, testosterone: -0.4, estrogen: +0.9 },
    thighs:  { insulin: -0.2, cortisol: -0.2, testosterone: -0.35, estrogen: +0.8 },
    arms:    { insulin: -0.1, cortisol: +0.1, testosterone: +0.0, estrogen: 0 },
    chest:   { insulin: +0.35, cortisol: +0.2, testosterone: -0.25, estrogen: 0 }
  };
  
  // Calculate raw fat percentages for each region
  let raw = {};
  Object.keys(b).forEach(region => {
    const baseVal = b[region];
    const eff = effects[region];
    
    // Weighted sum of hormone effects on this region
    // Each hormone contributes (normalized_hormone_value × effect_coefficient)
    const offset = (i * (eff.insulin || 0)) + 
                   (c * (eff.cortisol || 0)) + 
                   (t * (eff.testosterone || 0)) + 
                   (e * (eff.estrogen || 0));
    
    // Convert offset to scaling factor (1.0 = no change from baseline)
    // Scaling factor determines how much the baseline value multiplies
    // 0.35 means hormones can change region by ±35%
    const factor = 1 + offset * 0.35;
    
    // Clamp scaling factor to soft boundaries (0.65 to 1.35)
    // This prevents extreme changes while allowing significant variation
    // 0.65 = 65% of baseline (35% reduction)
    // 1.35 = 135% of baseline (35% increase)
    const clampedFactor = Math.max(0.65, Math.min(1.35, factor));
    
    // Apply clamped factor to baseline value
    const val = baseVal * clampedFactor;
    raw[region] = val;
  });
  
  // DERIVED REGIONS
  // Shoulders are derived from chest and arms proportions
  // This creates realistic proportions without separate hormone effects
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
  
  // NORMALIZE TO PERCENTAGE (total = 100%)
  // Calculate distribution as percentages of total
  let total = 0;
  Object.keys(derived).forEach(k => total += derived[k]);
  const distribution = {};
  Object.keys(derived).forEach(k => 
    distribution[k] = Number(((derived[k] / total) * 100).toFixed(1))
  );
  
  // CALCULATE BASELINE DISTRIBUTION (at neutral hormones)
  // Used to compute delta (change from baseline)
  const baseDerived = {
    arms: Math.max(0.1, b.arms * 0.9 + b.chest * 0.05),
    shoulders: Math.max(0.1, b.chest * 0.35 + b.arms * 0.15),
    chest: Math.max(0.1, b.chest * 0.6 + b.arms * 0.05),
    abdomen: Math.max(0.1, b.abdomen),
    hips: Math.max(0.1, b.hips),
    thighs: Math.max(0.1, b.thighs)
  };
  
  let baseTotal = 0;
  Object.keys(baseDerived).forEach(k => baseTotal += baseDerived[k]);
  const basePct = {};
  Object.keys(baseDerived).forEach(k => 
    basePct[k] = Number(((baseDerived[k] / baseTotal) * 100).toFixed(1))
  );
  
  // DELTA (CHANGE FROM BASELINE)
  // Shows how current distribution differs from baseline
  const delta = {};
  Object.keys(distribution).forEach(k => 
    delta[k] = Number((distribution[k] - basePct[k]).toFixed(1))
  );
  
  return { distribution, delta, gender };
}

const defaultBaseline = 25;

/**
 * Helper function to safely access DOM elements by ID
 * @param {string} id - The element ID to find
 * @returns {Element} The DOM element or null if not found
 */
function qs(id) { return document.getElementById(id); }

// List of all hormone slider IDs
const sliders = ['insulin', 'cortisol', 'testosterone', 'estrogen'];

/**
 * Maps a fill fraction (0 to 1) to a color with opacity.
 * 
 * Color Scale:
 *   0.0 (empty)  → Green (fat reduced in region)
 *   0.5 (middle) → Gray (at baseline)
 *   1.0 (full)   → Red (fat increased in region)
 * 
 * Opacity also varies with distance from middle:
 * - At middle (0.5): opacity 0.4 (subtle)
 * - At extremes (0 or 1): opacity 0.95 (prominent)
 * 
 * @param {number} fillFrac - Fill fraction from 0 to 1
 * @returns {string} CSS rgba() color string
 */
function getColorForFillFraction(fillFrac) {
  // Color definitions (RGB values)
  const green = { r: 34, g: 139, b: 34 };   // Dark green - fat reduction
  const gray = { r: 160, g: 160, b: 160 };  // Neutral gray - baseline
  const red = { r: 220, g: 20, b: 60 };     // Crimson red - fat increase
  
  let color;
  
  if (fillFrac < 0.5) {
    // Below baseline: interpolate from green to gray
    // Normalize 0-0.5 range to 0-1 for interpolation
    const t = fillFrac * 2;
    color = {
      r: Math.round(green.r + (gray.r - green.r) * t),
      g: Math.round(green.g + (gray.g - green.g) * t),
      b: Math.round(green.b + (gray.b - green.b) * t)
    };
  } else {
    // Above baseline: interpolate from gray to red
    // Normalize 0.5-1 range to 0-1 for interpolation
    const t = (fillFrac - 0.5) * 2;
    color = {
      r: Math.round(gray.r + (red.r - gray.r) * t),
      g: Math.round(gray.g + (red.g - gray.g) * t),
      b: Math.round(gray.b + (red.b - gray.b) * t)
    };
  }
  
  // Calculate opacity: more prominent at extremes, subtle at middle
  // Distance from 0.5 (middle): ranges from 0 to 0.5
  const distanceFromMiddle = Math.abs(fillFrac - 0.5);
  // Opacity formula: 0.4 at middle (distance=0), 0.95 at extremes (distance=0.5)
  const opacity = 0.4 + distanceFromMiddle * 1.1;
  
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`;
}


/**
 * Reads current hormone slider values
 * @returns {Object} Object with keys: insulin, cortisol, testosterone, estrogen
 */
function readValues() {
  const obj = {};
  sliders.forEach(s => obj[s] = Number(qs(s).value));
  return obj;
}

/**
 * Main update function - called whenever any slider changes
 * 
 * Steps:
 * 1. Read current slider values
 * 2. Update displayed values next to sliders
 * 3. Calculate fat distributions for both genders
 * 4. Calculate baseline (neutral) distribution
 * 5. Calculate min/max ranges for each region
 * 6. For each body region:
 *    - Calculate fill fraction (0-1) ensuring baseline=0.5
 *    - Determine color based on fill fraction
 *    - Update bar visualization
 *    - Update displayed percentage
 */
function updateOutputs() {
  // Step 1: Read all hormone slider values
  const hormones = readValues();
  
  // Step 2: Update the displayed hormone values next to sliders
  sliders.forEach(s => qs(s + 'Val').textContent = qs(s).value);

  // Step 3: Calculate distributions for current hormone values (both genders)
  const maleRes = computeDistribution(hormones, 'male');
  const femaleRes = computeDistribution(hormones, 'female');

  // Step 4: Calculate baseline distribution (all hormones at 50 = neutral)
  const hormonesBaseline = { 
    insulin: 50, 
    cortisol: 50, 
    testosterone: 50, 
    estrogen: 50 
  };
  const maleBaseline = computeDistribution(hormonesBaseline, 'male').distribution;
  const femaleBaseline = computeDistribution(hormonesBaseline, 'female').distribution;

  // Step 5: Calculate min/max ranges for each region
  // Min: all hormones at 0 (minimum values)
  const hormonesMin = { 
    insulin: 0, 
    cortisol: 0, 
    testosterone: 0, 
    estrogen: 0 
  };
  // Max: all hormones at 100 (maximum values)
  const hormonesMax = { 
    insulin: 100, 
    cortisol: 100, 
    testosterone: 100, 
    estrogen: 100 
  };
  const maleMin = computeDistribution(hormonesMin, 'male').distribution;
  const maleMax = computeDistribution(hormonesMax, 'male').distribution;
  const femaleMin = computeDistribution(hormonesMin, 'female').distribution;
  const femaleMax = computeDistribution(hormonesMax, 'female').distribution;

  // Debug output (can be removed in production)
  console.log('Current distributions:', {
    maleDist: maleRes.distribution,
    maleDelta: maleRes.delta,
    femaleDist: femaleRes.distribution,
    femaleDelta: femaleRes.delta
  });

  // Step 6: Update visualization for each body region
  const ordered = ['arms', 'shoulders', 'chest', 'abdomen', 'hips', 'thighs'];
  
  ordered.forEach(r => {
    // === MALE REGION ===
    const maleDist = maleRes.distribution[r] != null ? maleRes.distribution[r] : 0;
    const maleBaselineVal = maleBaseline[r] || 0;
    const maleMinVal = Math.min(maleMin[r] || 0, maleMax[r] || 0);
    const maleMaxVal = Math.max(maleMin[r] || 0, maleMax[r] || 0);
    
    // Calculate fill fraction using two-sided mapping
    // This ensures baseline always maps to 0.5 fill fraction
    let fillFracMale;
    if (maleDist < maleBaselineVal) {
      // Below baseline: scale from 0 (at min) to 0.5 (at baseline)
      const lowerRange = (maleBaselineVal - maleMinVal) || 1;
      fillFracMale = 0.25 + 0.25 * ((maleDist - maleMinVal) / lowerRange);
    } else if (maleDist > maleBaselineVal) {
      // Above baseline: scale from 0.5 (at baseline) to 1.0 (at max)
      const upperRange = (maleMaxVal - maleBaselineVal) || 1;
      fillFracMale = 0.5 + 0.5 * ((maleDist - maleBaselineVal) / upperRange);
    } else {
      // Exactly at baseline
      fillFracMale = 0.5;
    }
    // Ensure fill fraction stays within 0-1 range
    fillFracMale = Math.min(1, Math.max(0, fillFracMale));

    // Update male bar visualization
    const zoneMale = document.querySelector(`.zone[data-region="${r}"][data-gender="male"]`);
    if (zoneMale) {
      const barTrack = zoneMale.querySelector('.bar-track');
      const left = zoneMale.querySelector('.bar-fill-left');
      const right = zoneMale.querySelector('.bar-fill-right');
      const valEl = zoneMale.querySelector('.bar-value');
      
      // Get color based on fill fraction
      const barColor = getColorForFillFraction(fillFracMale);
      
      // Update bar visuals
      if (left) {
        left.style.width = '100%';
        left.style.transform = `scaleX(${Math.max(0, fillFracMale)})`;
        left.style.background = barColor;
        left.style.transformOrigin = 'left center';
      }
      if (right) {
        right.style.width = '100%';
        right.style.transform = 'scaleX(0)';
        right.style.background = barColor;
        right.style.transformOrigin = 'right center';
      }
      if (valEl) {
        valEl.textContent = Number(maleDist).toFixed(1) + '%';
      }
      if (barTrack) {
        barTrack.title = `Range: ${maleMinVal.toFixed(1)}% — ${maleMaxVal.toFixed(1)}%`;
      }
    }

    // === FEMALE REGION ===
    const femaleDist = femaleRes.distribution[r] != null ? femaleRes.distribution[r] : 0;
    const femaleBaselineVal = femaleBaseline[r] || 0;
    const femaleMinVal = Math.min(femaleMin[r] || 0, femaleMax[r] || 0);
    const femaleMaxVal = Math.max(femaleMin[r] || 0, femaleMax[r] || 0);
    
    // Calculate fill fraction using two-sided mapping (same logic as male)
    let fillFracFemale;
    if (femaleDist < femaleBaselineVal) {
      const lowerRange = (femaleBaselineVal - femaleMinVal) || 1;
      fillFracFemale = 0.25 + 0.25 * ((femaleDist - femaleMinVal) / lowerRange);
    } else if (femaleDist > femaleBaselineVal) {
      const upperRange = (femaleMaxVal - femaleBaselineVal) || 1;
      fillFracFemale = 0.5 + 0.5 * ((femaleDist - femaleBaselineVal) / upperRange);
    } else {
      fillFracFemale = 0.5;
    }
    fillFracFemale = Math.min(1, Math.max(0, fillFracFemale));

    // Update female bar visualization
    const zoneFemale = document.querySelector(`.zone[data-region="${r}"][data-gender="female"]`);
    if (zoneFemale) {
      const barTrack = zoneFemale.querySelector('.bar-track');
      const left = zoneFemale.querySelector('.bar-fill-left');
      const right = zoneFemale.querySelector('.bar-fill-right');
      const valEl = zoneFemale.querySelector('.bar-value');
      
      const barColor = getColorForFillFraction(fillFracFemale);
      
      if (left) {
        left.style.width = '100%';
        left.style.transform = `scaleX(${Math.max(0, fillFracFemale)})`;
        left.style.background = barColor;
        left.style.transformOrigin = 'left center';
      }
      if (right) {
        right.style.width = '100%';
        right.style.transform = 'scaleX(0)';
        right.style.background = barColor;
        right.style.transformOrigin = 'right center';
      }
      if (valEl) {
        valEl.textContent = Number(femaleDist).toFixed(1) + '%';
      }
      if (barTrack) {
        barTrack.title = `Range: ${femaleMinVal.toFixed(1)}% — ${femaleMaxVal.toFixed(1)}%`;
      }
    }
  });
}


/**
 * Randomize all hormone values within reasonable range (30-70)
 * Used for demo/exploration purposes
 */
function randomize() {
  sliders.forEach(s => qs(s).value = Math.floor(30 + Math.random() * 40));
  updateOutputs();
}

/**
 * Reset all hormone sliders to neutral (50)
 */
function reset() {
  sliders.forEach(s => qs(s).value = 50);
  updateOutputs();
}

/**
 * Initialize the application
 * - Attach event listeners to all sliders
 * - Attach event listeners to control buttons
 * - Perform initial render
 */
function init() {
  // Attach input listeners to all hormone sliders
  sliders.forEach(s => {
    const el = qs(s);
    if (el) el.addEventListener('input', updateOutputs);
  });

  // Attach button event listeners
  const resetBtn = qs('resetBtn');
  if (resetBtn) resetBtn.addEventListener('click', reset);
  
  const randomBtn = qs('randomBtn');
  if (randomBtn) randomBtn.addEventListener('click', randomize);

  // Perform initial render with all hormones at baseline (50)
  updateOutputs();
}

// Start app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', init);
