// ============================================================
// brawler.js — 角色實體(玩家與 AI 共用)
// ============================================================

class Brawler {
  constructor(key, team, isPlayer, spawnX, spawnY) {
    this.stats = CONFIG.brawlers[key];
    this.key = key;
    this.name = this.stats.name;
    this.color = this.stats.color;
    this.team = team;            // 'A'(玩家方,攻上門) | 'B'(敵方,攻下門)
    this.isPlayer = isPlayer;

    this.maxHp = this.stats.maxHp;
    this.hp = this.maxHp;
    this.radius = this.stats.radius;      // 立繪/撿球/中彈判定用(視覺大小)
    this.colRadius = 13;                  // 撞牆/障礙物用的小體積(約 1 格),與立繪脫鉤 → 不卡轉角
    this.speed = this.stats.speed;

    this.spawn = { x: spawnX, y: spawnY };
    this.x = spawnX;
    this.y = spawnY;

    this.ammo = 3;               // 0..3 浮點
    this.super = 0;              // 0..superMax
    this.attackCdMs = 360;       // 普攻最短間隔

    this.aimAngle = team === "A" ? -Math.PI / 2 : Math.PI / 2;

    this.alive = true;
    this.deadUntil = 0;
    this.hasBall = false;
    this.lastBallTouchAt = 0;    // 用於撿球冷卻
    this.inBush = false;         // 是否站在草叢
    this.concealed = false;      // 是否對敵方隱形

    this.lastAttackAt = -99999;
    this.lastDamagedAt = -99999;
    this.lastShotAt = -99999;

    // 每幀由玩家輸入或 AI 設定的意圖
    this.intent = {
      mx: 0, my: 0,            // 移動方向
      aimX: spawnX + Math.cos(this.aimAngle) * 50,
      aimY: spawnY + Math.sin(this.aimAngle) * 50,
      fire: false,            // 左鍵(持續)
      fireSuper: false,       // 右鍵(邊緣觸發)
    };

    // AI 控制器(玩家為 null)
    this.ai = null;
  }

  // ----- 狀態查詢 -----
  canSuper() {
    return this.super >= CONFIG.superMax;
  }

  // ----- 充能 -----
  gainSuper(amount) {
    this.super = clampNum(this.super + amount, 0, CONFIG.superMax);
  }

  // ----- 受擊 -----
  takeDamage(amount, knockback, fromAngle) {
    if (!this.alive) return;
    this.hp -= amount;
    this.lastDamagedAt = millis();
    if (knockback > 0) {
      this.x += Math.cos(fromAngle) * knockback;
      this.y += Math.sin(fromAngle) * knockback;
    }
    if (this.hp <= 0) this.die();
  }

  die() {
    this.alive = false;
    this.hp = 0;
    this.deadUntil = millis() + CONFIG.match.respawnMs;
    if (this.hasBall && game.ball) game.ball.drop();
  }

  respawn() {
    this.alive = true;
    this.hp = this.maxHp;
    this.x = this.spawn.x;
    this.y = this.spawn.y;
    this.ammo = 3;
    this.super = 0;
    this.lastAttackAt = -99999;
    this.lastDamagedAt = -99999;
    this.aimAngle = this.team === "A" ? -Math.PI / 2 : Math.PI / 2;
    if (this.ai) this.ai.rejoinUntil = millis() + 2200; // 重生後直接追球歸隊
  }

  // ----- 主更新 -----
  update(s) {
    const now = millis();
    const f = CONFIG.field;

    if (!this.alive) {
      if (now >= this.deadUntil) this.respawn();
      return;
    }

    // AI 設定意圖
    if (this.ai) this.ai.think();

    // 瞄準角(普攻 / 指示 / 踢球方向)
    this.aimAngle = angleTo(this.x, this.y, this.intent.aimX, this.intent.aimY);

    // 移動
    const playing = game.state === STATE.PLAYING;
    if (playing) {
      const mv = normalize(this.intent.mx, this.intent.my);
      let sp = this.speed;
      if (this.hasBall) sp *= 0.9; // 持球略慢
      this.x += mv.x * sp * s;
      this.y += mv.y * sp * s;
    }
    this.x = clampNum(this.x, f.left + this.radius, f.right - this.radius);
    this.y = clampNum(this.y, f.top + this.radius, f.bottom - this.radius);

    // 彈藥回充
    if (this.ammo < 3) {
      this.ammo = Math.min(3, this.ammo + (s / 60) * (1000 / this.stats.ammoReloadMs));
    }

    // 血量回復(停止攻擊且未受擊一段時間後)
    const idle = now - Math.max(this.lastAttackAt, this.lastDamagedAt);
    if (idle > CONFIG.regen.delayMs && this.hp < this.maxHp) {
      this.hp = Math.min(this.maxHp, this.hp + this.maxHp * CONFIG.regen.fractionPerSecond * (s / 60));
    }

    // 攻擊 / 踢球
    if (playing) this.handleActions(now);

    this.intent.fireSuper = false; // 邊緣觸發消耗
  }

