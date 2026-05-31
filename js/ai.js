// ============================================================
// ai.js — AI 控制器(輸出與玩家等價的 intent)
// 狀態：搶球 / 持球進攻 / 攻擊敵人 / 回防攔截
// ============================================================

function aiMoveToward(b, tx, ty, stopDist = 8) {
  const dx = tx - b.x;
  const dy = ty - b.y;
  if (Math.hypot(dx, dy) <= stopDist) {
    b.intent.mx = 0;
    b.intent.my = 0;
    return;
  }
  b.intent.mx = dx;
  b.intent.my = dy;
}

class AIController {
  constructor(brawler) {
    this.brawler = brawler;
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
        aiMoveToward(b, enemyGoal.x, enemyGoal.y);
      }
      return;
    }

    // --- 球自由：最近者去搶，其餘卡位支援 ---
    if (ball.carrier === null) {
      if (this.shouldChaseBall()) {
        aiMoveToward(b, ball.x, ball.y, 2);
      } else {
        const tx = lerpNum(ball.x, enemyGoal.x, 0.4);
        const ty = lerpNum(ball.y, enemyGoal.y, 0.4);
        aiMoveToward(b, tx, ty);
      }
      this.maybeShoot(nearestEnemy);
      return;
    }

    // --- 隊友持球：護送並沿途攻擊 ---
    if (ball.carrier.team === b.team) {
      const tx = lerpNum(ball.carrier.x, enemyGoal.x, 0.55);
      const ty = lerpNum(ball.carrier.y, enemyGoal.y, 0.55);
      aiMoveToward(b, tx, ty);
      this.maybeShoot(nearestEnemy);
      return;
    }

    // --- 敵方持球：追擊持球者並回防 ---
    const carrier = ball.carrier;
    const dCarrier = distXY(b.x, b.y, carrier.x, carrier.y);
    if (dCarrier < 260) {
      aiMoveToward(b, carrier.x, carrier.y, 2);
      this.maybeShoot(carrier);
    } else {
      // 退回到球與己門之間攔截
      const tx = lerpNum(carrier.x, ownGoal.x, 0.45);
      const ty = lerpNum(carrier.y, ownGoal.y, 0.45);
      aiMoveToward(b, tx, ty);
      this.maybeShoot(nearestEnemy);
    }
  }
}
