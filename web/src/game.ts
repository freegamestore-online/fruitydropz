import Phaser from "phaser";

// ─── Constants ────────────────────────────────────────────────────────────────
const VW = 400;
const VH = 640;
const MAX_LIVES = 3;
const HS_KEY = "fruitydropz_highscore";
const BASKET_SPEED = 340;

// ─── Fruit Definitions ────────────────────────────────────────────────────────
interface FruitDef {
  label: string;
  color: number;
  shine: number;
  dark: number;
  pts: number;
  r: number;
}

const FRUITS: FruitDef[] = [
  { label: "Apple",      color: 0xe63946, shine: 0xff8fa3, dark: 0xb02030, pts: 1, r: 18 },
  { label: "Lemon",      color: 0xffd60a, shine: 0xfff07c, dark: 0xc4a000, pts: 2, r: 16 },
  { label: "Grape",      color: 0x9b5de5, shine: 0xd4aaff, dark: 0x6a3ab0, pts: 3, r: 14 },
  { label: "Orange",     color: 0xf77f00, shine: 0xffc06e, dark: 0xb85c00, pts: 2, r: 17 },
  { label: "Strawberry", color: 0xff4d6d, shine: 0xffb3c1, dark: 0xc0002a, pts: 1, r: 15 },
  { label: "Blueberry",  color: 0x4361ee, shine: 0x9db4ff, dark: 0x2a3faa, pts: 3, r: 13 },
  { label: "Watermelon", color: 0x2dc653, shine: 0x80ffaa, dark: 0x1a8a38, pts: 4, r: 20 },
  { label: "Cherry",     color: 0xc0392b, shine: 0xff8a80, dark: 0x7b1a12, pts: 2, r: 14 },
];

const STAR_FRUIT: FruitDef = {
  label: "Star",
  color: 0xfbbf24,
  shine: 0xfef08a,
  dark: 0xb45309,
  pts: 8,
  r: 18,
};

interface FruitData {
  fruitIndex: number; // -1 = bomb, -2 = star
  isBomb: boolean;
  isStar: boolean;
}

// ─── Texture Builders ─────────────────────────────────────────────────────────

function buildFruitTex(scene: Phaser.Scene, key: string, def: FruitDef): void {
  if (scene.textures.exists(key)) return;
  const r = def.r;
  const size = r * 2 + 10;
  const cx = size / 2;
  const cy = size / 2;
  const g = scene.make.graphics({ add: false });

  g.fillStyle(0x000000, 0.2);
  g.fillCircle(cx + 2, cy + 3, r - 1);

  g.fillStyle(def.dark, 1);
  g.fillCircle(cx, cy, r);

  g.fillStyle(def.color, 1);
  g.fillCircle(cx, cy, r - 2);

  g.fillStyle(def.shine, 0.65);
  g.fillCircle(cx - r * 0.28, cy - r * 0.28, r * 0.4);

  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(cx - r * 0.2, cy - r * 0.22, r * 0.13);

  g.generateTexture(key, size, size);
  g.destroy();
}

function buildStarTex(scene: Phaser.Scene): void {
  if (scene.textures.exists("star_fruit")) return;
  const r = STAR_FRUIT.r + 2;
  const size = r * 2 + 16;
  const cx = size / 2;
  const cy = size / 2;
  const g = scene.make.graphics({ add: false });

  g.fillStyle(0xfef08a, 0.3);
  g.fillCircle(cx, cy, r + 5);

  const outer = r;
  const inner = r * 0.42;
  const ptsA: { x: number; y: number }[] = [];
  const ptsB: { x: number; y: number }[] = [];
  for (let i = 0; i < 10; i++) {
    const ang = (i * Math.PI) / 5 - Math.PI / 2;
    const radA = i % 2 === 0 ? outer : inner;
    ptsA.push({ x: cx + Math.cos(ang) * radA, y: cy + Math.sin(ang) * radA });
    const radB = i % 2 === 0 ? outer - 2 : inner;
    ptsB.push({ x: cx + Math.cos(ang) * radB, y: cy + Math.sin(ang) * radB });
  }
  g.fillStyle(STAR_FRUIT.dark, 1);
  g.fillPoints(ptsA, true);
  g.fillStyle(STAR_FRUIT.color, 1);
  g.fillPoints(ptsB, true);

  g.fillStyle(STAR_FRUIT.shine, 0.75);
  g.fillCircle(cx - r * 0.22, cy - r * 0.28, r * 0.32);
  g.fillStyle(0xffffff, 0.85);
  g.fillCircle(cx - r * 0.18, cy - r * 0.22, r * 0.12);

  g.generateTexture("star_fruit", size, size);
  g.destroy();
}

