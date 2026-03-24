export function setupDrawer(nv) {
  let position = null;
  let mode = null;
  let label = 1;
  let brushSize = 3;

  // brush size UI
  const brushLabel = document.getElementById('brushLabel');
  const brushSlider = document.getElementById('brushSlider');

  brushSlider.addEventListener('input', (e) => {
    brushSize = parseInt(e.target.value, 10);
    brushLabel.textContent = brushSize;
  });

  // --- helpers ---

  function getDims() {
    return {
      dx: nv.back.dims[1],
      dy: nv.back.dims[2],
      dz: nv.back.dims[3],
    };
  }

  function getSliceAxis() {
    const st = nv.opts.sliceType;
    if (st === nv.sliceTypeCoronal) return 1;
    if (st === nv.sliceTypeSagittal) return 0;
    return 2;
  }

  function getSliceIndex() {
    if (!position) return 0;
    return position[getSliceAxis()];
  }

  function getPlaneSize() {
    const { dx, dy, dz } = getDims();
    const axis = getSliceAxis();
    if (axis === 2) return { w: dx, h: dy };
    if (axis === 1) return { w: dx, h: dz };
    return { w: dy, h: dz };
  }

  function toVoxel(x, y, s) {
    const { dx, dy } = getDims();
    const axis = getSliceAxis();
    if (axis === 2) return x + y * dx + s * dx * dy;
    if (axis === 1) return x + s * dx + y * dx * dy;
    return s + x * dx + y * dx * dy;
  }

  function posToPlane(pos) {
    const axis = getSliceAxis();
    if (axis === 2) return { x: pos[0], y: pos[1] };
    if (axis === 1) return { x: pos[0], y: pos[2] };
    return { x: pos[1], y: pos[2] };
  }

  function getSliceCount() {
    const { dx, dy, dz } = getDims();
    const axis = getSliceAxis();
    if (axis === 2) return dz;
    if (axis === 1) return dy;
    return dx;
  }

  function extractSliceMask(sliceIdx) {
    const { w, h } = getPlaneSize();
    const mask = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        mask[y * w + x] = nv.drawBitmap[toVoxel(x, y, sliceIdx)] !== 0 ? 1 : 0;
      }
    }
    return mask;
  }

  function writeSliceMask(sliceIdx, mask, val) {
    const { w, h } = getPlaneSize();
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        nv.drawBitmap[toVoxel(x, y, sliceIdx)] = mask[y * w + x] ? val : 0;
      }
    }
  }

  function sliceHasPaint(sliceIdx) {
    const { w, h } = getPlaneSize();
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (nv.drawBitmap[toVoxel(x, y, sliceIdx)] !== 0) return true;
      }
    }
    return false;
  }

  // --- distance transform for interpolation ---

  function chamferDistance(dist, w, h) {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = y * w + x;
        if (y > 0) dist[idx] = Math.min(dist[idx], dist[(y - 1) * w + x] + 1);
        if (x > 0) dist[idx] = Math.min(dist[idx], dist[y * w + (x - 1)] + 1);
      }
    }
    for (let y = h - 1; y >= 0; y--) {
      for (let x = w - 1; x >= 0; x--) {
        const idx = y * w + x;
        if (y < h - 1) dist[idx] = Math.min(dist[idx], dist[(y + 1) * w + x] + 1);
        if (x < w - 1) dist[idx] = Math.min(dist[idx], dist[y * w + (x + 1)] + 1);
      }
    }
  }

  function computeSDF(mask, w, h) {
    const INF = w + h;
    const inside = new Float32Array(w * h);
    const outside = new Float32Array(w * h);

    for (let i = 0; i < mask.length; i++) {
      inside[i] = mask[i] ? INF : 0;
      outside[i] = mask[i] ? 0 : INF;
    }

    chamferDistance(inside, w, h);
    chamferDistance(outside, w, h);

    const sdf = new Float32Array(w * h);
    for (let i = 0; i < mask.length; i++) {
      sdf[i] = mask[i] ? -inside[i] : outside[i];
    }
    return sdf;
  }

  // --- core features ---

  function paintAt(pos) {
    if (!nv.drawBitmap) return;

    const { x: cx, y: cy } = posToPlane(pos);
    const s = pos[getSliceAxis()];
    const { w, h } = getPlaneSize();
    const val = mode === 'paint' ? label : 0;

    for (let dy = -brushSize; dy <= brushSize; dy++) {
      for (let dx = -brushSize; dx <= brushSize; dx++) {
        if (dx * dx + dy * dy > brushSize * brushSize) continue;
        const x = cx + dx;
        const y = cy + dy;
        if (x < 0 || x >= w || y < 0 || y >= h) continue;
        nv.drawBitmap[toVoxel(x, y, s)] = val;
      }
    }

    nv.refreshDrawing(true);
  }

  function copySlice(direction) {
    const src = getSliceIndex();
    const dst = src + direction;
    const count = getSliceCount();
    if (dst < 0 || dst >= count) return;

    const mask = extractSliceMask(src);
    writeSliceMask(dst, mask, label);

    nv.refreshDrawing(true);
    nv.drawAddUndoBitmap();
  }

  function interpolate() {
    const count = getSliceCount();
    const { w, h } = getPlaneSize();

    const keySlices = [];
    for (let s = 0; s < count; s++) {
      if (sliceHasPaint(s)) keySlices.push(s);
    }

    if (keySlices.length < 2) {
      console.log('Need at least 2 painted slices to interpolate');
      return;
    }

    nv.canvas.style.cursor = 'wait';

    for (let p = 0; p < keySlices.length - 1; p++) {
      const sliceA = keySlices[p];
      const sliceB = keySlices[p + 1];

      if (sliceB - sliceA <= 1) continue;

      const maskA = extractSliceMask(sliceA);
      const maskB = extractSliceMask(sliceB);

      const sdfA = computeSDF(maskA, w, h);
      const sdfB = computeSDF(maskB, w, h);

      for (let s = sliceA + 1; s < sliceB; s++) {
        const t = (s - sliceA) / (sliceB - sliceA);
        const interpolated = new Uint8Array(w * h);

        for (let i = 0; i < w * h; i++) {
          const blended = sdfA[i] * (1 - t) + sdfB[i] * t;
          interpolated[i] = blended <= 0 ? 1 : 0;
        }

        writeSliceMask(s, interpolated, label);
      }
    }

    nv.refreshDrawing(true);
    nv.drawAddUndoBitmap();
    nv.canvas.style.cursor = 'default';
  }

  // --- events ---

  nv.onLocationChange = (e) => {
    position = e.vox;

    if (!nv.drawBitmap) {
      nv.setDrawingEnabled(true);
      nv.setDrawingEnabled(false);
    }

    if (mode && position) {
      paintAt(position);
    }
  };

  window.addEventListener('keydown', (e) => {
    if (e.key === '1') {
      mode = 'paint';
      nv.canvas.style.cursor = 'crosshair';
    } else if (e.key === '2') {
      mode = 'erase';
      nv.canvas.style.cursor = 'crosshair';
    } else if (e.key === '[') {
      brushSize = Math.max(1, brushSize - 1);
      brushSlider.value = brushSize;
      brushLabel.textContent = brushSize;
    } else if (e.key === ']') {
      brushSize = Math.min(25, brushSize + 1);
      brushSlider.value = brushSize;
      brushLabel.textContent = brushSize;
    }
  });

  window.addEventListener('keyup', (e) => {
    if (e.key === '1' || e.key === '2') {
      if (mode) {
        nv.drawAddUndoBitmap();
      }
      mode = null;
      nv.canvas.style.cursor = 'default';
    }
  });

  window.addEventListener('keypress', (e) => {
    if (e.code === 'KeyZ') {
      nv.drawUndo();
    } else if (e.code === 'KeyX') {
      nv.saveImage('mask.nii.gz', true);
    } else if (e.code === 'KeyC') {
      copySlice(1);
      nv.moveCrosshairInVox(0, 0, 1);
    } else if (e.code === 'KeyB') {
      copySlice(-1);
      nv.moveCrosshairInVox(0, 0, -1);
    } else if (e.code === 'KeyI') {
      interpolate();
    }
    else if (e.code === 'KeyH') {
    if (nv.drawOpacity > 0) {
        nv.drawOpacity = 0;
    }  
    else {
        nv.drawOpacity = 1.0;
    }
    nv.updateGLVolume();
    }});

  nv.setDrawColormap("_slicer3d");
  nv.drawOpacity = 1.0;
}