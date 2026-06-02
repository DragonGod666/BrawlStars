// ============================================================
// game.js — 比賽管理：隊伍、計分、碰撞、進球、重生、勝負
// ============================================================

class Game {
  constructor() {
    this.state = STATE.MENU;
    this.brawlers = [];
    this.projectiles = [];
    this.pendingShots = []; // 柯爾特連發排程
    this.ball = null;
    this.player = null;

    this.score = { A: 0, B: 0 };
    this.matchTimeLeftMs = CONFIG.match.durationMs;
    this.countdownEndAt = 0;
    this.goalEndAt = 0;
    this.lastScorer = null;
    this.winner = null;

    this.selectedKey = "shelly"; // 選角畫面預設
    this.selectedMapId = MAP_ORDER[0]; // 選圖畫面預設

    // 當前地圖佈局(選圖後由 applyMap 設定；先給預設避免繪製出錯)
    this.obstacles = MAPS[0].obstacles;
    this.bushes = MAPS[0].bushes;
    this.wallTheme = MAPS[0].wall;
  }

  // 套用選定地圖的佈局與配色
  applyMap(mapId) {
    const m = getMap(mapId);
    this.selectedMapId = m.id;
    this.loadObstacles(); // 可破壞副本(不污染共用地圖資料)
    this.bushes = m.bushes;
    this.wallTheme = m.wall;
  }

  // 從目前地圖深拷貝一份障礙物(破牆後可在開球時重生)
  loadObstacles() {
    this.obstacles = getMap(this.selectedMapId).obstacles.map((o) => ({ ...o }));
  }

  // ---------- 幾何 / 球門 ----------
  get centerX() {
    return (CONFIG.field.left + CONFIG.field.right) / 2;
  }
  get centerY() {
    return (CONFIG.field.top + CONFIG.field.bottom) / 2;
  }
  topGoalCenter() {
    return { x: this.centerX, y: CONFIG.field.top };
  }
  bottomGoalCenter() {
    return { x: this.centerX, y: CONFIG.field.bottom };
  }
  // 我方進攻的球門(A 攻上門、B 攻下門)
  goalCenterFor(team) {
    return team === "A" ? this.topGoalCenter() : this.bottomGoalCenter();
  }
  goalCenterAgainst(team) {
    return team === "A" ? this.bottomGoalCenter() : this.topGoalCenter();
  }
  inGoalMouth(x) {
    return Math.abs(x - this.centerX) < CONFIG.goal.halfWidth;
  }

  nearestEnemy(b) {
    let best = null;
    let bestD = Infinity;
    for (const o of this.brawlers) {
      if (!o.alive || o.team === b.team) continue;
      if (o.concealed) continue; // 躲草叢的敵人無法被鎖定
      const d = dist2(b.x, b.y, o.x, o.y);
      if (d < bestD) {
        bestD = d;
        best = o;
      }
    }
    return best;
  }

  // ---------- 建立比賽 ----------
  startMatch(playerKey, mapId) {
    this.selectedKey = playerKey;
    if (mapId) this.applyMap(mapId);
    this.score = { A: 0, B: 0 };
    this.matchTimeLeftMs = CONFIG.match.durationMs;
    this.winner = null;
    this.lastScorer = null;
    this.setupTeams(playerKey);
    this.startCountdown();
  }

  setupTeams(playerKey) {
    this.brawlers = [];
    this.projectiles = [];
    this.pendingShots = [];
    const xs = [230, 350, 470];
    const order = BRAWLER_ORDER;

    // A 隊(玩家方，下方出生)
    order.forEach((key, i) => {
      const isPlayer = key === playerKey;
      const b = new Brawler(key, "A", isPlayer, xs[i], 705);
      if (!isPlayer) b.ai = new AIController(b);
      else this.player = b;
      this.brawlers.push(b);
    });
    // B 隊(敵方，上方出生)
    order.forEach((key, i) => {
      const b = new Brawler(key, "B", false, xs[i], 185);
      b.ai = new AIController(b);
      this.brawlers.push(b);
    });

    this.ball = new Ball(this.centerX, this.centerY);
  }

