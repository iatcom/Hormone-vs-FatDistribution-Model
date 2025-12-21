# Quick Reference Guide

## 🎯 Project at a Glance

**Project**: Hormone & Fat Distribution Model
**Type**: Interactive Educational Web Application
**Tech Stack**: HTML5, CSS3, Vanilla JavaScript (no dependencies)
**Purpose**: Visualize how hormones affect body fat distribution

---

## 📖 Documentation Files

| File | Purpose | Best For |
|------|---------|----------|
| **README.md** | Complete guide with all details | Learning project, understanding concepts |
| **ENHANCEMENT_SUMMARY.md** | What was improved and why | Seeing quality metrics and enhancements |
| **This File** | Quick reference and navigation | Quick lookups and navigation |
| **script.js** | Core calculation logic | Understanding algorithms and implementation |
| **styles.css** | Visual presentation | Styling modifications, responsive design |
| **index.html** | HTML structure | Page layout and semantic markup |

---

## 🚀 Quick Start

### 1. Open the Application
```
Open index.html in any modern web browser
```

### 2. Try These Actions
- **Drag sliders** left/right to adjust hormones
- **Watch bars** update in real-time
- **Notice colors**: Green (reduced) → Gray (baseline) → Red (increased)
- **Click Reset** to return to neutral state
- **Click Randomize** to explore random combinations

### 3. Read the Tooltips
- Hover over hormone names for explanations
- Hover over bars to see exact percentages and ranges

---

## 🧬 The 4 Hormones

### Insulin (Storage)
- **Range**: 0-100
- **Effect**: Controls nutrient storage
- **Key Effect**: ↑ Increases abdomen fat

### Cortisol (Stress)
- **Range**: 0-100
- **Effect**: Stress hormone metabolism
- **Key Effect**: ↑ Increases visceral fat

### Testosterone (Muscle)
- **Range**: 0-100
- **Effect**: Anabolic hormone
- **Key Effect**: ↓ Decreases fat overall

### Estrogen (Female)
- **Range**: 0-100
- **Effect**: Sex hormone distribution
- **Key Effect**: ↑ Increases hip/thigh fat

---

## 👤 The 6 Body Regions

1. **Arms** - Biceps/triceps region
2. **Shoulders** - Upper back/shoulder area
3. **Chest** - Upper torso/pectoral area
4. **Abdomen** - Central/visceral fat region
5. **Hips** - Hip/glute region
6. **Thighs** - Upper leg region

---

## 🎨 Color Meanings

```
GREEN  ←────────────→  RED
 ▓▓▓▓▓▓  GRAY  ▓▓▓▓▓▓
Reduced         Increased
Baseline is always GRAY (0.5 fill)
```

- **Green** = Less fat than baseline
- **Gray** = Normal/baseline level
- **Red** = More fat than baseline
- **Opacity** = Intensity of change

---

## 📊 Mathematical Concepts

### Hormone Normalization
```
Input:  0-100 slider value
Output: -1 to +1 normalized value
Formula: (value - 50) / 50

Example:
  0   → -1.0 (minimum)
  50  →  0.0 (neutral)
  100 → +1.0 (maximum)
```

### Fill Fraction Mapping
```
Baseline always maps to 0.5 (gray):

Below Baseline    At Baseline    Above Baseline
    0%            0.5%              1.0%
    │              │                 │
  Green ────────── Gray ─────────── Red
```

### Scaling Factor
```
factor = 1 + (hormone_effect × 0.35)
range = 0.65 to 1.35

Example:
  0.65 = 35% reduction from baseline
  1.00 = no change (baseline)
  1.35 = 35% increase from baseline
```

---

## 🎓 Learning Scenarios

### Scenario 1: Insulin Spike (Eating Disorder)
1. Set Insulin → 90
2. Notice abdomen becomes very red
3. This shows visceral fat accumulation
4. Reset and adjust Cortisol → similar effect!

