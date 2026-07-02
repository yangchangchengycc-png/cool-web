/**
 * L/C. STUDIO — static header logo from lc-studio-reference.png
 */
(function initSiteLogo() {
  const canvas = document.getElementById('site-logo-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  const scriptEl = document.currentScript || document.querySelector('script[src*="logo.js"]');
  const scriptBase = scriptEl?.src
    ? new URL('.', scriptEl.src)
    : new URL(window.location.pathname.replace(/\/pages\/.*$/, '/').replace(/[^/]*$/, ''), window.location.origin);
  const logoSrc = new URL('assets/logo/lc-studio-reference.png', scriptBase).href;

  const IMG_W = 266;
  const IMG_H = 322;

  function makeTransparent(source) {
    const off = document.createElement('canvas');
    off.width = IMG_W;
    off.height = IMG_H;
    const offCtx = off.getContext('2d', { alpha: true });
    offCtx.drawImage(source, 0, 0);
    const data = offCtx.getImageData(0, 0, IMG_W, IMG_H);
    for (let i = 0; i < data.data.length; i += 4) {
      const r = data.data[i];
      const g = data.data[i + 1];
      const b = data.data[i + 2];
      const a = data.data[i + 3];
      if (a < 8) continue;
      const max = Math.max(r, g, b);
      if (max > 246) {
        data.data[i + 3] = 0;
      } else if (max > 238) {
        data.data[i + 3] = Math.round(((255 - max) / 17) * a);
      }
    }
    offCtx.putImageData(data, 0, 0);
    return off;
  }

  const logoImage = new Image();
  logoImage.onload = () => {
    ctx.clearRect(0, 0, IMG_W, IMG_H);
    ctx.drawImage(makeTransparent(logoImage), 0, 0);
  };
  logoImage.src = logoSrc;
})();
