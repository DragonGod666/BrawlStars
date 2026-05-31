// ============================================================
// utils.js — 數學 / 碰撞 輔助函式
// ============================================================

function clampNum(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

function lerpNum(a, b, t) {
  return a + (b - a) * t;
}

function dist2(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}

function distXY(ax, ay, bx, by) {
  return Math.sqrt(dist2(ax, ay, bx, by));
}

function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

// 將向量正規化為單位向量(回傳 {x,y})；零向量回傳 {0,0}
function normalize(x, y) {
  const m = Math.hypot(x, y);
  if (m < 1e-6) return { x: 0, y: 0 };
  return { x: x / m, y: y / m };
}

// 圓對圓碰撞
function circlesOverlap(ax, ay, ar, bx, by, br) {
  const r = ar + br;
  return dist2(ax, ay, bx, by) <= r * r;
}

// 點是否在矩形內(rect: {left,right,top,bottom})
function pointInRect(x, y, rect) {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

// 圓是否與矩形(rect: {x,y,w,h} CORNER)重疊
function circleRectOverlap(cx, cy, r, rect) {
  const nx = clampNum(cx, rect.x, rect.x + rect.w);
  const ny = clampNum(cy, rect.y, rect.y + rect.h);
  return dist2(cx, cy, nx, ny) <= r * r;
}

// 將圓推出矩形(最小位移)；回傳新位置與法線 {x,y,nx,ny}，無重疊回傳 null
function resolveCircleRect(cx, cy, r, rect) {
  const nx = clampNum(cx, rect.x, rect.x + rect.w);
  const ny = clampNum(cy, rect.y, rect.y + rect.h);
  const dx = cx - nx;
  const dy = cy - ny;
  const d2v = dx * dx + dy * dy;
  if (d2v > r * r) return null;

  if (d2v > 1e-6) {
    const d = Math.sqrt(d2v);
    const push = r - d;
    return { x: cx + (dx / d) * push, y: cy + (dy / d) * push, nx: dx / d, ny: dy / d };
  }
  // 圓心在矩形內：往最近的邊推出
  const left = cx - rect.x;
  const right = rect.x + rect.w - cx;
  const top = cy - rect.y;
  const bottom = rect.y + rect.h - cy;
  const m = Math.min(left, right, top, bottom);
  if (m === left) return { x: rect.x - r, y: cy, nx: -1, ny: 0 };
  if (m === right) return { x: rect.x + rect.w + r, y: cy, nx: 1, ny: 0 };
  if (m === top) return { x: cx, y: rect.y - r, nx: 0, ny: -1 };
  return { x: cx, y: rect.y + rect.h + r, nx: 0, ny: 1 };
}

// 以 60fps 為基準的時間縮放係數(避免不同更新率造成速度差異)
function dtScale() {
  // p5 的 deltaTime 為毫秒；16.667ms = 一幀(60fps)
  if (typeof deltaTime === "number" && deltaTime > 0) {
    return Math.min(deltaTime / 16.6667, 3); // 上限避免卡頓時瞬移
  }
  return 1;
}
