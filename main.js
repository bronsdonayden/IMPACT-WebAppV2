import { Niivue } from "https://unpkg.com/@niivue/niivue@0.57.0/dist/index.js";

const nv = new Niivue({
textHeight: 0.02,
crosshairColor: [0, 1, 1, 0.1],
crosshairWidth: 0.2,
show3Dcrosshair: true,
});

const canvas = document.getElementById("viewer");
nv.attachToCanvas(canvas);

// BOTH inputs
const volumeInput = document.getElementById("volumeInput");
const maskInput = document.getElementById("maskInput");

// store files
let volumeFile = null;
let maskFile = null;

// when image is selected
volumeInput.addEventListener("change", (e) => {
volumeFile = e.target.files[0];
tryLoad();
});

// when mask is selected
maskInput.addEventListener("change", (e) => {
maskFile = e.target.files[0];
tryLoad();
});

// load ONLY when both are ready
async function tryLoad() {
if (!volumeFile || !maskFile) return;

const volumeURL = URL.createObjectURL(volumeFile);
const maskURL = URL.createObjectURL(maskFile);

await nv.loadVolumes([
{
url: volumeURL,
name: "image",
},
{
url: maskURL,
name: "mask",
colormap: "red",     // mask color
opacity: 0.4,        // transparency
}
]);

nv.setSliceType(nv.sliceTypeAxial);

document.getElementById("fileLoader").style.display = "none";
}