  resetPositions() {
    for (const b of this.brawlers) {
      b.alive = true;
      b.hp = b.maxHp;
      b.x = b.spawn.x;
      b.y = b.spawn.y;
      b.hasBall = false;
      b.ammo = 3;
      b.lastAttackAt = -99999;
      b.lastDamagedAt = -99999;
      b.aimAngle = b.team === "A" ? -Math.PI / 2 : Math.PI / 2;
      // 保留大招充能(獎勵)
    }
    this.ball.reset(this.centerX, this.centerY);
    this.projectiles = [];
    this.pendingShots = [];
    // 進球後不復原場地:被大招打掉的牆整場保持破壞(只在開新比賽時重置)
  }

  startCountdown() {
    this.state = STATE.COUNTDOWN;
    this.countdownEndAt = millis() + CONFIG.match.countdownMs;
  }

  someoneWon() {
    return this.score.A >= CONFIG.match.goalsToWin || this.score.B >= CONFIG.match.goalsToWin;
  }

  endMatch() {
    this.state = STATE.GAMEOVER;
    this.winner = this.score.A > this.score.B ? "A" : this.score.B > this.score.A ? "B" : "DRAW";
  }

  // ---------- 主迴圈 ----------
  update() {
    const s = dtScale();

    if (this.state === STATE.COUNTDOWN) {
      this.updateEntities(s);
      if (millis() >= this.countdownEndAt) this.state = STATE.PLAYING;
    } else if (this.state === STATE.PLAYING) {
      this.updateEntities(s);
      this.checkGoal();
      this.matchTimeLeftMs -= deltaTime;
      if (this.matchTimeLeftMs <= 0) {
        this.matchTimeLeftMs = 0;
        this.endMatch();
      }
    } else if (this.state === STATE.GOAL) {
      this.updateEntities(s);
      if (millis() >= this.goalEndAt) {
        if (this.someoneWon()) this.endMatch();
        else {
          this.resetPositions();
          this.startCountdown();
        }
      }
    }
  }

  updateEntities(s) {
    for (const b of this.brawlers) b.update(s);
    this.separateBrawlers();
    this.resolveBrawlerObstacles();
    this.ball.update(s);
    this.resolveBallObstacles();
    this.processPendingShots();
    for (const p of this.projectiles) p.update(s);
    this.killProjectilesOnObstacles();
    this.handleProjectileHits();
    this.projectiles = this.projectiles.filter((p) => p.alive);
    this.updateStealth();
  }

  // ---------- 障礙物碰撞 ----------
  resolveBrawlerObstacles() {
    const f = CONFIG.field;
    for (const b of this.brawlers) {
      if (!b.alive) continue;
      // 多趟迭代:同時壓到相鄰障礙物時收斂出無重疊位置,避免抖動/卡死
      // 用較小的 colRadius(約 1 格)→ 角色不會卡在轉角,立繪可略微疊到牆上
      for (let iter = 0; iter < 3; iter++) {
        let moved = false;
        for (const o of this.obstacles) {
          const res = resolveCircleRect(b.x, b.y, b.colRadius, o);
          if (res) {
            b.x = res.x;
            b.y = res.y;
            moved = true;
          }
        }
        if (!moved) break;
      }
      // 推出後重新夾回球場邊界
      b.x = clampNum(b.x, f.left + b.radius, f.right - b.radius);
      b.y = clampNum(b.y, f.top + b.radius, f.bottom - b.radius);
    }
  }

  resolveBallObstacles() {
    const ball = this.ball;
    if (ball.carrier) return;
    for (const o of this.obstacles) {
      const res = resolveCircleRect(ball.x, ball.y, ball.radius, o);
      if (res) {
        ball.x = res.x;
        ball.y = res.y;
        const dot = ball.vx * res.nx + ball.vy * res.ny;
        if (dot < 0) {
          const rest = 1 + 0.7;
          ball.vx -= rest * dot * res.nx;
          ball.vy -= rest * dot * res.ny;
        }
      }
    }
  }

