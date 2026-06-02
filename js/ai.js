// ============================================================
// ai.js — AI 控制器(輸出與玩家等價的 intent)
// 狀態：搶球 / 持球進攻 / 攻擊敵人 / 回防攔截
// ============================================================

// 從 b 沿 ang 探出 probe 距離,該處是否無障礙物(留 b 半徑+餘裕)
function aiClearAhead(b, ang, probe) {
  const px = b.x + Math.cos(ang) * probe;
  const py = b.y + Math.sin(ang) * probe;
  for (const o of game.obstacles) {
    if (circleRectOverlap(px, py, b.radius + 4, o)) return false;
  }
  return true;
}

// 若目標點落在障礙物內,推到牆外的可達點(避免 AI 對著牆內目標空轉)
function aiNudgeTarget(tx, ty, r) {
  for (const o of game.obstacles) {
    const res = resolveCircleRect(tx, ty, r, o);
    if (res) {
      tx = res.x;
      ty = res.y;
    }
  }
  return { x: tx, y: ty };
}

class AIController {
  constructor(brawler) {
    this.brawler = brawler;
    // 卡住偵測 / 轉向遲滯
    this.px = brawler.x;
    this.py = brawler.y;
    this.stuckMs = 0;
    this.unstickUntil = 0;
    this.unstickSign = 1;
    this.turnSign = 1; // 上次繞行側(+1=左 / -1=右),用於平滑繞障
  }

  // 朝 (tx,ty) 前進,自動繞過障礙物;含「撞牆卡住 → 側向脫困」機制
  move(tx, ty, stopDist = 8) {
    const b = this.brawler;
    const now = millis();
    const dx = tx - b.x;
    const dy = ty - b.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= stopDist) {
      b.intent.mx = 0;
      b.intent.my = 0;
      this.stuckMs = 0;
      this.px = b.x;
      this.py = b.y;
      return;
    }
    const desired = Math.atan2(dy, dx);

    // 卡住偵測:想動卻幾乎沒位移 → 進入脫困模式一小段時間
    // (僅在實際比賽中累計;倒數時角色不能動,不算卡住)
    const playing = game.state === STATE.PLAYING;
    if (playing && dist2(b.x, b.y, this.px, this.py) < 0.5) this.stuckMs += deltaTime;
    else this.stuckMs = 0;
    this.px = b.x;
    this.py = b.y;
    if (playing && this.stuckMs > 200 && now > this.unstickUntil) {
      // 選一側較開闊的方向繞行
      const left = aiClearAhead(b, desired + 1.4, b.radius + 36);
      const right = aiClearAhead(b, desired - 1.4, b.radius + 36);
      this.unstickSign = left && !right ? 1 : right && !left ? -1 : (Math.sin(b.y * 0.13 + b.x * 0.07) >= 0 ? 1 : -1);
      this.unstickUntil = now + 420;
      this.stuckMs = 0;
    }

