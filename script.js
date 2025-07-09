function hexToHsl(hex) {
  hex = hex.replace('#', '');
  const bigint = parseInt(hex, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;
  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h, s, l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = (gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0);
        break;
      case gNorm:
        h = (bNorm - rNorm) / d + 2;
        break;
      case bNorm:
        h = (rNorm - gNorm) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h, s, l) {
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

function rotateHue(h, deg) {
  return (h + deg + 360) % 360;
}

function generateSchemes(baseHex) {
  const base = hexToHsl(baseHex);
  const complementary = [hslToHex(rotateHue(base.h, 180), base.s, base.l)];
  const analogous = [
    hslToHex(rotateHue(base.h, -30), base.s, base.l),
    baseHex,
    hslToHex(rotateHue(base.h, 30), base.s, base.l),
  ];
  const triadic = [
    baseHex,
    hslToHex(rotateHue(base.h, 120), base.s, base.l),
    hslToHex(rotateHue(base.h, -120), base.s, base.l),
  ];
  const tetradic = [
    baseHex,
    hslToHex(rotateHue(base.h, 90), base.s, base.l),
    hslToHex(rotateHue(base.h, 180), base.s, base.l),
    hslToHex(rotateHue(base.h, 270), base.s, base.l),
  ];
  const mono = [
    hslToHex(base.h, base.s, Math.max(base.l - 20, 0)),
    baseHex,
    hslToHex(base.h, base.s, Math.min(base.l + 20, 100)),
  ];
  return { complementary, analogous, triadic, tetradic, monochromatic: mono };
}

function createSwatch(color) {
  const div = document.createElement('div');
  div.className = 'swatch';
  div.style.background = color;
  div.title = color;
  return div;
}

function displaySchemes(baseHex) {
  const schemesDiv = document.getElementById('schemes');
  schemesDiv.innerHTML = '';
  const schemes = generateSchemes(baseHex);
  Object.entries(schemes).forEach(([name, colors]) => {
    const container = document.createElement('div');
    container.className = 'scheme';
    const title = document.createElement('h3');
    title.textContent = name;
    container.appendChild(title);
    colors.forEach((c) => container.appendChild(createSwatch(c)));
    schemesDiv.appendChild(container);
  });
  updatePreview(baseHex, schemes.complementary[0]);
}

function updatePreview(primary, secondary) {
  const header = document.querySelector('.preview-header');
  const button = document.querySelector('.preview-button');
  header.style.background = primary;
  header.style.color = '#fff';
  button.style.background = secondary;
}

function exportPalette(format, baseHex) {
  const schemes = generateSchemes(baseHex);
  const flat = Object.values(schemes).flat();
  let data = '';
  switch (format) {
    case 'css':
      data = flat.map((c, i) => `--color-${i + 1}: ${c};`).join('\n');
      break;
    case 'scss':
      data = flat.map((c, i) => `$color-${i + 1}: ${c};`).join('\n');
      break;
    case 'json':
      data = JSON.stringify(flat, null, 2);
      break;
    case 'svg':
      const rects = flat
        .map((c, i) => `<rect x="${i * 40}" width="40" height="40" fill="${c}"/>`)
        .join('');
      data = `<svg xmlns="http://www.w3.org/2000/svg" width="${flat.length * 40}" height="40">${rects}</svg>`;
      break;
  }
  const blob = new Blob([data], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `palette.${format === 'svg' ? 'svg' : 'txt'}`;
  a.click();
}

window.addEventListener('DOMContentLoaded', () => {
  const baseInput = document.getElementById('baseColor');
  const hexInput = document.getElementById('hexInput');
  function syncInputs() {
    baseInput.value = hexInput.value;
  }
  baseInput.addEventListener('input', () => {
    hexInput.value = baseInput.value;
  });
  hexInput.addEventListener('input', () => {
    if (/^#?[0-9a-fA-F]{6}$/.test(hexInput.value)) {
      let val = hexInput.value;
      if (!val.startsWith('#')) val = '#' + val;
      baseInput.value = val;
    }
  });
  document.getElementById('generate').addEventListener('click', () => {
    displaySchemes(baseInput.value);
  });
  document.querySelectorAll('.export-buttons button').forEach((btn) => {
    btn.addEventListener('click', () => exportPalette(btn.dataset.format, baseInput.value));
  });
  syncInputs();
  displaySchemes(baseInput.value);
});