### Scenario 2: Athletic Build (High Testosterone)
1. Set Testosterone → 85
2. Watch abdomen turn green (fat loss)
3. Thighs become greener too
4. Hips stay neutral (testosterone doesn't affect males as much)

### Scenario 3: Female Puberty (High Estrogen)
1. Set Estrogen → 80
2. Watch hips and thighs turn red
3. Classic female fat distribution appears
4. Notice abdomen stays more neutral

### Scenario 4: Chronic Stress (High Cortisol)
1. Set Cortisol → 80
2. Similar to insulin effect
3. Notice abdomen becomes prominent
4. Reflects stress-induced weight gain pattern

---

## 💾 File Structure

```
Hormone-vs-FatDistribution-Model/
│
├── 📄 README.md                 ← Start here for overview
├── 📄 ENHANCEMENT_SUMMARY.md    ← See what improved
├── 📄 QUICK_REFERENCE.md        ← This file
│
├── 📜 script.js                 ← All JavaScript logic
│   ├── computeBodyFatImpact()
│   ├── computeDistribution()
│   ├── getColorForFillFraction()
│   ├── updateOutputs()
│   └── Event handlers
│
├── 🎨 styles.css                ← All styling
│   ├── Color scheme
│   ├── Layout
│   ├── Responsive design
│   └── Animations
│
├── 🌐 index.html                ← HTML structure
│   ├── Header & intro
│   ├── Hormone sliders
│   ├── Visualization area
│   ├── Guidelines section
│   └── References section
│
├── 📁 models/
│   └── mapping.js               ← Backup of functions
│
└── 📁 assets/                   ← For images/icons
```

---

## 🔧 Common Customizations

### Change a Hormone Effect Coefficient
**File**: script.js, line ~75
```javascript
const effects = {
  abdomen: { insulin: +1.3, ... }
                         ↑
                   Change this number
};
```

### Change Baseline Distribution
**File**: script.js, line ~72
```javascript
const base = {
  male:   { abdomen: 40, ... }
                     ↑
              Change percentage
};
```

### Change Bar Colors
**File**: script.js, line ~195
```javascript
const green = { r: 34, g: 139, b: 34 };
const gray  = { r: 160, g: 160, b: 160 };
const red   = { r: 220, g: 20, b: 60 };
```

### Adjust Scaling Sensitivity
**File**: script.js, line ~105
```javascript
const factor = 1 + offset * 0.35;
                          ↑
                    Change sensitivity
```

---

## 📚 Key Functions

### computeDistribution(hormones, gender)
**What it does**: Calculates fat % for each body region
**Input**: `{ insulin, cortisol, testosterone, estrogen }`
**Output**: 
```javascript
{
  distribution: { arms: 15.2, shoulders: 12.1, ... },
  delta: { arms: -0.5, shoulders: +0.3, ... },
  gender: 'male'
}
```

### getColorForFillFraction(fillFrac)
**What it does**: Maps 0-1 fill fraction to color
**Input**: 0.0 to 1.0
**Output**: "rgba(r, g, b, opacity)"

### updateOutputs()
**What it does**: Main update function (called on slider change)
**Steps**:
1. Read slider values
2. Calculate distributions
3. Compute fill fractions
4. Determine colors
5. Update DOM elements

---

## ✅ Testing Checklist

When making changes, verify:

- [ ] Sliders still respond to input
- [ ] Colors change smoothly (no jumping)
- [ ] Baseline (50) shows gray bars
- [ ] Extreme values (0, 100) show green/red
- [ ] Reset button works
- [ ] Randomize button works
- [ ] Both male/female columns update
- [ ] No console errors
- [ ] Responsive on mobile

---

## 🐛 Troubleshooting

### Problem: Bars not updating
**Solution**: Check if sliders have `id` attributes matching: `insulin`, `cortisol`, `testosterone`, `estrogen`

### Problem: Colors all red
**Solution**: Baseline might not be calculated correctly. Check `computeDistribution()` returns proper distribution.

### Problem: One gender not updating
**Solution**: Check if `.zone[data-gender="male/female"]` elements exist in HTML

### Problem: Performance slow
**Solution**: Remove or optimize the console.log() in `updateOutputs()`

---

## 🔗 Cross-References

**Understanding Hormones?**
→ See README.md "Hormones & Their Effects" section

**Want to customize colors?**
→ See script.js `getColorForFillFraction()` function

**Need responsive design help?**
→ See styles.css "Responsive Design" section

**Want to add a feature?**
→ See README.md "Development & Customization" section

---

## 📞 Support Resources

| Question | Where to Look |
|----------|---------------|
| How does it work? | README.md → "How It Works" |
| What do the colors mean? | This document → "Color Meanings" |
| How to customize? | README.md → "Development & Customization" |
| What code was improved? | ENHANCEMENT_SUMMARY.md |
| Which function does X? | script.js comments or Code Architecture |
| How is it styled? | styles.css with section headers |

---

## 🎯 Key Takeaways

1. ✅ **Modular Design**: Each function has single responsibility
2. ✅ **Clear Documentation**: Every section is commented
3. ✅ **Responsive**: Works on desktop, tablet, and mobile
4. ✅ **Educational**: Explains physiological concepts
5. ✅ **Extensible**: Easy to add new features
6. ✅ **No Dependencies**: Pure vanilla JavaScript
7. ✅ **Performant**: Updates complete in milliseconds

---

**Last Updated**: December 2024
**Version**: 2.0
**Status**: Fully Documented & Production Ready

For detailed information on any topic, refer to the main README.md file.
