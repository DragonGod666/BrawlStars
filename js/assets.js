// ============================================================
// assets.js — 內嵌 SVG 美術資源
// 以字串定義 SVG → 轉成 Image → 用 canvas 2D context 繪製
// (可旋轉/翻轉/縮放，且不需外部檔案、無 CORS 問題)
// ============================================================

function svgDoc(w, h, inner) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">` +
    inner +
    `</svg>`
  );
}

// ---- 角色 ----
const SVG_SHELLY = svgDoc(
  100,
  118,
  `
  <g stroke="#2a1a3a" stroke-width="3" stroke-linejoin="round">
    <rect x="38" y="86" width="10" height="20" rx="5" fill="#3b2a52"/>
    <rect x="52" y="86" width="10" height="20" rx="5" fill="#3b2a52"/>
    <rect x="34" y="100" width="17" height="10" rx="4" fill="#241634"/>
    <rect x="49" y="100" width="17" height="10" rx="4" fill="#241634"/>
    <path d="M30 60 Q50 51 70 60 L66 91 Q50 97 34 91 Z" fill="#8B5CF6"/>
    <path d="M44 56 L56 56 L54 93 L46 93 Z" fill="#a78bdf"/>
    <rect x="22" y="62" width="17" height="11" rx="5" fill="#7c4ddb"/>
    <rect x="61" y="62" width="17" height="11" rx="5" fill="#7c4ddb"/>
    <rect x="16" y="66" width="52" height="8" rx="3" fill="#5b6470"/>
    <rect x="58" y="63" width="17" height="13" rx="3" fill="#7a4a2b"/>
    <circle cx="50" cy="38" r="22" fill="#f2c79b"/>
    <path d="M27 39 Q24 11 50 11 Q76 11 73 39 Q66 25 50 25 Q34 25 27 39 Z" fill="#7c3aed"/>
    <path d="M27 38 Q23 52 31 58 L35 44 Z" fill="#7c3aed"/>
    <path d="M73 38 Q77 52 69 58 L65 44 Z" fill="#7c3aed"/>
  </g>
  <circle cx="42" cy="40" r="3.3" fill="#2a1a3a"/>
  <circle cx="58" cy="40" r="3.3" fill="#2a1a3a"/>
  <path d="M44 48 Q50 53 56 48" stroke="#2a1a3a" stroke-width="2.5" fill="none" stroke-linecap="round"/>
`
);

const SVG_SPIKE = svgDoc(
  100,
  112,
  `
  <g stroke="#0f5132" stroke-width="3" stroke-linejoin="round">
    <rect x="13" y="64" width="17" height="10" rx="5" fill="#1f9d55"/>
    <rect x="70" y="64" width="17" height="10" rx="5" fill="#1f9d55"/>
    <path d="M34 92 Q29 49 50 45 Q71 49 66 92 Q50 99 34 92 Z" fill="#22C55E"/>
    <path d="M50 50 L50 90" stroke="#16a34a" stroke-width="3" fill="none"/>
    <path d="M42 54 L40 88" stroke="#16a34a" stroke-width="2" fill="none"/>
    <path d="M58 54 L60 88" stroke="#16a34a" stroke-width="2" fill="none"/>
    <rect x="38" y="92" width="10" height="13" rx="5" fill="#15803d"/>
    <rect x="52" y="92" width="10" height="13" rx="5" fill="#15803d"/>
  </g>
  <g fill="#d9f99d" stroke="#0f5132" stroke-width="1.4">
    <polygon points="50,40 45,50 55,50"/>
    <polygon points="31,60 23,56 30,67"/>
    <polygon points="69,60 77,56 70,67"/>
    <polygon points="34,80 25,82 33,89"/>
    <polygon points="66,80 75,82 67,89"/>
  </g>
  <g stroke="#9a3412" stroke-width="0.8">
    <circle cx="50" cy="33" r="4.2" fill="#f59e0b"/>
    <circle cx="50" cy="26" r="3.6" fill="#fb7185"/>
    <circle cx="43" cy="31" r="3.6" fill="#fb7185"/>
    <circle cx="57" cy="31" r="3.6" fill="#fb7185"/>
    <circle cx="45" cy="37" r="3.6" fill="#fb7185"/>
    <circle cx="55" cy="37" r="3.6" fill="#fb7185"/>
  </g>
  <circle cx="43" cy="64" r="3.5" fill="#0f5132"/>
  <circle cx="57" cy="64" r="3.5" fill="#0f5132"/>
  <path d="M44 72 Q50 77 56 72" stroke="#0f5132" stroke-width="2.5" fill="none" stroke-linecap="round"/>
`
);