function buildBombTex(scene: Phaser.Scene): void {
  if (scene.textures.exists("bomb")) return;
  const r = 17;
  const size = r * 2 + 16;
  const cx = size / 2;
  const cy = size / 2 + 2;
  const g = scene.make.graphics({ add: false });

  g.fillStyle(0x000000, 0.22);
  g.fillCircle(cx + 2, cy + 3, r - 1);

  g.fillStyle(0x1a1a2e, 1);
  g.fillCircle(cx, cy, r);

  g.fillStyle(0x3a3a5c, 0.5);
  g.fillCircle(cx - r * 0.28, cy - r * 0.28, r * 0.38);

  g.lineStyle(2.5, 0x888899, 1);
  g.beginPath();
  g.moveTo(cx + r * 0.45, cy - r * 0.6);
  g.lineTo(cx + r * 0.7, cy - r * 0.95);
  g.lineTo(cx + r * 0.5, cy - r * 1.28);
  g.strokePath();

  g.fillStyle(0xfbbf24, 1);
  g.fillCircle(cx + r * 0.5, cy - r * 1.33, 5);
  g.fillStyle(0xfef3c7, 1);
  g.fillCircle(cx + r * 0.5, cy - r * 1.33, 2.5);

  g.generateTexture("bomb", size, size);
  g.destroy();
}

function buildBasketTex(scene: Phaser.Scene): void {
  if (scene.textures.exists("basket")) return;
  const W = 100;
  const H = 34;
  const g = scene.make.graphics({ add: false });

  g.fillStyle(0x000000, 0.18);
  g.fillRoundedRect(3, 4, W, H, 9);

  g.fillStyle(0x78350f, 1);
  g.fillRoundedRect(0, 0, W, H, 9);

  g.fillStyle(0xfbbf24, 1);
  g.fillRoundedRect(3, 3, W - 6, H - 6, 7);

  g.lineStyle(1.5, 0xd97706, 0.65);
  for (let y = 9; y < H - 3; y += 7) {
    g.strokeLineShape(new Phaser.Geom.Line(5, y, W - 5, y));
  }
  for (let x = 13; x < W - 5; x += 12) {
    g.strokeLineShape(new Phaser.Geom.Line(x, 4, x, H - 4));
  }

  g.fillStyle(0xfde68a, 0.55);
  g.fillRoundedRect(5, 4, W - 10, 7, 4);

  g.generateTexture("basket", W, H);
  g.destroy();
}

function buildTreeTex(scene: Phaser.Scene): void {
  if (scene.textures.exists("tree")) return;
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x78350f, 1);
  g.fillRect(18, 52, 14, 28);
  g.fillStyle(0x14532d, 0.5);
  g.fillTriangle(26, 4, 2, 44, 50, 44);
  g.fillStyle(0x15803d, 1);
  g.fillTriangle(25, 0, 0, 40, 50, 40);
  g.fillStyle(0x22c55e, 1);
  g.fillTriangle(25, 10, 3, 46, 47, 46);
  g.fillStyle(0x4ade80, 0.55);
  g.fillTriangle(25, 16, 9, 42, 41, 42);
  g.generateTexture("tree", 50, 80);
  g.destroy();
}

function buildCloudTex(scene: Phaser.Scene): void {
  if (scene.textures.exists("cloud")) return;
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0xffffff, 0.88);
  g.fillEllipse(60, 32, 82, 38);
  g.fillEllipse(38, 27, 58, 34);
  g.fillEllipse(82, 27, 54, 32);
  g.fillEllipse(60, 25, 52, 30);
  g.generateTexture("cloud", 124, 60);
  g.destroy();
}

function buildParticleTex(scene: Phaser.Scene): void {
  if (scene.textures.exists("particle")) return;
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0xffffff, 1);
  g.fillCircle(6, 6, 6);
  g.generateTexture("particle", 12, 12);
  g.destroy();
}

// ─── Audio helpers ────────────────────────────────────────────────────────────

function getAudioCtx(scene: Phaser.Scene): AudioContext | null {
  try {
    const mgr = scene.sound as Phaser.Sound.WebAudioSoundManager;
    const ctx = mgr.context as AudioContext;
    if (!ctx || ctx.state === "suspended") return null;
    return ctx;
  } catch {
    return null;
  }
}

function playTone(
  scene: Phaser.Scene,
  freq: number,
  duration: number,
  vol = 0.18,
  type: OscillatorType = "sine",
  attack = 0.01
): void {
  const ctx = getAudioCtx(scene);
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + attack);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration + 0.05);
  } catch {
    // silent fail
  }
}

function playCatchSound(scene: Phaser.Scene, combo: number): void {
  const base = 440 + Math.min(combo, 10) * 50;
  playTone(scene, base, 0.1, 0.22, "sine");
  scene.time.delayedCall(65, () => playTone(scene, base * 1.5, 0.1, 0.14, "sine"));
}

function playBombSound(scene: Phaser.Scene): void {
  playTone(scene, 90, 0.3, 0.32, "sawtooth");
  scene.time.delayedCall(70, () => playTone(scene, 60, 0.28, 0.28, "square"));
  scene.time.delayedCall(150, () => playTone(scene, 45, 0.25, 0.2, "sawtooth"));
}

