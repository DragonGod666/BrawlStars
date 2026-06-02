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

  // 障礙物與草叢佈局改由「地圖」定義(見檔案末端 MAPS)。
  // 牆面預設配色(地圖未指定時的備援)
  wallTheme: { base: "#475569", hi: "#64748b", edge: "#0f172a" },

  // ---------------------------------------------------------
  // 三角色：雪莉 / 史派克 / 柯爾特
  // ---------------------------------------------------------
  brawlers: {
    shelly: {
      key: "shelly",
      name: "雪莉",
      color: "#8B5CF6",   // 紫色實心圓
      maxHp: 4200,
      speed: 2.35,
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
        pierce: true,      // 穿透敵人
        breaksWalls: true, // 破壞牆面
      },
    },

    spike: {
      key: "spike",
      name: "史派克",
      color: "#22C55E",   // 綠色實心圓
      maxHp: 3300,
      speed: 2.45,
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
      speed: 2.55,
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
        pierce: true,       // 穿透敵人
        breaksWalls: true,  // 破壞牆面
      },
    },
  },
};

// 角色顯示順序(選角畫面用)
const BRAWLER_ORDER = ["shelly", "spike", "colt"];

// 遊戲狀態
const STATE = {
  MENU: "MENU",         // 選角
  MAPSELECT: "MAPSELECT", // 選地圖
  COUNTDOWN: "COUNTDOWN",
  PLAYING: "PLAYING",
  GOAL: "GOAL",
  GAMEOVER: "GAMEOVER",
};

// ============================================================
// 地圖：每張地圖定義自己的障礙物與草叢佈局(球場/球門共用)。
// 佈局以「上半場」座標撰寫，透過 mirrorY 自動鏡射出下半場，
// 確保上下兩隊完全對稱、公平。座標皆為 CORNER {x,y,w,h}。
// ============================================================
const FIELD_CY = (CONFIG.field.top + CONFIG.field.bottom) / 2; // 445

// 將上半場物件鏡射複製到下半場(置中於中線者不重複)
function mirrorY(items) {
  const out = [];
  for (const it of items) {
    out.push({ x: it.x, y: it.y, w: it.w, h: it.h });
    const my = 2 * FIELD_CY - it.y - it.h;
    if (Math.abs(my - it.y) > 0.5) out.push({ x: it.x, y: my, w: it.w, h: it.h });
  }
  return out;
}

const MAPS = [
  {
    id: "stadium",
    name: "亂鬥球場",
    desc: ["中央磚牆對峙", "邊路開闊好繞後"],
    wall: { base: "#b45f43", hi: "#cf7a5c", edge: "#5c2a1a" }, // 紅磚
    obstacles: mirrorY([
      // 角落 L 形(兩矩形重疊 → 渲染成相連一塊)
      { x: 90, y: 150, w: 100, h: 30 }, { x: 90, y: 150, w: 30, h: 96 },
      { x: 510, y: 150, w: 100, h: 30 }, { x: 580, y: 150, w: 30, h: 96 },
      { x: 300, y: 300, w: 100, h: 30 }, // 中央橫牆
      { x: 150, y: 418, w: 48, h: 54 },  // 中場側柱(置中)
      { x: 502, y: 418, w: 48, h: 54 },
    ]),
    bushes: mirrorY([
      { x: 84, y: 300, w: 92, h: 100 },  // 邊路草叢
      { x: 524, y: 300, w: 92, h: 100 },
      { x: 236, y: 368, w: 60, h: 62 },  // 中央側翼
      { x: 404, y: 368, w: 60, h: 62 },
    ]),
  },
  {
    id: "fortress",
    name: "木桶要塞",
    desc: ["箱體密集纏鬥", "錯位磚牆掩護"],
    wall: { base: "#a3742f", hi: "#c08f43", edge: "#5a3d12" }, // 木箱
    obstacles: mirrorY([
      // 角落 L 形(較大)
      { x: 90, y: 150, w: 110, h: 30 }, { x: 90, y: 150, w: 30, h: 120 },
      { x: 500, y: 150, w: 110, h: 30 }, { x: 580, y: 150, w: 30, h: 120 },
      { x: 212, y: 240, w: 48, h: 44 },  // 球門漏斗
      { x: 440, y: 240, w: 48, h: 44 },
      { x: 150, y: 392, w: 30, h: 106 }, // 中場側豎牆(置中)
      { x: 520, y: 392, w: 30, h: 106 },
      { x: 300, y: 300, w: 100, h: 28 }, // 中央橫牆
    ]),
    bushes: mirrorY([
      { x: 196, y: 300, w: 64, h: 60 },  // 側邊
      { x: 436, y: 300, w: 64, h: 60 },
      { x: 284, y: 372, w: 46, h: 71 },  // 中央雙側翼
      { x: 370, y: 372, w: 46, h: 71 },
    ]),
  },
  {
    id: "bowl",
    name: "後院足球場",
    desc: ["長柵欄封鎖中路", "草帶側翼潛行"],
    wall: { base: "#d98324", hi: "#eaa54a", edge: "#7a4410" }, // 橘柵欄
    obstacles: mirrorY([
      { x: 246, y: 150, w: 50, h: 30 },  // 球門柵
      { x: 404, y: 150, w: 50, h: 30 },
      { x: 150, y: 226, w: 130, h: 30 }, // 長柵欄(左右各一，留中路)
      { x: 420, y: 226, w: 130, h: 30 },
      { x: 300, y: 318, w: 100, h: 28 }, // 中央柵欄
      { x: 96, y: 332, w: 30, h: 90 },   // 側邊豎柵
      { x: 574, y: 332, w: 30, h: 90 },
    ]),
    bushes: mirrorY([
      { x: 78, y: 196, w: 54, h: 150 },  // 高草帶側翼
      { x: 568, y: 196, w: 54, h: 150 },
      { x: 250, y: 250, w: 58, h: 118 }, // 中央草帶
      { x: 392, y: 250, w: 58, h: 118 },
    ]),
  },
];

const MAP_ORDER = MAPS.map((m) => m.id);
function getMap(id) {
  return MAPS.find((m) => m.id === id) || MAPS[0];
}