const SVG_COLT = svgDoc(
  100,
  118,
  `
  <g stroke="#3a0d0d" stroke-width="3" stroke-linejoin="round">
    <rect x="38" y="86" width="10" height="20" rx="5" fill="#3b2326"/>
    <rect x="52" y="86" width="10" height="20" rx="5" fill="#3b2326"/>
    <rect x="34" y="100" width="17" height="10" rx="4" fill="#241317"/>
    <rect x="49" y="100" width="17" height="10" rx="4" fill="#241317"/>
    <path d="M32 60 Q50 52 68 60 L64 91 Q50 96 36 91 Z" fill="#EF4444"/>
    <path d="M46 56 L54 56 L53 93 L47 93 Z" fill="#fef2f2"/>
    <rect x="34" y="84" width="32" height="7" rx="2" fill="#7a4a2b"/>
    <rect x="47" y="84" width="6" height="7" fill="#fbbf24"/>
    <rect x="22" y="64" width="16" height="10" rx="5" fill="#dc2626"/>
    <rect x="62" y="64" width="16" height="10" rx="5" fill="#dc2626"/>
    <rect x="11" y="66" width="15" height="7" rx="2" fill="#5b6470"/>
    <rect x="74" y="66" width="15" height="7" rx="2" fill="#5b6470"/>
    <circle cx="50" cy="38" r="21" fill="#f2c79b"/>
  </g>
  <g stroke="#3a0d0d" stroke-width="3" stroke-linejoin="round">
    <ellipse cx="50" cy="24" rx="28" ry="7" fill="#b91c1c"/>
    <path d="M37 24 Q39 8 50 8 Q61 8 63 24 Z" fill="#dc2626"/>
    <rect x="37" y="20" width="26" height="4" fill="#7a1212"/>
  </g>
  <circle cx="43" cy="40" r="3.2" fill="#3a0d0d"/>
  <circle cx="57" cy="40" r="3.2" fill="#3a0d0d"/>
  <path d="M44 47 Q50 51 56 47" stroke="#3a0d0d" stroke-width="2.5" fill="none" stroke-linecap="round"/>
`
);

// ---- 足球 ----
const SVG_BALL = svgDoc(
  60,
  60,
  `
  <circle cx="30" cy="30" r="27" fill="#f8fafc" stroke="#1f2937" stroke-width="3"/>
  <g fill="#1f2937">
    <polygon points="30,17 38,23 35,33 25,33 22,23"/>
    <polygon points="30,17 22,23 13,19 20,11 30,10"/>
    <polygon points="30,17 38,23 47,19 40,11 30,10"/>
    <polygon points="25,33 21,43 13,39 14,29"/>
    <polygon points="35,33 39,43 47,39 46,29"/>
    <polygon points="25,33 35,33 38,44 30,49 22,44"/>
  </g>
`
);

// ---- 草叢(可平鋪) ----
const SVG_BUSH = svgDoc(
  90,
  80,
  `
  <g stroke="#0f5132" stroke-width="2">
    <circle cx="24" cy="48" r="20" fill="#1f7a3d"/>
    <circle cx="46" cy="34" r="22" fill="#239b48"/>
    <circle cx="66" cy="48" r="20" fill="#1f7a3d"/>
    <circle cx="36" cy="56" r="17" fill="#1c6f38"/>
    <circle cx="56" cy="56" r="17" fill="#1c6f38"/>
  </g>
  <g fill="#3ad065" opacity="0.55">
    <circle cx="40" cy="30" r="5"/>
    <circle cx="60" cy="44" r="4.5"/>
    <circle cx="26" cy="44" r="4"/>
  </g>
`
);

