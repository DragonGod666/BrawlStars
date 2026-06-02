// ============================================================
// ball.js — 足球：物理、撿取、踢球、掉球
// ============================================================

class Ball {
  constructor(x, y) {
    this.radius = CONFIG.ball.radius;
    this.reset(x, y);
  }

  reset(x, y) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.carrier = null;
    this.lastKicker = null;
    this.lastKickAt = -99999;
  }

  // 該角色現在能否撿球(踢球者短暫冷卻)
  canGrab(b) {
    if (b === this.lastKicker && millis() - this.lastKickAt < CONFIG.ball.pickupCooldownMs) {
      return false;
    }
    return true;
  }

  kick(angle, speed, kicker) {
    this.carrier = null;
    if (kicker) kicker.hasBall = false;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.lastKicker = kicker;
    this.lastKickAt = millis();
    // 推到角色前方一點，避免立即再碰撞
    this.x = kicker.x + Math.cos(angle) * (kicker.radius + this.radius + 4);
    this.y = kicker.y + Math.sin(angle) * (kicker.radius + this.radius + 4);
    Sound.play("kick");
  }

  drop() {
    if (!this.carrier) return;
    const c = this.carrier;
    c.hasBall = false;
    this.lastKicker = c;
    this.lastKickAt = millis();
    this.vx = 0;
    this.vy = 0;
    this.carrier = null;
  }

  update(s) {
    // 被持有：跟在持球者瞄準方向前方
    if (this.carrier) {
      if (!this.carrier.alive) {
        this.drop();
      } else {
        const c = this.carrier;
        this.x = c.x + Math.cos(c.aimAngle) * (c.radius + CONFIG.ball.carryOffset);
        this.y = c.y + Math.sin(c.aimAngle) * (c.radius + CONFIG.ball.carryOffset);
        this.vx = 0;
        this.vy = 0;
        return;
      }
    }

    // 自由滾動
    this.x += this.vx * s;
    this.y += this.vy * s;
    this.vx *= Math.pow(CONFIG.ball.friction, s);
    this.vy *= Math.pow(CONFIG.ball.friction, s);
    if (Math.hypot(this.vx, this.vy) < CONFIG.ball.minSpeed) {
      this.vx = 0;
      this.vy = 0;
    }

    this.handleWalls();
    this.tryPickup();
  }

  handleWalls() {
    const f = CONFIG.field;
    const r = this.radius;
    const rest = 0.72;

    if (this.x < f.left + r) {
      this.x = f.left + r;
      this.vx = Math.abs(this.vx) * rest;
    } else if (this.x > f.right - r) {
      this.x = f.right - r;
      this.vx = -Math.abs(this.vx) * rest;
    }

    // 上下牆：若在球門開口內則放行(交由 game 判定進球)，否則反彈
    if (this.y < f.top + r) {
      if (!game.inGoalMouth(this.x)) {
        this.y = f.top + r;
        this.vy = Math.abs(this.vy) * rest;
      }
    } else if (this.y > f.bottom - r) {
      if (!game.inGoalMouth(this.x)) {
        this.y = f.bottom - r;
        this.vy = -Math.abs(this.vy) * rest;
      }
    }
  }

  tryPickup() {
    if (this.carrier) return;
    for (const b of game.brawlers) {
      if (!b.alive || !this.canGrab(b)) continue;
      if (circlesOverlap(this.x, this.y, this.radius, b.x, b.y, b.radius)) {
        this.carrier = b;
        b.hasBall = true;
        this.vx = 0;
        this.vy = 0;
        return;
      }
    }
  }

  draw() {
    // 影子
    push();
    noStroke();
    fill(0, 0, 0, 60);
    ellipse(this.x, this.y + this.radius * 0.7, this.radius * 2.2, this.radius * 1.1);
    pop();

    // SVG 足球(隨滾動方向略為旋轉)
    if (Assets.ready("ball")) {
      const spin = (this.x + this.y) * 0.02;
      Assets.draw("ball", this.x, this.y, this.radius * 2.4, this.radius * 2.4, spin);
      return;
    }

    push();
    // 球體
    stroke(30);
    strokeWeight(2);
    fill(245);
    circle(this.x, this.y, this.radius * 2);

    // 足球斑紋
    noStroke();
    fill(30);
    const r = this.radius;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TWO_PI + millis() / 1400;
      const px = this.x + Math.cos(a) * r * 0.55;
      const py = this.y + Math.sin(a) * r * 0.55;
      circle(px, py, r * 0.42);
    }
    fill(30);
    circle(this.x, this.y, r * 0.5);
    pop();
  }
}
