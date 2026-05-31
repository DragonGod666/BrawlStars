// ============================================================
// sketch.js — p5 進入點：setup/draw、輸入、畫面狀態、HUD、選角
// ============================================================

let leftHeld = false;
let superRequested = false;

const CHAR_INFO = {
  shelly: { role: "霰彈", desc: ["近距離散彈", "越近越痛"] },
  spike: { role: "範圍", desc: ["仙人掌爆裂", "六向小子彈"] },
  colt: { role: "遠程", desc: ["直線連發", "遠程壓制"] },
};

function setup() {
  const cnv = createCanvas(CONFIG.canvas.w, CONFIG.canvas.h);
  cnv.parent("game-wrap");
  // 關閉右鍵瀏覽器選單
  cnv.elt.addEventListener("contextmenu", (e) => e.preventDefault());
  textFont("Microsoft JhengHei, Segoe UI, sans-serif");
  Assets.init();
  game = new Game();
}

function draw() {
  background("#0d1117");

  if (game.state === STATE.MENU) {
    drawMenu();
    return;
  }

  // 設定玩家意圖 → 模擬
  if (game.player) updatePlayerIntent();
  game.update();

  // 場地與實體
  drawField();
  drawGoalLabels();

  const p = game.player;
  const showInd =
    game.state === STATE.PLAYING || game.state === STATE.COUNTDOWN || game.state === STATE.GOAL;
  if (p && p.alive && !p.hasBall && showInd) p.drawIndicator();

  for (const pr of game.projectiles) pr.draw();
  if (game.ball) game.ball.draw();
  // 角色(躲在草叢且未現形的敵人不繪製)
  for (const b of game.brawlers) {
    if (b.alive && b.team !== "A" && b.concealed) continue;
    b.draw();
  }
  // 草叢冠層(蓋在角色之上，營造藏身效果)
  drawBushesCanopy();

  drawTopHUD();
  drawBottomHUD();
  drawLegend();

  if (game.state === STATE.COUNTDOWN) drawCountdown();
  if (game.state === STATE.GOAL) drawGoalBanner();
  if (game.state === STATE.GAMEOVER) drawGameOver();
}

// ------------------------------------------------------------
// 輸入
// ------------------------------------------------------------
function updatePlayerIntent() {
  const p = game.player;
  if (!p) return;
  let mx = 0;
  let my = 0;
  if (keyIsDown(65) || keyIsDown(LEFT_ARROW)) mx -= 1; // A
  if (keyIsDown(68) || keyIsDown(RIGHT_ARROW)) mx += 1; // D
  if (keyIsDown(87) || keyIsDown(UP_ARROW)) my -= 1; // W
  if (keyIsDown(83) || keyIsDown(DOWN_ARROW)) my += 1; // S
  p.intent.mx = mx;
  p.intent.my = my;
  p.intent.aimX = mouseX;
  p.intent.aimY = mouseY;
  p.intent.fire = leftHeld;
  if (superRequested) {
    p.intent.fireSuper = true;
    superRequested = false;
  }
}

function mousePressed() {
  if (game.state === STATE.MENU) {
    handleMenuClick();
    return false;
  }
  if (game.state === STATE.GAMEOVER) {
    game.state = STATE.MENU;
    leftHeld = false;
    return false;
  }
  if (mouseButton === LEFT) leftHeld = true;
  else if (mouseButton === RIGHT) superRequested = true;
  return false;
}

function mouseReleased() {
  if (mouseButton === LEFT) leftHeld = false;
  return false;
}

function keyPressed() {
  if (game.state === STATE.MENU) {
    if (key === "1") game.selectedKey = "shelly";
    else if (key === "2") game.selectedKey = "spike";
    else if (key === "3") game.selectedKey = "colt";
    else if (keyCode === ENTER || key === " ") startGame();
  } else if (game.state === STATE.GAMEOVER) {
    if (key === "r" || key === "R" || keyCode === ENTER) game.state = STATE.MENU;
  }
}

function startGame() {
  leftHeld = false;
  superRequested = false;
  game.startMatch(game.selectedKey);
}

