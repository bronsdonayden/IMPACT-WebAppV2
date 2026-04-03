import { Niivue } from "https://unpkg.com/@niivue/niivue@0.57.0/dist/index.js";
import { setupDrawer } from "./drawer.js";

const nv = new Niivue({
  textHeight: 0.02,
  crosshairColor: [0, 1, 1, 0.1],
  crosshairWidth: 0.2,
  show3Dcrosshair: true,
});

const canvas = document.getElementById("viewer");
nv.attachToCanvas(canvas);

// BOTH file inputs
const volumeInput = document.getElementById("volumeInput");
const maskInput = document.getElementById("maskInput");

// store files
let volumeFile = null;
let maskFile = null;

// Helper: add mask overlay
async function loadMask(file) {
  const maskURL = URL.createObjectURL(file);
  await nv.addVolume({
    url: maskURL,
    name: "mask",
    colormap: "red",   // mask color
    opacity: 0.4       // semi-transparent
  });
}

// Load volume and setup drawer
async function loadVolume(file) {
  const url = URL.createObjectURL(file);
  await nv.loadVolumes([{ url: url, name: file.name }]);
  nv.setSliceType(nv.sliceTypeAxial);
  nv.opts.dragMode = nv.dragModes.slicer3D;
  setupDrawer(nv);
}

// Try loading files if ready
async function tryLoad() {
  if (!volumeFile) return;

  // Load the base volume
  await loadVolume(volumeFile);

  // Overlay mask if selected
  if (maskFile) await loadMask(maskFile);

  // hide loader UI
  document.getElementById("fileLoader").style.display = "none";
}

// When volume selected
volumeInput.addEventListener("change", async (e) => {
  volumeFile = e.target.files[0];
  await tryLoad();
});

// When mask selected
maskInput.addEventListener("change", async (e) => {
  maskFile = e.target.files[0];

  // Only overlay mask if volume already loaded
  if (volumeFile) await loadMask(maskFile);
});