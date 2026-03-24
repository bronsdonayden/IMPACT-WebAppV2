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

const volumeInput = document.getElementById("volumeInput");

volumeInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  await nv.loadVolumes([{ url: url, name: file.name }]);

  nv.setSliceType(nv.sliceTypeAxial);
  nv.opts.dragMode = nv.dragModes.slicer3D;

  // set up drawing after volume is loaded
  setupDrawer(nv);

  document.getElementById("fileLoader").style.display = "none";
});