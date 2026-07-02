/**
 * Komorebi Portfolio — dappled light & tree-shadow wind
 */

const canvas = document.getElementById('scene');
const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mainScriptEl = document.currentScript || document.querySelector('script[src*="main.js"]');
const scriptBase = mainScriptEl?.src
  ? new URL('.', mainScriptEl.src)
  : new URL(window.location.pathname.replace(/\/pages\/.*$/, '/').replace(/[^/]*$/, ''), window.location.origin);
const paperTexture = new Image();
let paperTextureReady = false;
paperTexture.onload = () => {
  paperTextureReady = true;
  wallBaseCanvas = null;
};
paperTexture.src = new URL('assets/paper-texture.png', scriptBase).href;

let width = 0;
let height = 0;
let dpr = 1;
let bufferW = 0;
let bufferH = 0;
let renderScale = 1;
let perfTier = 1;
let lightBrightBoost = 1;
let renderFrame = 0;
let lastRenderAt = 0;
let lastDynamicTextMeasureAt = 0;
let lastClusterUpdateAt = 0;
let lastShadowLayerAt = 0;
let lastBokehUpdateAt = 0;
let lastLightMapUpdateAt = 0;
let lastFxOverlayAt = 0;
let hasRollItems = false;
let sceneIdle = true;
let pageVisible = true;
let lastTextCanvasDrawAt = -1;
let wallBaseCanvas = null;
let wallBaseCtx = null;
let cachedOpenRollRect = null;
let cachedOpenRollFrame = -1;
let cachedCanvasRect = null;
let cachedCanvasRectFrame = -1;
let cachedScatterItems = [];
let cachedRollItemEls = [];
let cachedRollViewport = null;
let cachedWorkRollEls = [];
let cachedRollLineGroups = [];

const MOBILE_TARGET_FRAME_MS = 1000 / 40;
const DESKTOP_CLUSTER_FRAME_MS = 1000 / 30;
const DESKTOP_CLUSTER_IDLE_FRAME_MS = 1000 / 12;
const DESKTOP_SHADOW_FRAME_MS = 1000 / 30;
const DESKTOP_SHADOW_IDLE_FRAME_MS = 1000 / 18;
const DESKTOP_BOKEH_FRAME_MS = 1000 / 24;
const DESKTOP_BOKEH_IDLE_FRAME_MS = 1000 / 16;
const DESKTOP_LIGHT_FRAME_MS = 1000 / 26;
const DESKTOP_IDLE_LIGHT_FRAME_MS = 1000 / 18;
const DESKTOP_FX_FRAME_MS = 1000 / 24;
const DESKTOP_TEXT_MEASURE_MS = 110;
const SHADOW_LIGHTEN = 0.1;
const SHADOW_WALL_MULTIPLY = 0.78 * (1 - SHADOW_LIGHTEN);
const SHADOW_WALL_MULTIPLY_MOBILE = 0.64 * (1 - SHADOW_LIGHTEN);

const mouse = { targetX: 0.5, targetY: 0.5 };
const smoothMouse = { x: 0.5, y: 0.5 };
let lastPointerMove = 0;
let pointerOnScreen = false;

const wind = {
  gustX: 0,
  gustY: 0,
  gustTargetX: 0,
  gustTargetY: 0,
  flutterX: 0,
  flutterY: 0,
  nextGustAt: 0,
};

const WALL = '#efefec';
const SHADOW_LIGHTEN_CHANNEL = (v) => Math.round(v + (255 - v) * SHADOW_LIGHTEN);
// Multiply tones — lower RGB = deeper shadow on the wall
const SHADOW_LIGHT = { r: SHADOW_LIGHTEN_CHANNEL(226), g: SHADOW_LIGHTEN_CHANNEL(224), b: SHADOW_LIGHTEN_CHANNEL(218) };
const SHADOW_MID = { r: SHADOW_LIGHTEN_CHANNEL(200), g: SHADOW_LIGHTEN_CHANNEL(196), b: SHADOW_LIGHTEN_CHANNEL(188) };
const SHADOW_DARK = { r: SHADOW_LIGHTEN_CHANNEL(176), g: SHADOW_LIGHTEN_CHANNEL(172), b: SHADOW_LIGHTEN_CHANNEL(162) };
const GAP_SHADOW = { r: SHADOW_LIGHTEN_CHANNEL(128), g: SHADOW_LIGHTEN_CHANNEL(122), b: SHADOW_LIGHTEN_CHANNEL(112) };
const SHADOW_HUES = [
  { r: 10, g: 6, b: -8 },
  { r: -6, g: 12, b: 4 },
  { r: -8, g: 2, b: 12 },
  { r: 12, g: 4, b: -6 },
  { r: 4, g: -3, b: 9 },
  { r: 8, g: 10, b: -4 },
];
const LIGHT = { r: 255, g: 251, b: 244 };
const TEXT = '#b8b8b4';
const TEXT_META = 'rgba(184, 184, 180, 0.62)';
const TEXT_HOVER = '#000000';
const UI_FONT = '"PingFang SC", "PingFang TC", "Hiragino Sans GB", -apple-system, BlinkMacSystemFont, "Helvetica Neue", sans-serif';
const HOVER_SCALE_TARGET = 1.06;
const HOVER_SCALE_LERP = 0.2;

let shadowRawCanvas, shadowRawCtx;
let shadowCanvas, shadowCtx;
let lightBokehRawCanvas, lightBokehRawCtx;
let lightBokehCanvas, lightBokehCtx;
let lightRawCanvas, lightRawCtx;
let lightCanvas, lightCtx;
let wallCanvas, wallCtx;
let textCanvas, textCtx;
let fxRawCanvas, fxRawCtx;
let fxCanvas, fxCtx;
let grainCanvas;
let frostCanvas;

let blobs = [];
let cachedLightBlobs = [];
let foliage = [];
let gapPatches = [];
let edgeFeatherSpots = [];
let clusterGlows = [];
let dustParticles = [];
let lightBeams = [];
let textItems = [];
let grainPattern = null;
let frostPattern = null;
let scatterLayoutItems = [];
let hoveredTextEl = null;
let hoveredTextLightRect = null;
const textHoverScale = new WeakMap();
let pointerClientX = 0;
let pointerClientY = 0;

const BLUR_SHADOW = prefersReducedMotion ? 38 : 58;
const BLUR_LIGHT = prefersReducedMotion ? 28 : 50;
const BLUR_MASK = prefersReducedMotion ? 28 : 42;
const BLUR_RAYS = prefersReducedMotion ? 22 : 34;

const SUN_ANGLE = Math.PI * 0.75;
const MOBILE_SUN_ANGLE = Math.PI * 0.72;
const PERSP_SKEW = -0.28;
const MOBILE_PERSP_SKEW = -0.08;
const LIGHT_SIZE_SCALE = 1.18;
const CLUSTER_AREA_SCALE = 0.8;
const MOBILE_BREAKPOINT = 768;
const MOBILE_DESKTOP_CROP_SCALE = 0.8;

const cursorLight = {
  radius: 170 * LIGHT_SIZE_SCALE,
  baseRadius: 170 * LIGHT_SIZE_SCALE,
  strength: 1.65,
  renderX: 0,
  renderY: 0,
  renderRx: 1,
  renderRy: 1,
  renderRadius: 120 * LIGHT_SIZE_SCALE,
  sizeFreq: 0.65,
  sizeAmp: 0.14,
  tiltVariation: 0.04,
  ellipseX: 1.35,
  ellipseY: 0.48,
  ellipseRound: 0.62,
};

const hoverTextLight = {
  active: false,
  opacity: 0,
  targetX: 0,
  targetY: 0,
  renderX: 0,
  renderY: 0,
  targetRadius: 190 * LIGHT_SIZE_SCALE,
  renderRadius: 190 * LIGHT_SIZE_SCALE,
  strength: 1.9,
  tiltVariation: 0.02,
  ellipseX: 1.42,
  ellipseY: 0.5,
  ellipseRound: 0.6,
};

function createOffscreen(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return { canvas: c, ctx: c.getContext('2d', { alpha: true, desynchronized: true }) };
}

function updatePerfProfile() {
  const rawDpr = window.devicePixelRatio || 1;
  const megaPx = (width * height) / 1e6;

  if (width < MOBILE_BREAKPOINT) {
    perfTier = 0;
    renderScale = 0.74;
    dpr = Math.min(rawDpr, 1.5);
  } else if (width >= 1920 || megaPx > 2.4) {
    perfTier = 3;
    renderScale = 0.46;
    dpr = Math.min(rawDpr, 1.2);
  } else if (width >= 1400) {
    perfTier = 2;
    renderScale = 0.52;
    dpr = Math.min(rawDpr, 1.35);
  } else {
    perfTier = 1;
    renderScale = 0.6;
    dpr = Math.min(rawDpr, 1.5);
  }

  if (prefersReducedMotion) {
    renderScale = Math.max(renderScale, 0.78);
  }

  lightBrightBoost = 1.08 + (1 - renderScale) * 0.34;
}

function beginBufferDraw(targetCtx) {
  targetCtx.setTransform(renderScale, 0, 0, renderScale, 0, 0);
}

function endBufferDraw(targetCtx) {
  targetCtx.setTransform(1, 0, 0, 1, 0, 0);
}

function refreshLightBlobs() {
  cachedLightBlobs = [];
  for (const b of blobs) {
    if (b.type === 'light') cachedLightBlobs.push(b);
  }
}

function initGrain() {
  const size = 256;
  grainCanvas = document.createElement('canvas');
  grainCanvas.width = size;
  grainCanvas.height = size;
  const gCtx = grainCanvas.getContext('2d');
  const img = gCtx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 126 + (Math.random() - 0.5) * 22;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 20;
  }
  gCtx.putImageData(img, 0, 0);
  grainPattern = ctx.createPattern(grainCanvas, 'repeat');
}

function initFrostGrain() {
  const size = 512;
  frostCanvas = document.createElement('canvas');
  frostCanvas.width = size;
  frostCanvas.height = size;
  const fCtx = frostCanvas.getContext('2d');
  fCtx.fillStyle = 'rgb(128,128,128)';
  fCtx.fillRect(0, 0, size, size);
  const img = fCtx.createImageData(size, size);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 118 + (Math.random() - 0.5) * 38;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v - 2;
    img.data[i + 3] = 28;
  }
  fCtx.putImageData(img, 0, 0);
  fCtx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < size * 1.4; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 0.4 + Math.random() * 1.8;
    const a = 0.04 + Math.random() * 0.14;
    fCtx.beginPath();
    fCtx.arc(x, y, r, 0, Math.PI * 2);
    fCtx.fillStyle = `rgba(255,252,246,${a})`;
    fCtx.fill();
  }
  fCtx.globalCompositeOperation = 'source-over';
  frostPattern = ctx.createPattern(frostCanvas, 'repeat');
}

function pickLightRadius() {
  const r = Math.random();
  let radius;
  if (r < 0.34) radius = 8 + Math.random() * 30;
  else if (r < 0.58) radius = 22 + Math.random() * 44;
  else if (r < 0.78) radius = 42 + Math.random() * 60;
  else if (r < 0.92) radius = 66 + Math.random() * 58;
  else radius = 96 + Math.random() * 72;

  const sizeJitter = 0.72 + Math.random() * 0.68;
  return radius * sizeJitter * LIGHT_SIZE_SCALE;
}

function pickLightEllipse() {
  const kind = Math.random();
  if (kind < 0.34) {
    return {
      ellipseX: 1.1 + Math.random() * 1.2,
      ellipseY: 0.14 + Math.random() * 0.15,
      ellipseRound: 0.32 + Math.random() * 0.14,
    };
  }
  if (kind < 0.62) {
    return {
      ellipseX: 0.68 + Math.random() * 0.45,
      ellipseY: 0.3 + Math.random() * 0.24,
      ellipseRound: 0.6 + Math.random() * 0.24,
    };
  }
  return {
    ellipseX: 0.85 + Math.random() * 0.8,
    ellipseY: 0.22 + Math.random() * 0.32,
    ellipseRound: 0.46 + Math.random() * 0.26,
  };
}

function randomPerimeterNorm() {
  const side = Math.random() * 4;
  if (side < 1) return { nx: -0.08 + Math.random() * 0.14, ny: Math.random() };
  if (side < 2) return { nx: 0.92 + Math.random() * 0.14, ny: Math.random() };
  if (side < 3) return { nx: Math.random(), ny: -0.07 + Math.random() * 0.13 };
  return { nx: Math.random(), ny: 0.93 + Math.random() * 0.13 };
}

function initEdgeFeatherSpots() {
  edgeFeatherSpots = [];
  const large = width >= 1400;
  const count = width < 768 ? 12 : (large ? (perfTier >= 3 ? 16 : 20) : 16);
  for (let i = 0; i < count; i++) {
    const { nx, ny } = randomPerimeterNorm();
    edgeFeatherSpots.push({
      nx: nx + (Math.random() - 0.5) * 0.06,
      ny: ny + (Math.random() - 0.5) * 0.06,
      r: 0.14 + Math.random() * 0.32,
      a: 0.1 + Math.random() * 0.2,
    });
  }
}

