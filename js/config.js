// ============================================================
// config.js — 全域常數與三角色數值表
// 所有平衡數值集中在此，方便調整。
// 時間單位：毫秒(ms)。速度單位：像素 / 幀(以 60fps 為基準，實際以 dt 縮放)。
// ============================================================

const CONFIG = {
  canvas: { w: 700, h: 860 },

  // 球場可移動邊界(內牆)
  field: { left: 60, right: 640, top: 90, bottom: 800 },

  // 球門：mouth = 球門開口半寬(以球場中線為中心)，depth = 視覺凹陷深度
  goal: { halfWidth: 82, depth: 34 },

  ball: {
    radius: 13,
    friction: 0.982,      // 每幀速度衰減
    minSpeed: 0.3,        // 低於此速度視為靜止
    kickSpeed: 9.5,       // 普通踢球初速
    superKickSpeed: 17,   // 大招踢球初速
    pickupCooldownMs: 400,// 踢出後該角色短暫無法立即回收
    carryOffset: 24,      // 持球時球停在角色前方的距離
  },

  match: {
    goalsToWin: 2,
    durationMs: 150000,   // 2:30 平手判定用
    countdownMs: 3000,    // 開賽 / 進球後重新開球倒數
    goalCelebrateMs: 1600,// 進球慶祝停頓
    respawnMs: 3200,      // 陣亡重生
  },

  regen: {
    delayMs: 1500,        // 需「未攻擊且未受擊」持續此時間才開始回血
    fractionPerSecond: 0.20, // 每秒回復最大血量的比例
  },

  // 隊伍顏色(角色填色維持角色本色，靠光環區分敵我)
  teamColor: {
    A: "#2f6bef", // 玩家方 = 藍
    B: "#ef4444", // 敵方   = 紅
  },

  superMax: 100,          // 大招充能上限

  // 草叢：站在其中會對「敵方」隱形(攻擊/持球/敵人靠近會現形)
  bushRevealRadius: 80,

  // 障礙物(阻擋移動、子彈、足球) — CORNER 座標
  obstacles: [
    // 中場掩體
    { x: 150, y: 320, w: 60, h: 62 },
    { x: 490, y: 320, w: 60, h: 62 },
    { x: 150, y: 508, w: 60, h: 62 },
    { x: 490, y: 508, w: 60, h: 62 },
    // 敵方(上)球門前掩體 — 放慢進攻節奏
    { x: 232, y: 238, w: 56, h: 46 },
    { x: 412, y: 238, w: 56, h: 46 },
    // 我方(下)球門前掩體
    { x: 232, y: 606, w: 56, h: 46 },
    { x: 412, y: 606, w: 56, h: 46 },
  ],

  // 草叢區 — CORNER 座標
  bushes: [
    { x: 84, y: 392, w: 96, h: 106 },   // 中場左
    { x: 520, y: 392, w: 96, h: 106 },  // 中場右
    { x: 285, y: 158, w: 130, h: 54 },  // 敵門前
    { x: 285, y: 678, w: 130, h: 54 },  // 我門前
  ],

  // ---------------------------------------------------------
  // 三角色：雪莉 / 史派克 / 柯爾特
  // ---------------------------------------------------------
  brawlers: {
    shelly: {
      key: "shelly",
      name: "雪莉",
      color: "#8B5CF6",   // 紫色實心圓
      maxHp: 4200,
      speed: 3.2,
      radius: 20,
      ammoReloadMs: 1600, // 每格彈藥回充時間
      superPerHit: 9,     // 每顆普攻彈命中累積的大招值
      attack: {
        type: "fan",
        pellets: 5,
        spreadDeg: 34,
        range: 235,
        projSpeed: 11,
        projRadius: 6,
        dmgNear: 360,     // 點放(最近)單顆傷害
        dmgFar: 150,      // 最遠單顆傷害
        knockback: 0,
        color: "#E9D5FF", // 淺紫白
      },
      super: {
        type: "fan",
        pellets: 9,
        spreadDeg: 46,
        range: 320,
        projSpeed: 12,
        projRadius: 7,
        dmgNear: 520,
        dmgFar: 230,
        knockback: 14,
        color: "#FF3DCB", // 亮洋紅(區分大招)
      },
    },

    spike: {
      key: "spike",
      name: "史派克",
      color: "#22C55E",   // 綠色實心圓
      maxHp: 3300,
      speed: 3.3,
      radius: 19,
      ammoReloadMs: 1700,
      superPerHit: 11,
      attack: {
        type: "cactus",
        // 仙人掌
        projSpeed: 9,
        range: 235,
        projRadius: 9,
        cactusColor: "#15803D", // 深綠
        // 爆裂小子彈
        burst: 6,           // 六邊形 6 頂點
        ringOffsets: [0],   // 單環
        smallSpeed: 8,
        smallRange: 92,
        smallRadius: 5,
        smallDmg: 200,      // 小子彈傷害
        // 仙人掌傷害 = 2 顆小子彈
        cactusDmgMult: 2,
        smallColor: "#86EFAC", // 淺綠
      },
      super: {
        type: "cactus",
        projSpeed: 9,
        range: 250,
        projRadius: 13,
        cactusColor: "#166534",
        burst: 6,
        ringOffsets: [0, 30], // 雙環(12 顆)
        smallSpeed: 9,
        smallRange: 120,
        smallRadius: 6,
        smallDmg: 260,
        cactusDmgMult: 2,
        smallColor: "#FDE047", // 黃綠(區分大招)
      },
    },

    colt: {
      key: "colt",
      name: "柯爾特",
      color: "#EF4444",   // 紅色實心圓
      maxHp: 3100,
      speed: 3.4,
      radius: 18,
      ammoReloadMs: 1550,
      superPerHit: 7,
      attack: {
        type: "line",
        bullets: 4,         // 一發 = 連射 4 顆
        burstGapMs: 55,     // 連射間隔
        lanes: [0],         // 單排
        laneGap: 0,
        projSpeed: 13,
        range: 330,
        projRadius: 4,
        dmg: 150,
        color: "#FCA5A5",   // 淺紅
      },
      super: {
        type: "line",
        bullets: 9,
        burstGapMs: 45,
        lanes: [-1, 0, 1],  // 三排(更寬)
        laneGap: 11,
        projSpeed: 14,
        range: 400,
        projRadius: 5,
        dmg: 220,
        color: "#FDE047",   // 黃(區分大招)
      },
    },
  },
};

// 角色顯示順序(選角畫面用)
const BRAWLER_ORDER = ["shelly", "spike", "colt"];

// 遊戲狀態
const STATE = {
  MENU: "MENU",
  COUNTDOWN: "COUNTDOWN",
  PLAYING: "PLAYING",
  GOAL: "GOAL",
  GAMEOVER: "GAMEOVER",
};
