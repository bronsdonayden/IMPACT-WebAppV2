// Decides whether to draw mask, outline, or nothing based on dropdown
function updateOverlay() {
    ctx.clearRect(0, 0, overlay.width, overlay.height);
  
    if (overlayMode.value === 'No Overlay') {
      return;
    }
    if (overlayMode.value === 'Outline Only') {
      drawOutline();
    }
    if (overlayMode.value === 'Transparent Overlay') {
      drawMask();
    }
  }
  
  // Listens for the change in the overlay dropdown
  overlayMode.addEventListener('change', function() {
    updateOverlay();
  });
  
  // Takes raw pixel data and builds a clean true/false array
  // true = part of the mask, false = background
  function buildMaskGrid(data) {
    const grid = [];
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
  
      // Transparent = not mask
      if (a === 0) {
        grid.push(false);
        continue;
      }
  
      // Bright enough = part of mask
      grid.push(r > 10 || g > 10 || b > 10);
    }
    return grid;
  }
  
  // Draws the current mask as a colored transparent overlay
  function drawMask() {
    if (maskList.length === 0) return;
  
    if(workingMasks[currentIndex]){
      renderMaskFromGrid(workingMasks[currentIndex]);
      return;
    }
    const maskImg = new Image();
    maskImg.src = maskList[currentIndex];
  
    maskImg.onload = function() {
      ctx.drawImage(maskImg, 0, 0, overlay.width, overlay.height);
      const maskData = ctx.getImageData(0, 0, overlay.width, overlay.height);
      const grid = buildMaskGrid(maskData.data);
      workingMasks[currentIndex] = grid;
      renderMaskFromGrid(grid);
    }};
  
    function renderMaskFromGrid(grid) {
    const imageData = ctx.createImageData(overlay.width, overlay.height);
    for (let i = 0; i < grid.length; i++) {
      const pixel = i * 4;
      if (grid[i]) {
        imageData.data[pixel] = 255;
        imageData.data[pixel + 1] = 0;
        imageData.data[pixel + 2] = 0;
        imageData.data[pixel + 3] = 80;
      }
    }
    ctx.clearRect(0, 0, overlay.width, overlay.height);
    ctx.putImageData(imageData, 0, 0);
  }
  
  // Draws only the outline of the current mask
  function drawOutline() {
    if (maskList.length === 0) return;
  
    if(workingMasks[currentIndex]){
      renderOutlineFromGrid(workingMasks[currentIndex]);
      return;
    }
    const maskImg = new Image();
    maskImg.src = maskList[currentIndex];
  
      maskImg.onload = function() {
      ctx.drawImage(maskImg, 0, 0, overlay.width, overlay.height);
      const maskData = ctx.getImageData(0, 0, overlay.width, overlay.height);
      const grid = buildMaskGrid(maskData.data);
      workingMasks[currentIndex] = grid;
      renderOutlineFromGrid(grid);
  }};
    
  
  
    function renderOutlineFromGrid(grid){
      
      const imageData = ctx.createImageData(overlay.width, overlay.height);
      const width = overlay.width;
      const height = overlay.height;
  
      for (let i = 0; i < grid.length; i++) {
        const pixel = i * 4;
        const row = Math.floor(i / width);
        const col = i % width;
  
        // If not part of mask, make transparent
        if (!grid[i]) {
          imageData.data[pixel] = 0;
          imageData.data[pixel + 1] = 0;
          imageData.data[pixel + 2] = 0;
          imageData.data[pixel + 3] = 0;
          continue;
        }
  
        // Check if any neighbor is NOT part of the mask
        let isOutline = false;
  
        // Up
        if (row === 0 || !grid[(row - 1) * width + col]) isOutline = true;
        // Down
        if (row === height - 1 || !grid[(row + 1) * width + col]) isOutline = true;
        // Left
        if (col === 0 || !grid[row * width + col - 1]) isOutline = true;
        // Right
        if (col === width - 1 || !grid[row * width + col + 1]) isOutline = true;
  
        if (isOutline) {
          // Color it green
          imageData.data[pixel] = 0;         // R
          imageData.data[pixel + 1] = 255;   // G
          imageData.data[pixel + 2] = 0;     // B
          imageData.data[pixel + 3] = 255;   // A
        } else {
          // Interior — make transparent
          imageData.data[pixel] = 0;
          imageData.data[pixel + 1] = 0;
          imageData.data[pixel + 2] = 0;
          imageData.data[pixel + 3] = 0;
        }
      }
  
      ctx.clearRect(0, 0, width, height);
      ctx.putImageData(imageData, 0, 0);
    };
  
  
    
  