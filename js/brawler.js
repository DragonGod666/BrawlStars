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
    this.radius = this.stats.radius;
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
    // 自動鎖定最近敵人
    const target = game.nearestEnemy(this);
    if (target) this.aimAngle = angleTo(this.x, this.y, target.x, target.y);
    spawnAttack(this, true);
    this.super = 0;
    this.lastAttackAt = millis();
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

    // 角色立繪(直立、依瞄準左右翻面)
    const flip = Math.cos(this.aimAngle) < 0;
    const sw = this.radius * 3.0;
    const sh = this.radius * 3.6;
    const drawn = Assets.draw("char_" + this.key, this.x, this.y - this.radius * 0.5, sw, sh, 0, flip);
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

  drawPlayerTag() {
    const ty = this.y - this.radius - 46;
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

    push();
    rectMode(CORNER);
    noStroke();

    // HP
    const hpRatio = clampNum(this.hp / this.maxHp, 0, 1);
    fill(0, 0, 0, 150);
    rect(x - 2, y - 2, w + 4, 7 + 4);
    fill(60, 60, 60);
    rect(x, y, w, 7, 2);
    fill(lerpColor(color("#ef4444"), color("#22c55e"), hpRatio));
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

    // 大招條
    y += 8;
    const sr = this.super / CONFIG.superMax;
    fill(40);
    rect(x, y, w, 4, 1);
    if (this.canSuper()) {
      fill(180 + 60 * Math.sin(millis() / 120), 200, 255);
    } else {
      fill("#38bdf8");
    }
    rect(x, y, w * sr, 4, 1);

    pop();
  }

  // 玩家攻擊範圍指示(僅玩家、未持球時)
  drawIndicator() {
    if (!this.alive) return;
    const cfg = this.stats.attack;
    const a = this.aimAngle;
    const c = color(this.color);

    push();
    translate(this.x, this.y);
    rotate(a);
    noStroke();
    fill(red(c), green(c), blue(c), 40);

    if (cfg.type === "fan") {
      const spread = radians(cfg.spreadDeg);
      arc(0, 0, cfg.range * 2, cfg.range * 2, -spread / 2, spread / 2, PIE);
    } else if (cfg.type === "cactus") {
      rectMode(CORNER);
      rect(this.radius, -cfg.projRadius - 1, cfg.range, (cfg.projRadius + 1) * 2, 4);
      // 爆裂範圍提示
      push();
      translate(cfg.range, 0);
      fill(red(c), green(c), blue(c), 26);
      circle(0, 0, cfg.smallRange * 2);
      pop();
    } else if (cfg.type === "line") {
      rectMode(CORNER);
      const lw = cfg.projRadius * 2 + 8;
      rect(this.radius, -lw / 2, cfg.range, lw, 4);
    }
    pop();

    // 準星線
    push();
    stroke(255, 255, 255, 70);
    strokeWeight(1);
    line(this.x, this.y, this.x + Math.cos(a) * 46, this.y + Math.sin(a) * 46);
    pop();
  }
}