  handleActions(now) {
    if (this.hasBall) {
      // 持球：普攻=踢球(扣 1 格)；大招=大招踢(更遠)
      if (this.intent.fireSuper && this.canSuper()) {
        this.kickBall(true);
        this.super = 0;
        this.lastAttackAt = now;
      } else if (this.intent.fire && this.ammo >= 1 && now - this.lastShotAt > this.attackCdMs) {
        this.kickBall(false);
        this.ammo -= 1;
        this.lastShotAt = now;
        this.lastAttackAt = now;
      }
    } else {
      if (this.intent.fireSuper && this.canSuper()) {
        this.fireSuperAttack();
      } else if (this.intent.fire && this.ammo >= 1 && now - this.lastShotAt > this.attackCdMs) {
        spawnAttack(this, false);
        this.ammo -= 1;
        this.lastShotAt = now;
        this.lastAttackAt = now;
      }
    }
  }

  fireSuperAttack() {
    // 不自動鎖敵:直接往目前瞄準方向(玩家=滑鼠瞄準線)發射
    spawnAttack(this, true);
    this.super = 0;
    this.lastAttackAt = millis();
    Sound.play("super");
  }

  kickBall(isSuper) {
    if (!game.ball || game.ball.carrier !== this) return;
    const sp = isSuper ? CONFIG.ball.superKickSpeed : CONFIG.ball.kickSpeed;
    game.ball.kick(this.aimAngle, sp, this);
  }

  // ----- 繪製 -----
  draw() {
    if (!this.alive) {
      this.drawRespawn();
      return;
    }

    // 地面隊伍光環(藍=你方 / 紅=敵人) + 影子
    push();
    noStroke();
    fill(0, 0, 0, 55);
    ellipse(this.x, this.y + this.radius * 0.72, this.radius * 2.1, this.radius * 1.0);
    const tc = color(CONFIG.teamColor[this.team]);
    tc.setAlpha(165);
    fill(tc);
    ellipse(this.x, this.y + this.radius * 0.55, this.radius * 2.5, this.radius * 1.35);
    if (this.isPlayer) {
      noFill();
      stroke(255, 255, 255, 180 + 60 * Math.sin(millis() / 200));
      strokeWeight(3);
      ellipse(this.x, this.y + this.radius * 0.55, this.radius * 2.8, this.radius * 1.6);
    }
    pop();

    // 大招就緒:腳下旋轉黃色光環(沒大招不顯示)
    if (this.canSuper()) this.drawSuperRing();

    // 角色立繪(直立、依瞄準左右翻面);尺寸貼近碰撞框,視覺與被牆擋住的位置一致
    const flip = Math.cos(this.aimAngle) < 0;
    const sw = this.radius * 2.5;
    const sh = this.radius * 3.0;
    const drawn = Assets.draw("char_" + this.key, this.x, this.y - this.radius * 0.45, sw, sh, 0, flip);
    if (!drawn) {
      push();
      stroke(15, 23, 42);
      strokeWeight(3);
      fill(this.color);
      circle(this.x, this.y, this.radius * 2);
      pop();
    }

    if (this.isPlayer) this.drawPlayerTag();
    this.drawBars();
  }

  // 血條/名字的關係色:自己綠、隊友藍、敵人紅
  barColor() {
    if (this.isPlayer) return "#22c55e";
    return this.team === "A" ? CONFIG.teamColor.A : CONFIG.teamColor.B;
  }

  // 大招就緒:腳下一圈持續旋轉的黃色特效光環
  drawSuperRing() {
    const cx = this.x;
    const cy = this.y + this.radius * 0.55;
    const rx = this.radius * 1.9;
    const ry = rx * 0.6;
    const t = millis();
    push();
    translate(cx, cy);
    // 柔光底(呼吸脈動)
    noStroke();
    fill(255, 215, 60, 45 + 28 * Math.sin(t / 220));
    ellipse(0, 0, rx * 2.2, ry * 2.2);
    // 旋轉虛線環
    rotate(t / 320);
    noFill();
    stroke(255, 210, 50);
    strokeWeight(3);
    const segs = 9;
    const span = (TWO_PI / segs) * 0.55;
    for (let i = 0; i < segs; i++) {
      const a0 = (i / segs) * TWO_PI;
      arc(0, 0, rx * 2, ry * 2, a0, a0 + span);
    }
    pop();
  }

  drawPlayerTag() {
    const ty = this.y - this.radius - 56;
    push();
    noStroke();
    fill("#fbbf24");
    triangle(this.x - 8, ty, this.x + 8, ty, this.x, ty + 11);
    fill(255);
    textAlign(CENTER, BOTTOM);
    textSize(12);
    textStyle(BOLD);
    text("你", this.x, ty - 1);
    textStyle(NORMAL);
    pop();
  }