function playMissSound(scene: Phaser.Scene): void {
  playTone(scene, 220, 0.18, 0.2, "triangle");
  scene.time.delayedCall(110, () => playTone(scene, 185, 0.22, 0.16, "triangle"));
}

function playStarSound(scene: Phaser.Scene): void {
  [523, 659, 784, 1047, 1319].forEach((f, i) => {
    scene.time.delayedCall(i * 55, () => playTone(scene, f, 0.16, 0.2, "sine"));
  });
}

function playLevelUpSound(scene: Phaser.Scene): void {
  [392, 523, 659, 784].forEach((f, i) => {
    scene.time.delayedCall(i * 80, () => playTone(scene, f, 0.2, 0.22, "sine"));
  });
}

function playGameOverSound(scene: Phaser.Scene): void {
  [440, 370, 294, 220].forEach((f, i) => {
    scene.time.delayedCall(i * 120, () => playTone(scene, f, 0.25, 0.28, "triangle"));
  });
}

// ─── MenuScene ────────────────────────────────────────────────────────────────

class MenuScene extends Phaser.Scene {
  constructor() {
    super("menu");
  }

  create(): void {
    FRUITS.forEach((fr, i) => buildFruitTex(this, `fruit_${i}`, fr));
    buildStarTex(this);
    buildBombTex(this);
    buildBasketTex(this);
    buildTreeTex(this);
    buildCloudTex(this);
    buildParticleTex(this);

    this.drawBackground();
    this.drawScenery();
    this.drawFloatingFruits();
    this.drawUI();
  }

