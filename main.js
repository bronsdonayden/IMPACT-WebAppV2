import { Niivue } from "https://unpkg.com/@niivue/niivue@0.57.0/dist/index.js";

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

  // single slice view — spacebar to cycle
  nv.setSliceType(nv.sliceTypeAxial);

  // hide the file loader once a volume is loaded
  document.getElementById("fileLoader").style.display = "none";
});