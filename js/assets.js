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
  <g stroke="#241a14" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
    <!-- 馬尾(頭後) -->
    <path d="M40 28 Q18 34 22 66 Q30 56 41 52 Z" fill="#7c4a2d"/>
    <!-- 腿(丹寧短褲下) -->
    <rect x="40" y="86" width="9" height="20" rx="4" fill="#3f5170"/>
    <rect x="51" y="86" width="9" height="20" rx="4" fill="#3f5170"/>
    <!-- 鞋 -->
    <rect x="35" y="100" width="16" height="10" rx="4" fill="#4b2f1c"/>
    <rect x="49" y="100" width="16" height="10" rx="4" fill="#4b2f1c"/>
    <!-- 身體:橄欖綠背心 + 內衫 -->
    <path d="M33 58 Q50 50 67 58 L62 90 Q50 96 38 90 Z" fill="#6f8f4d"/>
    <path d="M44 54 L56 54 L55 92 L45 92 Z" fill="#e8e2cf"/>
    <!-- 後手臂 -->
    <rect x="24" y="60" width="15" height="10" rx="5" fill="#e7b07f"/>
    <!-- 雙管散彈槍(朝右前) -->
    <rect x="56" y="58" width="13" height="15" rx="3" fill="#7a4a2b"/>
    <rect x="62" y="60" width="33" height="10" rx="2.5" fill="#5f6670"/>
    <line x1="62" y1="65" x2="95" y2="65" stroke="#3c424c" stroke-width="2"/>
    <rect x="62" y="60" width="33" height="3.5" rx="2" fill="#8a929c"/>
    <!-- 持槍前手 -->
    <rect x="58" y="62" width="12" height="9" rx="4.5" fill="#e7b07f"/>
    <!-- 頭 -->
    <circle cx="50" cy="38" r="21" fill="#f1c499"/>
    <!-- 頭髮(瀏海) -->
    <path d="M28 39 Q26 13 50 13 Q74 13 72 39 Q64 26 50 26 Q36 26 28 39 Z" fill="#8a5230"/>
    <!-- 紅色頭帶 -->
    <rect x="29" y="32" width="42" height="6" rx="3" fill="#c0392b"/>
  </g>
  <circle cx="43" cy="40" r="3.1" fill="#241a14"/>
  <circle cx="57" cy="40" r="3.1" fill="#241a14"/>
  <path d="M44 47 Q50 52 56 47" stroke="#241a14" stroke-width="2.4" fill="none" stroke-linecap="round"/>
`
);

const SVG_SPIKE = svgDoc(
  100,
  112,
  `
  <g stroke="#0f5132" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
    <!-- 雙側小芽手臂 -->
    <path d="M31 70 Q15 66 15 51 Q25 54 31 63 Z" fill="#2bb763"/>
    <path d="M69 70 Q85 66 85 51 Q75 54 69 63 Z" fill="#2bb763"/>
    <!-- 身體 -->
    <path d="M33 92 Q28 47 50 44 Q72 47 67 92 Q50 100 33 92 Z" fill="#2bb763"/>
    <!-- 縱向紋路 -->
    <path d="M50 52 L50 90" stroke="#1f9d52" stroke-width="3" fill="none"/>
    <path d="M41 56 L39 88" stroke="#1f9d52" stroke-width="2.4" fill="none"/>
    <path d="M59 56 L61 88" stroke="#1f9d52" stroke-width="2.4" fill="none"/>
    <!-- 腳 -->
    <rect x="38" y="92" width="10" height="13" rx="5" fill="#15803d"/>
    <rect x="52" y="92" width="10" height="13" rx="5" fill="#15803d"/>
  </g>
  <!-- 刺 -->
  <g fill="#e2fbb0" stroke="#0f5132" stroke-width="1.2">
    <polygon points="50,50 46,42 54,42"/>
    <polygon points="31,61 22,58 30,67"/>
    <polygon points="69,61 78,58 70,67"/>
    <polygon points="34,80 25,82 33,87"/>
    <polygon points="66,80 75,82 67,87"/>
  </g>
  <!-- 頂部花朵 -->
  <g stroke="#9a3412" stroke-width="0.8">
    <circle cx="50" cy="30" r="5" fill="#fb7185"/>
    <circle cx="43" cy="34" r="4.6" fill="#fb7185"/>
    <circle cx="57" cy="34" r="4.6" fill="#fb7185"/>
    <circle cx="46" cy="40" r="4.6" fill="#fb7185"/>
    <circle cx="54" cy="40" r="4.6" fill="#fb7185"/>
    <circle cx="50" cy="36" r="4" fill="#f59e0b"/>
  </g>
  <!-- 臉 -->
  <circle cx="43" cy="66" r="3.4" fill="#0f5132"/>
  <circle cx="57" cy="66" r="3.4" fill="#0f5132"/>
  <path d="M44 73 Q50 78 56 73" stroke="#0f5132" stroke-width="2.5" fill="none" stroke-linecap="round"/>
