export function saveNRRD(nv) {
  if (!nv.drawBitmap) return;

  const dx = nv.back.dims[1];
  const dy = nv.back.dims[2];
  const dz = nv.back.dims[3];
  const vol = nv.volumes[0];

  const sx = vol.hdr.pixDims[1] || 1;
  const sy = vol.hdr.pixDims[2] || 1;
  const sz = vol.hdr.pixDims[3] || 1;

  const header = [
    'NRRD0004',
    'type: uint8',
    'dimension: 3',
    `sizes: ${dx} ${dy} ${dz}`,
    'encoding: raw',
    'endian: little',
    `space directions: (${sx},0,0) (0,${sy},0) (0,0,${sz})`,
    'space origin: (0,0,0)',
    '',
  ].join('\n');

  const headerBytes = new TextEncoder().encode(header + '\n');
  const blob = new Blob([headerBytes, nv.drawBitmap], { type: 'application/octet-stream' });

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'mask.nrrd';
  link.click();
  URL.revokeObjectURL(link.href);
}