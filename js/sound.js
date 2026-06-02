// ============================================================
// sound.js — 背景音樂 + 音效管理
// 使用 HTML5 Audio + 相對路徑(encodeURI),本機(file://)與網站(http)皆可播放。
// 瀏覽器規定「使用者互動前不能自動播放」,故 BGM 於第一次點擊/按鍵(Sound.start)才開始。
// 之後新增音效:把 mp3 放進 assets/sfx/,並在下方 sfxDefs 加一行即可(檔案不存在會自動略過)。
// ============================================================

const Sound = {
  muted: false,
  started: false,
  bgmEl: null,

  // 背景音樂(放在 assets/);要換歌只要用同名 bgm.mp3 覆蓋即可,不用改程式
  bgmPath: "assets/bgm.mp3",
  bgmVolume: 0.35,

  // 音效定義:把對應 mp3 放到 assets/sfx/ 即自動生效;檔案不存在則安靜略過
  sfxDefs: {
    kick: { path: "assets/sfx/kick.mp3", volume: 0.6 },
    goal: { path: "assets/sfx/goal.mp3", volume: 0.7 },
    super: { path: "assets/sfx/super.mp3", volume: 0.6 },
  },
  sfxDead: {}, // 記錄載入失敗的音效,避免重複請求

  init() {
    try {
      this.muted = localStorage.getItem("bs_muted") === "1";
    } catch (e) {}

    const el = new Audio();
    el.src = encodeURI(this.bgmPath);
    el.loop = true;
    el.volume = this.bgmVolume;
    el.preload = "auto";
    this.bgmEl = el;
  },

  // 第一次使用者互動時呼叫(滿足瀏覽器自動播放限制)
  start() {
    if (this.started) return;
    this.started = true;
    if (!this.muted) this._playBgm();
  },

  _playBgm() {
    if (!this.bgmEl) return;
    const p = this.bgmEl.play();
    if (p && p.catch) p.catch(() => {}); // 被擋/載入失敗:安靜略過,不讓遊戲出錯
  },

  toggleMute() {
    this.muted = !this.muted;
    try {
      localStorage.setItem("bs_muted", this.muted ? "1" : "0");
    } catch (e) {}
    if (this.bgmEl) {
      if (this.muted) this.bgmEl.pause();
      else if (this.started) this._playBgm();
    }
    return this.muted;
  },

  // 播放一次性音效(可重疊);未開始、靜音、或檔案不存在皆安靜略過
  play(name) {
    if (this.muted || !this.started) return;
    const def = this.sfxDefs[name];
    if (!def || this.sfxDead[name]) return;
    try {
      const a = new Audio(encodeURI(def.path));
      a.volume = def.volume != null ? def.volume : 0.6;
      a.addEventListener("error", () => {
        this.sfxDead[name] = true; // 載入失敗 → 標記,之後不再嘗試
      });
      const pr = a.play();
      if (pr && pr.catch) pr.catch(() => {});
    } catch (e) {}
  },
};