  drawRespawn() {
    const remain = Math.max(0, this.deadUntil - millis());
    push();
    noFill();
    stroke(CONFIG.teamColor[this.team]);
    strokeWeight(2);
    drawingContext.setLineDash([5, 5]);
    circle(this.spawn.x, this.spawn.y, this.radius * 2);
    drawingContext.setLineDash([]);
    noStroke();
    fill(255, 200);
    textAlign(CENTER, CENTER);
    textSize(14);
    text(Math.ceil(remain / 1000), this.spawn.x, this.spawn.y);
    pop();
  }

  drawBars() {
    const w = 48;
    const x = this.x - w / 2;
    let y = this.y - this.radius - 28;
    const col = this.barColor();

    // 名字(顏色與血條相同,帶黑色陰影增加可讀性)
    push();
    textAlign(CENTER, BOTTOM);
    textSize(11);
    textStyle(BOLD);
    noStroke();
    fill(0, 0, 0, 170);
    text(this.name, this.x + 1, y - 2);
    fill(col);
    text(this.name, this.x, y - 3);
    pop();

    push();
    rectMode(CORNER);
    noStroke();

    // HP(顏色=陣營關係色,長度=血量)
    const hpRatio = clampNum(this.hp / this.maxHp, 0, 1);
    fill(0, 0, 0, 150);
    rect(x - 2, y - 2, w + 4, 7 + 4);
    fill(60, 60, 60);
    rect(x, y, w, 7, 2);
    fill(col);
    rect(x, y, w * hpRatio, 7, 2);

    // 彈藥 3 格
    y += 10;
    const seg = (w - 4) / 3;
    for (let i = 0; i < 3; i++) {
      const filled = clampNum(this.ammo - i, 0, 1);
      fill(40);
      rect(x + i * (seg + 2), y, seg, 5, 1);
      if (filled > 0) {
        fill("#fbbf24");
        rect(x + i * (seg + 2), y, seg * filled, 5, 1);
      }
    }

    pop();
  }

  // 玩家攻擊範圍指示(僅玩家、未持球時)
  // 範圍形狀:有子彈=白色、空彈=紅色,皆帶深色邊框
  drawIndicator() {
    if (!this.alive) return;
    const cfg = this.stats.attack;
    const a = this.aimAngle;
    const hasAmmo = this.ammo >= 1;
    const col = hasAmmo ? color(255, 255, 255) : color(239, 68, 68);
    const rr = red(col);
    const gg = green(col);
    const bb = blue(col);

    push();
    translate(this.x, this.y);
    rotate(a);
    fill(rr, gg, bb, 70);        // 白/紅 半透明填色
    stroke(0, 0, 0, 170);        // 深色邊框
    strokeWeight(2.5);

    if (cfg.type === "fan") {
      const spread = radians(cfg.spreadDeg);
      arc(0, 0, cfg.range * 2, cfg.range * 2, -spread / 2, spread / 2, PIE);
    } else if (cfg.type === "cactus") {
      rectMode(CORNER);
      rect(this.radius, -cfg.projRadius - 1, cfg.range, (cfg.projRadius + 1) * 2, 4);
      // 爆裂範圍提示(同色,較淡)
      push();
      translate(cfg.range, 0);
      fill(rr, gg, bb, 40);
      circle(0, 0, cfg.smallRange * 2);
      pop();
    } else if (cfg.type === "line") {
      rectMode(CORNER);
      const lw = cfg.projRadius * 2 + 8;
      rect(this.radius, -lw / 2, cfg.range, lw, 4);
    }
    pop();
  }

  // 持球時的踢球預瞄:從球沿瞄準方向預測路徑(遇牆/障礙物停止)
  drawKickAim() {
    const ball = game.ball;
    if (!ball || ball.carrier !== this) return;
    const a = this.aimAngle;
    const f = CONFIG.field;
    const step = 9;
    let x = ball.x;
    let y = ball.y;
    let ex = x;
    let ey = y;
    for (let d = 0; d < 360; d += step) {
      x += Math.cos(a) * step;
      y += Math.sin(a) * step;
      // 邊界(球門開口放行)
      if (x < f.left + ball.radius || x > f.right - ball.radius) break;
      if ((y < f.top + ball.radius || y > f.bottom - ball.radius) && !game.inGoalMouth(x)) break;
      let blocked = false;
      for (const o of game.obstacles) {
        if (circleRectOverlap(x, y, ball.radius, o)) {
          blocked = true;
          break;
        }
      }
      if (blocked) break;
      ex = x;
      ey = y;
    }
    push();
    // 虛線軌跡
    stroke(255, 255, 255, 210);
    strokeWeight(3);
    drawingContext.setLineDash([9, 9]);
    line(ball.x, ball.y, ex, ey);
    drawingContext.setLineDash([]);
    // 箭頭
    noStroke();
    fill(255, 255, 255, 230);
    push();
    translate(ex, ey);
    rotate(a);
    triangle(0, 0, -11, -6, -11, 6);
    pop();
    pop();
  }
}