`
);

const SVG_COLT = svgDoc(
  100,
  118,
  `
  <g stroke="#1b2333" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
    <!-- 腿 -->
    <rect x="40" y="86" width="9" height="20" rx="4" fill="#2b3550"/>
    <rect x="51" y="86" width="9" height="20" rx="4" fill="#2b3550"/>
    <!-- 靴 -->
    <rect x="35" y="100" width="16" height="10" rx="4" fill="#3a2415"/>
    <rect x="49" y="100" width="16" height="10" rx="4" fill="#3a2415"/>
    <!-- 身體:藍色背心 + 內衫 -->
    <path d="M33 58 Q50 50 67 58 L62 91 Q50 96 38 91 Z" fill="#2f6bef"/>
    <path d="M45 54 L55 54 L54 92 L46 92 Z" fill="#dbe6ff"/>
    <!-- 警徽 -->
    <circle cx="50" cy="70" r="5" fill="#fcd34d"/>
    <path d="M50 66 L51.2 69 L54 69 L51.8 71 L52.6 74 L50 72 L47.4 74 L48.2 71 L46 69 L48.8 69 Z" fill="#b45309"/>
    <!-- 後手臂(收後) + 左輪 -->
    <rect x="24" y="63" width="15" height="10" rx="5" fill="#e7b07f"/>
    <rect x="14" y="64" width="14" height="7" rx="2" fill="#6b6b6b"/>
    <!-- 前手臂 + 主手左輪(朝右前) -->
    <rect x="60" y="62" width="13" height="10" rx="5" fill="#e7b07f"/>
    <rect x="70" y="59" width="21" height="8" rx="2" fill="#6b6b6b"/>
    <rect x="70" y="59" width="21" height="3" rx="1.5" fill="#9aa0aa"/>
    <rect x="67" y="58" width="8" height="13" rx="2" fill="#7a4a2b"/>
    <!-- 頭 -->
    <circle cx="50" cy="38" r="20" fill="#f1c499"/>
    <!-- 牛仔帽 -->
    <ellipse cx="50" cy="24" rx="29" ry="6.5" fill="#9a6b3f"/>
    <path d="M36 24 Q38 7 50 7 Q62 7 64 24 Z" fill="#b07d4a"/>
    <rect x="36" y="20" width="28" height="4" fill="#6b4a28"/>
  </g>
  <circle cx="43" cy="40" r="3.1" fill="#1b2333"/>
  <circle cx="57" cy="40" r="3.1" fill="#1b2333"/>
  <path d="M44 47 Q50 51 56 47" stroke="#1b2333" stroke-width="2.4" fill="none" stroke-linecap="round"/>
`
);

// ---- 足球(經典黑白五邊形) ----
function buildBallSVG() {
  const cx = 30;
  const cy = 30;
  const rad = (d) => (d * Math.PI) / 180;
  const P = (a, r) => [cx + Math.cos(rad(a)) * r, cy + Math.sin(rad(a)) * r];
  const poly = (pts) => pts.map(([x, y]) => x.toFixed(1) + "," + y.toFixed(1)).join(" ");

  // 中央正五邊形(尖端朝上)
  const center = [];
  for (let k = 0; k < 5; k++) center.push(P(-90 + k * 72, 9));

  // 沿五條邊法線方向的邊緣黑色補丁 + 接縫線
  let patches = "";
  let seams = "";
  for (let k = 0; k < 5; k++) {
    const a = -54 + k * 72; // 邊法線方向
    const [bx, by] = P(a, 19.5); // 補丁中心(靠近球緣,留邊不溢出)
    const pts = [];
    for (let j = 0; j < 5; j++) {
      const aa = a + 180 + j * 72; // 尖端朝向球心
      pts.push([bx + Math.cos(rad(aa)) * 6.5, by + Math.sin(rad(aa)) * 6.5]);
    }
    patches += `<polygon points="${poly(pts)}"/>`;
    // 補丁連到中央五邊形的兩個相鄰頂點
    const v0 = center[k];
    const v1 = center[(k + 1) % 5];
    seams += `<line x1="${bx.toFixed(1)}" y1="${by.toFixed(1)}" x2="${v0[0].toFixed(1)}" y2="${v0[1].toFixed(1)}"/>`;
    seams += `<line x1="${bx.toFixed(1)}" y1="${by.toFixed(1)}" x2="${v1[0].toFixed(1)}" y2="${v1[1].toFixed(1)}"/>`;
  }

  return svgDoc(
    60,
    60,
    `<circle cx="30" cy="30" r="27" fill="#f8fafc" stroke="#1f2937" stroke-width="2.5"/>
     <g stroke="#4b5563" stroke-width="1.3" stroke-linecap="round">${seams}</g>
     <g fill="#1f2937" stroke="#111827" stroke-width="0.6" stroke-linejoin="round">
       <polygon points="${poly(center)}"/>
       ${patches}
     </g>`
  );
}

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
    ball: buildBallSVG(),
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