function initBlobs() {
  blobs = [];
  const isMobile = width < 768;
  const isPortrait = height > width;
  const largeScreen = width >= 1400;
  const areaCap = perfTier >= 3 ? 0.85 : perfTier >= 2 ? 0.95 : 1.08;
  const mobileAreaScale = Math.min(1, Math.sqrt((width * height) / (390 * 844)));
  const areaScale = isMobile ? mobileAreaScale : Math.min(areaCap, Math.sqrt((width * height) / (1920 * 1080)));

  const lightCount = isMobile ? 4 + Math.floor(Math.random() * 2) : Math.round(46 * areaScale);
  for (let i = 0; i < lightCount; i++) {
    let radius = pickLightRadius();
    if (isMobile) radius *= MOBILE_DESKTOP_CROP_SCALE;
    let baseX;
    let baseY;
    const zone = Math.random();
    if (zone < 0.28) {
      const band = Math.floor(Math.random() * 4);
      if (band === 0) {
        baseX = Math.random() * width * 0.14;
        baseY = Math.random() * height;
      } else if (band === 1) {
        baseX = width * (0.86 + Math.random() * 0.14);
        baseY = Math.random() * height;
      } else if (band === 2) {
        baseX = Math.random() * width;
        baseY = Math.random() * height * 0.14;
      } else {
        baseX = Math.random() * width;
        baseY = height * (0.86 + Math.random() * 0.14);
      }
    } else if (zone < 0.62) {
      baseX = width * (0.22 + Math.random() * 0.56);
      baseY = height * (0.22 + Math.random() * 0.56);
    } else {
      baseX = Math.random() * width;
      baseY = Math.random() * height;
    }
    const shape = pickLightEllipse();

    const blob = {
      type: 'light',
      baseX,
      baseY,
      relX: baseX - width * 0.5,
      relY: baseY - height * 0.5,
      radius,
      ellipseX: shape.ellipseX,
      ellipseY: shape.ellipseY,
      ellipseRound: shape.ellipseRound,
      tiltVariation: (Math.random() - 0.5) * 0.22,
      rx: 0.88 + Math.random() * 0.24,
      ry: 0.88 + Math.random() * 0.24,
      strength: 0.34 + Math.random() * 0.48,
      swayFreq: 0.22 + Math.random() * 0.38,
      swayAmp: 10 + Math.random() * 28,
      flutterFreq: 1.4 + Math.random() * 2.8,
      flutterAmp: 3 + Math.random() * 12,
      sizeFreq: 0.28 + Math.random() * 0.55,
      sizeAmp: 0.14 + Math.random() * 0.24,
      phase: Math.random() * Math.PI * 2,
      phase2: Math.random() * Math.PI * 2,
      parallax: 0.2 + Math.random() * 0.6,
      renderX: 0,
      renderY: 0,
      renderRx: 1,
      renderRy: 1,
      renderRadius: radius,
      gapToCursor: {
        sizeScale: 0.5 + Math.random() * 0.95,
        depth: 0.48 + Math.random() * 0.46,
        colorVariant: Math.random(),
        bias: (Math.random() - 0.5) * 0.45,
        aspect: 0.5 + Math.random() * 0.7,
      },
    };
    if (Math.random() < 0.28) {
      blob.wanderAmpX = 14 + Math.random() * 32;
      blob.wanderAmpY = 12 + Math.random() * 28;
      blob.wanderFreq = 0.1 + Math.random() * 0.16;
      blob.anchorNormX = baseX / width;
      blob.anchorNormY = baseY / height;
    }
    blobs.push(blob);
  }

  const heroProfiles = [
    { rMin: 175, rMax: 235, exMin: 0.82, exMax: 1.12, eyMin: 0.3, eyMax: 0.44, roundMin: 0.64, roundMax: 0.82 },
    { rMin: 112, rMax: 162, exMin: 2.15, exMax: 3.0, eyMin: 0.08, eyMax: 0.14, roundMin: 0.28, roundMax: 0.38 },
    { rMin: 148, rMax: 212, exMin: 1.3, exMax: 1.8, eyMin: 0.17, eyMax: 0.26, roundMin: 0.42, roundMax: 0.52 },
    { rMin: 98, rMax: 142, exMin: 1.65, exMax: 2.35, eyMin: 0.1, eyMax: 0.18, roundMin: 0.34, roundMax: 0.44 },
    { rMin: 132, rMax: 188, exMin: 0.95, exMax: 1.55, eyMin: 0.2, eyMax: 0.34, roundMin: 0.48, roundMax: 0.68 },
  ];
  const activeHeroProfiles = heroProfiles;
  const heroLightCount = isMobile ? 2 : 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < heroLightCount; i++) {
    const p = activeHeroProfiles[i % activeHeroProfiles.length];
    const anchorNormX = 0.18 + Math.random() * 0.64;
    const anchorNormY = 0.18 + Math.random() * 0.64;
    const heroSizeBoost = 1.15 + Math.random() * 0.15;
    const radius =
      (p.rMin + Math.random() * (p.rMax - p.rMin)) *
      LIGHT_SIZE_SCALE *
      1.15 *
      heroSizeBoost *
      (isMobile ? MOBILE_DESKTOP_CROP_SCALE : (largeScreen ? 1.08 : 1));
    blobs.push({
      type: 'light',
      heroLight: true,
      anchorNormX,
      anchorNormY,
      wanderAmpX: 85 + Math.random() * 125,
      wanderAmpY: 75 + Math.random() * 115,
      wanderFreq: 0.07 + Math.random() * 0.11,
      baseX: width * anchorNormX,
      baseY: height * anchorNormY,
      relX: width * (anchorNormX - 0.5),
      relY: height * (anchorNormY - 0.5),
      radius,
      ellipseX: p.exMin + Math.random() * (p.exMax - p.exMin),
      ellipseY: p.eyMin + Math.random() * (p.eyMax - p.eyMin),
      ellipseRound: p.roundMin + Math.random() * (p.roundMax - p.roundMin),
      tiltVariation: (Math.random() - 0.5) * 0.24,
      rx: 0.94 + Math.random() * 0.2,
      ry: 0.94 + Math.random() * 0.2,
      strength: 0.92 + Math.random() * 0.22,
      swayFreq: 0.14 + Math.random() * 0.22,
      swayAmp: 22 + Math.random() * 32,
      flutterFreq: 0.9 + Math.random() * 1.5,
      flutterAmp: 4 + Math.random() * 12,
      sizeFreq: 0.16 + Math.random() * 0.28,
      sizeAmp: 0.16 + Math.random() * 0.22,
      phase: Math.random() * Math.PI * 2,
      phase2: Math.random() * Math.PI * 2,
      parallax: 0.22 + Math.random() * 0.28,
      renderX: 0,
      renderY: 0,
      renderRx: 1,
      renderRy: 1,
      renderRadius: radius,
      gapToCursor: {
        sizeScale: 0.55 + Math.random() * 0.85,
        depth: 0.44 + Math.random() * 0.44,
        colorVariant: Math.random(),
        bias: (Math.random() - 0.5) * 0.42,
        aspect: 0.5 + Math.random() * 0.62,
      },
    });
  }

  const edgeCount = isMobile ? 0 : (largeScreen ? (perfTier >= 3 ? 9 : 14) : 12);
  for (let i = 0; i < edgeCount; i++) {
    const { nx, ny } = randomPerimeterNorm();
    const radius = (78 + Math.random() * 68) * LIGHT_SIZE_SCALE * (isMobile ? MOBILE_DESKTOP_CROP_SCALE : (largeScreen ? 1.14 : 1));
    const shape = pickLightEllipse();
    blobs.push({
      type: 'light',
      pinEdge: true,
      normX: nx + (Math.random() - 0.5) * 0.04,
      normY: ny + (Math.random() - 0.5) * 0.04,
      baseX: width * nx,
      baseY: height * ny,
      radius,
      ellipseX: shape.ellipseX,
      ellipseY: shape.ellipseY,
      ellipseRound: shape.ellipseRound,
      tiltVariation: (Math.random() - 0.5) * 0.2,
      rx: 0.88 + Math.random() * 0.2,
      ry: 0.88 + Math.random() * 0.2,
      strength: 0.36 + Math.random() * 0.36,
      swayFreq: 0.16 + Math.random() * 0.28,
      swayAmp: 8 + Math.random() * 18,
      flutterFreq: 1 + Math.random() * 1.8,
      flutterAmp: 2 + Math.random() * 8,
      sizeFreq: 0.2 + Math.random() * 0.36,
      sizeAmp: 0.08 + Math.random() * 0.16,
      phase: Math.random() * Math.PI * 2,
      phase2: Math.random() * Math.PI * 2,
      parallax: 0,
      renderX: 0,
      renderY: 0,
      renderRx: 1,
      renderRy: 1,
      renderRadius: radius,
      gapToCursor: {
        sizeScale: 0.48 + Math.random() * 0.78,
        depth: 0.4 + Math.random() * 0.42,
        colorVariant: Math.random(),
        bias: (Math.random() - 0.5) * 0.38,
        aspect: 0.48 + Math.random() * 0.58,
      },
    });
  }

  const bleedCount = isMobile ? 0 : (largeScreen ? (perfTier >= 3 ? 7 : 8) : 7);
  for (let i = 0; i < bleedCount; i++) {
    const { nx, ny } = randomPerimeterNorm();
    const radius = (105 + Math.random() * 95) * LIGHT_SIZE_SCALE * (isMobile ? MOBILE_DESKTOP_CROP_SCALE : (largeScreen ? 1.22 : 1));
    const shape = pickLightEllipse();
    blobs.push({
      type: 'light',
      pinEdge: true,
      normX: nx,
      normY: ny,
      baseX: width * nx,
      baseY: height * ny,
      radius,
      ellipseX: shape.ellipseX * 1.08,
      ellipseY: shape.ellipseY,
      ellipseRound: shape.ellipseRound,
      tiltVariation: (Math.random() - 0.5) * 0.16,
      rx: 0.92 + Math.random() * 0.14,
      ry: 0.92 + Math.random() * 0.14,
      strength: 0.3 + Math.random() * 0.28,
      swayFreq: 0.14 + Math.random() * 0.22,
      swayAmp: 5 + Math.random() * 12,
      flutterFreq: 0.85 + Math.random() * 1.4,
      flutterAmp: 1.5 + Math.random() * 6,
      sizeFreq: 0.18 + Math.random() * 0.3,
      sizeAmp: 0.06 + Math.random() * 0.12,
      phase: Math.random() * Math.PI * 2,
      phase2: Math.random() * Math.PI * 2,
      parallax: 0,
      renderX: 0,
      renderY: 0,
      renderRx: 1,
      renderRy: 1,
      renderRadius: radius,
      gapToCursor: {
        sizeScale: 0.45 + Math.random() * 0.65,
        depth: 0.38 + Math.random() * 0.36,
        colorVariant: Math.random(),
        bias: (Math.random() - 0.5) * 0.32,
        aspect: 0.45 + Math.random() * 0.5,
      },
    });
  }

  refreshLightBlobs();
}

function initGapPatches() {
  gapPatches = [];
  const lights = getLightBlobs();
  const isMobile = width < MOBILE_BREAKPOINT;
  if (isMobile) return;

  const maxDist = isMobile ? 165 : 270;
  const minDist = 26;
  const maxGapPatches = isMobile ? 28 : perfTier >= 3 ? 36 : perfTier >= 2 ? 52 : 72;

  gapLoop:
  for (let i = 0; i < lights.length; i++) {
    for (let j = i + 1; j < lights.length; j++) {
      if (gapPatches.length >= maxGapPatches) break gapLoop;
      const dx = lights[j].baseX - lights[i].baseX;
      const dy = lights[j].baseY - lights[i].baseY;
      const dist = Math.hypot(dx, dy);
      if (dist < minDist || dist > maxDist) continue;

      gapPatches.push({
        lightA: lights[i],
        lightB: lights[j],
        sizeScale: isMobile ? 0.2 + Math.random() * 0.28 : 0.45 + Math.random() * 1.05,
        depth: isMobile ? 0.3 + Math.random() * 0.3 : 0.5 + Math.random() * 0.46,
        colorVariant: Math.random(),
        bias: (Math.random() - 0.5) * 0.48,
        aspect: isMobile ? 0.24 + Math.random() * 0.26 : 0.5 + Math.random() * 0.72,
      });
    }
  }
}

function initFoliage() {
  foliage = [];
  const isMobile = width < MOBILE_BREAKPOINT;
  if (isMobile) return;

  const foliageByTier = [18, 18, 15, 13];
  const foliageCount = foliageByTier[perfTier] ?? 28;

  for (let i = 0; i < foliageCount; i++) {
    const scale = isMobile ? 0.42 + Math.random() * 0.42 : 0.65 + Math.random() * 1.05;
    const radius = (isMobile ? 22 + Math.random() * 46 : 50 + Math.random() * 130) * scale;
    const baseX = Math.random() * width;
    const baseY = Math.random() * height;
    const shadowShape = isMobile ? 'leaf' : (Math.random() < 0.5 ? 'branch' : 'leaf');

    const item = {
      shadowShape,
      baseX,
      baseY,
      relX: baseX - width * 0.5,
      relY: baseY - height * 0.5,
      radius,
      rx: isMobile ? 0.72 + Math.random() * 0.54 : 0.5 + Math.random() * 0.95,
      ry: isMobile ? 0.62 + Math.random() * 0.46 : 0.5 + Math.random() * 0.95,
      strength: isMobile ? 0.12 + Math.random() * 0.12 : 0.34 + Math.random() * 0.38,
      shadowTint: Math.random(),
      shadowDepth: isMobile ? 0.16 + Math.random() * 0.16 : 0.42 + Math.random() * 0.48,
      colorVariant: Math.random(),
      baseAngle: SUN_ANGLE + (Math.random() - 0.5) * 0.9,
      swayFreq: 0.18 + Math.random() * 0.32,
      swayAmp: isMobile ? 5 + Math.random() * 12 : 10 + Math.random() * 28,
      flutterFreq: 1.1 + Math.random() * 2.2,
      flutterAmp: isMobile ? 1.5 + Math.random() * 5 : 3 + Math.random() * 12,
      phase: Math.random() * Math.PI * 2,
      phase2: Math.random() * Math.PI * 2,
      parallax: 0.2 + Math.random() * 0.6,
      renderX: 0,
      renderY: 0,
      renderRx: 1,
      renderRy: 1,
      renderRadius: radius,
    };

    if (shadowShape === 'branch') {
      const segCount = isMobile ? 3 + Math.floor(Math.random() * 3) : 3 + Math.floor(Math.random() * 5);
      const segments = [];
      for (let s = 0; s < segCount; s++) {
        segments.push({
          t: s / Math.max(segCount - 1, 1),
          perpOffset: (Math.random() - 0.5) * (isMobile ? 0.38 : 0.55),
          width: isMobile ? 0.06 + Math.random() * 0.12 : 0.12 + Math.random() * 0.28,
          bulge: 0.65 + Math.random() * 0.55,
        });
      }
      item.branch = {
        length: radius * (isMobile ? 1.05 + Math.random() * 0.45 : 1.6 + Math.random() * 0.9),
        segments,
        twigs: (() => {
          const twigs = [];
          const twigCount = isMobile ? 1 + Math.floor(Math.random() * 2) : 1 + Math.floor(Math.random() * 4);
          for (let tw = 0; tw < twigCount; tw++) {
            twigs.push({
              segT: segments[Math.floor(Math.random() * segments.length)].t,
              angle: (Math.random() - 0.5) * 1.6,
              len: isMobile ? 0.14 + Math.random() * 0.24 : 0.22 + Math.random() * 0.48,
              width: isMobile ? 0.18 + Math.random() * 0.22 : 0.3 + Math.random() * 0.5,
            });
          }
          return twigs;
        })(),
      };
    } else {
      const leafCount = isMobile ? 2 + Math.floor(Math.random() * 2) : 2 + Math.floor(Math.random() * 3);
      const leaves = [];
      for (let l = 0; l < leafCount; l++) {
        leaves.push({
          ox: (Math.random() - 0.5) * radius * 0.55,
          oy: (Math.random() - 0.5) * radius * 0.45,
          rot: Math.random() * Math.PI * 2,
          scale: 0.5 + Math.random() * 0.7,
          aspect: 0.42 + Math.random() * 0.38,
        });
      }
      item.leaf = { leaves };
    }

    foliage.push(item);
  }
}

function initLightBeams() {
  lightBeams = [];
  if (width < MOBILE_BREAKPOINT) return;

  const beamByTier = [4, 6, 5, 4];
  const count = beamByTier[perfTier] ?? 7;
  for (let i = 0; i < count; i++) {
    lightBeams.push({
      offset: (i / (count - 1)) * 0.46 - 0.2,
      width: 0.07 + Math.random() * 0.11,
      strength: 0.1 + Math.random() * 0.15,
      sway: Math.random() * Math.PI * 2,
      swayAmp: 0.018 + Math.random() * 0.035,
      freq: 0.22 + Math.random() * 0.22,
    });
  }
}

function initDust() {
  dustParticles = [];
}

function getBeamSource() {
  const w = canvas.width;
  const h = canvas.height;
  const mx = pointerOnScreen ? (smoothMouse.x - 0.5) * w * 0.05 : 0;
  const my = pointerOnScreen ? (smoothMouse.y - 0.5) * h * 0.03 : 0;
  return { x: w * 1.06 + mx, y: -h * 0.05 + my };
}