// ------------------------------------------------------------
// 場地繪製
// ------------------------------------------------------------
function drawField() {
  const f = CONFIG.field;
  const w = f.right - f.left;
  const h = f.bottom - f.top;

  // 草皮 + 條紋
  noStroke();
  fill("#1f7a3d");
  rect(f.left, f.top, w, h, 6);
  fill("#1c6f38");
  const stripeH = h / 8;
  for (let i = 0; i < 8; i += 2) rect(f.left, f.top + i * stripeH, w, stripeH);

  // 中線與中圈
  stroke(255, 255, 255, 130);
  strokeWeight(3);
  noFill();
  line(f.left, game.centerY, f.right, game.centerY);
  circle(game.centerX, game.centerY, 130);
  noStroke();
  fill(255, 255, 255, 130);
  circle(game.centerX, game.centerY, 8);

  // 草叢底層 + 障礙物(在角色之下)
  drawBushesBase();
  drawObstacles();

  // 球門(上門=敵方紅、下門=我方藍)
  drawGoal(f.top, -1, CONFIG.teamColor.B);
  drawGoal(f.bottom, 1, CONFIG.teamColor.A);

  // 牆(留球門開口)
  drawWalls();
}

function drawObstacles() {
  push();
  rectMode(CORNER);
  for (const o of CONFIG.obstacles) {
    noStroke();
    fill(0, 0, 0, 70);
    rect(o.x + 3, o.y + 5, o.w, o.h, 7); // 陰影
    fill("#475569");
    rect(o.x, o.y, o.w, o.h, 7); // 本體
    fill("#64748b");
    rect(o.x, o.y, o.w, o.h * 0.42, 7); // 上緣高光
    noFill();
    stroke("#0f172a");
    strokeWeight(2);
    rect(o.x, o.y, o.w, o.h, 7);
  }
  pop();
}

// 以 SVG 平鋪填滿草叢區(裁切在矩形內)；未載入回 false 由備援繪製
function tileBush(alpha) {
  if (!Assets.ready("bush")) return false;
  const img = Assets.images["bush"];
  const ctx = drawingContext;
  const tw = 60;
  const th = 54;
  for (const bz of CONFIG.bushes) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.rect(bz.x, bz.y, bz.w, bz.h);
    ctx.clip();
    for (let yy = bz.y - 8; yy < bz.y + bz.h; yy += th - 16) {
      for (let xx = bz.x - 8; xx < bz.x + bz.w; xx += tw - 18) {
        ctx.drawImage(img, xx, yy, tw, th);
      }
    }
    ctx.restore();
  }
  return true;
}

function drawBushesBase() {
  if (tileBush(1.0)) return;
  push();
  rectMode(CORNER);
  noStroke();
  for (const bz of CONFIG.bushes) {
    fill("#15532e");
    rect(bz.x, bz.y, bz.w, bz.h, 16);
    fill("#124826");
    for (let lx = bz.x + 12; lx < bz.x + bz.w - 4; lx += 22) {
      for (let ly = bz.y + 12; ly < bz.y + bz.h - 4; ly += 22) {
        circle(lx, ly, 18);
      }
    }
  }
  pop();
}

function drawBushesCanopy() {
  if (tileBush(0.5)) return;
  push();
  rectMode(CORNER);
  noStroke();
  for (const bz of CONFIG.bushes) {
    fill(34, 139, 69, 165);
    rect(bz.x, bz.y, bz.w, bz.h, 16);
    fill(46, 160, 82, 180);
    for (let lx = bz.x + 12; lx < bz.x + bz.w - 4; lx += 22) {
      for (let ly = bz.y + 12; ly < bz.y + bz.h - 4; ly += 22) {
        circle(lx + Math.sin(millis() / 600 + lx) * 1.5, ly, 20);
      }
    }
  }
  pop();
}

function drawLegend() {
  push();
  textAlign(LEFT, CENTER);
  noStroke();
  const x = 16;
  let y = 16;
  fill(CONFIG.teamColor.A);
  circle(x, y, 13);
  fill(225);
  textSize(12);
  text("你方", x + 12, y);
  y += 20;
  fill(CONFIG.teamColor.B);
  circle(x, y, 13);
  fill(225);
  text("敵人", x + 12, y);
  pop();
}