// ---- 球門(開口在下方，底側貼齊球門線) ----
function buildGoalSVG() {
  let net = "";
  for (let gx = 18; gx <= 182; gx += 14) net += `<line x1="${gx}" y1="12" x2="${gx}" y2="72"/>`;
  for (let gy = 16; gy <= 70; gy += 12) net += `<line x1="10" y1="${gy}" x2="190" y2="${gy}"/>`;
  return svgDoc(
    200,
    80,
    `
    <rect x="10" y="10" width="180" height="62" rx="6" fill="rgba(255,255,255,0.10)"/>
    <g stroke="rgba(255,255,255,0.55)" stroke-width="1.4">${net}</g>
    <g stroke="#f1f5f9" stroke-width="6" stroke-linecap="round">
      <line x1="10" y1="74" x2="10" y2="10"/>
      <line x1="190" y1="74" x2="190" y2="10"/>
      <line x1="10" y1="11" x2="190" y2="11"/>
    </g>
  `
  );
}

// ---- 子彈(以顏色參數化，普攻/大招共用) ----
function pelletSVG(core, glow) {
  return svgDoc(
    26,
    16,
    `<ellipse cx="13" cy="8" rx="12" ry="7" fill="${glow}" opacity="0.45"/>
     <ellipse cx="13" cy="8" rx="7.5" ry="4.5" fill="${core}"/>
     <ellipse cx="16" cy="8" rx="3" ry="2.4" fill="#ffffff"/>`
  );
}
function cactusBulletSVG(body, spike) {
  return svgDoc(
    42,
    42,
    `<g fill="${spike}" stroke="#0f5132" stroke-width="1.2">
       <polygon points="21,2 16,12 26,12"/>
       <polygon points="40,21 30,16 30,26"/>
       <polygon points="2,21 12,16 12,26"/>
       <polygon points="21,40 16,30 26,30"/>
     </g>
     <circle cx="21" cy="21" r="13" fill="${body}" stroke="#0f5132" stroke-width="2"/>`
  );
}
function seedSVG(core, glow) {
  return svgDoc(
    16,
    16,
    `<circle cx="8" cy="8" r="7" fill="${glow}" opacity="0.45"/>
     <circle cx="8" cy="8" r="4.5" fill="${core}"/>`
  );
}
function boltSVG(core, glow) {
  return svgDoc(
    24,
    11,
    `<rect x="2" y="2" width="20" height="7" rx="3.5" fill="${glow}" opacity="0.45"/>
     <rect x="4" y="3.5" width="13" height="4" rx="2" fill="${core}"/>
     <circle cx="19" cy="5.5" r="3" fill="#ffffff"/>`
  );
}

const Assets = {
  images: {},
  defs: {
    char_shelly: SVG_SHELLY,
    char_spike: SVG_SPIKE,
    char_colt: SVG_COLT,
    ball: SVG_BALL,
    bush: SVG_BUSH,
    goal: buildGoalSVG(),
    pellet: pelletSVG("#c4b5fd", "#8B5CF6"),
    pellet_super: pelletSVG("#ff8de0", "#FF3DCB"),
    cactus: cactusBulletSVG("#22C55E", "#86EFAC"),
    cactus_super: cactusBulletSVG("#15803d", "#FDE047"),
    seed: seedSVG("#86EFAC", "#22C55E"),
    seed_super: seedSVG("#FDE047", "#a3e635"),
    bolt: boltSVG("#fca5a5", "#EF4444"),
    bolt_super: boltSVG("#fde047", "#f59e0b"),
  },

  init() {
    for (const name in this.defs) {
      const img = new Image();
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(this.defs[name]);
      this.images[name] = img;
    }
  },

  ready(name) {
    const img = this.images[name];
    return img && img.complete && img.naturalWidth > 0;
  },

  // 以畫布座標(中心)繪製資源，回傳是否成功(未載入完成回 false → 由呼叫端畫備援)
  draw(name, cx, cy, w, h, angle = 0, flipX = false, flipY = false, alpha = 1) {
    if (!this.ready(name)) return false;
    const ctx = drawingContext;
    ctx.save();
    if (alpha !== 1) ctx.globalAlpha = alpha;
    ctx.translate(cx, cy);
    if (angle) ctx.rotate(angle);
    if (flipX || flipY) ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);
    ctx.drawImage(this.images[name], -w / 2, -h / 2, w, h);
    ctx.restore();
    return true;
  },
};
