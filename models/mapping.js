
// Simple, readable mapping from normalized hormone slider values (0-100)
// to an estimated monthly percentage change in body fat. This is a toy model
// built for visualization/education only.

/**
 * Compute estimated body fat change given hormone levels.
 * @param {{insulin:number,cortisol:number,testosterone:number,estrogen:number}} hormones
 * @param {number} baselinePercent baseline body fat percentage (e.g., 25)
 * @returns {{deltaPercent:number,newBodyFat:number}}
 */
export function computeBodyFatImpact(hormones, baselinePercent = 25) {
	// Treat 50 as neutral. Positive contributions increase body fat, negative reduce.
	const norm = v => (v - 50) / 50; // -1..+1

	const i = norm(hormones.insulin || 50);
	// removed leptin and growthHormone from the reduced model
	const c = norm(hormones.cortisol || 50);
	const t = norm(hormones.testosterone || 50);
	const e = norm(hormones.estrogen || 50);
	// Coefficients chosen for the reduced 4-hormone model
	const coeff = {
		insulin: 1.0,    // insulin strongly promotes fat storage
		cortisol: 0.6,   // stress hormone increases fat (esp visceral)
		testosterone: -0.7, // testosterone protects/helps reduce fat
		estrogen: 0.1    // estrogen has smaller direct effect here
	};

	// Weighted sum -> change factor per month (percent points)
	let delta = i * coeff.insulin
						+ c * coeff.cortisol
						+ t * coeff.testosterone
						+ e * coeff.estrogen;

	// Scale to percent points and keep reasonable bounds
	delta = delta * 1.8; // scale down to a plausible monthly percent change
	// clamp to [-6%, +6%] per month to avoid wild numbers
	delta = Math.max(-6, Math.min(6, delta));

	const newBodyFat = Math.max(1, Math.min(60, baselinePercent + delta));

	return { deltaPercent: Number(delta.toFixed(2)), newBodyFat: Number(newBodyFat.toFixed(2)) };
}

/**
 * Compute a distribution of body fat concentration across regions for a given
 * set of hormone values and gender. Returns percentages per region that sum to 100.
 * Regions: abdomen, hips, thighs, arms, chest
 */
export function computeDistribution(hormones, gender = 'male'){
	const norm = v => (v - 50) / 50; // -1..+1
	const i = norm(hormones.insulin || 50);
	// Only four hormones in the reduced model
	const c = norm(hormones.cortisol || 50);
	const t = norm(hormones.testosterone || 50);
	const e = norm(hormones.estrogen || 50);

	// Base distributions (prior) for male/female (sum to 100)
	const base = {
		male:   {abdomen:40, hips:10, thighs:15, arms:15, chest:20},
		female: {abdomen:20, hips:32, thighs:28, arms:10, chest:10}
	};

	const b = base[gender] || base.male;

	// Hormone effect multipliers per region (how much each hormone pushes fat to that region)
	// Positive value means hormone increases relative accumulation in that region.
	// Effects per region for the reduced hormone set
	const effects = {
		abdomen: {insulin: +1.3, cortisol: +1.0, testosterone: -0.7, estrogen: -0.2},
		hips:    {insulin: -0.2, cortisol: -0.25, testosterone: -0.4, estrogen: +0.9},
		thighs:  {insulin: -0.2, cortisol: -0.2, testosterone: -0.35, estrogen: +0.8},
		arms:    {insulin: -0.1, cortisol: +0.1, testosterone: +0.0, estrogen: 0},
		chest:   {insulin: +0.35, cortisol: +0.2, testosterone: -0.25, estrogen: 0}
	};

	// Start from base and apply multipliers influenced by hormone normalized values
	let raw = {};
	Object.keys(b).forEach(region=>{
		const baseVal = b[region];
		const eff = effects[region];
		// compute a small offset from hormones
		const offset = (i * (eff.insulin||0)) + (c * (eff.cortisol||0))
					 + (t * (eff.testosterone||0)) + (e * (eff.estrogen||0));
		// Convert offset into a multiplier factor around 1
		const factor = 1 + offset * 0.12; // scale down impact
		const val = Math.max(0.1, baseVal * factor);
		raw[region] = val;
	});

	// Derive a 'shoulders' region from chest/arms and slightly adjust chest/arms
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

	// Normalize derived values to percentages that sum to 100
	let total = 0;
	Object.keys(derived).forEach(k => total += derived[k]);
	const distribution = {};
	Object.keys(derived).forEach(k => distribution[k] = Number(((derived[k] / total) * 100).toFixed(1)) );

	// Compute delta relative to a base-derived mapping
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

	const delta = {};
	Object.keys(distribution).forEach(k=> delta[k] = Number((distribution[k] - basePct[k]).toFixed(1)));

	return { distribution, delta, gender };
}