function drawGoal(lineY, dir, col) {
  const cx = game.centerX;
  const hw = CONFIG.goal.halfWidth;
  const depth = CONFIG.goal.depth;

  if (Assets.ready("goal")) {
    push();
    rectMode(CORNER);
    noStroke();
    const c = color(col);
    fill(red(c), green(c), blue(c), 75); // 隊伍色底
    if (dir < 0) rect(cx - hw, lineY - depth, hw * 2, depth, 6);
    else rect(cx - hw, lineY, hw * 2, depth, 6);
    pop();
    const cyImg = dir < 0 ? lineY - depth / 2 : lineY + depth / 2;
    // 上門開口朝下(不翻轉)；下門開口朝上(垂直翻轉)
    Assets.draw("goal", cx, cyImg, hw * 2, depth, 0, false, dir > 0);
    return;
  }

  push();
  rectMode(CORNERS);
  // 球門框
  noStroke();
  fill(red(color(col)), green(color(col)), blue(color(col)), 80);
  if (dir < 0) rect(cx - hw, lineY - depth, cx + hw, lineY);
  else rect(cx - hw, lineY, cx + hw, lineY + depth);
  // 網格線
  stroke(255, 255, 255, 120);
  strokeWeight(1);
  for (let gx = cx - hw; gx <= cx + hw; gx += 12) {
    if (dir < 0) line(gx, lineY - depth, gx, lineY);
    else line(gx, lineY, gx, lineY + depth);
  }
  // 門柱
  stroke(col);
  strokeWeight(5);
  if (dir < 0) {
    line(cx - hw, lineY, cx - hw, lineY - depth);
    line(cx + hw, lineY, cx + hw, lineY - depth);
  } else {
    line(cx - hw, lineY, cx - hw, lineY + depth);
    line(cx + hw, lineY, cx + hw, lineY + depth);
  }
  pop();
}

function drawWalls() {
  const f = CONFIG.field;
  const cx = game.centerX;
  const hw = CONFIG.goal.halfWidth;
  push();
  stroke("#0a2f18");
  strokeWeight(6);
  // 左右
  line(f.left, f.top, f.left, f.bottom);
  line(f.right, f.top, f.right, f.bottom);
  // 上(兩段，留中間開口)
  line(f.left, f.top, cx - hw, f.top);
  line(cx + hw, f.top, f.right, f.top);
  // 下
  line(f.left, f.bottom, cx - hw, f.bottom);
  line(cx + hw, f.bottom, f.right, f.bottom);
  pop();
}

function drawGoalLabels() {
  push();
  textAlign(CENTER, CENTER);
  textSize(12);
  fill(255, 200);
  text("↑ 敵方球門", game.centerX, CONFIG.field.top - CONFIG.goal.depth - 10);
  text("↓ 我方球門", game.centerX, CONFIG.field.bottom + CONFIG.goal.depth + 10);
  pop();
}

// ------------------------------------------------------------
// HUD
// ------------------------------------------------------------
function formatTime(ms) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return m + ":" + (s < 10 ? "0" + s : s);
}

function drawTopHUD() {
  const cx = CONFIG.canvas.w / 2;
  push();
  textAlign(CENTER, CENTER);

  // 計時
  fill(230);
  textSize(20);
  text(formatTime(game.matchTimeLeftMs), cx, 18);

  // 比分框
  drawScoreBox(cx - 78, 36, CONFIG.teamColor.A, game.score.A, "你的隊");
  drawScoreBox(cx + 78, 36, CONFIG.teamColor.B, game.score.B, "敵隊");

  fill(200);
  textSize(13);
  text("先進 " + CONFIG.match.goalsToWin + " 球獲勝", cx, 70);
  pop();
}

function drawScoreBox(x, y, col, val, label) {
  push();
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  noStroke();
  fill(col);
  rect(x, y, 56, 40, 8);
  fill(255);
  textSize(26);
  textStyle(BOLD);
  text(val, x, y + 1);
  textStyle(NORMAL);
  textSize(11);
  fill(220);
  text(label, x, y - 30);
  pop();
}

