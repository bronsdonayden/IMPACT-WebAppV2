# IMPACT-WebAppV2

Browser-based 3D annotation tool for segmenting structures in ultrasound volumes. Paint masks slice-by-slice, interpolate between key slices, and export NRRD masks for model training.

Built by the UMass Boston IMPACT program in partnership with INIA Biosciences to generate training data for spleen segmentation. Designed to be faster and lighter than desktop tools like 3D Slicer for the per-slice painting workflow.

![Demo](demo.gif)

---

## Running the App

No installation needed — runs directly in the browser.

**On the web:**
[https://bronsdonayden.github.io/IMPACT-WebAppV2/](https://bronsdonayden.github.io/IMPACT-WebAppV2/)

**Locally:**
```bash
git clone https://github.com/bronsdonayden/IMPACT-WebAppV2.git
cd IMPACT-WebAppV2
python -m http.server
```
Open `http://localhost:8000`.

Requires Chrome or Edge.

---

## Loading a Volume

Use the **File** tab to load from disk, or the **URL** tab to load from a remote link.

- **Volume (.nrrd)** — required
- **Mask (.nrrd)** — optional, resumes a previous annotation session

---

## Workflow

1. Load a volume
2. Scroll or use arrow keys to navigate slices
3. Click and drag in 3D view to rotate
4. Hold `1` to paint, `2` to erase
5. Annotate a few key slices, press `I` to interpolate the gaps
6. Press `X` to export `mask.nrrd`

---

## How Interpolation Works

Paint at least two slices bracketing the structure. Pressing `I` computes a signed distance field (SDF) for each painted slice — a grid where each pixel stores its distance to the nearest mask boundary, negative inside and positive outside. The SDFs are linearly blended for every unpainted slice between them, and the zero-crossing of the blended field becomes the new mask.

The upshot: the interpolated shape *morphs* between the two painted shapes rather than fading in and out. A blob on one slice smoothly deforms into a blob on another instead of flickering through intermediate opacities.

---

## Stack

- [NiiVue 0.57.0](https://github.com/niivue/niivue) — WebGL volumetric rendering
- Vanilla JS (ES modules), no build step

---

## Authors

Ayden Bronsdon & Rukia Omar — UMass Boston IMPACT Program, 2025–2026