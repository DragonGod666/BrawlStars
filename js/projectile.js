// ============================================================
// projectile.js — 子彈基底 + 各角色攻擊生成
// ============================================================

class Projectile {
  constructor(opts) {
    this.x = opts.x;
    this.y = opts.y;
    const dir = normalize(opts.dx, opts.dy);
    this.vx = dir.x * opts.speed;
    this.vy = dir.y * opts.speed;
    this.dirAngle = Math.atan2(dir.y, dir.x);

    this.radius = opts.radius;
    this.range = opts.range;
    this.team = opts.team;       // 'A' | 'B'
    this.owner = opts.owner;     // 發射者 Brawler
    this.color = opts.color;
    this.knockback = opts.knockback || 0;
    this.chargesSuper = !!opts.chargesSuper; // 命中是否替發射者充大招(普攻 true)

    this.dmgNear = opts.dmgNear;
    this.dmgFar = opts.dmgFar !== undefined ? opts.dmgFar : opts.dmgNear;

    this.onDeath = opts.onDeath || null; // 死亡時觸發(例如仙人掌爆裂)
    this.shape = opts.shape || "ball";    // 'ball' | 'cactus'
    this.asset = opts.asset || null;      // SVG 資源名

    this.alive = true;
    this.traveled = 0;
  }

  // 依飛行距離計算傷害(近高遠低)；若 near==far 則固定傷害
  computeDamage() {
    if (this.dmgFar === this.dmgNear) return this.dmgNear;
    const t = clampNum(this.range > 0 ? this.traveled / this.range : 0, 0, 1);
    return lerpNum(this.dmgNear, this.dmgFar, t);
  }

  update(s) {
    const step = Math.hypot(this.vx, this.vy) * s;
    this.x += this.vx * s;
    this.y += this.vy * s;
    this.traveled += step;

    if (this.traveled >= this.range) {
      this.kill();
      return;
    }
    const f = CONFIG.field;
    if (this.x < f.left - 16 || this.x > f.right + 16 || this.y < f.top - 16 || this.y > f.bottom + 16) {
      this.kill();
    }
  }

  kill() {
    if (!this.alive) return;
    this.alive = false;
    if (this.onDeath) this.onDeath(this);
  }

  draw() {
    // 優先使用 SVG 資源
    if (this.asset && Assets.ready(this.asset)) {
      let w;
      let h;
      if (this.shape === "cactus" || this.asset.startsWith("cactus")) {
        w = h = this.radius * 3.0;
      } else if (this.asset.startsWith("seed")) {
        w = h = this.radius * 3.2;
      } else if (this.asset.startsWith("bolt")) {
        w = this.radius * 5.2;
        h = this.radius * 2.8;
      } else {
        // pellet
        w = this.radius * 4.4;
        h = this.radius * 2.8;
      }
      Assets.draw(this.asset, this.x, this.y, w, h, this.dirAngle);
      return;
    }

    push();
    if (this.shape === "cactus") {
      translate(this.x, this.y);
      rotate(this.dirAngle);
      noStroke();
      fill(this.color);
      circle(0, 0, this.radius * 2);
      stroke(this.color);
      strokeWeight(2);
      for (let a = 0; a < 6; a++) {
        const ang = (a * Math.PI) / 3;
        const r1 = this.radius;
        const r2 = this.radius + 5;
        line(Math.cos(ang) * r1, Math.sin(ang) * r1, Math.cos(ang) * r2, Math.sin(ang) * r2);
      }
    } else {
      noStroke();
      // 外發光
      const c = color(this.color);
      fill(red(c), green(c), blue(c), 70);
      circle(this.x, this.y, this.radius * 3.2);
      fill(c);
      circle(this.x, this.y, this.radius * 2);
    }
    pop();
  }
}

// ------------------------------------------------------------
// 攻擊生成總入口
// ------------------------------------------------------------
function spawnAttack(b, isSuper) {
  const cfg = isSuper ? b.stats.super : b.stats.attack;
  switch (cfg.type) {
    case "fan":
      spawnFan(b, cfg, isSuper);
      break;
    case "cactus":
      spawnCactus(b, cfg, isSuper);
      break;
    case "line":
      spawnLine(b, cfg, isSuper);
      break;
  }
}

