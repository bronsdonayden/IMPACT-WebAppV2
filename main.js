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

let drawerInitialized = false;

// load a volume from a url
async function loadVolume(url, name) {
  await nv.loadVolumes([{ url: url, name: name || "volume.nrrd" }]);
  nv.setSliceType(nv.sliceTypeAxial);
  nv.opts.dragMode = nv.dragModes.slicer3D;

  if (!drawerInitialized) {
    setupDrawer(nv);
    drawerInitialized = true;
  }
}

// Loads a mask NRRD into drawbitmap so that it is editable
// loads the mask as a second volume and copies its data into
// drawBitmap then removes the volume so it doesn't display a second time
async function loadMaskIntoDrawBitmap(url, name) {
  // load mask as a temporary second volume
  await nv.loadVolumes([
    { url: nv.volumes[0].url, name: nv.volumes[0].name },
    { url: url, name: name || "mask.nrrd" }
  ]);

  // make sure drawBitmap exists
  if (!nv.drawBitmap) {
    nv.setDrawingEnabled(true);
    nv.setDrawingEnabled(false);
  }

  // copy mask voxel data into drawBitmap
  const maskVolume = nv.volumes[1];
  const dx = nv.back.dims[1];
  const dy = nv.back.dims[2];
  const dz = nv.back.dims[3];

  for (let k = 0; k < dz; k++) {
    for (let j = 0; j < dy; j++) {
      for (let i = 0; i < dx; i++) {
        const val = maskVolume.getValue(i, j, k);
        if (val > 0) {
          nv.drawBitmap[i + j * dx + k * dx * dy] = 1;
        }
      }
    }
  }

  // remove the mask volume so it doesn't render as an overlay
  nv.removeVolume(nv.volumes[1]);

  nv.refreshDrawing(true);
  nv.drawAddUndoBitmap();
}

// file input handlers

const volumeInput = document.getElementById("volumeInput");
const maskInput = document.getElementById("maskInput");

volumeInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const url = URL.createObjectURL(file);
  await loadVolume(url, file.name);

  document.getElementById("fileLoader").style.display = "none";
});

maskInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // need volume loaded first
  if (nv.volumes.length === 0) {
    alert("Load a volume first");
    return;
  }

  const url = URL.createObjectURL(file);
  await loadMaskIntoDrawBitmap(url, file.name);

  document.getElementById("fileLoader").style.display = "none";
});

// url input

const loadURLButton = document.getElementById("loadURLButton");

loadURLButton.addEventListener("click", async () => {
  const volURL = document.getElementById("volumeURL").value.trim();
  const mskURL = document.getElementById("maskURL").value.trim();

  if (!volURL) {
    alert("Enter a volume URL");
    return;
  }

  // extract filename from URL so niivue knows the file format
  const volName = volURL.split('/').pop() || "volume.nrrd";

  await loadVolume(volURL, volName);

  if (mskURL) {
    const mskName = mskURL.split('/').pop() || "mask.nrrd";
    await loadMaskIntoDrawBitmap(mskURL, mskName);
  }

  document.getElementById("fileLoader").style.display = "none";
});