  killProjectilesOnObstacles() {
    const destroyed = new Set();
    for (const p of this.projectiles) {
      if (!p.alive) continue;
      for (const o of this.obstacles) {
        if (destroyed.has(o)) continue;
        if (circleRectOverlap(p.x, p.y, p.radius, o)) {
          if (p.breaksWalls) {
            destroyed.add(o); // 打掉這段牆,子彈穿牆續飛(不 kill)
            continue;
          }
          p.kill();
          break;
        }
      }
    }
    if (destroyed.size) this.obstacles = this.obstacles.filter((o) => !destroyed.has(o));
  }

  // ---------- 草叢隱形 ----------
  isInBush(x, y) {
    for (const bz of this.bushes) {
      if (x >= bz.x && x <= bz.x + bz.w && y >= bz.y && y <= bz.y + bz.h) return true;
    }
    return false;
  }

  updateStealth() {
    const R = CONFIG.bushRevealRadius;
    const now = millis();
    for (const b of this.brawlers) {
      if (!b.alive) {
        b.inBush = false;
        b.concealed = false;
        continue;
      }
      b.inBush = this.isInBush(b.x, b.y);
      if (!b.inBush) {
        b.concealed = false;
        continue;
      }
      let revealed = now - b.lastAttackAt < 700 || b.hasBall;
      if (!revealed) {
        for (const o of this.brawlers) {
          if (o.alive && o.team !== b.team && dist2(b.x, b.y, o.x, o.y) < R * R) {
            revealed = true;
            break;
          }
        }
      }
      b.concealed = !revealed;
    }
  }

  processPendingShots() {
    if (this.pendingShots.length === 0) return;
    const now = millis();
    const remain = [];
    for (const shot of this.pendingShots) {
      if (now >= shot.fireAt) {
        const p = shot.make();
        if (p) this.projectiles.push(p);
      } else {
        remain.push(shot);
      }
    }
    this.pendingShots = remain;
  }

  handleProjectileHits() {
    const snapshot = this.projectiles.slice();
    for (const p of snapshot) {
      if (!p.alive) continue;
      for (const b of this.brawlers) {
        if (!b.alive || b.team === p.team) continue;
        if (p.hitSet.has(b)) continue; // 穿透:同一發不重複扣血
        if (circlesOverlap(p.x, p.y, p.radius, b.x, b.y, b.radius)) {
          b.takeDamage(p.computeDamage(), p.knockback, p.dirAngle);
          p.hitSet.add(b);
          if (p.chargesSuper && p.owner && p.owner.alive) {
            p.owner.gainSuper(p.owner.stats.superPerHit);
          }
          if (p.pierce) continue; // 穿透:繼續打後方敵人,不消失
          p.kill(); // 仙人掌會在此觸發爆裂
          break;
        }
      }
    }
  }

  // 角色之間不互相碰撞(可重疊),僅夾回球場邊界
  separateBrawlers() {
    const f = CONFIG.field;
    for (const b of this.brawlers) {
      if (!b.alive) continue;
      b.x = clampNum(b.x, f.left + b.radius, f.right - b.radius);
      b.y = clampNum(b.y, f.top + b.radius, f.bottom - b.radius);
    }
  }

  checkGoal() {
    const f = CONFIG.field;
    const ball = this.ball;
    if (ball.carrier) return; // 需踢進(自由球)才算分，避免持球走入造成烏龍
    if (!this.inGoalMouth(ball.x)) return;
    if (ball.y < f.top) {
      this.scoreGoal("A"); // 上門 → A 隊得分
    } else if (ball.y > f.bottom) {
      this.scoreGoal("B"); // 下門 → B 隊得分
    }
  }

  scoreGoal(team) {
    this.score[team]++;
    this.lastScorer = team;
    Sound.play("goal");
    this.state = STATE.GOAL;
    this.goalEndAt = millis() + CONFIG.match.goalCelebrateMs;
    if (this.ball.carrier) this.ball.drop();
    this.ball.vx = 0;
    this.ball.vy = 0;
  }
}

// 全域單例(於 sketch.setup 建立)
let game;