    let chosen = desired;
    if (now < this.unstickUntil) {
      chosen = desired + this.unstickSign * 1.25; // 脫困:側向繞
    } else {
      // 直行被擋就漸增偏轉角繞過;優先沿用「上次繞行側」避免逐幀左右橫跳
      const probe = b.radius + 30;
      const s = this.turnSign;
      const offsets = [0, 0.5 * s, 1.0 * s, 1.5 * s, -0.5 * s, -1.0 * s, -1.5 * s, 2.1 * s, -2.1 * s];
      let found = false;
      for (const off of offsets) {
        if (aiClearAhead(b, desired + off, probe)) {
          chosen = desired + off;
          if (off > 0.01) this.turnSign = 1;
          else if (off < -0.01) this.turnSign = -1;
          found = true;
          break;
        }
      }
      // 四面被包圍:不要硬頂牆抽動,立刻側移脫困
      if (!found && now > this.unstickUntil) {
        const left = aiClearAhead(b, desired + 1.4, b.radius + 36);
        const right = aiClearAhead(b, desired - 1.4, b.radius + 36);
        this.unstickSign = left && !right ? 1 : right && !left ? -1 : this.turnSign;
        this.unstickUntil = now + 420;
        chosen = desired + this.unstickSign * 1.25;
      }
    }
    b.intent.mx = Math.cos(chosen);
    b.intent.my = Math.sin(chosen);
  }

  // 是否為我方距離球最近者(只讓最近的去搶，其餘支援)
  shouldChaseBall() {
    const b = this.brawler;
    const ball = game.ball;
    const mates = game.brawlers.filter((o) => o.team === b.team && o.alive);
    mates.sort(
      (p, q) => dist2(p.x, p.y, ball.x, ball.y) - dist2(q.x, q.y, ball.x, ball.y)
    );
    return mates.length > 0 && mates[0] === b;
  }

  maybeShoot(target) {
    const b = this.brawler;
    if (!target) return;
    b.intent.aimX = target.x;
    b.intent.aimY = target.y;
    const d = distXY(b.x, b.y, target.x, target.y);
    if (b.canSuper() && d < b.stats.super.range) {
      b.intent.fireSuper = true;
      return;
    }
    if (d < b.stats.attack.range * 0.95 && b.ammo >= 1) {
      b.intent.fire = true;
    }
  }

  think() {
    const b = this.brawler;
    const ball = game.ball;
    const enemyGoal = game.goalCenterFor(b.team);  // 我方進攻目標
    const ownGoal = game.goalCenterAgainst(b.team); // 我方需防守
    const nearestEnemy = game.nearestEnemy(b);

    // 重置意圖
    b.intent.mx = 0;
    b.intent.my = 0;
    b.intent.fire = false;
    if (nearestEnemy) {
      b.intent.aimX = nearestEnemy.x;
      b.intent.aimY = nearestEnemy.y;
    }

    // --- 我方持球：帶往敵門，近門就射 ---
    if (b.hasBall) {
      b.intent.aimX = enemyGoal.x;
      b.intent.aimY = enemyGoal.y;
      const dGoal = distXY(b.x, b.y, enemyGoal.x, enemyGoal.y);
      if (dGoal < 235) {
        if (b.canSuper()) b.intent.fireSuper = true;
        else b.intent.fire = true;
      } else {
        this.move(enemyGoal.x, enemyGoal.y);
      }
      return;
    }

    // --- 球自由：最近者去搶，其餘卡位支援 ---
    if (ball.carrier === null) {
      if (this.shouldChaseBall()) {
        this.move(ball.x, ball.y, 2);
      } else {
        const t = aiNudgeTarget(lerpNum(ball.x, enemyGoal.x, 0.4), lerpNum(ball.y, enemyGoal.y, 0.4), b.radius);
        this.move(t.x, t.y, 14);
      }
      this.maybeShoot(nearestEnemy);
      return;
    }

    // --- 隊友持球：護送並沿途攻擊 ---
    if (ball.carrier.team === b.team) {
      const t = aiNudgeTarget(lerpNum(ball.carrier.x, enemyGoal.x, 0.55), lerpNum(ball.carrier.y, enemyGoal.y, 0.55), b.radius);
      this.move(t.x, t.y, 14);
      this.maybeShoot(nearestEnemy);
      return;
    }

    // --- 敵方持球：追擊持球者並回防 ---
    const carrier = ball.carrier;
    const dCarrier = distXY(b.x, b.y, carrier.x, carrier.y);
    if (dCarrier < 260) {
      this.move(carrier.x, carrier.y, 2);
      this.maybeShoot(carrier);
    } else {
      // 退回到球與己門之間攔截
      const t = aiNudgeTarget(lerpNum(carrier.x, ownGoal.x, 0.45), lerpNum(carrier.y, ownGoal.y, 0.45), b.radius);
      this.move(t.x, t.y, 14);
      this.maybeShoot(nearestEnemy);
    }
  }
}