function drawBottomHUD() {
  const p = game.player;
  if (!p) return;
  const y0 = 808;
  push();
  textAlign(LEFT, CENTER);

  // 角色頭像 + 名字
  noStroke();
  fill(p.color);
  stroke(CONFIG.teamColor.A);
  strokeWeight(3);
  circle(36, y0 + 22, 34);
  noStroke();
  fill(235);
  textSize(16);
  textStyle(BOLD);
  text(p.name + (p.alive ? "" : " (重生中)"), 60, y0 + 14);
  textStyle(NORMAL);

  // HP 條
  const barX = 60;
  const barY = y0 + 30;
  const barW = 230;
  const hpRatio = p.alive ? clampNum(p.hp / p.maxHp, 0, 1) : 0;
  fill(50);
  rect(barX, barY, barW, 14, 4);
  fill(lerpColor(color("#ef4444"), color("#22c55e"), hpRatio));
  rect(barX, barY, barW * hpRatio, 14, 4);
  fill(255);
  textSize(11);
  textAlign(CENTER, CENTER);
  text(Math.ceil(p.alive ? p.hp : 0) + " / " + p.maxHp, barX + barW / 2, barY + 7);

  // 彈藥 3 格
  const ammoX = 320;
  const ammoY = y0 + 16;
  textAlign(LEFT, CENTER);
  fill(200);
  textSize(12);
  text("彈藥", ammoX, ammoY);
  for (let i = 0; i < 3; i++) {
    const filled = clampNum(p.ammo - i, 0, 1);
    fill(45);
    rect(ammoX + 40 + i * 36, ammoY - 8, 32, 16, 3);
    if (filled > 0) {
      fill("#fbbf24");
      rect(ammoX + 40 + i * 36, ammoY - 8, 32 * filled, 16, 3);
    }
  }

  // 大招
  const supX = 320;
  const supY = y0 + 40;
  fill(200);
  text("大招", supX, supY);
  const supW = 108;
  const sr = p.super / CONFIG.superMax;
  fill(45);
  rect(supX + 40, supY - 7, supW, 14, 4);
  fill(p.canSuper() ? color(120, 220, 255) : color("#38bdf8"));
  rect(supX + 40, supY - 7, supW * sr, 14, 4);
  if (p.canSuper()) {
    fill(255, 230, 120);
    textSize(12);
    textStyle(BOLD);
    text("就緒! 右鍵發射", supX + 40 + supW + 8, supY);
    textStyle(NORMAL);
  }

  pop();
}

function drawCountdown() {
  const remain = game.countdownEndAt - millis();
  const n = Math.ceil(remain / 1000);
  push();
  textAlign(CENTER, CENTER);
  fill(0, 0, 0, 90);
  noStroke();
  rect(0, 0, width, height);
  fill(255);
  textSize(96);
  textStyle(BOLD);
  text(n > 0 ? n : "GO!", game.centerX, game.centerY - 30);
  textStyle(NORMAL);
  textSize(22);
  text("準備!", game.centerX, game.centerY + 50);
  pop();
}

function drawGoalBanner() {
  const col = game.lastScorer === "A" ? CONFIG.teamColor.A : CONFIG.teamColor.B;
  push();
  textAlign(CENTER, CENTER);
  fill(0, 0, 0, 70);
  noStroke();
  rect(0, 0, width, height);
  fill(col);
  textSize(72);
  textStyle(BOLD);
  text("進球!", game.centerX, game.centerY - 20);
  textStyle(NORMAL);
  fill(255);
  textSize(24);
  text(game.lastScorer === "A" ? "你的隊得分" : "敵隊得分", game.centerX, game.centerY + 45);
  pop();
}

function drawGameOver() {
  push();
  textAlign(CENTER, CENTER);
  fill(0, 0, 0, 180);
  noStroke();
  rect(0, 0, width, height);

  let title;
  let col;
  if (game.winner === "A") {
    title = "勝利!";
    col = CONFIG.teamColor.A;
  } else if (game.winner === "B") {
    title = "落敗...";
    col = CONFIG.teamColor.B;
  } else {
    title = "平手";
    col = color(200);
  }

  fill(col);
  textSize(72);
  textStyle(BOLD);
  text(title, game.centerX, game.centerY - 70);
  textStyle(NORMAL);

  fill(255);
  textSize(40);
  text(game.score.A + " : " + game.score.B, game.centerX, game.centerY);

  // 按鈕
  const b = { x: game.centerX - 100, y: game.centerY + 60, w: 200, h: 56 };
  const hover = mouseX > b.x && mouseX < b.x + b.w && mouseY > b.y && mouseY < b.y + b.h;
  rectMode(CORNER);
  fill(hover ? "#2563eb" : "#1d4ed8");
  rect(b.x, b.y, b.w, b.h, 12);
  fill(255);
  textSize(22);
  text("再來一場", game.centerX, b.y + b.h / 2);
  textSize(13);
  fill(200);
  text("(點擊任意處 / 按 R)", game.centerX, b.y + b.h + 24);
  pop();
}