// 雪莉：扇形散彈(近高遠低)
function spawnFan(b, cfg, isSuper) {
  const n = cfg.pellets;
  const spread = radians(cfg.spreadDeg);
  const base = b.aimAngle - spread / 2;
  const step = n > 1 ? spread / (n - 1) : 0;
  const mx = b.x + Math.cos(b.aimAngle) * (b.radius + 4);
  const my = b.y + Math.sin(b.aimAngle) * (b.radius + 4);
  for (let i = 0; i < n; i++) {
    const a = base + step * i;
    game.projectiles.push(
      new Projectile({
        x: mx, y: my, dx: Math.cos(a), dy: Math.sin(a),
        speed: cfg.projSpeed, radius: cfg.projRadius, range: cfg.range,
        team: b.team, owner: b, color: cfg.color,
        dmgNear: cfg.dmgNear, dmgFar: cfg.dmgFar,
        knockback: cfg.knockback, chargesSuper: !isSuper,
        asset: isSuper ? "pellet_super" : "pellet",
      })
    );
  }
}

// 史派克：仙人掌 → 命中/到底後朝六邊形頂點爆裂
function spawnCactus(b, cfg, isSuper) {
  const a = b.aimAngle;
  const mx = b.x + Math.cos(a) * (b.radius + 4);
  const my = b.y + Math.sin(a) * (b.radius + 4);
  const smallDmg = cfg.smallDmg;
  const cactusDmg = smallDmg * cfg.cactusDmgMult; // 仙人掌傷害 = 2 顆小子彈

  const proj = new Projectile({
    x: mx, y: my, dx: Math.cos(a), dy: Math.sin(a),
    speed: cfg.projSpeed, radius: cfg.projRadius, range: cfg.range,
    team: b.team, owner: b, color: cfg.cactusColor,
    dmgNear: cactusDmg, dmgFar: cactusDmg,
    chargesSuper: !isSuper, shape: "cactus",
    asset: isSuper ? "cactus_super" : "cactus",
  });

  proj.onDeath = (p) => {
    cfg.ringOffsets.forEach((off) => {
      for (let k = 0; k < cfg.burst; k++) {
        const ang = radians(off) + k * (Math.PI / 3);
        game.projectiles.push(
          new Projectile({
            x: p.x, y: p.y, dx: Math.cos(ang), dy: Math.sin(ang),
            speed: cfg.smallSpeed, radius: cfg.smallRadius, range: cfg.smallRange,
            team: p.team, owner: p.owner, color: cfg.smallColor,
            dmgNear: smallDmg, dmgFar: smallDmg, chargesSuper: false,
            asset: isSuper ? "seed_super" : "seed",
          })
        );
      }
    });
  };

  game.projectiles.push(proj);
}

// 柯爾特：朝瞄準方向連發小子彈(大招為多排加寬)
function spawnLine(b, cfg, isSuper) {
  const a = b.aimAngle; // 開火當下鎖定方向
  const perp = a + Math.PI / 2;
  for (let i = 0; i < cfg.bullets; i++) {
    const fireAt = millis() + i * cfg.burstGapMs;
    const lane = cfg.lanes[i % cfg.lanes.length];
    const offx = Math.cos(perp) * lane * cfg.laneGap;
    const offy = Math.sin(perp) * lane * cfg.laneGap;
    game.pendingShots.push({
      fireAt,
      make: () => {
        if (!b.alive) return null;
        const mx = b.x + Math.cos(a) * (b.radius + 4) + offx;
        const my = b.y + Math.sin(a) * (b.radius + 4) + offy;
        return new Projectile({
          x: mx, y: my, dx: Math.cos(a), dy: Math.sin(a),
          speed: cfg.projSpeed, radius: cfg.projRadius, range: cfg.range,
          team: b.team, owner: b, color: cfg.color,
          dmgNear: cfg.dmg, dmgFar: cfg.dmg, chargesSuper: !isSuper,
          asset: isSuper ? "bolt_super" : "bolt",
        });
      },
    });
  }
}
