// ============================================================
// ai.js — AI 控制器(輸出與玩家等價的 intent)
// 狀態：搶球 / 持球進攻 / 攻擊敵人 / 回防攔截
// ============================================================

// 從 b 沿 ang 探出 probe 距離,該處是否無障礙物(留 b 半徑+餘裕)
function aiClearAhead(b, ang, probe) {
  const px = b.x + Math.cos(ang) * probe;
  const py = b.y + Math.sin(ang) * probe;
  for (const o of game.obstacles) {
    if (circleRectOverlap(px, py, b.colRadius + 4, o)) return false;
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
    // 決策遲滯與站位
    this.chasing = false; // 是否正在搶球(含遲滯,避免兩人輪流搶造成抖動)
    this.midSide = BRAWLER_ORDER.indexOf(brawler.key) % 2 === 0 ? -1 : 1; // 中路 AI 擇邊(含遲滯)
    this.rejoinUntil = 0; // 重生後一段時間直接追球歸隊
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

    // 前方是否被障礙物擋住(空曠處 = 沒擋)
    const probe = b.colRadius + 30;
    const straightClear = aiClearAhead(b, desired, probe);

    // 卡住偵測:只有「前方被擋 + 幾乎沒位移」才累計 → 空曠處絕不誤判、不會亂抖
    // (僅在實際比賽中累計;倒數時角色不能動,不算卡住)
    const playing = game.state === STATE.PLAYING;
    if (playing && !straightClear && dist2(b.x, b.y, this.px, this.py) < 0.5) this.stuckMs += deltaTime;
    else this.stuckMs = 0;
    this.px = b.x;
    this.py = b.y;
    if (playing && !straightClear && this.stuckMs > 200 && now > this.unstickUntil) {
      // 選一側較開闊的方向繞行
      const left = aiClearAhead(b, desired + 1.4, b.colRadius + 36);
      const right = aiClearAhead(b, desired - 1.4, b.colRadius + 36);
      this.unstickSign = left && !right ? 1 : right && !left ? -1 : (Math.sin(b.y * 0.13 + b.x * 0.07) >= 0 ? 1 : -1);
      this.unstickUntil = now + 420;
      this.stuckMs = 0;
    }

    let chosen = desired;
    if (now < this.unstickUntil) {
      chosen = desired + this.unstickSign * 1.25; // 脫困:側向繞
    } else if (straightClear) {
      chosen = desired; // 空曠:直接走向目標,不繞不抖
    } else {
      // 前方被擋:漸增偏轉角繞過;優先沿用「上次繞行側」避免逐幀左右橫跳
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
        const left = aiClearAhead(b, desired + 1.4, b.colRadius + 36);
        const right = aiClearAhead(b, desired - 1.4, b.colRadius + 36);
        this.unstickSign = left && !right ? 1 : right && !left ? -1 : this.turnSign;
        this.unstickUntil = now + 420;
        chosen = desired + this.unstickSign * 1.25;
      }
    }
    b.intent.mx = Math.cos(chosen);
    b.intent.my = Math.sin(chosen);
  }

  // 路線 X:雪莉走左路 / 柯爾特走右路 / 史派克走中路(中路擇一側避開中央障礙,含遲滯)
  laneX(ball) {
    const f = CONFIG.field;
    const cx = (f.left + f.right) / 2;
    const i = BRAWLER_ORDER.indexOf(this.brawler.key);
    if (i === 0) return f.left + 120; // 左路 ≈180
    if (i === 2) return f.right - 120; // 右路 ≈520
    // 中路:往球所在那側偏,避開正中央障礙;±30px 死區避免在中線左右亂跳
    if (ball.x < cx - 30) this.midSide = -1;
    else if (ball.x > cx + 30) this.midSide = 1;
    return cx + this.midSide * 95; // ≈255 或 ≈445
  }

  // 是否由我去搶自由球(只讓最近者去搶,其餘支援);含遲滯避免兩人輪流搶造成抖動
  shouldChaseBall() {
    const b = this.brawler;
    const ball = game.ball;
    let bestOther = Infinity;
    for (const o of game.brawlers) {
      if (o === b || o.team !== b.team || !o.alive) continue;
      const d = distXY(o.x, o.y, ball.x, ball.y);
      if (d < bestOther) bestOther = d;
    }
    const myD = distXY(b.x, b.y, ball.x, ball.y);
    // 已在搶:即使比最近隊友遠 40px 內也續搶;沒在搶:要明顯近 40px 才接手
    const margin = this.chasing ? 40 : -40;
    this.chasing = myD <= bestOther + margin;
    return this.chasing;
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

    const now = millis();

    // --- 持球：帶往敵門，近門就射 ---
    if (b.hasBall) {
      b.intent.aimX = enemyGoal.x;
      b.intent.aimY = enemyGoal.y;
      const dGoal = distXY(b.x, b.y, enemyGoal.x, enemyGoal.y);
      if (dGoal < 235) {
        if (b.canSuper()) b.intent.fireSuper = true;
        else b.intent.fire = true;
      } else {
        this.move(enemyGoal.x, enemyGoal.y, 8);
      }
      return;
    }

    // --- 搶球：剛重生者、或最近的隊友 → 直接追球(球被持有時=追持球者) ---
    if (now < this.rejoinUntil || this.shouldChaseBall()) {
      this.move(ball.x, ball.y, 6);
      this.maybeShoot(nearestEnemy);
      return;
    }

    // --- 其餘：守住自己的路線(左/中/右),y 依攻守前壓或回防 ---
    const carrierTeam = ball.carrier ? ball.carrier.team : null;
    let baseY;
    if (carrierTeam === b.team) baseY = lerpNum(ball.y, enemyGoal.y, 0.55); // 我方持球:壓上接應
    else if (carrierTeam) baseY = lerpNum(ball.y, ownGoal.y, 0.4); // 敵方持球:回防
    else baseY = lerpNum(ball.y, enemyGoal.y, 0.25); // 自由球:稍微壓上
    const t = aiNudgeTarget(this.laneX(ball), baseY, b.colRadius);
    this.move(t.x, t.y, 18);
    this.maybeShoot(nearestEnemy);
  }
}