// ------------------------------------------------------------
// 選角畫面
// ------------------------------------------------------------
function menuLayout() {
  const cw = 168;
  const ch = 220;
  const gap = 30;
  const total = cw * 3 + gap * 2;
  const startX = (CONFIG.canvas.w - total) / 2;
  const y = 250;
  const cards = BRAWLER_ORDER.map((key, i) => ({
    key,
    x: startX + i * (cw + gap),
    y,
    w: cw,
    h: ch,
  }));
  const start = { x: CONFIG.canvas.w / 2 - 100, y: y + ch + 46, w: 200, h: 58 };
  return { cards, start };
}

function drawMenu() {
  push();
  textAlign(CENTER, CENTER);

  // 標題
  fill(255);
  textSize(46);
  textStyle(BOLD);
  text("亂鬥足球 3v3", CONFIG.canvas.w / 2, 90);
  textStyle(NORMAL);
  fill(150);
  textSize(18);
  text("選擇你的角色", CONFIG.canvas.w / 2, 140);

  const { cards, start } = menuLayout();
  for (const c of cards) drawCharCard(c);

  // 開始按鈕
  const sHover = inRect(mouseX, mouseY, start);
  rectMode(CORNER);
  noStroke();
  fill(sHover ? "#16a34a" : "#15803d");
  rect(start.x, start.y, start.w, start.h, 14);
  fill(255);
  textSize(24);
  textStyle(BOLD);
  text("開始比賽 ▶", CONFIG.canvas.w / 2, start.y + start.h / 2);
  textStyle(NORMAL);

  // 說明
  fill(140);
  textSize(13);
  text(
    "雙方陣容皆為 雪莉 / 史派克 / 柯爾特 · 你控制 1 隻，其餘為 AI",
    CONFIG.canvas.w / 2,
    start.y + start.h + 34
  );
  text(
    "WASD 移動 · 滑鼠瞄準 · 左鍵 普攻/踢球 · 右鍵 大招(自動鎖敵)/大招踢球 · 數字鍵1~3選角",
    CONFIG.canvas.w / 2,
    start.y + start.h + 56
  );
  fill(170);
  text(
    "藍色光環=你方　紅色光環=敵人　·　躲進草叢可對敵隱形　·　灰色方塊會擋住人與子彈",
    CONFIG.canvas.w / 2,
    start.y + start.h + 80
  );
  pop();
}

function drawCharCard(c) {
  const stats = CONFIG.brawlers[c.key];
  const info = CHAR_INFO[c.key];
  const selected = game.selectedKey === c.key;
  const hover = inRect(mouseX, mouseY, c);

  push();
  rectMode(CORNER);
  // 面板
  stroke(selected ? "#fbbf24" : hover ? "#64748b" : "#334155");
  strokeWeight(selected ? 4 : 2);
  fill("#161b22");
  rect(c.x, c.y, c.w, c.h, 14);

  textAlign(CENTER, CENTER);
  noStroke();

  // 角色圓
  fill(stats.color);
  stroke(CONFIG.teamColor.A);
  strokeWeight(3);
  circle(c.x + c.w / 2, c.y + 64, 76);
  noStroke();

  // 名字
  fill(235);
  textSize(24);
  textStyle(BOLD);
  text(stats.name, c.x + c.w / 2, c.y + 124);
  textStyle(NORMAL);

  // 角色定位標籤
  fill("#fbbf24");
  textSize(13);
  text("【" + info.role + "】", c.x + c.w / 2, c.y + 150);

  // 描述
  fill(170);
  textSize(13);
  info.desc.forEach((line, i) => {
    text(line, c.x + c.w / 2, c.y + 174 + i * 20);
  });

  if (selected) {
    fill("#fbbf24");
    textSize(13);
    text("✓ 已選擇", c.x + c.w / 2, c.y + c.h - 14);
  }
  pop();
}

function handleMenuClick() {
  const { cards, start } = menuLayout();
  for (const c of cards) {
    if (inRect(mouseX, mouseY, c)) {
      game.selectedKey = c.key;
      return;
    }
  }
  if (inRect(mouseX, mouseY, start)) startGame();
}

function inRect(mx, my, r) {
  return mx > r.x && mx < r.x + r.w && my > r.y && my < r.y + r.h;
}