function beamIntensityAt(px, py, time) {
  const t = time * 0.001;
  const { x: srcX, y: srcY } = getBeamSource();
  let intensity = 0;

  for (const beam of lightBeams) {
    const sway = prefersReducedMotion ? 0 : Math.sin(t * beam.freq + beam.sway) * beam.swayAmp;
    const angle = SUN_ANGLE + beam.offset + sway;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const vx = px - srcX;
    const vy = py - srcY;
    const along = vx * dx + vy * dy;
    if (along < 0) continue;

    const perpDist = Math.abs(vx * -dy + vy * dx);
    const spread = beam.width * canvas.width;
    const lateral = Math.max(0, 1 - perpDist / spread);
    const depth = Math.max(0, 1 - along / (canvas.width * 1.15));
    intensity += lateral * lateral * depth * beam.strength * 4.1;
  }

  return Math.min(intensity, 1);
}

function updateDust(time) {
  if (prefersReducedMotion) return;

  const windX = (wind.gustX + wind.flutterX) * 0.000004;
  const windY = (wind.gustY + wind.flutterY) * 0.000003;

  for (const p of dustParticles) {
    p.x += p.vx + windX;
    p.y += p.vy + windY;
    if (p.x < 0) p.x += 1;
    if (p.x > 1) p.x -= 1;
    if (p.y < 0) p.y += 1;
    if (p.y > 1) p.y -= 1;
  }
}

function drawGodRays(time) {
  const w = canvas.width;
  const h = canvas.height;
  const { x: srcX, y: srcY } = getBeamSource();
  const t = time * 0.001;

  beginBufferDraw(fxRawCtx);
  fxRawCtx.clearRect(0, 0, w, h);
  fxRawCtx.globalCompositeOperation = 'lighter';

  for (const beam of lightBeams) {
    const sway = prefersReducedMotion ? 0 : Math.sin(t * beam.freq + beam.sway) * beam.swayAmp;
    const angle = SUN_ANGLE + beam.offset + sway;
    const len = Math.hypot(w, h) * 1.45;
    const endX = srcX + Math.cos(angle) * len;
    const endY = srcY + Math.sin(angle) * len;
    const spread = beam.width * w;
    const perpX = -Math.sin(angle) * spread;
    const perpY = Math.cos(angle) * spread;
    const s = beam.strength;

    const grad = fxRawCtx.createLinearGradient(srcX, srcY, endX, endY);
    grad.addColorStop(0, `rgba(255,252,246,${s * 0.95})`);
    grad.addColorStop(0.2, `rgba(255,250,242,${s * 0.55})`);
    grad.addColorStop(0.45, `rgba(255,247,235,${s * 0.22})`);
    grad.addColorStop(0.72, `rgba(255,244,228,${s * 0.07})`);
    grad.addColorStop(1, 'rgba(255,255,255,0)');

    fxRawCtx.beginPath();
    fxRawCtx.moveTo(srcX + perpX, srcY + perpY);
    fxRawCtx.lineTo(srcX - perpX, srcY - perpY);
    fxRawCtx.lineTo(endX - perpX * 0.25, endY - perpY * 0.25);
    fxRawCtx.lineTo(endX + perpX * 0.25, endY + perpY * 0.25);
    fxRawCtx.closePath();
    fxRawCtx.fillStyle = grad;
    fxRawCtx.fill();
  }

  fxRawCtx.globalCompositeOperation = 'source-over';
  endBufferDraw(fxRawCtx);
  blurPass(fxRawCanvas, fxCtx, fxCanvas, BLUR_RAYS);
}