  private drawBackground(): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0ea5e9, 0x0ea5e9, 0x7dd3fc, 0x7dd3fc, 1);
    bg.fillRect(0, 0, VW, VH * 0.74);
    bg.fillGradientStyle(0x4ade80, 0x4ade80, 0x16a34a, 0x16a34a, 1);
    bg.fillRect(0, VH * 0.74, VW, VH * 0.26);
    bg.fillStyle(0x15803d, 1);
    bg.fillRect(0, VH - 22, VW, 22);
  }

  private drawScenery(): void {
    for (let i = 0; i < 3; i++) {
      const cx = 70 + i * 130;
      const cy = 55 + i * 22;
      const cloud = this.add.image(cx, cy, "cloud").setAlpha(0.88).setScale(0.7 + i * 0.15);
      this.tweens.add({
        targets: cloud,
        x: cx + 28,
        duration: 5500 + i * 2200,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
    this.add.image(28, VH - 22, "tree").setScale(0.95).setOrigin(0.5, 1);
    this.add.image(VW - 28, VH - 22, "tree").setScale(1.1).setOrigin(0.5, 1);
    this.add.image(80, VH - 18, "tree").setScale(0.72).setOrigin(0.5, 1);
    this.add.image(VW - 82, VH - 18, "tree").setScale(0.78).setOrigin(0.5, 1);
  }

  private drawFloatingFruits(): void {
    const positions = [
      { fi: 0, x: 50,      y: 195 },
      { fi: 1, x: VW - 50, y: 158 },
      { fi: 2, x: 195,     y: 108 },
      { fi: 3, x: 88,      y: 328 },
      { fi: 4, x: VW - 88, y: 308 },
      { fi: 6, x: 42,      y: 468 },
      { fi: 5, x: VW - 44, y: 452 },
      { fi: 7, x: VW / 2,  y: 148 },
    ];
    for (const p of positions) {
      const img = this.add.image(p.x, p.y, `fruit_${p.fi}`).setAlpha(0.72).setScale(1.25);
      this.tweens.add({
        targets: img,
        y: p.y - 18,
        angle: Phaser.Math.Between(-12, 12),
        duration: 1200 + p.fi * 200,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  private drawUI(): void {
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x000000, 0.22);
    panelBg.fillRoundedRect(VW / 2 - 162, 192, 324, 124, 20);

    this.add
      .text(VW / 2, 226, "🍉 FruityDrop", {
        fontFamily: "Fraunces, serif",
        fontSize: "52px",
        color: "#ffffff",
        stroke: "#14532d",
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    this.add
      .text(VW / 2, 290, "Catch fruit • Dodge bombs • Beat your best!", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "13px",
        color: "#e0f2fe",
        wordWrap: { width: 300 },
        align: "center",
      })
      .setOrigin(0.5);

    const hs = parseInt(localStorage.getItem(HS_KEY) ?? "0", 10);
    let nextY = 328;
    if (hs > 0) {
      const hsBg = this.add.graphics();
      hsBg.fillStyle(0x78350f, 0.9);
      hsBg.fillRoundedRect(VW / 2 - 82, nextY, 164, 36, 18);
      this.add
        .text(VW / 2, nextY + 18, `🏆  Best: ${hs}`, {
          fontFamily: "Manrope, sans-serif",
          fontSize: "17px",
          color: "#fde68a",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      nextY += 52;
    }

    const btnY = nextY + 4;
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x15803d, 1);
    btnBg.fillRoundedRect(VW / 2 - 108, btnY, 216, 64, 32);
    btnBg.fillStyle(0x22c55e, 1);
    btnBg.fillRoundedRect(VW / 2 - 106, btnY - 4, 212, 60, 30);

    const btnTxt = this.add
      .text(VW / 2, btnY + 28, "▶  Play Now", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "27px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: [btnBg, btnTxt],
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 820,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const hintY = btnY + 80;
    this.add
      .text(VW / 2, hintY, "🖱️ mouse / touch  •  ← → arrow keys", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "12px",
        color: "#bae6fd",
      })
      .setOrigin(0.5);
    this.add
      .text(VW / 2, hintY + 20, "Miss 3 fruits = game over  •  Bombs cost a life!", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "11px",
        color: "#bae6fd",
        wordWrap: { width: 320 },
        align: "center",
      })
      .setOrigin(0.5);

    const legendY = hintY + 60;
    this.add
      .text(VW / 2, legendY, "Points per fruit:", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "12px",
        color: "#fde68a",
      })
      .setOrigin(0.5);

    const legendFruits = [0, 1, 2, 6];
    legendFruits.forEach((fi, i) => {
      const lx = VW / 2 - 60 + i * 42;
      const fr = FRUITS[fi];
      if (!fr) return;
      const img = this.add.image(lx, legendY + 26, `fruit_${fi}`).setScale(0.95);
      this.add
        .text(lx, legendY + 44, `+${fr.pts}`, {
          fontFamily: "Manrope, sans-serif",
          fontSize: "11px",
          color: "#ffffff",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      this.tweens.add({
        targets: img,
        y: legendY + 22,
        duration: 550 + i * 120,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });

    const starImg = this.add.image(VW / 2 - 28, legendY + 68, "star_fruit").setScale(0.85);
    this.add
      .text(VW / 2 + 10, legendY + 68, `= +${STAR_FRUIT.pts} bonus!`, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "12px",
        color: "#fde68a",
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5);
    this.tweens.add({
      targets: starImg,
      scaleX: 1.12,
      scaleY: 1.12,
      duration: 450,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    const start = (): void => {
      this.cameras.main.fadeOut(260, 0, 0, 0);
      this.time.delayedCall(260, () => this.scene.start("play"));
    };
    btnTxt.on("pointerdown", start);
    this.input.keyboard?.once("keydown-SPACE", start);
    this.input.keyboard?.once("keydown-ENTER", start);
  }
}

// ─── GameOverScene ────────────────────────────────────────────────────────────

class GameOverScene extends Phaser.Scene {
  constructor() {
    super("gameover");
  }

  create(data: { score: number; isNewBest: boolean }): void {
    const score = data.score ?? 0;
    const isNewBest = data.isNewBest ?? false;

    // Dim overlay
    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.72);
    overlay.fillRect(0, 0, VW, VH);

    // Panel
    const panelH = isNewBest ? 360 : 320;
    const panelY = VH / 2 - panelH / 2;
    const panel = this.add.graphics();
    panel.fillStyle(0x1e3a5f, 1);
    panel.fillRoundedRect(VW / 2 - 155, panelY, 310, panelH, 24);
    panel.fillStyle(0x2563eb, 0.5);
    panel.fillRoundedRect(VW / 2 - 153, panelY + 2, 306, panelH - 4, 22);

    // Fruit confetti
    this.spawnConfetti();

    let y = panelY + 44;

    // Title
    const titleTxt = isNewBest ? "🎉 New Best!" : "Game Over!";
    this.add
      .text(VW / 2, y, titleTxt, {
        fontFamily: "Fraunces, serif",
        fontSize: "40px",
        color: isNewBest ? "#fbbf24" : "#f87171",
        stroke: "#000000",
        strokeThickness: 5,
      })
      .setOrigin(0.5);
    y += 56;

    if (isNewBest) {
      this.add
        .text(VW / 2, y, "You crushed your record! 🏆", {
          fontFamily: "Manrope, sans-serif",
          fontSize: "14px",
          color: "#fde68a",
        })
        .setOrigin(0.5);
      y += 32;
    }

    // Score
    this.add
      .text(VW / 2, y, "Score", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "16px",
        color: "#93c5fd",
      })
      .setOrigin(0.5);
    y += 26;

    const scoreTxt = this.add
      .text(VW / 2, y, "0", {
        fontFamily: "Fraunces, serif",
        fontSize: "64px",
        color: "#ffffff",
        stroke: "#1e3a5f",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setScale(0.1);

    this.tweens.add({
      targets: scoreTxt,
      scaleX: 1,
      scaleY: 1,
      duration: 420,
      ease: "Back.easeOut",
      onUpdate: (tween) => {
        const val = Math.round(tween.progress * score);
        scoreTxt.setText(String(val));
      },
      onComplete: () => {
        scoreTxt.setText(String(score));
      },
    });
    y += 74;

    // Best
    const best = parseInt(localStorage.getItem(HS_KEY) ?? "0", 10);
    this.add
      .text(VW / 2, y, `Best: ${best}`, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "16px",
        color: "#fde68a",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    y += 44;

    // Play Again button
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x15803d, 1);
    btnBg.fillRoundedRect(VW / 2 - 108, y, 216, 58, 29);
    btnBg.fillStyle(0x22c55e, 1);
    btnBg.fillRoundedRect(VW / 2 - 106, y - 3, 212, 54, 27);

    const btnTxt = this.add
      .text(VW / 2, y + 26, "▶  Play Again", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "24px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: [btnBg, btnTxt],
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    y += 72;

    // Menu link
    const menuTxt = this.add
      .text(VW / 2, y, "← Main Menu", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "15px",
        color: "#93c5fd",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    menuTxt.on("pointerover", () => menuTxt.setColor("#ffffff"));
    menuTxt.on("pointerout", () => menuTxt.setColor("#93c5fd"));

    const restart = (): void => {
      this.cameras.main.fadeOut(220, 0, 0, 0);
      this.time.delayedCall(220, () => this.scene.start("play"));
    };
    const menu = (): void => {
      this.cameras.main.fadeOut(220, 0, 0, 0);
      this.time.delayedCall(220, () => this.scene.start("menu"));
    };

    btnTxt.on("pointerdown", restart);
    menuTxt.on("pointerdown", menu);
    this.input.keyboard?.once("keydown-SPACE", restart);
    this.input.keyboard?.once("keydown-ENTER", restart);
    this.input.keyboard?.once("keydown-ESC", menu);

    // Animate panel in
    this.tweens.add({
      targets: [panel, overlay],
      alpha: { from: 0, to: 1 },
      duration: 320,
      ease: "Quad.easeOut",
    });

    this.cameras.main.fadeIn(280, 0, 0, 0);
  }

  private spawnConfetti(): void {
    const colors = [0xff4d6d, 0xfbbf24, 0x22c55e, 0x3b82f6, 0xa855f7, 0xf97316];
    for (let i = 0; i < 28; i++) {
      const x = Phaser.Math.Between(20, VW - 20);
      const color = colors[i % colors.length] ?? 0xffffff;
      const dot = this.add.graphics();
      dot.fillStyle(color, 1);
      dot.fillCircle(0, 0, Phaser.Math.Between(4, 9));
      dot.x = x;
      dot.y = -20;
      this.tweens.add({
        targets: dot,
        y: VH + 40,
        x: x + Phaser.Math.Between(-60, 60),
        angle: Phaser.Math.Between(-180, 180),
        duration: Phaser.Math.Between(1200, 2800),
        delay: Phaser.Math.Between(0, 900),
        ease: "Quad.easeIn",
        alpha: { from: 1, to: 0.4 },
      });
    }
  }
}

// ─── PlayScene ────────────────────────────────────────────────────────────────

class PlayScene extends Phaser.Scene {
  private readonly onScore: (n: number) => void;

  private score = 0;
  private lives = MAX_LIVES;
  private over = false;
  private combo = 0;
  private comboTimer?: Phaser.Time.TimerEvent;

  private basket!: Phaser.GameObjects.Image;
  private drops!: Phaser.Physics.Arcade.Group;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private spawnTimer?: Phaser.Time.TimerEvent;
  private diffTimer?: Phaser.Time.TimerEvent;

  private scoreText!: Phaser.GameObjects.Text;
  private heartIcons: Phaser.GameObjects.Text[] = [];
  private comboLabel!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;

  private spawnDelay = 920;
  private dropSpeed = 130;
  private bombChance = 0.07;
  private starChance = 0.045;
  private level = 1;

  private dragOffsetX = 0;
  private isDragging = false;

  constructor(onScore: (n: number) => void) {
    super("play");
    this.onScore = onScore;
  }

  create(): void {
    this.score = 0;
    this.lives = MAX_LIVES;
    this.over = false;
    this.combo = 0;
    this.spawnDelay = 920;
    this.dropSpeed = 130;
    this.bombChance = 0.07;
    this.starChance = 0.045;
    this.level = 1;
    this.isDragging = false;
    this.heartIcons = [];
    this.onScore(0);

    this.drawBackground();
    this.drawScenery();
    this.buildHUD();
    this.buildBasket();
    this.buildInput();
    this.buildPhysics();
    this.startTimers();

    this.cameras.main.fadeIn(280, 0, 0, 0);
  }

  // ── Background ──────────────────────────────────────────────────────────────

  private drawBackground(): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0ea5e9, 0x0ea5e9, 0x7dd3fc, 0x7dd3fc, 1);
    bg.fillRect(0, 0, VW, VH * 0.78);
    bg.fillGradientStyle(0x4ade80, 0x4ade80, 0x16a34a, 0x16a34a, 1);
    bg.fillRect(0, VH * 0.78, VW, VH * 0.22);
    bg.fillStyle(0x15803d, 1);
    bg.fillRect(0, VH - 20, VW, 20);
  }

  private drawScenery(): void {
    for (let i = 0; i < 4; i++) {
      const startX = Phaser.Math.Between(0, VW);
      const cy = 52 + i * 28;
      const sc = 0.52 + i * 0.1;
      const cloud = this.add.image(startX, cy, "cloud").setAlpha(0.72).setScale(sc);
      const speed = 24000 + i * 5500;
      const elapsed = (startX / VW) * speed;
      this.tweens.add({
        targets: cloud,
        x: VW + 80,
        duration: speed - elapsed,
        onComplete: () => {
          this.tweens.add({
            targets: cloud,
            x: { from: -80, to: VW + 80 },
            duration: speed,
            repeat: -1,
          });
        },
      });
    }
    this.add.image(22, VH - 20, "tree").setScale(0.88).setOrigin(0.5, 1).setAlpha(0.92);
    this.add.image(VW - 22, VH - 20, "tree").setScale(1.02).setOrigin(0.5, 1).setAlpha(0.92);
  }

  // ── HUD ─────────────────────────────────────────────────────────────────────

  private buildHUD(): void {
    const hudBg = this.add.graphics().setDepth(10);
    hudBg.fillStyle(0x000000, 0.32);
    hudBg.fillRoundedRect(6, 6, VW - 12, 50, 11);

    this.levelText = this.add
      .text(18, 31, "Lv.1", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "15px",
        color: "#fde68a",
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5)
      .setDepth(11);

    this.scoreText = this.add
      .text(VW / 2, 31, "0", {
        fontFamily: "Fraunces, serif",
        fontSize: "30px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(11);

    for (let i = 0; i < MAX_LIVES; i++) {
      const h = this.add
        .text(VW - 16 - i * 28, 31, "❤️", { fontSize: "20px" })
        .setOrigin(0.5, 0.5)
        .setDepth(11);
      this.heartIcons.push(h);
    }

    this.comboLabel = this.add
      .text(VW / 2, 68, "", {
        fontFamily: "Fraunces, serif",
        fontSize: "18px",
        color: "#fbbf24",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(11)
      .setAlpha(0);
  }

  // ── Basket ───────────────────────────────────────────────────────────────────

  private buildBasket(): void {
    this.basket = this.add.image(VW / 2, VH - 50, "basket").setDepth(5);
    this.physics.add.existing(this.basket);
    const body = this.basket.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true);
    body.setAllowGravity(false);
    body.setSize(92, 26);
  }

  // ── Input ────────────────────────────────────────────────────────────────────

  private buildInput(): void {
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (this.over) return;
      this.isDragging = true;
      this.dragOffsetX = this.basket.x - p.x;
    });
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!this.isDragging || this.over) return;
      this.basket.x = Phaser.Math.Clamp(p.x + this.dragOffsetX, 52, VW - 52);
    });
    this.input.on("pointerup", () => { this.isDragging = false; });
    this.input.on("pointerupoutside", () => { this.isDragging = false; });
    this.cursors = this.input.keyboard?.createCursorKeys();
  }

  // ── Physics ──────────────────────────────────────────────────────────────────

  private buildPhysics(): void {
    this.drops = this.physics.add.group();
    this.physics.add.overlap(this.basket, this.drops, (_b, dropObj) => {
      const drop = dropObj as Phaser.GameObjects.Image;
      if (!drop.active) return;
      const data = drop.getData("fd") as FruitData;
      drop.setActive(false);
      if (data.isBomb) {
        this.onBombCaught(drop);
      } else if (data.isStar) {
        this.onStarCaught(drop);
      } else {
        this.onFruitCaught(drop, data.fruitIndex);
      }
    });
  }

  // ── Timers ───────────────────────────────────────────────────────────────────

  private startTimers(): void {
    this.spawnTimer = this.time.addEvent({
      delay: this.spawnDelay,
      loop: true,
      callback: this.spawnDrop,
      callbackScope: this,
    });
    this.diffTimer = this.time.addEvent({
      delay: 11000,
      loop: true,
      callback: this.rampDifficulty,
      callbackScope: this,
    });
  }

  // ── Update ───────────────────────────────────────────────────────────────────

  update(_time: number, delta: number): void {
    if (this.over) return;

    if (this.cursors) {
      const speed = BASKET_SPEED * (delta / 1000);
      if (this.cursors.left?.isDown) {
        this.basket.x = Math.max(52, this.basket.x - speed);
      } else if (this.cursors.right?.isDown) {
        this.basket.x = Math.min(VW - 52, this.basket.x + speed);
      }
    }

    const body = this.basket.body as Phaser.Physics.Arcade.Body;
    body.reset(this.basket.x, this.basket.y);

    this.drops.getChildren().forEach((obj) => {
      const drop = obj as Phaser.GameObjects.Image;
      if (!drop.active) return;
      if (drop.y > VH + 40) {
        const data = drop.getData("fd") as FruitData;
        drop.setActive(false);
        drop.destroy();
        if (!data.isBomb) {
          this.missedFruit();
        }
      }
    });
  }

  // ── Spawning ─────────────────────────────────────────────────────────────────

  private spawnDrop(): void {
    if (this.over) return;

    const roll = Math.random();
    let key: string;
    let r: number;
    const fd: FruitData = { fruitIndex: 0, isBomb: false, isStar: false };

    if (roll < this.bombChance) {
      key = "bomb";
      r = 17;
      fd.isBomb = true;
      fd.fruitIndex = -1;
    } else if (roll < this.bombChance + this.starChance) {
      key = "star_fruit";
      r = STAR_FRUIT.r + 2;
      fd.isStar = true;
      fd.fruitIndex = -2;
    } else {
      const fi = Phaser.Math.Between(0, FRUITS.length - 1);
      key = `fruit_${fi}`;
      fd.fruitIndex = fi;
      r = FRUITS[fi]?.r ?? 16;
    }

    const margin = r + 16;
    const x = Phaser.Math.Between(margin, VW - margin);
    const drop = this.add.image(x, -r - 8, key).setDepth(4);
    this.physics.add.existing(drop);
    const body = drop.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setVelocityY(this.dropSpeed + Phaser.Math.Between(-18, 18));
    body.setCircle(r, (drop.width / 2) - r, (drop.height / 2) - r);

    drop.setData("fd", fd);
    this.drops.add(drop);

    // Slight wobble on the way down
    this.tweens.add({
      targets: drop,
      angle: Phaser.Math.Between(-8, 8),
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Star pulses
    if (fd.isStar) {
      this.tweens.add({
        targets: drop,
        scaleX: 1.18,
        scaleY: 1.18,
        duration: 380,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  // ── Catch / Miss handlers ────────────────────────────────────────────────────

  private onFruitCaught(drop: Phaser.GameObjects.Image, fi: number): void {
    const fr = FRUITS[fi];
    if (!fr) return;
    this.combo++;
    this.resetComboTimer();

    const multiplier = Math.floor(this.combo / 5) + 1;
    const pts = fr.pts * multiplier;
    this.score += pts;
    this.onScore(this.score);
    this.scoreText.setText(String(this.score));

    playCatchSound(this, this.combo);
    this.spawnPopLabel(drop.x, drop.y, `+${pts}`, 0x4ade80);
    this.spawnBurst(drop.x, drop.y, fr.color);

    // Combo banner
    if (this.combo >= 3) {
      const msgs = ["Nice!", "Great!", "Amazing!", "COMBO!", "FEVER!"];
      const idx = Math.min(Math.floor(this.combo / 3), msgs.length - 1);
      this.showCombo(`${msgs[idx] ?? "COMBO!"} x${this.combo}`);
    }

    // Score pop
    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.28,
      scaleY: 1.28,
      duration: 90,
      yoyo: true,
      ease: "Quad.easeOut",
    });

    drop.destroy();
  }

  private onStarCaught(drop: Phaser.GameObjects.Image): void {
    this.combo += 2;
    this.resetComboTimer();
    this.score += STAR_FRUIT.pts;
    this.onScore(this.score);
    this.scoreText.setText(String(this.score));

    playStarSound(this);
    this.spawnPopLabel(drop.x, drop.y, `⭐ +${STAR_FRUIT.pts}`, 0xfbbf24);
    this.spawnBurst(drop.x, drop.y, STAR_FRUIT.color, 20);
    this.showCombo(`✨ STAR! ✨`);

    // Camera flash
    this.cameras.main.flash(180, 255, 220, 100);

    drop.destroy();
  }

  private onBombCaught(drop: Phaser.GameObjects.Image): void {
    this.combo = 0;
    this.loseLife();
    playBombSound(this);
    this.spawnPopLabel(drop.x, drop.y, "💥 BOOM!", 0xf87171);
    this.spawnBurst(drop.x, drop.y, 0x1a1a2e, 14);

    // Camera shake
    this.cameras.main.shake(280, 0.014);
    this.cameras.main.flash(160, 255, 80, 80);

    drop.destroy();
  }

  private missedFruit(): void {
    this.combo = 0;
    this.loseLife();
    playMissSound(this);
  }

  // ── Life management ──────────────────────────────────────────────────────────

  private loseLife(): void {
    if (this.over) return;
    this.lives--;
    this.updateHearts();

    if (this.lives <= 0) {
      this.triggerGameOver();
    } else {
      // Basket flash red
      this.tweens.add({
        targets: this.basket,
        tint: 0xff4444,
        duration: 120,
        yoyo: true,
        repeat: 2,
        onComplete: () => { this.basket.setTint(0xffffff); },
      });
    }
  }

  private updateHearts(): void {
    this.heartIcons.forEach((h, i) => {
      h.setText(i < this.lives ? "❤️" : "🖤");
      h.setAlpha(i < this.lives ? 1 : 0.4);
    });
  }

  // ── Game over ────────────────────────────────────────────────────────────────

  private triggerGameOver(): void {
    this.over = true;
    this.spawnTimer?.remove();
    this.diffTimer?.remove();
    this.comboTimer?.remove();

    // Save high score
    const prev = parseInt(localStorage.getItem(HS_KEY) ?? "0", 10);
    const isNewBest = this.score > prev;
    if (isNewBest) localStorage.setItem(HS_KEY, String(this.score));

    playGameOverSound(this);
    this.cameras.main.shake(350, 0.018);

    this.time.delayedCall(700, () => {
      this.cameras.main.fadeOut(320, 0, 0, 0);
      this.time.delayedCall(320, () => {
        this.scene.start("gameover", { score: this.score, isNewBest });
      });
    });
  }

  // ── Difficulty ramp ──────────────────────────────────────────────────────────

  private rampDifficulty(): void {
    if (this.over) return;
    this.level++;
    this.levelText.setText(`Lv.${this.level}`);

    this.dropSpeed = Math.min(this.dropSpeed + 18, 310);
    this.spawnDelay = Math.max(this.spawnDelay - 55, 390);
    this.bombChance = Math.min(this.bombChance + 0.012, 0.22);
    this.starChance = Math.min(this.starChance + 0.005, 0.09);

    this.spawnTimer?.remove();
    this.spawnTimer = this.time.addEvent({
      delay: this.spawnDelay,
      loop: true,
      callback: this.spawnDrop,
      callbackScope: this,
    });

    playLevelUpSound(this);
    this.showLevelBanner();
  }

  // ── Visual helpers ───────────────────────────────────────────────────────────

  private spawnPopLabel(x: number, y: number, msg: string, color: number): void {
    const hex = "#" + color.toString(16).padStart(6, "0");
    const txt = this.add
      .text(x, y - 10, msg, {
        fontFamily: "Fraunces, serif",
        fontSize: "20px",
        color: hex,
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5, 1)
      .setDepth(20);

    this.tweens.add({
      targets: txt,
      y: y - 68,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 750,
      ease: "Quad.easeOut",
      onComplete: () => txt.destroy(),
    });
  }

  private spawnBurst(x: number, y: number, color: number, count = 10): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = Phaser.Math.Between(55, 130);
      const dot = this.add.graphics().setDepth(15);
      dot.fillStyle(color, 1);
      dot.fillCircle(0, 0, Phaser.Math.Between(3, 6));
      dot.x = x;
      dot.y = y;
      this.tweens.add({
        targets: dot,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        scaleX: 0.2,
        scaleY: 0.2,
        duration: Phaser.Math.Between(380, 620),
        ease: "Quad.easeOut",
        onComplete: () => dot.destroy(),
      });
    }
  }

  private showCombo(msg: string): void {
    this.comboLabel.setText(msg).setAlpha(1).setScale(1.3);
    this.tweens.add({
      targets: this.comboLabel,
      scaleX: 1,
      scaleY: 1,
      duration: 180,
      ease: "Back.easeOut",
    });
    this.tweens.add({
      targets: this.comboLabel,
      alpha: 0,
      duration: 900,
      delay: 700,
      ease: "Quad.easeIn",
    });
  }

  private showLevelBanner(): void {
    const banner = this.add
      .text(VW / 2, VH / 2 - 30, `🎉 Level ${this.level}!`, {
        fontFamily: "Fraunces, serif",
        fontSize: "44px",
        color: "#fbbf24",
        stroke: "#000000",
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setDepth(30)
      .setAlpha(0);

    this.tweens.add({
      targets: banner,
      alpha: 1,
      scaleX: { from: 0.5, to: 1 },
      scaleY: { from: 0.5, to: 1 },
      duration: 320,
      ease: "Back.easeOut",
    });
    this.tweens.add({
      targets: banner,
      alpha: 0,
      duration: 500,
      delay: 1100,
      ease: "Quad.easeIn",
      onComplete: () => banner.destroy(),
    });
  }

  private resetComboTimer(): void {
    this.comboTimer?.remove();
    this.comboTimer = this.time.delayedCall(2200, () => {
      this.combo = 0;
    });
  }
}

// ─── startGame export ─────────────────────────────────────────────────────────

export function startGame(
  parent: HTMLElement,
  onScore: (n: number) => void
): () => void {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    width: VW,
    height: VH,
    parent,
    backgroundColor: "#0ea5e9",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    scene: [
      MenuScene,
      new PlayScene(onScore),
      GameOverScene,
    ],
  });

  return () => {
    game.destroy(true);
  };
}
