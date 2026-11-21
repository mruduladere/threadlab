# THREADLAB — REALISTIC 3D CLOTHING MOCKUP STUDIO

**THREADLAB** is a professional, browser-native 3D clothing mockup studio and 2D garment pattern editor engineered with a premium streetwear editorial aesthetic.

---

## ⚡ Quick Start

```bash
# 1. Open the project in VS Code or Terminal:
cd C:\Users\91935\.gemini\antigravity\scratch\threadlab

# 2. Run the local studio:
npm run dev

# 3. Open in your browser:
# http://localhost:5173/
```

To create an optimized production build:
```bash
npm run build
npm run preview
```

---

## 👕 100% Genuine 3D Garment Models (Zero Primitive Placeholders)

All primitive geometric placeholders (cylinders, spheres, cones) have been removed. Every product uses an independent, authentic 3D `.glb` polygon mesh with realistic fabric drape, thickness, natural folds, and UV coordinate islands:

| Garment | 3D Asset File | Size | Silhouette & Features |
| :--- | :--- | :--- | :--- |
| **Oversized Boxy Tee** | `public/models/oversized_tshirt.glb` | 1.04 MB | Relaxed streetwear cut, dropped shoulder seams, wide body, heavy collar rib. |
| **Classic Regular Tee** | `public/models/classic_tshirt.glb` | 12.4 MB | Standard tailored fit, natural sleeve slope, crewneck collar. |
| **Heavyweight Street Hoodie** | `public/models/heavy_hoodie.glb` | 14.3 MB | Double-layer 3D hood with visible interior depth, kangaroo pouch pocket, ribbed cuffs & bottom band, and realistic fabric folds. |
| **Crewneck Sweatshirt** | `public/models/sweatshirt.glb` | 761 KB | Relaxed athletic pullover with long sleeves, ribbed collar, cuffs, and bottom waistband. |

---

## 📐 Redesigned 2D Pattern Editor with Real Centimetre Grid

The 2D editor renders the exact flat pattern pieces corresponding to the selected garment:

### Calibrated Physical Dimensions:
- **Oversized Tee:**
  - Front Body: 64 cm width × 76 cm length
  - Back Body: 64 cm width × 78 cm length
  - Left Sleeve: 44 cm width × 28 cm length
  - Right Sleeve: 44 cm width × 28 cm length
  - Collar Rib: 48 cm length × 4 cm width
- **Classic Tee:**
  - Front Body: 54 cm width × 72 cm length
  - Back Body: 54 cm width × 74 cm length
  - Left Sleeve: 38 cm width × 24 cm length
  - Right Sleeve: 38 cm width × 24 cm length
  - Collar Rib: 46 cm length × 3 cm width
- **Heavyweight Hoodie:**
  - Front Body: 64 cm width × 72 cm length
  - Kangaroo Pocket: 44 cm width × 26 cm height
  - Back Body: 64 cm width × 74 cm length
  - Left & Right Sleeves: 46 cm bicep × 64 cm length
  - Anatomical Hood: 38 cm width × 44 cm height
  - Rib Waistband: 56 cm width × 8 cm height
- **Crewneck Sweatshirt:**
  - Front Body: 60 cm width × 70 cm length
  - Back Body: 60 cm width × 72 cm length
  - Left & Right Sleeves: 44 cm bicep × 64 cm length
  - Crewneck Collar: 46 cm length × 3.5 cm width
  - Rib Waistband: 52 cm width × 7 cm height

### Calibrated Centimetre Grid:
- **Calibrated Scale:** `1 cm = 5.0 pixels`.
- **Minor Grid Lines:** Drawn every **1 cm**.
- **Major Grid Lines:** Drawn every **5 cm** with legible centimetre labels (`0 cm`, `5 cm`, `10 cm`, `15 cm`...).
- **Fit-to-View Control:** Automatically centers and fits all pattern pieces inside the viewport without cropping sleeves or labels.

---

## 🔄 Live 2D-to-3D UV Synchronization

- **Unified 2048×2048 Texture Compositor:** Seamlessly renders artwork from the 2D pattern piece directly to the corresponding 3D UV island.
- **Multi-Element Manipulation:** Upload images, add typography, drag to reposition, resize with corner handles, and rotate.
- **Camera Auto-Focus:** Selecting any piece in 2D (Front, Back, Sleeve, Hood, Pocket) smoothly orbits the 3D camera to face that region.

---

## 💾 Export & Persistence

- **3D Viewport Mockup:** High-resolution PNG or JPEG (1080p, 2K, 4K) with transparent alpha background support.
- **UV Texture Atlas:** Direct 2048×2048 PNG export of the complete texture map for apparel sublimation, CLO3D, or Blender.
- **Local Persistence:** Zero cloud database requirement (₹0 budget); saves projects locally via native IndexedDB and localStorage.