function drawDust(time) {
  if (!dustParticles.length) return;

  const w = canvas.width;
  const h = canvas.height;
  const skipMatte = perfTier >= 2;

  for (const p of dustParticles) {
    const px = p.x * w;
    const py = p.y * h;
    const beam = beamIntensityAt(px, py, time);
    const twinkle = 0.65 + Math.sin(time * 0.002 * p.twinkle + p.phase) * 0.35;

    if (p.matte && !skipMatte) {
      const ma = Math.min(p.alpha * 0.1 * twinkle * (0.35 + p.z * 0.5), 0.085);
      const mr = p.size * dpr * (0.35 + p.z * 0.55);
      ctx.beginPath();
      ctx.arc(px, py, mr, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,252,246,${ma})`;
      ctx.fill();
    }

    if (beam < (perfTier >= 2 ? 0.05 : 0.035)) continue;

    const a = Math.min(p.alpha * beam * twinkle * (0.42 + p.z * 0.58), 0.72);
    const r = p.size * dpr * (0.58 + p.z * 1.0);

    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255,253,248,${a})`;
    ctx.fill();
  }
}

function drawTyndallEffect(time) {
  if (perfTier >= 3) return;

  const skipFx = perfTier >= 2 && time - lastFxOverlayAt < DESKTOP_FX_FRAME_MS;
  if (!skipFx && perfTier < 2) {
    if (renderFrame % 3 === 0) drawGodRays(time);
    updateDust(time);
    lastFxOverlayAt = time;
  } else if (!skipFx && sceneIdle) {
    lastFxOverlayAt = time;
  } else if (!skipFx) {
    updateDust(time);
    lastFxOverlayAt = time;
  }

  ctx.globalCompositeOperation = 'screen';
  ctx.globalAlpha = perfTier >= 2 ? 0.58 : 0.5;
  ctx.drawImage(fxCanvas, 0, 0, canvas.width, canvas.height);
  if (perfTier < 2) {
    ctx.globalAlpha = 0.16;
    ctx.drawImage(fxCanvas, 0, 0, canvas.width, canvas.height);
  }
  ctx.globalAlpha = 1;

  if (!skipFx && perfTier < 2 && !sceneIdle) {
    ctx.globalCompositeOperation = 'lighter';
    drawDust(time);
  }

  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

function drawFrostOverlay(force = false) {
  if (!force && sceneIdle && perfTier >= 1) return;
  const w = canvas.width;
  const h = canvas.height;
  if (!frostPattern && !grainPattern) return;

  ctx.save();
  if (frostPattern) {
    ctx.globalCompositeOperation = 'soft-light';
    ctx.globalAlpha = 0.42;
    ctx.fillStyle = frostPattern;
    ctx.fillRect(0, 0, w, h);
  }
  if (grainPattern) {
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = grainPattern;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}

function refreshDomCaches() {
  cachedScatterItems = [...document.querySelectorAll('.scatter-item')];
  cachedRollItemEls = [...document.querySelectorAll('.roll-item')];
  cachedRollViewport = document.querySelector('.roll-viewport');
  cachedWorkRollEls = [...document.querySelectorAll('.work-roll')];
  cachedRollLineGroups = cachedWorkRollEls.map((roll) => ({
    roll,
    lines: [...roll.querySelectorAll('.roll-line')].map((line) => ({
      line,
      spans: [...line.querySelectorAll('span')],
      isBottom: line.classList.contains('roll-line--bottom'),
    })),
  }));
  hasRollItems = cachedRollItemEls.length > 0;
}

function getCanvasRect() {
  if (cachedCanvasRectFrame === renderFrame) return cachedCanvasRect;
  cachedCanvasRectFrame = renderFrame;
  cachedCanvasRect = canvas.getBoundingClientRect();
  return cachedCanvasRect;
}

function shuffleArray(items) {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function buildScatterAnchors(count, isMobile) {
  const desktopAnchors = [
    { x: 0.1, y: 0.22 },
    { x: 0.48, y: 0.24 },
    { x: 0.79, y: 0.31 },
    { x: 0.66, y: 0.41 },
    { x: 0.52, y: 0.5 },
    { x: 0.48, y: 0.62 },
    { x: 0.12, y: 0.78 },
    { x: 0.25, y: 0.45 },
  ];
  const mobileAnchors = [
    { x: 0.08, y: 0.16 },
    { x: 0.36, y: 0.26 },
    { x: 0.62, y: 0.36 },
    { x: 0.18, y: 0.45 },
    { x: 0.52, y: 0.53 },
    { x: 0.08, y: 0.64 },
    { x: 0.1, y: 0.78 },
    { x: 0.54, y: 0.72 },
  ];
  return shuffleArray((isMobile ? mobileAnchors : desktopAnchors).slice(0, count));
}

function layoutScatterItems() {
  const items = [...document.querySelectorAll('.scatter-item')];
  if (!items.length) return;

  const isMobile = width < MOBILE_BREAKPOINT;
  const anchors = buildScatterAnchors(items.length, isMobile);
  const placedRects = [];
  const gap = isMobile ? 22 : 34;
  const orderedItems = [...items].sort((a, b) => {
    const aText = a.querySelector('.project__title')?.textContent?.length ?? 0;
    const bText = b.querySelector('.project__title')?.textContent?.length ?? 0;
    return bText - aText;
  });

  function inflateRect(rect, amount) {
    return {
      left: rect.left - amount,
      right: rect.right + amount,
      top: rect.top - amount,
      bottom: rect.bottom + amount,
    };
  }

  function rectsOverlap(a, b) {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  }

  scatterLayoutItems = orderedItems.map((el, index) => {
    const title = el.querySelector('.project__title') || el;
    const titleRect = title.getBoundingClientRect();
    const maxX = Math.max(0.06, 0.94 - titleRect.width / Math.max(width, 1));
    const maxY = Math.max(0.12, 0.88 - titleRect.height / Math.max(height, 1));
    let x = 0.5;
    let y = 0.5;
    let chosenRect = null;

    for (let attempt = 0; attempt < 96; attempt++) {
      const anchor = anchors[(index + attempt) % anchors.length];
      const jitterX = (Math.random() - 0.5) * (isMobile ? 0.18 : 0.22);
      const jitterY = (Math.random() - 0.5) * (isMobile ? 0.14 : 0.18);
      const candidateX = Math.max(0.06, Math.min(maxX, anchor.x + jitterX));
      const candidateY = Math.max(0.12, Math.min(maxY, anchor.y + jitterY));

      el.style.left = `${candidateX * 100}%`;
      el.style.top = `${candidateY * 100}%`;
      el.style.right = 'auto';
      el.style.bottom = 'auto';
      el.style.transform = 'translate3d(0, 0, 0)';

      const candidateRect = inflateRect(title.getBoundingClientRect(), gap);
      const overlaps = placedRects.some((rect) => rectsOverlap(candidateRect, rect));
      if (!overlaps || attempt === 95) {
        x = candidateX;
        y = candidateY;
        chosenRect = candidateRect;
        break;
      }
    }

    if (chosenRect) placedRects.push(chosenRect);
    const phase = Math.random() * Math.PI * 2;

    el.style.left = `${x * 100}%`;
    el.style.top = `${y * 100}%`;
    el.style.right = 'auto';
    el.style.bottom = 'auto';

    return {
      el,
      x,
      y,
      phase,
      ampX: (isMobile ? 1.5 : 2.5) + Math.random() * (isMobile ? 1.8 : 2.5),
      ampY: (isMobile ? 1.2 : 2) + Math.random() * (isMobile ? 1.6 : 2.5),
      speed: 0.00018 + Math.random() * 0.00018,
    };
  });
}

function updateScatterMotion(time) {
  if (!scatterLayoutItems.length) return false;

  for (const item of scatterLayoutItems) {
    const x = Math.sin(time * item.speed + item.phase) * item.ampX;
    const y = Math.cos(time * item.speed * 0.82 + item.phase) * item.ampY;
    item.el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  }

  return true;
}

function measureTextItems() {
  refreshDomCaches();
  textItems = [];
  const canvasRect = getCanvasRect();

  cachedScatterItems.forEach((el) => {
    const title = el.querySelector('.project__title');
    const meta = el.querySelector('.project__meta');
    if (!title) return;

    const titleRect = title.getBoundingClientRect();
    const metaRect = meta?.getBoundingClientRect();
    const fontSize = parseFloat(getComputedStyle(title).fontSize) * dpr;
    const fontFamily = getComputedStyle(title).fontFamily;
    textCtx.font = `400 ${fontSize}px ${fontFamily}`;
    const titleWidth = textCtx.measureText(title.textContent.trim()).width;

    textItems.push({
      title: title.textContent.trim(),
      meta: meta?.textContent.trim() ?? '',
      titleX: (titleRect.left - canvasRect.left) * dpr,
      titleY: (titleRect.top - canvasRect.top) * dpr,
      metaX: metaRect ? (metaRect.left - canvasRect.left) * dpr : 0,
      metaY: metaRect ? (metaRect.top - canvasRect.top) * dpr : 0,
      fontSize,
      metaSize: meta ? parseFloat(getComputedStyle(meta).fontSize) * dpr : 0,
      fontFamily,
      titleWidth,
      align: 'left',
      sourceEl: el,
    });
  });

  cachedRollItemEls.forEach((el) => {
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    const viewport = el.closest('.roll-viewport');
    const viewportOpacity = viewport ? parseFloat(getComputedStyle(viewport).opacity || '1') : 1;
    const viewportOpen = viewport ? parseFloat(viewport.dataset.open || '0') : 0;
    if (viewportOpen <= 0.01) return;
    const transform = style.transform;
    let scaleX = 1;
    let scaleY = 1;

    if (transform && transform !== 'none') {
      const matrix = transform.match(/matrix(3d)?\(([^)]+)\)/);
      if (matrix) {
        const values = matrix[2].split(',').map((value) => parseFloat(value.trim()));
        if (matrix[1]) {
          scaleX = values[0] || 1;
          scaleY = values[5] || 1;
        } else {
          scaleX = values[0] || 1;
          scaleY = values[3] || 1;
        }
      }
    }

    textItems.push({
      title: el.textContent.trim(),
      meta: '',
      titleX: (rect.left + rect.width * 0.5 - canvasRect.left) * dpr,
      titleY: (rect.top + rect.height * 0.5 - canvasRect.top) * dpr,
      metaX: 0,
      metaY: 0,
      fontSize: parseFloat(style.fontSize) * dpr,
      metaSize: 0,
      fontFamily: style.fontFamily,
      align: 'center',
      scaleX,
      scaleY,
      opacity: parseFloat(style.opacity || '1') * viewportOpacity * viewportOpen,
      sourceEl: el,
    });
  });
}

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  refreshDomCaches();
  cachedOpenRollRect = null;
  cachedOpenRollFrame = -1;
  cachedCanvasRect = null;
  cachedCanvasRectFrame = -1;
  updatePerfProfile();

  wallBaseCanvas = null;
  lastTextCanvasDrawAt = -1;

  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;

  bufferW = Math.max(1, Math.round(canvas.width * renderScale));
  bufferH = Math.max(1, Math.round(canvas.height * renderScale));

  const buf = () => createOffscreen(bufferW, bufferH);
  const full = () => createOffscreen(canvas.width, canvas.height);

  const offRaw = buf();
  shadowRawCanvas = offRaw.canvas;
  shadowRawCtx = offRaw.ctx;

  const off = buf();
  shadowCanvas = off.canvas;
  shadowCtx = off.ctx;

  const offBokehRaw = buf();
  lightBokehRawCanvas = offBokehRaw.canvas;
  lightBokehRawCtx = offBokehRaw.ctx;

  const offBokeh = buf();
  lightBokehCanvas = offBokeh.canvas;
  lightBokehCtx = offBokeh.ctx;

  const offRaw2 = buf();
  lightRawCanvas = offRaw2.canvas;
  lightRawCtx = offRaw2.ctx;

  const off2 = full();
  lightCanvas = off2.canvas;
  lightCtx = off2.ctx;

  const off3 = full();
  wallCanvas = off3.canvas;
  wallCtx = off3.ctx;

  const off4 = full();
  textCanvas = off4.canvas;
  textCtx = off4.ctx;
  textCtx.imageSmoothingEnabled = true;
  textCtx.imageSmoothingQuality = 'high';

  const offFxRaw = buf();
  fxRawCanvas = offFxRaw.canvas;
  fxRawCtx = offFxRaw.ctx;

  const offFx = buf();
  fxCanvas = offFx.canvas;
  fxCtx = offFx.ctx;

  if (!grainPattern) initGrain();
  if (!frostPattern) initFrostGrain();
  const isMobile = width < 768;
  cursorLight.radius = (isMobile ? 135 : 190) * LIGHT_SIZE_SCALE;
  cursorLight.baseRadius = cursorLight.radius;
  cursorLight.renderRadius = cursorLight.radius;
  initBlobs();
  initEdgeFeatherSpots();
  initFoliage();
  initGapPatches();
  initLightBeams();
  initDust();
  requestAnimationFrame(() => {
    layoutScatterItems();
    measureTextItems();
  });
}

function getShadowColor(b) {
  const t = b.shadowTint ?? 0.5;
  const d = b.shadowDepth ?? 0.5;
  const v = b.colorVariant ?? 0.5;

  const mid = {
    r: SHADOW_DARK.r + (SHADOW_MID.r - SHADOW_DARK.r) * t,
    g: SHADOW_DARK.g + (SHADOW_MID.g - SHADOW_DARK.g) * t,
    b: SHADOW_DARK.b + (SHADOW_MID.b - SHADOW_DARK.b) * t,
  };
  const base = {
    r: mid.r + (SHADOW_LIGHT.r - mid.r) * (1 - d) * 0.55,
    g: mid.g + (SHADOW_LIGHT.g - mid.g) * (1 - d) * 0.55,
    b: mid.b + (SHADOW_LIGHT.b - mid.b) * (1 - d) * 0.55,
  };

  const hueIdx = Math.floor(v * SHADOW_HUES.length) % SHADOW_HUES.length;
  const hueNext = SHADOW_HUES[(hueIdx + 1) % SHADOW_HUES.length];
  const hueFrac = (v * SHADOW_HUES.length) % 1;
  const hueMix = 0.3 + t * 0.45;
  const hue = {
    r: SHADOW_HUES[hueIdx].r + (hueNext.r - SHADOW_HUES[hueIdx].r) * hueFrac,
    g: SHADOW_HUES[hueIdx].g + (hueNext.g - SHADOW_HUES[hueIdx].g) * hueFrac,
    b: SHADOW_HUES[hueIdx].b + (hueNext.b - SHADOW_HUES[hueIdx].b) * hueFrac,
  };

  return {
    r: Math.round(Math.min(240, Math.max(171, base.r + hue.r * hueMix))),
    g: Math.round(Math.min(238, Math.max(167, base.g + hue.g * hueMix))),
    b: Math.round(Math.min(234, Math.max(161, base.b + hue.b * hueMix))),
  };
}

function getLightBlobs() {
  return cachedLightBlobs;
}

function getGapShadowColor(patch) {
  const v = patch.colorVariant ?? 0.5;
  const d = patch.depth ?? 0.55;
  const darken = Math.round(d * 24);
  const base = {
    r: GAP_SHADOW.r - darken,
    g: GAP_SHADOW.g - darken + 2,
    b: GAP_SHADOW.b - darken + 3,
  };

  const hueIdx = Math.floor(v * SHADOW_HUES.length) % SHADOW_HUES.length;
  const hueNext = SHADOW_HUES[(hueIdx + 1) % SHADOW_HUES.length];
  const hueFrac = (v * SHADOW_HUES.length) % 1;
  const hueMix = 0.38 + d * 0.42;
  const hue = {
    r: SHADOW_HUES[hueIdx].r + (hueNext.r - SHADOW_HUES[hueIdx].r) * hueFrac,
    g: SHADOW_HUES[hueIdx].g + (hueNext.g - SHADOW_HUES[hueIdx].g) * hueFrac,
    b: SHADOW_HUES[hueIdx].b + (hueNext.b - SHADOW_HUES[hueIdx].b) * hueFrac,
  };

  return {
    r: Math.round(Math.min(142, Math.max(112, base.r + hue.r * hueMix))),
    g: Math.round(Math.min(140, Math.max(108, base.g + hue.g * hueMix))),
    b: Math.round(Math.min(136, Math.max(102, base.b + hue.b * hueMix))),
  };
}

function drawGapPatch(targetCtx, blobA, blobB, patch) {
  const dx = blobB.renderX - blobA.renderX;
  const dy = blobB.renderY - blobA.renderY;
  const dist = Math.hypot(dx, dy);
  if (dist < 8) return;

  const bias = patch.bias ?? 0;
  const mx = (blobA.renderX + blobB.renderX) * 0.5 + (dx / dist) * dist * bias * 0.18;
  const my = (blobA.renderY + blobB.renderY) * 0.5 + (dy / dist) * dist * bias * 0.18;

  const rA = (blobA.renderRadius ?? blobA.radius) * dpr;
  const rB = (blobB.renderRadius ?? blobB.radius) * dpr;
  const avgR = (rA + rB) * 0.5;
  const rad = (dist * 0.36 + avgR * 0.48) * (patch.sizeScale ?? 0.75);
  const color = getGapShadowColor(patch);
  const a = patch.depth ?? 0.55;

  targetCtx.save();
  targetCtx.translate(mx, my);
  targetCtx.rotate(Math.atan2(dy, dx));
  targetCtx.scale(1, patch.aspect ?? 0.8);

  const grad = targetCtx.createRadialGradient(0, 0, rad * 0.06, 0, 0, rad);
  grad.addColorStop(0, `rgba(${color.r},${color.g},${color.b},${Math.min(a * 1.02, 0.92)})`);
  grad.addColorStop(0.4, `rgba(${color.r},${color.g},${color.b},${a * 0.62})`);
  grad.addColorStop(0.72, `rgba(${color.r},${color.g},${color.b},${a * 0.26})`);
  grad.addColorStop(1, `rgba(${color.r},${color.g},${color.b},0)`);
  targetCtx.fillStyle = grad;
  targetCtx.fillRect(-rad * 1.25, -rad * 1.25, rad * 2.5, rad * 2.5);
  targetCtx.restore();
}

function updateWind(time) {
  if (prefersReducedMotion) return;
  if (sceneIdle && renderFrame % 3 !== 0) return;

  const t = time * 0.001;
  const idle = !pointerOnScreen;
  const idleBoost = idle ? 1.35 : 0.55;

  if (time > wind.nextGustAt) {
    const strength = idle ? 1.5 : 0.6;
    wind.gustTargetX = (Math.random() - 0.5) * 200 * strength;
    wind.gustTargetY = (Math.random() - 0.5) * 150 * strength;
    wind.nextGustAt = time + 600 + Math.random() * 2000;
  }

  wind.gustX += (wind.gustTargetX - wind.gustX) * 0.02;
  wind.gustY += (wind.gustTargetY - wind.gustY) * 0.02;

  wind.flutterX =
    (Math.sin(t * 2.1) * 24 + Math.sin(t * 4.7 + 1.2) * 16 + Math.sin(t * 7.3) * 9) *
    idleBoost;
  wind.flutterY =
    (Math.cos(t * 1.8) * 20 + Math.sin(t * 5.1) * 14 + Math.cos(t * 6.8) * 8) * idleBoost;
}

function updateCursorLight(time) {
  const t = time * 0.001;
  cursorLight.renderX = smoothMouse.x * canvas.width;
  cursorLight.renderY = smoothMouse.y * canvas.height;

  const sizePulse =
    1 +
    Math.sin(t * cursorLight.sizeFreq) * cursorLight.sizeAmp +
    Math.sin(t * cursorLight.sizeFreq * 1.7) * cursorLight.sizeAmp * 0.45;
  cursorLight.renderRadius = cursorLight.baseRadius * sizePulse;

  const breathe = pointerOnScreen ? 0.12 : 0.08;
  cursorLight.renderRx = 0.86 + Math.sin(t * 0.9) * breathe;
  cursorLight.renderRy = 0.86 + Math.cos(t * 0.75) * breathe;
}

function getCursorLightBlob() {
  return {
    radius: cursorLight.renderRadius,
    strength: cursorLight.strength,
    renderX: cursorLight.renderX,
    renderY: cursorLight.renderY,
    renderRx: cursorLight.renderRx,
    renderRy: cursorLight.renderRy,
    renderRadius: cursorLight.renderRadius,
    tiltVariation: cursorLight.tiltVariation,
    ellipseX: cursorLight.ellipseX * cursorLight.renderRx,
    ellipseY: cursorLight.ellipseY * cursorLight.renderRy,
    ellipseRound: cursorLight.ellipseRound,
  };
}

function updateHoverTextLight(time) {
  const hoverRect = hoveredTextLightRect;
  const hasHover = pointerOnScreen && hoverRect;
  hoverTextLight.active = !!hasHover;

  if (hasHover) {
    const textCenterX = hoverRect.left + hoverRect.width * 0.5;
    const textCenterY = hoverRect.top + hoverRect.height * 0.5;
    hoverTextLight.targetX = (pointerClientX * 0.72 + textCenterX * 0.28) * dpr;
    hoverTextLight.targetY = (pointerClientY * 0.76 + textCenterY * 0.24) * dpr;
    hoverTextLight.targetRadius = Math.max(
      cursorLight.baseRadius * 1.18,
      hoverRect.width * (width < MOBILE_BREAKPOINT ? 0.78 : 0.66) + 128,
      hoverRect.height * 5.2
    );
  }

  const appear = hasHover ? 0.24 : 0.1;
  hoverTextLight.opacity += ((hasHover ? 1 : 0) - hoverTextLight.opacity) * appear;
  hoverTextLight.renderX += (hoverTextLight.targetX - hoverTextLight.renderX) * (hasHover ? 0.34 : 0.08);
  hoverTextLight.renderY += (hoverTextLight.targetY - hoverTextLight.renderY) * (hasHover ? 0.34 : 0.08);
  hoverTextLight.renderRadius += (hoverTextLight.targetRadius - hoverTextLight.renderRadius) * 0.18;

  const t = time * 0.001;
  hoverTextLight.renderRx = 1.1 + Math.sin(t * 0.72) * 0.06;
  hoverTextLight.renderRy = 0.78 + Math.cos(t * 0.64) * 0.04;
}

function getHoverTextLightBlob() {
  return {
    hoverTextLight: true,
    radius: hoverTextLight.renderRadius,
    strength: hoverTextLight.strength * hoverTextLight.opacity,
    renderX: hoverTextLight.renderX,
    renderY: hoverTextLight.renderY,
    renderRx: hoverTextLight.renderRx,
    renderRy: hoverTextLight.renderRy,
    renderRadius: hoverTextLight.renderRadius,
    tiltVariation: hoverTextLight.tiltVariation,
    ellipseX: hoverTextLight.ellipseX * hoverTextLight.renderRx,
    ellipseY: hoverTextLight.ellipseY * hoverTextLight.renderRy,
    ellipseRound: hoverTextLight.ellipseRound,
  };
}

function forEachLightBlob(callback) {
  for (const b of cachedLightBlobs) callback(b, false);
  if (hoverTextLight.opacity > 0.025) callback(getHoverTextLightBlob(), false);
  if (pointerOnScreen) callback(getCursorLightBlob(), true);
}

function getMouseFollowWeight(baseX, baseY, anchorX, anchorY, parallax = 0.4) {
  const mouseX = anchorX / dpr;
  const mouseY = anchorY / dpr;
  const dx = baseX - mouseX;
  const dy = baseY - mouseY;
  const dist = Math.hypot(dx, dy);
  const reach = Math.hypot(width, height) * 0.52;
  let t = 1 - Math.min(dist / reach, 1);
  t = t * t * (3 - 2 * t);
  const floor = 0.1;
  const ceiling = 0.94 + parallax * 0.06;
  return floor + t * (ceiling - floor);
}

function updateMotionEntity(b, time, idle, motionScale, globalX, globalY, anchorX, anchorY) {
  const t = time * 0.001;
  const followWind = 0.45;

  const swayX =
    Math.sin(t * b.swayFreq + b.phase) * b.swayAmp +
    Math.sin(t * b.swayFreq * 0.55 + b.phase2) * b.swayAmp * 0.45;

  const swayY =
    Math.cos(t * b.swayFreq * 0.85 + b.phase) * b.swayAmp * 0.75 +
    Math.sin(t * b.swayFreq * 0.4 + b.phase2) * b.swayAmp * 0.35;

  const flutterX = Math.sin(t * b.flutterFreq + b.phase) * b.flutterAmp;
  const flutterY = Math.cos(t * b.flutterFreq * 1.15 + b.phase2) * b.flutterAmp;

  const localX = (swayX + flutterX) * dpr * motionScale;
  const localY = (swayY + flutterY) * dpr * motionScale;

  const baseRenderX = b.baseX * dpr + localX + globalX;
  const baseRenderY = b.baseY * dpr + localY + globalY;

  if (b.pinEdge) {
    b.renderX = b.normX * canvas.width + localX + globalX;
    b.renderY = b.normY * canvas.height + localY + globalY;
  } else if (pointerOnScreen && b.relX != null) {
    const follow = getMouseFollowWeight(
      b.baseX, b.baseY, anchorX, anchorY, b.parallax ?? 0.4
    );
    const anchorRenderX = anchorX + b.relX * dpr + localX + globalX * followWind;
    const anchorRenderY = anchorY + b.relY * dpr + localY + globalY * followWind;
    b.renderX = baseRenderX + (anchorRenderX - baseRenderX) * follow;
    b.renderY = baseRenderY + (anchorRenderY - baseRenderY) * follow;
  } else {
    b.renderX = baseRenderX;
    b.renderY = baseRenderY;
  }

  const breathe = 1 + Math.sin(t * b.swayFreq * 1.6 + b.phase) * 0.1 * motionScale;
  b.renderRx = b.rx * breathe;
  b.renderRy = b.ry * (1 + Math.cos(t * b.swayFreq * 1.3 + b.phase2) * 0.08 * motionScale);
}

function updateLightWander(time) {
  const t = time * 0.001;

  for (const b of blobs) {
    if (b.type !== 'light' || b.pinEdge || b.wanderAmpX == null) continue;

    const wx =
      Math.sin(t * b.wanderFreq + b.phase) * b.wanderAmpX +
      Math.sin(t * b.wanderFreq * 0.51 + b.phase2) * b.wanderAmpX * 0.62;
    const wy =
      Math.cos(t * b.wanderFreq * 0.78 + b.phase2) * b.wanderAmpY +
      Math.cos(t * b.wanderFreq * 0.43 + b.phase) * b.wanderAmpY * 0.58;

    const ax = b.anchorNormX ?? b.baseX / width;
    const ay = b.anchorNormY ?? b.baseY / height;
    b.baseX = width * ax + wx;
    b.baseY = height * ay + wy;
    b.relX = b.baseX - width * 0.5;
    b.relY = b.baseY - height * 0.5;
  }
}

function updateLightClustering(time) {
  const isMobile = width < MOBILE_BREAKPOINT;
  const t = time * 0.001;
  const lights = cachedLightBlobs.filter((b) => !b.pinEdge);
  clusterGlows = [];

  for (const b of lights) {
    b.mergeFactor = 0;
    b.clusterPullX = 0;
    b.clusterPullY = 0;
  }

  const cellSize = (isMobile ? 170 : 110) * dpr * CLUSTER_AREA_SCALE;
  const grid = new Map();

  for (let i = 0; i < lights.length; i++) {
    const b = lights[i];
    const cx = Math.floor(b.renderX / cellSize);
    const cy = Math.floor(b.renderY / cellSize);
    const key = `${cx},${cy}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(i);
  }

  for (let i = 0; i < lights.length; i++) {
    const a = lights[i];
    const acx = Math.floor(a.renderX / cellSize);
    const acy = Math.floor(a.renderY / cellSize);

    for (let gx = -1; gx <= 1; gx++) {
      for (let gy = -1; gy <= 1; gy++) {
        const bucket = grid.get(`${acx + gx},${acy + gy}`);
        if (!bucket) continue;

        for (const j of bucket) {
          if (j <= i) continue;
          const b = lights[j];
          const dx = b.renderX - a.renderX;
          const dy = b.renderY - a.renderY;
          const dist = Math.hypot(dx, dy);
          const mergeDist = (a.renderRadius + b.renderRadius) * dpr * (isMobile ? 1.85 : 1.2) * CLUSTER_AREA_SCALE;
          if (dist < 8 || dist > mergeDist) continue;

          const closeness = 1 - dist / mergeDist;
          const cycle = Math.sin(t * 0.26 + a.phase * 0.6 + b.phase * 0.8) * 0.5 + 0.5;
          const merge = closeness * (0.25 + cycle * 0.75);

          a.mergeFactor = Math.max(a.mergeFactor, merge);
          b.mergeFactor = Math.max(b.mergeFactor, merge);

          const nx = dx / dist;
          const ny = dy / dist;
          if (cycle > 0.48) {
            const pull = (cycle - 0.48) * closeness * 0.34;
            a.clusterPullX += nx * pull * dist * 0.1;
            a.clusterPullY += ny * pull * dist * 0.1;
            b.clusterPullX -= nx * pull * dist * 0.1;
            b.clusterPullY -= ny * pull * dist * 0.1;
          } else {
            const push = (0.48 - cycle) * closeness * 0.26;
            a.clusterPullX -= nx * push * dist * 0.05;
            a.clusterPullY -= ny * push * dist * 0.05;
            b.clusterPullX += nx * push * dist * 0.05;
            b.clusterPullY += ny * push * dist * 0.05;
          }
        }
      }
    }
  }

  const used = new Set();
  for (let i = 0; i < lights.length; i++) {
    if (used.has(i)) continue;
    const group = [lights[i]];
    used.add(i);

    for (let j = i + 1; j < lights.length; j++) {
      if (used.has(j)) continue;
      const dist = Math.hypot(
        lights[i].renderX - lights[j].renderX,
        lights[i].renderY - lights[j].renderY
      );
      const joinDist = (lights[i].renderRadius + lights[j].renderRadius) * dpr * (isMobile ? 2.05 : 1.35) * CLUSTER_AREA_SCALE;
      if (dist < joinDist) {
        group.push(lights[j]);
        used.add(j);
      }
    }

    if (group.length < 2) continue;

    let cx = 0;
    let cy = 0;
    let totalR = 0;
    let maxMerge = 0;
    for (const g of group) {
      cx += g.renderX;
      cy += g.renderY;
      totalR += g.renderRadius * dpr;
      maxMerge = Math.max(maxMerge, g.mergeFactor ?? 0);
    }
    cx /= group.length;
    cy /= group.length;

    if (maxMerge < (isMobile ? 0.08 : 0.2)) continue;

    const avgR = totalR / group.length;
    clusterGlows.push({
      x: cx,
      y: cy,
      radius: (avgR * (isMobile ? 0.82 + maxMerge * 0.92 : 0.55 + maxMerge * 0.65) + avgR * group.length * (isMobile ? 0.18 : 0.12)) * CLUSTER_AREA_SCALE,
      merge: maxMerge,
      strength: (isMobile ? 0.42 + maxMerge * 0.48 : 0.28 + maxMerge * 0.42) * CLUSTER_AREA_SCALE,
    });
  }
}

function drawClusterGlows(targetCtx) {
  const isMobile = width < MOBILE_BREAKPOINT;
  targetCtx.save();
  targetCtx.globalCompositeOperation = 'lighter';
  for (const c of clusterGlows) {
    const s = c.strength * lightBrightBoost * (isMobile ? 1.18 : 1);
    const grad = targetCtx.createRadialGradient(
      c.x, c.y, c.radius * 0.05,
      c.x, c.y, c.radius
    );
    grad.addColorStop(0, `rgba(255,255,252,${s * (isMobile ? 0.62 : 0.85)})`);
    grad.addColorStop(0.35, `rgba(255,250,242,${s * (isMobile ? 0.38 : 0.42)})`);
    grad.addColorStop(0.72, `rgba(255,247,236,${s * (isMobile ? 0.13 : 0.14)})`);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    targetCtx.fillStyle = grad;
    targetCtx.beginPath();
    targetCtx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
    targetCtx.fill();
  }
  targetCtx.restore();
}

function updateBlobs(time) {
  if (sceneIdle && renderFrame % 2 !== 0) return;

  const t = time * 0.001;
  const idle = !pointerOnScreen;
  const motionScale = idle ? 1.6 : 1;

  const globalX = (wind.gustX + wind.flutterX) * dpr * motionScale;
  const globalY = (wind.gustY + wind.flutterY) * dpr * motionScale;

  const anchorX = smoothMouse.x * canvas.width;
  const anchorY = smoothMouse.y * canvas.height;

  updateLightWander(time);

  for (const b of blobs) {
    if (b.type !== 'light') continue;

    updateMotionEntity(b, time, idle, motionScale, globalX, globalY, anchorX, anchorY);

    if (b.sizeFreq) {
      const pulse =
        1 +
        Math.sin(t * b.sizeFreq + b.phase) * b.sizeAmp +
        Math.sin(t * b.sizeFreq * 1.6 + b.phase2) * b.sizeAmp * 0.4;
      b.renderRadius = b.radius * pulse;
    } else {
      b.renderRadius = b.radius;
    }
  }

  const clusterInterval = sceneIdle ? DESKTOP_CLUSTER_IDLE_FRAME_MS : DESKTOP_CLUSTER_FRAME_MS;
  if (width < MOBILE_BREAKPOINT || time - lastClusterUpdateAt > clusterInterval) {
    updateLightClustering(time);
    lastClusterUpdateAt = time;
  }

  for (const b of blobs) {
    if (b.type !== 'light') continue;
    b.renderX += b.clusterPullX ?? 0;
    b.renderY += b.clusterPullY ?? 0;
    const merge = b.mergeFactor ?? 0;
    if (merge > 0) b.renderRadius *= 1 + merge * 0.52 * CLUSTER_AREA_SCALE;
  }

  for (const f of foliage) {
    updateMotionEntity(f, time, idle, motionScale, globalX, globalY, anchorX, anchorY);
    f.renderRadius = f.radius;
    f.renderAngle =
      (f.baseAngle ?? 0) + Math.sin(t * f.swayFreq * 0.6 + f.phase) * 0.06 * motionScale;
  }
}

function drawBlob(targetCtx, b, color, alphaScale = 1, hot = false, softShadow = false) {
  const { r, g, b: bv } = color;
  const radius = (b.renderRadius ?? b.radius) * dpr;

  targetCtx.save();
  targetCtx.translate(b.renderX, b.renderY);
  targetCtx.scale(b.renderRx, b.renderRy);
  targetCtx.translate(-b.renderX, -b.renderY);

  const grad = targetCtx.createRadialGradient(
    b.renderX, b.renderY, 0,
    b.renderX, b.renderY, radius
  );
  const a = Math.min(b.strength * alphaScale, 1);

  if (hot) {
    grad.addColorStop(0, `rgba(${r},${g},${bv},${Math.min(a * 1.05, 1)})`);
    grad.addColorStop(0.2, `rgba(${r},${g},${bv},${a * 0.75})`);
    grad.addColorStop(0.5, `rgba(${r},${g},${bv},${a * 0.28})`);
    grad.addColorStop(1, `rgba(${r},${g},${bv},0)`);
  } else if (softShadow) {
    grad.addColorStop(0, `rgba(${r},${g},${bv},${Math.min(a * 1.1, 1)})`);
    grad.addColorStop(0.2, `rgba(${r},${g},${bv},${a * 0.82})`);
    grad.addColorStop(0.45, `rgba(${r},${g},${bv},${a * 0.52})`);
    grad.addColorStop(0.68, `rgba(${r},${g},${bv},${a * 0.28})`);
    grad.addColorStop(0.88, `rgba(${r},${g},${bv},${a * 0.1})`);
    grad.addColorStop(1, `rgba(${r},${g},${bv},0)`);
  } else {
    grad.addColorStop(0, `rgba(${r},${g},${bv},${a})`);
    grad.addColorStop(0.35, `rgba(${r},${g},${bv},${a * 0.65})`);
    grad.addColorStop(0.7, `rgba(${r},${g},${bv},${a * 0.2})`);
    grad.addColorStop(1, `rgba(${r},${g},${bv},0)`);
  }

  targetCtx.fillStyle = grad;
  targetCtx.fillRect(0, 0, canvas.width, canvas.height);
  targetCtx.restore();
}

function shadowFillClipped(targetCtx, b, r, g, bv, a) {
  const radius = (b.renderRadius ?? b.radius) * dpr;
  targetCtx.save();
  targetCtx.clip();
  const grad = targetCtx.createRadialGradient(0, 0, radius * 0.01, 0, 0, radius * 0.95);
  grad.addColorStop(0, `rgba(${r},${g},${bv},${Math.min(a * 1.02, 1)})`);
  grad.addColorStop(0.28, `rgba(${r},${g},${bv},${a * 0.68})`);
  grad.addColorStop(0.58, `rgba(${r},${g},${bv},${a * 0.32})`);
  grad.addColorStop(1, `rgba(${r},${g},${bv},0)`);
  targetCtx.fillStyle = grad;
  targetCtx.fillRect(-radius * 1.4, -radius * 1.4, radius * 2.8, radius * 2.8);
  targetCtx.restore();
}

function branchPointAt(segs, len, t) {
  let x = (t - 0.5) * len;
  let y = 0;
  let angle = SUN_ANGLE;

  for (let i = 0; i < segs.length - 1; i++) {
    const s0 = segs[i];
    const s1 = segs[i + 1];
    if (t >= s0.t && t <= s1.t) {
      const u = (t - s0.t) / Math.max(s1.t - s0.t, 0.001);
      const x0 = (s0.t - 0.5) * len;
      const y0 = s0.perpOffset * len * 0.38;
      const x1 = (s1.t - 0.5) * len;
      const y1 = s1.perpOffset * len * 0.38;
      x = x0 + (x1 - x0) * u;
      y = y0 + (y1 - y0) * u;
      angle = Math.atan2(y1 - y0, x1 - x0);
      break;
    }
  }

  return { x, y, angle };
}

function appendLeafPath(targetCtx, len, wid) {
  targetCtx.moveTo(0, -len * 0.52);
  targetCtx.bezierCurveTo(wid * 0.65, -len * 0.2, wid * 0.6, len * 0.3, 0, len * 0.5);
  targetCtx.bezierCurveTo(-wid * 0.6, len * 0.3, -wid * 0.65, -len * 0.2, 0, -len * 0.52);
}

function drawBranchShadow(targetCtx, b, r, g, bv, a) {
  const len = b.branch.length * dpr;
  const segs = b.branch.segments;

  targetCtx.beginPath();
  for (const seg of segs) {
    const x = (seg.t - 0.5) * len;
    const y = seg.perpOffset * len * 0.38;
    const w = seg.width * len * 0.13;
    targetCtx.ellipse(x, y, Math.max(w * 0.42, 1.5), Math.max(w * seg.bulge * 0.34, 1.2), 0, 0, Math.PI * 2);
  }
  for (let i = 0; i < segs.length - 1; i++) {
    const s0 = segs[i];
    const s1 = segs[i + 1];
    const x0 = (s0.t - 0.5) * len;
    const y0 = s0.perpOffset * len * 0.38;
    const x1 = (s1.t - 0.5) * len;
    const y1 = s1.perpOffset * len * 0.38;
    const mx = (x0 + x1) * 0.5;
    const my = (y0 + y1) * 0.5;
    const w = ((s0.width + s1.width) * 0.5) * len * 0.085;
    targetCtx.ellipse(mx, my, Math.max(w, 1.5), Math.max(w * 0.65, 1.2), Math.atan2(y1 - y0, x1 - x0), 0, Math.PI * 2);
  }

  for (const twig of b.branch.twigs ?? []) {
    const pt = branchPointAt(segs, len, twig.segT);
    const twigLen = len * twig.len * 0.5;
    const angle = pt.angle + twig.angle;
    const steps = 3;
    for (let k = 0; k <= steps; k++) {
      const tt = k / steps;
      const tx = pt.x + Math.cos(angle) * twigLen * tt;
      const ty = pt.y + Math.sin(angle) * twigLen * tt;
      const tw = twig.width * len * 0.04 * (1 - tt * 0.4);
      targetCtx.ellipse(tx, ty, Math.max(tw, 1), Math.max(tw * 0.65, 0.8), angle, 0, Math.PI * 2);
    }
  }

  shadowFillClipped(targetCtx, b, r, g, bv, a);
}

function drawLeafShadow(targetCtx, b, r, g, bv, a) {
  const baseLen = (b.renderRadius ?? b.radius) * dpr * 0.92;

  targetCtx.beginPath();
  for (const leaf of b.leaf.leaves) {
    targetCtx.save();
    targetCtx.translate(leaf.ox * dpr, leaf.oy * dpr);
    targetCtx.rotate(leaf.rot);
    targetCtx.scale(leaf.scale, leaf.scale * leaf.aspect);
    appendLeafPath(targetCtx, baseLen, baseLen * 0.44);
    targetCtx.restore();
  }

  shadowFillClipped(targetCtx, b, r, g, bv, a);
}

function drawShadowShape(targetCtx, b, color, alphaScale = 1) {
  const { r, g, b: bv } = color;
  const a = Math.min(b.strength * alphaScale, 1);

  targetCtx.save();
  targetCtx.translate(b.renderX, b.renderY);
  targetCtx.rotate(b.renderAngle ?? 0);
  targetCtx.scale(b.renderRx, b.renderRy);

  if (b.shadowShape === 'branch') {
    drawBranchShadow(targetCtx, b, r, g, bv, a);
  } else {
    drawLeafShadow(targetCtx, b, r, g, bv, a);
  }

  targetCtx.restore();
}

function drawLightCutout(targetCtx, b, alphaScale = 1.08, radiusScale = 1.04) {
  const radius = (b.renderRadius ?? b.radius) * dpr;
  const tilt = SUN_ANGLE + (b.tiltVariation ?? 0);
  const ex = (b.ellipseX ?? 1) * (b.renderRx ?? 1);
  const ey = (b.ellipseY ?? 1) * (b.renderRy ?? 1);
  const round = b.ellipseRound ?? 0.65;
  const a = Math.min(b.strength * alphaScale, 1.2);
  const rs = radiusScale;

  targetCtx.save();
  targetCtx.translate(b.renderX, b.renderY);
  targetCtx.rotate(tilt);
  targetCtx.transform(1, 0, PERSP_SKEW, 0.84, 0, radius * 0.05);
  targetCtx.scale(ex, ey);

  const cx = -radius * 0.24;
  const cy = -radius * 0.15;

  const grad = targetCtx.createRadialGradient(
    cx, cy, radius * 0.02 * rs,
    cx * 0.12, cy * 0.12, radius * 1.16 * rs
  );
  grad.addColorStop(0, `rgba(255,255,255,${Math.min(a * 1.05, 1)})`);
  grad.addColorStop(0.22, `rgba(255,255,255,${a * 0.78})`);
  grad.addColorStop(0.5, `rgba(255,255,255,${a * 0.38})`);
  grad.addColorStop(0.76, `rgba(255,255,255,${a * 0.12})`);
  grad.addColorStop(1, 'rgba(255,255,255,0)');

  targetCtx.beginPath();
  targetCtx.ellipse(0, 0, radius * rs, radius * round * rs, 0, 0, Math.PI * 2);
  targetCtx.fillStyle = grad;
  targetCtx.fill();
  targetCtx.restore();
}

function fillShadowBase(targetCtx) {
  const w = canvas.width;
  const h = canvas.height;
  const c = SHADOW_LIGHTEN_CHANNEL;
  const grad = targetCtx.createLinearGradient(w * 0.92, -h * 0.08, -w * 0.12, h * 1.05);
  grad.addColorStop(0, `rgb(${c(230)}, ${c(227)}, ${c(221)})`);
  grad.addColorStop(0.32, `rgb(${c(210)}, ${c(206)}, ${c(198)})`);
  grad.addColorStop(0.58, `rgb(${c(198)}, ${c(200)}, ${c(206)})`);
  grad.addColorStop(0.82, `rgb(${c(188)}, ${c(182)}, ${c(172)})`);
  grad.addColorStop(1, `rgb(${c(176)}, ${c(170)}, ${c(158)})`);
  targetCtx.fillStyle = grad;
  targetCtx.fillRect(0, 0, w, h);
}

function applyOrganicShadowEdgeBlend(targetCtx) {
  const w = canvas.width;
  const h = canvas.height;
  targetCtx.globalCompositeOperation = 'destination-out';
  for (const s of edgeFeatherSpots) {
    const cx = s.nx * w;
    const cy = s.ny * h;
    const rad = s.r * Math.max(w, h);
    const g = targetCtx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    g.addColorStop(0, `rgba(255,255,255,${s.a})`);
    g.addColorStop(0.45, `rgba(255,255,255,${s.a * 0.38})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    targetCtx.fillStyle = g;
    targetCtx.fillRect(0, 0, w, h);
  }
  targetCtx.globalCompositeOperation = 'source-over';
}

function drawEdgeWallGlow() {
  const w = canvas.width;
  const h = canvas.height;
  wallCtx.save();
  wallCtx.globalCompositeOperation = 'screen';
  wallCtx.globalAlpha = 0.85;
  for (const s of edgeFeatherSpots) {
    const cx = s.nx * w;
    const cy = s.ny * h;
    const rad = s.r * Math.max(w, h) * 1.2;
    const g = wallCtx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    g.addColorStop(0, `rgba(255,252,246,${s.a * 0.42})`);
    g.addColorStop(0.5, `rgba(255,249,240,${s.a * 0.16})`);
    g.addColorStop(1, 'rgba(255,255,255,0)');
    wallCtx.fillStyle = g;
    wallCtx.fillRect(0, 0, w, h);
  }
  wallCtx.globalAlpha = 1;
  wallCtx.globalCompositeOperation = 'source-over';
  wallCtx.restore();
}

function drawShadowAmbientWashes(targetCtx) {
  const w = canvas.width;
  const h = canvas.height;
  const washes = [
    { x: 0.16, y: 0.22, r: 0.44, rgb: [SHADOW_LIGHTEN_CHANNEL(186), SHADOW_LIGHTEN_CHANNEL(178), SHADOW_LIGHTEN_CHANNEL(168)], a: 0.198 },
    { x: 0.68, y: 0.32, r: 0.4, rgb: [SHADOW_LIGHTEN_CHANNEL(174), SHADOW_LIGHTEN_CHANNEL(180), SHADOW_LIGHTEN_CHANNEL(188)], a: 0.18 },
    { x: 0.42, y: 0.68, r: 0.46, rgb: [SHADOW_LIGHTEN_CHANNEL(176), SHADOW_LIGHTEN_CHANNEL(184), SHADOW_LIGHTEN_CHANNEL(172)], a: 0.171 },
    { x: 0.82, y: 0.74, r: 0.36, rgb: [SHADOW_LIGHTEN_CHANNEL(188), SHADOW_LIGHTEN_CHANNEL(178), SHADOW_LIGHTEN_CHANNEL(170)], a: 0.18 },
    { x: 0.28, y: 0.52, r: 0.42, rgb: [SHADOW_LIGHTEN_CHANNEL(168), SHADOW_LIGHTEN_CHANNEL(174), SHADOW_LIGHTEN_CHANNEL(182)], a: 0.162 },
    { x: 0.55, y: 0.38, r: 0.32, rgb: [SHADOW_LIGHTEN_CHANNEL(182), SHADOW_LIGHTEN_CHANNEL(174), SHADOW_LIGHTEN_CHANNEL(162)], a: 0.153 },
  ];

  for (const wash of washes) {
    const cx = wash.x * w;
    const cy = wash.y * h;
    const rad = wash.r * Math.max(w, h);
    const [r, g, b] = wash.rgb;
    const g2 = targetCtx.createRadialGradient(cx, cy, 0, cx, cy, rad);
    g2.addColorStop(0, `rgba(${r},${g},${b},${wash.a})`);
    g2.addColorStop(0.5, `rgba(${r},${g},${b},${wash.a * 0.4})`);
    g2.addColorStop(1, `rgba(${r},${g},${b},0)`);
    targetCtx.fillStyle = g2;
    targetCtx.fillRect(0, 0, w, h);
  }
}

function drawGapShadowBoost(targetCtx) {
  if (width < MOBILE_BREAKPOINT || sceneIdle) return;

  for (const patch of gapPatches) {
    drawGapPatch(targetCtx, patch.lightA, patch.lightB, patch);
  }

  if (pointerOnScreen) {
    const cursor = getCursorLightBlob();
    const maxDist = 340 * dpr;
    const minDist = 18 * dpr;
    for (const light of getLightBlobs()) {
      const dx = light.renderX - cursor.renderX;
      const dy = light.renderY - cursor.renderY;
      const dist = Math.hypot(dx, dy);
      if (dist > maxDist || dist < minDist) continue;
      drawGapPatch(targetCtx, light, cursor, light.gapToCursor);
    }
  }
}

function drawLightBlob(targetCtx, b, alphaScale = 1) {
  const isMobile = width < MOBILE_BREAKPOINT;
  const radius = (b.renderRadius ?? b.radius) * dpr;
  const tilt = SUN_ANGLE + (b.tiltVariation ?? 0);
  const ex = (b.ellipseX ?? 1) * (b.renderRx ?? 1);
  const ey = (b.ellipseY ?? 1) * (b.renderRy ?? 1);
  const round = b.ellipseRound ?? 0.65;
  const a = Math.min(
    b.strength * alphaScale * lightBrightBoost * (isMobile ? 0.82 : 1),
    isMobile ? 0.96 : 1.32
  );
  const { r, g, b: bv } = LIGHT;

  targetCtx.save();
  targetCtx.translate(b.renderX, b.renderY);
  targetCtx.rotate(tilt);
  targetCtx.transform(1, 0, PERSP_SKEW, 0.84, 0, radius * 0.05);
  targetCtx.scale(ex, ey);

  const cx = -radius * 0.24;
  const cy = -radius * 0.15;

  const glow = targetCtx.createRadialGradient(cx, cy, radius * 0.05, cx, cy, radius * (isMobile ? 2.35 : 1.55));
  glow.addColorStop(0, `rgba(255,255,255,${Math.min(a * (isMobile ? 0.34 : 0.52), 1)})`);
  glow.addColorStop(0.32, `rgba(255,252,246,${a * (isMobile ? 0.2 : 0.26)})`);
  glow.addColorStop(0.68, `rgba(255,250,240,${a * (isMobile ? 0.09 : 0.1)})`);
  if (isMobile) glow.addColorStop(0.9, `rgba(255,248,236,${a * 0.025})`);
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  targetCtx.globalCompositeOperation = 'lighter';
  targetCtx.beginPath();
  targetCtx.ellipse(0, 0, radius * (isMobile ? 2.05 : 1.38), radius * round * (isMobile ? 2.25 : 1.38), 0, 0, Math.PI * 2);
  targetCtx.fillStyle = glow;
  targetCtx.fill();

  const grad = targetCtx.createRadialGradient(
    cx, cy, radius * 0.01,
    cx * 0.12, cy * 0.12, radius * 1.12
  );
  grad.addColorStop(0, `rgba(255,255,255,${Math.min(a * (isMobile ? 0.82 : 1.18), 1)})`);
  grad.addColorStop(0.07, `rgba(255,255,252,${Math.min(a * (isMobile ? 0.72 : 1.05), 1)})`);
  grad.addColorStop(0.22, `rgba(255,252,245,${a * (isMobile ? 0.54 : 0.86)})`);
  grad.addColorStop(0.42, `rgba(${r},${g},${bv},${a * (isMobile ? 0.32 : 0.58)})`);
  grad.addColorStop(0.64, `rgba(${r},${g},${bv},${a * (isMobile ? 0.16 : 0.36)})`);
  grad.addColorStop(0.82, `rgba(${r},${g},${bv},${a * (isMobile ? 0.045 : 0.05)})`);
  grad.addColorStop(1, `rgba(${r},${g},${bv},0)`);

  targetCtx.globalCompositeOperation = 'source-over';

  targetCtx.beginPath();
  targetCtx.ellipse(0, 0, radius * (isMobile ? 0.96 : 1), radius * round * (isMobile ? 1.16 : 1), 0, 0, Math.PI * 2);
  targetCtx.fillStyle = grad;
  targetCtx.fill();

  if (!isMobile) {
    const edgeAlpha = Math.min(a * (b.heroLight ? 0.3 : 0.18), 0.36);
    targetCtx.globalCompositeOperation = 'lighter';
    targetCtx.beginPath();
    targetCtx.ellipse(0, 0, radius * 0.98, radius * round * 0.98, 0, Math.PI * 1.08, Math.PI * 1.82);
    targetCtx.strokeStyle = `rgba(255,255,255,${edgeAlpha})`;
    targetCtx.lineWidth = Math.max(1.1 * dpr, radius * 0.014);
    targetCtx.lineCap = 'round';
    targetCtx.stroke();
  }

  targetCtx.save();
  targetCtx.beginPath();
  targetCtx.ellipse(0, 0, radius, radius * round, 0, 0, Math.PI * 2);
  targetCtx.clip();

  const fade = targetCtx.createLinearGradient(
    -radius * 0.5, -radius * 0.32,
    radius * 0.58, radius * 0.38
  );
  fade.addColorStop(0, `rgba(255,255,255,${Math.min(a * 0.55, 1)})`);
  fade.addColorStop(0.28, `rgba(255,253,248,${a * 0.22})`);
  fade.addColorStop(0.55, `rgba(${r},${g},${bv},${a * 0.08})`);
  fade.addColorStop(0.8, `rgba(${r},${g},${bv},${a * 0.025})`);
  fade.addColorStop(1, `rgba(${r},${g},${bv},0)`);

  targetCtx.globalCompositeOperation = 'lighter';
  targetCtx.fillStyle = fade;
  targetCtx.fillRect(-radius * 2.2, -radius * 2.2, radius * 4.4, radius * 4.4);

  const toneMask = targetCtx.createLinearGradient(
    -radius * 0.45, -radius * 0.28,
    radius * 0.55, radius * 0.36
  );
  toneMask.addColorStop(0, 'rgba(255,255,255,1)');
  toneMask.addColorStop(0.4, 'rgba(255,255,255,0.88)');
  toneMask.addColorStop(0.68, 'rgba(255,255,255,0.55)');
  toneMask.addColorStop(1, 'rgba(255,255,255,0.22)');

  targetCtx.globalCompositeOperation = 'destination-in';
  targetCtx.fillStyle = toneMask;
  targetCtx.fillRect(-radius * 2.2, -radius * 2.2, radius * 4.4, radius * 4.4);
  targetCtx.restore();

  targetCtx.restore();
}

function blurPass(source, destCtx, destCanvas, amount, extraFilter = '') {
  const dw = destCanvas.width;
  const dh = destCanvas.height;
  destCtx.clearRect(0, 0, dw, dh);
  const tierBlurScale = perfTier >= 3 ? 0.86 : perfTier >= 2 ? 0.92 : 1;
  const blurPx = amount * renderScale * tierBlurScale;
  destCtx.filter = extraFilter ? `blur(${blurPx}px) ${extraFilter}` : `blur(${blurPx}px)`;
  destCtx.drawImage(source, 0, 0, dw, dh);
  destCtx.filter = 'none';
}

function getOpenRollRect() {
  if (cachedOpenRollFrame === renderFrame) return cachedOpenRollRect;

  const roll = document.querySelector('.work-roll');
  if (!roll) {
    cachedOpenRollFrame = renderFrame;
    cachedOpenRollRect = null;
    return null;
  }
  const viewport = roll.querySelector('.roll-viewport');
  const rect = (viewport || roll).getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) {
    cachedOpenRollFrame = renderFrame;
    cachedOpenRollRect = null;
    return null;
  }

  cachedOpenRollFrame = renderFrame;
  cachedOpenRollRect = {
    x: rect.left * dpr,
    y: rect.top * dpr,
    width: rect.width * dpr,
    height: rect.height * dpr,
  };
  return cachedOpenRollRect;
}

function drawRollFocusLights(targetCtx, alphaScale = 1) {
  const rect = getOpenRollRect();
  if (!rect) return;

  const t = lastRenderAt * 0.001;
  const spots = [
    { x: 0.34, y: 0.42, r: 0.9, a: 0.18, px: 0.7 },
    { x: 0.62, y: 0.58, r: 0.72, a: 0.14, px: 1.3 },
    { x: 0.48, y: 0.5, r: 1.18, a: 0.08, px: 2.1 },
  ];

  targetCtx.save();
  targetCtx.globalCompositeOperation = 'lighter';
  for (const spot of spots) {
    const cx = rect.x + rect.width * spot.x + Math.sin(t * 0.45 + spot.px) * rect.width * 0.035;
    const cy = rect.y + rect.height * spot.y + Math.cos(t * 0.38 + spot.px) * rect.height * 0.045;
    const radius = Math.max(rect.width, rect.height) * spot.r;
    const grad = targetCtx.createRadialGradient(cx, cy, radius * 0.08, cx, cy, radius);
    grad.addColorStop(0, `rgba(255,255,255,${spot.a * alphaScale})`);
    grad.addColorStop(0.34, `rgba(255,252,246,${spot.a * 0.48 * alphaScale})`);
    grad.addColorStop(0.68, `rgba(255,248,236,${spot.a * 0.16 * alphaScale})`);
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    targetCtx.fillStyle = grad;
    targetCtx.beginPath();
    targetCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    targetCtx.fill();
  }
  targetCtx.restore();
}

function rollShadowPulse(value) {
  const t = Math.max(0, Math.min(value, 1));
  return t * t * (3 - 2 * t);
}

function drawRollFocusShadows(targetCtx, mode = 'mask') {
  const rect = getOpenRollRect();
  if (!rect) return;

  const t = lastRenderAt * 0.001;
  const shadows = [
    { x: 0.28, y: 0.38, rx: 0.28, ry: 0.18, phase: 0.2, speed: 0.22 },
    { x: 0.68, y: 0.55, rx: 0.22, ry: 0.14, phase: 1.8, speed: 0.18 },
    { x: 0.48, y: 0.72, rx: 0.34, ry: 0.12, phase: 3.1, speed: 0.16 },
  ];

  targetCtx.save();
  targetCtx.globalCompositeOperation = mode === 'mask' ? 'destination-out' : 'multiply';

  for (const shadow of shadows) {
    const cycle = Math.sin(t * shadow.speed + shadow.phase) * 0.5 + 0.5;
    const alpha = rollShadowPulse(cycle) * (mode === 'mask' ? 0.24 : 0.075);
    if (alpha < 0.012) continue;

    const cx = rect.x + rect.width * shadow.x + Math.sin(t * 0.33 + shadow.phase) * rect.width * 0.045;
    const cy = rect.y + rect.height * shadow.y + Math.cos(t * 0.27 + shadow.phase) * rect.height * 0.06;
    const rx = rect.width * shadow.rx;
    const ry = rect.height * shadow.ry;
    const grad = targetCtx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry));

    if (mode === 'mask') {
      grad.addColorStop(0, `rgba(255,255,255,${alpha})`);
      grad.addColorStop(0.46, `rgba(255,255,255,${alpha * 0.42})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
    } else {
      grad.addColorStop(0, `rgba(${SHADOW_LIGHTEN_CHANNEL(152)},${SHADOW_LIGHTEN_CHANNEL(150)},${SHADOW_LIGHTEN_CHANNEL(142)},${alpha})`);
      grad.addColorStop(0.5, `rgba(${SHADOW_LIGHTEN_CHANNEL(172)},${SHADOW_LIGHTEN_CHANNEL(170)},${SHADOW_LIGHTEN_CHANNEL(162)},${alpha * 0.38})`);
      grad.addColorStop(1, 'rgba(255,255,255,0)');
    }

    targetCtx.save();
    targetCtx.translate(cx, cy);
    targetCtx.rotate(-0.62 + Math.sin(t * 0.19 + shadow.phase) * 0.12);
    targetCtx.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry));
    targetCtx.fillStyle = grad;
    targetCtx.beginPath();
    targetCtx.arc(0, 0, Math.max(rx, ry), 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.restore();
  }

  targetCtx.restore();
}

function drawShadowLayer() {
  const isMobile = width < MOBILE_BREAKPOINT;
  const shadowInterval = isMobile ? 0 : (sceneIdle ? DESKTOP_SHADOW_IDLE_FRAME_MS : DESKTOP_SHADOW_FRAME_MS);
  if (!isMobile && renderFrame > 1 && lastRenderAt - lastShadowLayerAt < shadowInterval) return;
  lastShadowLayerAt = lastRenderAt;

  const w = canvas.width;
  const h = canvas.height;
  beginBufferDraw(shadowRawCtx);
  shadowRawCtx.clearRect(0, 0, w, h);
  fillShadowBase(shadowRawCtx);
  drawShadowAmbientWashes(shadowRawCtx);
  drawGapShadowBoost(shadowRawCtx);

  for (const f of foliage) {
    drawShadowShape(shadowRawCtx, f, getShadowColor(f), isMobile ? 0.83 : 1.21);
  }

  shadowRawCtx.globalCompositeOperation = 'destination-out';
  forEachLightBlob((b) => drawLightCutout(shadowRawCtx, b, isMobile ? 1.22 : 1.08, isMobile ? 1.16 : 1.04));
  shadowRawCtx.globalCompositeOperation = 'source-over';

  applyOrganicShadowEdgeBlend(shadowRawCtx);
  endBufferDraw(shadowRawCtx);
  blurPass(shadowRawCanvas, shadowCtx, shadowCanvas, isMobile ? BLUR_SHADOW * 1.15 : BLUR_SHADOW * (perfTier >= 2 ? 0.92 : 1));
}

function drawLightBokehLayer(time = lastRenderAt) {
  const isMobile = width < MOBILE_BREAKPOINT;
  const bokehInterval = isMobile ? 0 : (sceneIdle ? DESKTOP_BOKEH_IDLE_FRAME_MS : DESKTOP_BOKEH_FRAME_MS);
  if (!isMobile && time - lastBokehUpdateAt < bokehInterval) return;
  lastBokehUpdateAt = time;

  const w = canvas.width;
  const h = canvas.height;
  beginBufferDraw(lightBokehRawCtx);
  lightBokehRawCtx.clearRect(0, 0, w, h);
  lightBokehRawCtx.globalCompositeOperation = 'lighter';
  forEachLightBlob((b, isCursor) => {
    let scale = 1.38;
    if (isCursor) scale = 2.55;
    else if (b.hoverTextLight) scale = 2.08;
    else if (b.heroLight) scale = 1.54;
    else if ((b.mergeFactor ?? 0) > 0.35) scale = 1.48 + (b.mergeFactor ?? 0) * 0.18;
    drawLightBlob(lightBokehRawCtx, b, scale);
  });
  drawClusterGlows(lightBokehRawCtx);
  drawRollFocusLights(lightBokehRawCtx, 0.55);
  lightBokehRawCtx.globalCompositeOperation = 'source-over';
  endBufferDraw(lightBokehRawCtx);
  const bokehBright = isMobile ? 1.04 : 1.1 + (1 - renderScale) * 0.28;
  blurPass(lightBokehRawCanvas, lightBokehCtx, lightBokehCanvas, isMobile ? BLUR_LIGHT * 1.18 : BLUR_LIGHT, `brightness(${bokehBright})`);
}

function shouldUpdateLightMap(time, recentlyMoved) {
  if (width < MOBILE_BREAKPOINT) return true;
  if (recentlyMoved) return true;
  if (hasRollItems) return time - lastLightMapUpdateAt >= DESKTOP_LIGHT_FRAME_MS;
  if (pointerOnScreen) return time - lastLightMapUpdateAt >= DESKTOP_LIGHT_FRAME_MS;
  if (sceneIdle) return time - lastLightMapUpdateAt >= DESKTOP_IDLE_LIGHT_FRAME_MS * 1.35;
  return time - lastLightMapUpdateAt >= DESKTOP_IDLE_LIGHT_FRAME_MS;
}

function drawLightMap(time = lastRenderAt, recentlyMoved = false) {
  if (!shouldUpdateLightMap(time, recentlyMoved)) return;
  lastLightMapUpdateAt = time;

  const isMobile = width < MOBILE_BREAKPOINT;
  const w = canvas.width;
  const h = canvas.height;
  beginBufferDraw(lightRawCtx);
  lightRawCtx.clearRect(0, 0, w, h);

  lightRawCtx.globalCompositeOperation = 'lighter';
  forEachLightBlob((b, isCursor) => {
    let scale = 1.42;
    if (isCursor) scale = 2.65;
    else if (b.hoverTextLight) scale = 2.18;
    else if (b.heroLight) scale = 1.58;
    else if ((b.mergeFactor ?? 0) > 0.35) scale = 1.5 + (b.mergeFactor ?? 0) * 0.16;
    drawLightBlob(lightRawCtx, b, scale);
  });
  drawClusterGlows(lightRawCtx);
  drawRollFocusLights(lightRawCtx, 0.9);
  drawRollFocusShadows(lightRawCtx, 'mask');
  lightRawCtx.globalCompositeOperation = 'source-over';
  endBufferDraw(lightRawCtx);

  const maskFilter = isMobile
    ? `brightness(${0.98 + (1 - renderScale) * 0.06}) contrast(1.55)`
    : `brightness(${1.14 + (1 - renderScale) * 0.12}) contrast(3.8)`;
  blurPass(lightRawCanvas, lightCtx, lightCanvas, isMobile ? BLUR_MASK * 1.55 : BLUR_MASK, maskFilter);
}

function drawMobileAmbientLightBlend() {
  wallCtx.save();
  wallCtx.globalCompositeOperation = 'screen';

  for (const b of cachedLightBlobs) {
    if (!b.heroLight) continue;

    const radius = (b.renderRadius ?? b.radius) * dpr;
    const grad = wallCtx.createRadialGradient(
      b.renderX, b.renderY, radius * 0.12,
      b.renderX, b.renderY, radius * 3.2
    );
    grad.addColorStop(0, 'rgba(255,255,255,0.16)');
    grad.addColorStop(0.28, 'rgba(255,252,246,0.11)');
    grad.addColorStop(0.58, 'rgba(255,248,236,0.055)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    wallCtx.fillStyle = grad;
    wallCtx.beginPath();
    wallCtx.arc(b.renderX, b.renderY, radius * 3.2, 0, Math.PI * 2);
    wallCtx.fill();
  }

  wallCtx.restore();
}

function drawPaperTexture(targetCtx, w, h, alpha = 1) {
  targetCtx.fillStyle = WALL;
  targetCtx.fillRect(0, 0, w, h);
  if (!paperTextureReady || !paperTexture.naturalWidth || !paperTexture.naturalHeight) return;

  const imgRatio = paperTexture.naturalWidth / paperTexture.naturalHeight;
  const targetRatio = w / h;
  let sx = 0;
  let sy = 0;
  let sw = paperTexture.naturalWidth;
  let sh = paperTexture.naturalHeight;

  if (imgRatio > targetRatio) {
    sw = paperTexture.naturalHeight * targetRatio;
    sx = (paperTexture.naturalWidth - sw) * 0.5;
  } else {
    sh = paperTexture.naturalWidth / targetRatio;
    sy = (paperTexture.naturalHeight - sh) * 0.5;
  }

  targetCtx.save();
  targetCtx.globalAlpha = alpha;
  targetCtx.filter = 'brightness(1.1)';
  targetCtx.drawImage(paperTexture, sx, sy, sw, sh, 0, 0, w, h);
  targetCtx.filter = 'none';
  targetCtx.restore();
}

function rebuildWallBase() {
  if (!wallBaseCtx) return;
  drawPaperTexture(wallBaseCtx, canvas.width, canvas.height);
  if (grainPattern) {
    wallBaseCtx.fillStyle = grainPattern;
    wallBaseCtx.globalAlpha = paperTextureReady ? 0.1 : 0.55;
    wallBaseCtx.fillRect(0, 0, canvas.width, canvas.height);
    wallBaseCtx.globalAlpha = 1;
  }
}

function ensureWallBase() {
  if (
    wallBaseCanvas &&
    wallBaseCanvas.width === canvas.width &&
    wallBaseCanvas.height === canvas.height
  ) {
    return;
  }

  const off = createOffscreen(canvas.width, canvas.height);
  wallBaseCanvas = off.canvas;
  wallBaseCtx = off.ctx;
  rebuildWallBase();
}

function drawWall() {
  const isMobile = width < MOBILE_BREAKPOINT;
  ensureWallBase();
  wallCtx.clearRect(0, 0, canvas.width, canvas.height);
  wallCtx.drawImage(wallBaseCanvas, 0, 0);

  wallCtx.globalCompositeOperation = 'multiply';
  wallCtx.globalAlpha = isMobile ? SHADOW_WALL_MULTIPLY_MOBILE : SHADOW_WALL_MULTIPLY;
  wallCtx.drawImage(shadowCanvas, 0, 0, canvas.width, canvas.height);
  wallCtx.globalAlpha = 1;

  if (isMobile) drawMobileAmbientLightBlend();

  wallCtx.globalCompositeOperation = 'screen';
  wallCtx.globalAlpha = isMobile ? 0.88 : Math.min(0.94 * lightBrightBoost, 1);
  wallCtx.drawImage(lightBokehCanvas, 0, 0, canvas.width, canvas.height);
  wallCtx.globalAlpha = 1;

  drawRollFocusShadows(wallCtx, 'wall');

  if (perfTier < 3) {
    wallCtx.globalCompositeOperation = 'lighter';
    wallCtx.globalAlpha = isMobile ? 0.12 : Math.min(0.12 + (1 - renderScale) * 0.16, 0.26);
    wallCtx.drawImage(lightBokehCanvas, 0, 0, canvas.width, canvas.height);
    wallCtx.globalAlpha = 1;
  }

  wallCtx.globalCompositeOperation = 'source-over';

  if (!sceneIdle || perfTier < 2) drawEdgeWallGlow();
}

function shouldRedrawWall() {
  if (hasRollItems) return true;
  if (lastShadowLayerAt === lastRenderAt) return true;
  if (lastBokehUpdateAt === lastRenderAt) return true;
  if (!sceneIdle) return true;
  return false;
}

function drawWallIfNeeded() {
  if (!shouldRedrawWall()) return;
  drawWall();
}

function getTextHoverTargetRect(el) {
  if (!el) return null;
  const target = el.classList.contains('roll-item')
    ? el
    : el.querySelector('.project__title') || el.querySelector('.project__link') || el;
  const rect = target.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  return rect;
}

function updateHoveredTextFromPointer(clientX, clientY) {
  if (!pointerOnScreen) {
    hoveredTextEl = null;
    hoveredTextLightRect = null;
    return;
  }

  let hit = null;
  let hitPriority = -Infinity;
  const padX = 4;
  const padY = 3;

  if (hasRollItems) {
    const viewportOpen = cachedRollViewport
      ? parseFloat(cachedRollViewport.dataset.open || '0')
      : 0;
    if (viewportOpen <= 0.01) {
      hoveredTextEl = null;
      hoveredTextLightRect = null;
      return;
    }

    for (const el of cachedRollItemEls) {
      const opacity = parseFloat(el.style.opacity || '0');
      if (opacity < 0.12) continue;

      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;

      if (
        clientX >= rect.left - padX
        && clientX <= rect.right + padX
        && clientY >= rect.top - padY
        && clientY <= rect.bottom + padY
      ) {
        const priority = parseInt(el.style.zIndex || '0', 10) + opacity * 100;
        if (priority > hitPriority) {
          hitPriority = priority;
          hit = el;
        }
      }
    }
  } else {
    for (const el of cachedScatterItems) {
      const title = el.querySelector('.project__title');
      const target = title || el.querySelector('.project__link') || el;
      const rect = target.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) continue;

      if (
        clientX >= rect.left - padX
        && clientX <= rect.right + padX
        && clientY >= rect.top - padY
        && clientY <= rect.bottom + padY
      ) {
        hit = el;
        break;
      }
    }
  }

  hoveredTextEl = hit;
  hoveredTextLightRect = getTextHoverTargetRect(hit);
}

function getTextHoverScale(sourceEl) {
  if (!sourceEl) return 1;
  return textHoverScale.get(sourceEl) ?? 1;
}

function updateTextHoverScales() {
  const seen = new Set();

  for (const item of textItems) {
    if (!item.sourceEl || seen.has(item.sourceEl)) continue;
    seen.add(item.sourceEl);

    const target = item.sourceEl === hoveredTextEl ? HOVER_SCALE_TARGET : 1;
    const current = textHoverScale.get(item.sourceEl) ?? 1;
    textHoverScale.set(item.sourceEl, current + (target - current) * HOVER_SCALE_LERP);
  }
}

function drawMaskedText() {
  textCtx.clearRect(0, 0, canvas.width, canvas.height);
  updateTextHoverScales();

  for (const item of textItems) {
    const hoverScale = getTextHoverScale(item.sourceEl);
    const fontSize = Math.round(item.fontSize);
    textCtx.font = `400 ${fontSize}px ${item.fontFamily || UI_FONT}`;
    textCtx.fillStyle = hoverScale > 1.01 ? TEXT_HOVER : TEXT;
    textCtx.textBaseline = 'top';

    if (item.align === 'center') {
      textCtx.save();
      textCtx.globalAlpha = Number.isFinite(item.opacity) ? item.opacity : 1;
      textCtx.textAlign = 'center';
      textCtx.translate(item.titleX, item.titleY - (item.fontSize * (item.scaleY ?? 1)) * 0.5);
      textCtx.scale((item.scaleX ?? 1) * hoverScale, (item.scaleY ?? 1) * hoverScale);
      textCtx.fillText(item.title, 0, 0);
      textCtx.restore();
    } else {
      textCtx.save();
      textCtx.textAlign = 'left';
      const textWidth = item.titleWidth ?? textCtx.measureText(item.title).width;
      const cx = item.titleX + textWidth * 0.5;
      const cy = item.titleY + item.fontSize * 0.5;
      textCtx.translate(cx, cy);
      textCtx.scale(hoverScale, hoverScale);
      textCtx.fillText(item.title, -textWidth * 0.5, -item.fontSize * 0.5);
      textCtx.restore();
    }

    if (!item.meta) continue;
    textCtx.font = `400 ${Math.round(item.metaSize)}px ${UI_FONT}`;
    textCtx.fillStyle = TEXT_META;
    textCtx.textAlign = 'left';
    textCtx.fillText(item.meta, item.metaX, item.metaY);
  }

  drawMaskedRollLines();

  textCtx.globalCompositeOperation = 'destination-in';
  textCtx.drawImage(lightCanvas, 0, 0);
  textCtx.drawImage(lightCanvas, 0, 0);
  textCtx.globalCompositeOperation = 'source-over';
  lastTextCanvasDrawAt = lastRenderAt;
}

function shouldRedrawTextCanvas(recentlyMoved, dynamicTextChanged) {
  if (dynamicTextChanged) return true;
  if (recentlyMoved || pointerOnScreen) return true;
  if (hoverTextLight.active || hoverTextLight.opacity > 0.03) return true;
  if (hasRollItems) return true;
  if (lastLightMapUpdateAt > lastTextCanvasDrawAt) return true;
  if (lastShadowLayerAt > lastTextCanvasDrawAt) return true;

  for (const item of textItems) {
    if (Math.abs(getTextHoverScale(item.sourceEl) - 1) > 0.008) return true;
  }

  return lastTextCanvasDrawAt < 0;
}

function drawMaskedTextIfNeeded(recentlyMoved, dynamicTextChanged) {
  if (!shouldRedrawTextCanvas(recentlyMoved, dynamicTextChanged)) return;
  drawMaskedText();
}

function getRemPx() {
  return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}

function drawLineRect(rect, alpha = 1, canvasRect = getCanvasRect()) {
  if (alpha <= 0 || rect.width <= 0 || rect.height <= 0) return;
  textCtx.globalAlpha = alpha;
  textCtx.fillRect(
    (rect.left - canvasRect.left) * dpr,
    (rect.top - canvasRect.top) * dpr,
    rect.width * dpr,
    Math.max(rect.height * dpr, dpr)
  );
}

function drawMaskedRollLines() {
  if (!cachedRollLineGroups.length) return;

  textCtx.save();
  textCtx.fillStyle = TEXT;
  const canvasRect = getCanvasRect();

  for (const group of cachedRollLineGroups) {
    const isOpen = group.roll.classList.contains('is-open');

    for (const lineData of group.lines) {
      const lineOpacity = parseFloat(getComputedStyle(lineData.line).opacity || '1');

      lineData.spans.forEach((span, index) => {
        const spanOpacity = parseFloat(getComputedStyle(span).opacity || '1');
        drawLineRect(span.getBoundingClientRect(), lineOpacity * spanOpacity, canvasRect);

        if (!isOpen || index !== 1) return;

        const rect = span.getBoundingClientRect();
        const rem = getRemPx();
        const sideWidth = Math.min(2.8 * rem, Math.max(1.9 * rem, window.innerWidth * 0.028));
        const sideGap = 0;
        const yOffset = lineData.isBottom ? -8 : 5;
        const sideHeight = Math.max(rect.height, 1);

        drawLineRect({
          left: rect.left - sideGap - sideWidth,
          top: rect.top + yOffset,
          width: sideWidth,
          height: sideHeight,
        }, lineOpacity, canvasRect);
        drawLineRect({
          left: rect.right + sideGap,
          top: rect.top + yOffset,
          width: sideWidth,
          height: sideHeight,
        }, lineOpacity, canvasRect);
      });
    }
  }

  textCtx.globalAlpha = 1;
  textCtx.restore();
}

function getMobileLightSources() {
  const heroes = cachedLightBlobs.filter((b) => b.heroLight);
  return heroes.length ? heroes : cachedLightBlobs.slice(0, 3);
}

function drawMobileSoftLight(targetCtx, b, scale = 1, alphaScale = 1) {
  const radius = (b.renderRadius ?? b.radius) * dpr * scale;
  const tilt = MOBILE_SUN_ANGLE + (b.tiltVariation ?? 0);
  const ex = (b.ellipseX ?? 1) * (b.renderRx ?? 1);
  const ey = (b.ellipseY ?? 1) * (b.renderRy ?? 1);
  const round = b.ellipseRound ?? 0.65;
  const strength = Math.min((b.strength ?? 0.7) * alphaScale, 1);

  targetCtx.save();
  targetCtx.translate(b.renderX, b.renderY);
  targetCtx.rotate(tilt);
  targetCtx.transform(1, 0, MOBILE_PERSP_SKEW, 0.9, 0, radius * 0.04);
  targetCtx.scale(ex, ey);

  const grad = targetCtx.createRadialGradient(
    -radius * 0.18, -radius * 0.12, radius * 0.04,
    0, 0, radius
  );
  grad.addColorStop(0, `rgba(255,255,255,${0.58 * strength})`);
  grad.addColorStop(0.22, `rgba(255,253,248,${0.38 * strength})`);
  grad.addColorStop(0.48, `rgba(255,249,238,${0.2 * strength})`);
  grad.addColorStop(0.74, `rgba(255,246,232,${0.075 * strength})`);
  grad.addColorStop(1, 'rgba(255,255,255,0)');

  targetCtx.fillStyle = grad;
  targetCtx.beginPath();
  targetCtx.ellipse(0, 0, radius, radius * round, 0, 0, Math.PI * 2);
  targetCtx.fill();
  targetCtx.restore();
}

function drawMobileUpperHighlight(targetCtx, b) {
  const radius = (b.renderRadius ?? b.radius) * dpr * 1.55;
  const tilt = MOBILE_SUN_ANGLE + (b.tiltVariation ?? 0);
  const ex = (b.ellipseX ?? 1) * (b.renderRx ?? 1);
  const ey = (b.ellipseY ?? 1) * (b.renderRy ?? 1);
  const round = b.ellipseRound ?? 0.65;

  targetCtx.save();
  targetCtx.translate(b.renderX, b.renderY);
  targetCtx.rotate(tilt);
  targetCtx.transform(1, 0, MOBILE_PERSP_SKEW, 0.9, 0, radius * 0.04);
  targetCtx.scale(ex, ey);

  const grad = targetCtx.createRadialGradient(
    -radius * 0.16, -radius * 0.46, radius * 0.02,
    -radius * 0.04, -radius * 0.32, radius * 0.86
  );
  grad.addColorStop(0, 'rgba(255,255,255,0.72)');
  grad.addColorStop(0.2, 'rgba(255,253,248,0.42)');
  grad.addColorStop(0.52, 'rgba(255,249,238,0.16)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');

  targetCtx.fillStyle = grad;
  targetCtx.beginPath();
  targetCtx.ellipse(0, -radius * 0.34, radius * 0.9, radius * round * 0.72, 0, 0, Math.PI * 2);
  targetCtx.fill();
  targetCtx.restore();
}

function drawMobileBackdrop(time) {
  const w = canvas.width;
  const h = canvas.height;
  const lights = getMobileLightSources();

  drawPaperTexture(wallCtx, w, h);

  if (grainPattern) {
    wallCtx.fillStyle = grainPattern;
    wallCtx.globalAlpha = paperTextureReady ? 0.08 : 0.32;
    wallCtx.fillRect(0, 0, w, h);
    wallCtx.globalAlpha = 1;
  }

  const ambient = wallCtx.createLinearGradient(w * 0.98, -h * 0.08, -w * 0.12, h * 1.05);
  ambient.addColorStop(0, 'rgba(255,255,255,0.34)');
  ambient.addColorStop(0.35, 'rgba(238,235,226,0.08)');
  ambient.addColorStop(0.72, 'rgba(176,174,168,0.06)');
  ambient.addColorStop(1, 'rgba(255,255,255,0.18)');
  wallCtx.fillStyle = ambient;
  wallCtx.fillRect(0, 0, w, h);

  wallCtx.save();
  wallCtx.globalCompositeOperation = 'multiply';
  wallCtx.globalAlpha = 0.12;
  const t = time * 0.00025;
  for (let i = 0; i < 3; i++) {
    const offset = (i - 1) * w * 0.28 + Math.sin(t + i) * w * 0.04;
    const band = wallCtx.createLinearGradient(w * 0.95 + offset, -h * 0.15, -w * 0.15 + offset, h * 1.05);
    band.addColorStop(0, 'rgba(190,188,182,0)');
    band.addColorStop(0.42, 'rgba(160,158,150,0.16)');
    band.addColorStop(0.58, 'rgba(160,158,150,0.08)');
    band.addColorStop(1, 'rgba(190,188,182,0)');
    wallCtx.fillStyle = band;
    wallCtx.fillRect(0, 0, w, h);
  }
  wallCtx.restore();

  wallCtx.save();
  wallCtx.globalCompositeOperation = 'screen';
  for (let i = 0; i < lights.length; i++) {
    const light = lights[i];
    const sizeShift = 0.9 + (i % 3) * 0.22;
    drawMobileSoftLight(wallCtx, light, 2.18 * sizeShift, 0.5);
    drawMobileSoftLight(wallCtx, light, 1.18 * sizeShift, 0.72);
    if (i === 0) drawMobileUpperHighlight(wallCtx, light);
  }
  if (hoverTextLight.opacity > 0.025) drawMobileSoftLight(wallCtx, getHoverTextLightBlob(), 1.8, 0.84);
  if (pointerOnScreen) drawMobileSoftLight(wallCtx, getCursorLightBlob(), 1.65, 0.72);
  wallCtx.restore();
}

function drawMobileLightMap() {
  lightCtx.clearRect(0, 0, canvas.width, canvas.height);
  lightCtx.globalCompositeOperation = 'lighter';

  const lights = getMobileLightSources();
  for (let i = 0; i < lights.length; i++) {
    const light = lights[i];
    const sizeShift = 0.9 + (i % 3) * 0.22;
    drawMobileSoftLight(lightCtx, light, 1.95 * sizeShift, 0.78);
    drawMobileSoftLight(lightCtx, light, 1.02 * sizeShift, 0.6);
    if (i === 0) drawMobileUpperHighlight(lightCtx, light);
  }
  if (hoverTextLight.opacity > 0.025) drawMobileSoftLight(lightCtx, getHoverTextLightBlob(), 1.72, 0.92);
  if (pointerOnScreen) drawMobileSoftLight(lightCtx, getCursorLightBlob(), 1.55, 0.75);

  lightCtx.globalCompositeOperation = 'source-over';
}

function renderMobileScene(time, recentlyMoved, dynamicTextChanged) {
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  updateWind(time);
  updateHoveredTextFromPointer(pointerClientX, pointerClientY);
  updateHoverTextLight(time);
  updateCursorLight(time);
  updateBlobs(time);
  drawMobileBackdrop(time);
  drawMobileLightMap();
  drawMaskedTextIfNeeded(recentlyMoved, dynamicTextChanged);

  ctx.drawImage(wallCanvas, 0, 0);
  ctx.drawImage(textCanvas, 0, 0);
  drawFrostOverlay();
}

function render(time) {
  if (!pageVisible) {
    requestAnimationFrame(render);
    return;
  }

  const targetFrameMs = width < MOBILE_BREAKPOINT ? MOBILE_TARGET_FRAME_MS : 0;
  if (targetFrameMs && time - lastRenderAt < targetFrameMs) {
    requestAnimationFrame(render);
    return;
  }

  lastRenderAt = time;
  renderFrame += 1;
  cachedOpenRollFrame = -1;
  cachedCanvasRectFrame = -1;
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  const recentlyMoved = time - lastPointerMove < 120;
  sceneIdle = !recentlyMoved && !pointerOnScreen && !hasRollItems && !hoverTextLight.active;

  smoothMouse.x += (mouse.targetX - smoothMouse.x) * (pointerOnScreen ? (recentlyMoved ? 0.45 : 0.18) : 0.05);
  smoothMouse.y += (mouse.targetY - smoothMouse.y) * (pointerOnScreen ? (recentlyMoved ? 0.45 : 0.18) : 0.05);
  const dynamicTextChanged = updateScatterMotion(time) || hasRollItems;
  if (dynamicTextChanged && time - lastDynamicTextMeasureAt > DESKTOP_TEXT_MEASURE_MS) {
    measureTextItems();
    lastDynamicTextMeasureAt = time;
  }
  updateHoveredTextFromPointer(pointerClientX, pointerClientY);
  updateHoverTextLight(time);

  if (width < MOBILE_BREAKPOINT) {
    renderMobileScene(time, recentlyMoved, dynamicTextChanged);
    requestAnimationFrame(render);
    return;
  }

  updateWind(time);
  updateCursorLight(time);
  updateBlobs(time);
  drawShadowLayer();
  drawLightBokehLayer(time);
  drawLightMap(time, recentlyMoved);
  drawWallIfNeeded();
  drawMaskedTextIfNeeded(recentlyMoved, dynamicTextChanged);

  ctx.drawImage(wallCanvas, 0, 0);
  ctx.drawImage(textCanvas, 0, 0);
  if (!sceneIdle || perfTier < 2) drawTyndallEffect(time);
  drawFrostOverlay();

  requestAnimationFrame(render);
}

function onPointerMove(e) {
  const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
  const y = 'touches' in e ? e.touches[0].clientY : e.clientY;
  mouse.targetX = x / width;
  mouse.targetY = y / height;
  pointerClientX = x;
  pointerClientY = y;
  pointerOnScreen = true;
  lastPointerMove = performance.now();
}

function onPointerEnter() {
  pointerOnScreen = true;
}

function onPointerLeave() {
  pointerOnScreen = false;
  hoveredTextEl = null;
  hoveredTextLightRect = null;
  mouse.targetX = 0.5;
  mouse.targetY = 0.5;
}

resize();
requestAnimationFrame(render);

window.addEventListener('resize', () => {
  window.clearTimeout(resize._t);
  resize._t = window.setTimeout(() => {
    resize();
    layoutScatterItems();
    measureTextItems();
  }, 120);
});

window.addEventListener('scroll', measureTextItems, { passive: true });
document.documentElement.addEventListener('pointerenter', onPointerEnter);
document.documentElement.addEventListener('pointermove', onPointerMove, { passive: true });
document.documentElement.addEventListener('pointerleave', onPointerLeave);
document.documentElement.addEventListener('touchstart', onPointerMove, { passive: true });
document.documentElement.addEventListener('touchmove', onPointerMove, { passive: true });
document.documentElement.addEventListener('touchend', onPointerLeave, { passive: true });

document.addEventListener('visibilitychange', () => {
  pageVisible = document.visibilityState !== 'hidden';
  if (pageVisible) {
    lastTextCanvasDrawAt = -1;
    wallBaseCanvas = null;
  }
});

document.fonts.ready.then(measureTextItems);
