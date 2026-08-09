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
  emoji: string;
  color: number;
  shine: number;
  dark: number;
  pts: number;
  r: number;
}

const FRUITS: FruitDef[] = [
  { label: "Apple",      emoji: "🍎", color: 0xe63946, shine: 0xff8fa3, dark: 0xb02030, pts: 1, r: 18 },
  { label: "Lemon",      emoji: "🍋", color: 0xffd60a, shine: 0xfff07c, dark: 0xc4a000, pts: 2, r: 16 },
  { label: "Grape",      emoji: "🍇", color: 0x9b5de5, shine: 0xd4aaff, dark: 0x6a3ab0, pts: 3, r: 14 },
  { label: "Orange",     emoji: "🍊", color: 0xf77f00, shine: 0xffc06e, dark: 0xb85c00, pts: 2, r: 17 },
  { label: "Strawberry", emoji: "🍓", color: 0xff4d6d, shine: 0xffb3c1, dark: 0xc0002a, pts: 1, r: 15 },
  { label: "Blueberry",  emoji: "🫐", color: 0x4361ee, shine: 0x9db4ff, dark: 0x2a3faa, pts: 3, r: 13 },
  { label: "Watermelon", emoji: "🍉", color: 0x2dc653, shine: 0x80ffaa, dark: 0x1a8a38, pts: 4, r: 20 },
  { label: "Cherry",     emoji: "🍒", color: 0xc0392b, shine: 0xff8a80, dark: 0x7b1a12, pts: 2, r: 14 },
];

const STAR_FRUIT: FruitDef = {
  label: "Star",
  emoji: "⭐",
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

  // Drop shadow
  g.fillStyle(0x000000, 0.2);
  g.fillCircle(cx + 2, cy + 3, r - 1);

  // Dark base rim
  g.fillStyle(def.dark, 1);
  g.fillCircle(cx, cy, r);

  // Main color fill
  g.fillStyle(def.color, 1);
  g.fillCircle(cx, cy, r - 2);

  // Shine highlight
  g.fillStyle(def.shine, 0.65);
  g.fillCircle(cx - r * 0.28, cy - r * 0.28, r * 0.4);

  // Specular dot
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

  // Outer glow ring
  g.fillStyle(0xfef08a, 0.3);
  g.fillCircle(cx, cy, r + 5);

  // Star points
  const outer = r;
  const inner = r * 0.42;
  const pts: { x: number; y: number }[] = [];
  const pts2: { x: number; y: number }[] = [];
  for (let i = 0; i < 10; i++) {
    const ang = (i * Math.PI) / 5 - Math.PI / 2;
    const rad = i % 2 === 0 ? outer : inner;
    pts.push({ x: cx + Math.cos(ang) * rad, y: cy + Math.sin(ang) * rad });
    const rad2 = i % 2 === 0 ? outer - 2 : inner;
    pts2.push({ x: cx + Math.cos(ang) * rad2, y: cy + Math.sin(ang) * rad2 });
  }
  g.fillStyle(STAR_FRUIT.dark, 1);
  g.fillPoints(pts, true);
  g.fillStyle(STAR_FRUIT.color, 1);
  g.fillPoints(pts2, true);

  // Shine
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

  // Shadow
  g.fillStyle(0x000000, 0.22);
  g.fillCircle(cx + 2, cy + 3, r - 1);

  // Body
  g.fillStyle(0x1a1a2e, 1);
  g.fillCircle(cx, cy, r);

  // Sheen
  g.fillStyle(0x3a3a5c, 0.5);
  g.fillCircle(cx - r * 0.28, cy - r * 0.28, r * 0.38);

  // Fuse cord
  g.lineStyle(2.5, 0x888899, 1);
  g.beginPath();
  g.moveTo(cx + r * 0.45, cy - r * 0.6);
  g.lineTo(cx + r * 0.7, cy - r * 0.95);
  g.lineTo(cx + r * 0.5, cy - r * 1.28);
  g.strokePath();

  // Spark
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

  // Shadow
  g.fillStyle(0x000000, 0.18);
  g.fillRoundedRect(3, 4, W, H, 9);

  // Outer rim (dark wood)
  g.fillStyle(0x78350f, 1);
  g.fillRoundedRect(0, 0, W, H, 9);

  // Inner body
  g.fillStyle(0xfbbf24, 1);
  g.fillRoundedRect(3, 3, W - 6, H - 6, 7);

  // Weave lines horizontal
  g.lineStyle(1.5, 0xd97706, 0.65);
  for (let y = 9; y < H - 3; y += 7) {
    g.strokeLineShape(new Phaser.Geom.Line(5, y, W - 5, y));
  }
  // Weave lines vertical
  for (let x = 13; x < W - 5; x += 12) {
    g.strokeLineShape(new Phaser.Geom.Line(x, 4, x, H - 4));
  }

  // Top highlight strip
  g.fillStyle(0xfde68a, 0.55);
  g.fillRoundedRect(5, 4, W - 10, 7, 4);

  g.generateTexture("basket", W, H);
  g.destroy();
}

function buildTreeTex(scene: Phaser.Scene): void {
  if (scene.textures.exists("tree")) return;
  const g = scene.make.graphics({ add: false });
  // Trunk
  g.fillStyle(0x78350f, 1);
  g.fillRect(18, 52, 14, 28);
  // Canopy shadow
  g.fillStyle(0x14532d, 0.5);
  g.fillTriangle(26, 4, 2, 44, 50, 44);
  // Main canopy layers
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

function buildGroundTex(scene: Phaser.Scene): void {
  if (scene.textures.exists("ground")) return;
  const g = scene.make.graphics({ add: false });
  // Grass top
  g.fillStyle(0x4ade80, 1);
  g.fillRect(0, 0, VW, 12);
  // Soil body
  g.fillStyle(0x92400e, 1);
  g.fillRect(0, 12, VW, 20);
  g.generateTexture("ground", VW, 32);
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
    // Build all shared textures
    FRUITS.forEach((fr, i) => buildFruitTex(this, `fruit_${i}`, fr));
    buildStarTex(this);
    buildBombTex(this);
    buildBasketTex(this);
    buildTreeTex(this);
    buildCloudTex(this);
    buildGroundTex(this);

    this.drawBackground();
    this.drawScenery();
    this.drawFloatingFruits();
    this.drawUI();
  }

  private drawBackground(): void {
    const bg = this.add.graphics();
    // Sky
    bg.fillGradientStyle(0x0ea5e9, 0x0ea5e9, 0x7dd3fc, 0x7dd3fc, 1);
    bg.fillRect(0, 0, VW, VH * 0.74);
    // Ground
    bg.fillGradientStyle(0x4ade80, 0x4ade80, 0x16a34a, 0x16a34a, 1);
    bg.fillRect(0, VH * 0.74, VW, VH * 0.26);
    // Ground strip
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
      const img = this.add.image(p.x, p.y, `fruit_${p.fi}`).setAlpha(0.7).setScale(1.25);
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
    // Title panel
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x000000, 0.18);
    panelBg.fillRoundedRect(VW / 2 - 158, 195, 316, 118, 18);

    this.add
      .text(VW / 2, 226, "FruityDrop", {
        fontFamily: "Fraunces, serif",
        fontSize: "58px",
        color: "#ffffff",
        stroke: "#14532d",
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    this.add
      .text(VW / 2, 290, "Catch the fruit! Dodge the bombs! 🍉", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "14px",
        color: "#e0f2fe",
        wordWrap: { width: 300 },
        align: "center",
      })
      .setOrigin(0.5);

    // High score badge
    const hs = parseInt(localStorage.getItem(HS_KEY) ?? "0", 10);
    let nextY = 318;
    if (hs > 0) {
      const hsBg = this.add.graphics();
      hsBg.fillStyle(0x78350f, 0.88);
      hsBg.fillRoundedRect(VW / 2 - 80, nextY, 160, 34, 17);
      this.add
        .text(VW / 2, nextY + 17, `🏆  Best: ${hs}`, {
          fontFamily: "Manrope, sans-serif",
          fontSize: "16px",
          color: "#fde68a",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      nextY += 48;
    }

    // Play button
    const btnY = nextY + 4;
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x15803d, 1);
    btnBg.fillRoundedRect(VW / 2 - 105, btnY, 210, 62, 31);
    btnBg.fillStyle(0x22c55e, 1);
    btnBg.fillRoundedRect(VW / 2 - 103, btnY - 3, 206, 58, 29);

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
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Hint text
    const hintY = btnY + 76;
    this.add
      .text(VW / 2, hintY, "🖱️ mouse/touch  •  ← → arrow keys", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "12px",
        color: "#bae6fd",
      })
      .setOrigin(0.5);
    this.add
      .text(VW / 2, hintY + 18, "Miss 3 fruits = game over  •  Bombs cost a life!", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "11px",
        color: "#bae6fd",
        wordWrap: { width: 320 },
        align: "center",
      })
      .setOrigin(0.5);

    // Mini fruit legend
    const legendY = hintY + 55;
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
      const img = this.add.image(lx, legendY + 26, `fruit_${fi}`).setScale(0.95);
      const fr = FRUITS[fi]!;
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

    // Star bonus hint
    const starImg = this.add.image(VW / 2, legendY + 68, "star_fruit").setScale(0.85);
    this.add
      .text(VW / 2 + 22, legendY + 68, `= +${STAR_FRUIT.pts} bonus!`, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "12px",
        color: "#fde68a",
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5);
    this.tweens.add({
      targets: starImg,
      scaleX: 1.1,
      scaleY: 1.1,
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

  // Basket touch drag offset
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

  // ── Background + scenery ────────────────────────────────────────────────────

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
    // Scrolling clouds
    for (let i = 0; i < 4; i++) {
      const startX = Phaser.Math.Between(0, VW);
      const cy = 52 + i * 28;
      const sc = 0.52 + i * 0.1;
      const cloud = this.add.image(startX, cy, "cloud").setAlpha(0.72).setScale(sc);
      const totalDist = VW + 160;
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
      void totalDist; // suppress unused
    }

    // Flanking trees
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

    this.heartIcons = [];
    for (let i = 0; i < MAX_LIVES; i++) {
      const h = this.add
        .text(VW - 16 - i * 28, 31, "❤️", { fontSize: "20px" })
        .setOrigin(0.5, 0.5)
        .setDepth(11);
      this.heartIcons.push(h);
    }

    this.comboLabel = this.add
      .text(VW / 2, 66, "", {
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
    // Pointer drag — track offset so basket doesn't snap to center of finger
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

  // ── Update loop ──────────────────────────────────────────────────────────────

  update(_time: number, delta: number): void {
    if (this.over) return;

    // Keyboard movement
    if (this.cursors) {
      const speed = BASKET_SPEED * (delta / 1000);
      if (this.cursors.left?.isDown) {
        this.basket.x = Math.max(52, this.basket.x - speed);
      } else if (this.cursors.right?.isDown) {
        this.basket.x = Math.min(VW - 52, this.basket.x + speed);
      }
    }

    // Sync physics body to basket image
    const body = this.basket.body as Phaser.Physics.Arcade.Body;
    body.reset(this.basket.x, this.basket.y);

    // Cull drops that fell off screen
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
      r = FRUITS[fi]!.r;
      fd.fruitIndex = fi;
    }

    const x = Phaser.Math.Between(r + 14, VW - r - 14);
    const drop = this.add.image(x, -r - 14, key).setDepth(4);
    drop.setData("fd", fd);
    drop.setActive(true);

    this.physics.add.existing(drop);
    const body = drop.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setCircle(r, drop.width / 2 - r, drop.height / 2 - r);
    const speedVar = Phaser.Math.Between(-20, 30);
    body.setVelocityY(this.dropSpeed + speedVar);

    // Gentle wobble
    this.tweens.add({
      targets: drop,
      angle: Phaser.Math.Between(-14, 14),
      duration: 320 + Phaser.Math.Between(0, 280),
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Star pulses
    if (fd.isStar) {
      this.tweens.add({
        targets: drop,
        scaleX: 1.22,
        scaleY: 1.22,
        duration: 280,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    // Bomb warning flash when near bottom
    if (fd.isBomb) {
      this.time.addEvent({
        delay: 200,
        loop: true,
        callback: () => {
          if (!drop.active || drop.y > VH - 80) return;
          if (drop.y > VH * 0.6) {
            drop.setTint(0xff4444);
            this.time.delayedCall(80, () => { if (drop.active) drop.clearTint(); });
          }
        },
      });
    }

    this.drops.add(drop);
  }

  // ── Catch handlers ───────────────────────────────────────────────────────────

  private onFruitCaught(drop: Phaser.GameObjects.Image, fi: number): void {
    const fr = FRUITS[fi]!;
    this.combo++;
    const mult = this.combo >= 8 ? 4 : this.combo >= 5 ? 3 : this.combo >= 3 ? 2 : 1;
    const pts = fr.pts * mult;
    this.score += pts;
    this.onScore(this.score);
    this.saveHighScore();

    this.resetComboTimer();
    this.updateScoreText();
    this.showComboLabel();
    this.spawnScorePopup(pts, fr.color, mult);
    this.spawnBurst(drop.x, drop.y, fr.color, fr.shine);
    this.basketBounce();
    playCatchSound(this, this.combo);
    this.destroyDrop(drop);
  }

  private onStarCaught(drop: Phaser.GameObjects.Image): void {
    this.combo += 3;
    const pts = STAR_FRUIT.pts;
    this.score += pts;
    this.onScore(this.score);
    this.saveHighScore();

    this.resetComboTimer();
    this.updateScoreText();
    this.showComboLabel();
    this.spawnScorePopup(pts, STAR_FRUIT.color, 0);
    this.spawnStarBurst(drop.x, drop.y);
    this.basketBounce();
    playStarSound(this);
    this.cameras.main.flash(180, 255, 235, 80);
    this.destroyDrop(drop);
  }

  private onBombCaught(drop: Phaser.GameObjects.Image): void {
    this.combo = 0;
    this.tweens.add({ targets: this.comboLabel, alpha: 0, duration: 140 });
    this.cameras.main.flash(320, 230, 40, 40);
    this.cameras.main.shake(260, 0.016);
    playBombSound(this);
    this.spawnExplosion(drop.x, drop.y);
    this.destroyDrop(drop);
    this.loseLife();
  }

  private loseLife(): void {
    if (this.over) return;
    this.lives = Math.max(0, this.lives - 1);
    this.updateHearts();
    if (this.lives <= 0) {
      this.triggerGameOver();
    }
  }

  private missedFruit(): void {
    if (this.over) return;
    this.combo = 0;
    this.tweens.add({ targets: this.comboLabel, alpha: 0, duration: 140 });
    playMissSound(this);
    this.loseLife();
  }

  // ── Difficulty ramp ──────────────────────────────────────────────────────────

  private rampDifficulty(): void {
    if (this.over) return;
    this.level++;
    this.levelText.setText(`Lv.${this.level}`);

    this.dropSpeed = Math.min(this.dropSpeed + 18, 340);
    this.spawnDelay = Math.max(this.spawnDelay - 60, 380);
    this.bombChance = Math.min(this.bombChance + 0.015, 0.22);
    this.starChance = Math.min(this.starChance + 0.005, 0.09);

    // Restart spawn timer with new delay
    this.spawnTimer?.remove();
    this.spawnTimer = this.time.addEvent({
      delay: this.spawnDelay,
      loop: true,
      callback: this.spawnDrop,
      callbackScope: this,
    });

    this.showLevelUpBanner();
    playLevelUpSound(this);
  }

  private showLevelUpBanner(): void {
    const banner = this.add
      .text(VW / 2, VH / 2, `⬆ Level ${this.level}!`, {
        fontFamily: "Fraunces, serif",
        fontSize: "38px",
        color: "#fbbf24",
        stroke: "#000000",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setAlpha(0);

    this.tweens.add({
      targets: banner,
      alpha: { from: 0, to: 1 },
      y: VH / 2 - 30,
      duration: 280,
      ease: "Back.easeOut",
      onComplete: () => {
        this.tweens.add({
          targets: banner,
          alpha: 0,
          y: VH / 2 - 65,
          duration: 400,
          delay: 700,
          ease: "Sine.easeIn",
          onComplete: () => banner.destroy(),
        });
      },
    });
  }

  // ── Visual feedback ──────────────────────────────────────────────────────────

  private spawnScorePopup(pts: number, color: number, mult: number): void {
    const label = mult > 1 ? `+${pts} ×${mult}!` : `+${pts}`;
    const col = "#" + color.toString(16).padStart(6, "0");
    const pop = this.add
      .text(
        this.basket.x + Phaser.Math.Between(-28, 28),
        this.basket.y - 28,
        label,
        {
          fontFamily: "Fraunces, serif",
          fontSize: mult > 1 ? "22px" : "18px",
          color: mult > 1 ? "#fbbf24" : col,
          stroke: "#000000",
          strokeThickness: 3,
        }
      )
      .setOrigin(0.5)
      .setDepth(15);

    this.tweens.add({
      targets: pop,
      y: pop.y - 52,
      alpha: 0,
      scaleX: mult > 1 ? 1.3 : 1,
      scaleY: mult > 1 ? 1.3 : 1,
      duration: 700,
      ease: "Sine.easeOut",
      onComplete: () => pop.destroy(),
    });
  }

  private spawnBurst(x: number, y: number, color: number, shine: number): void {
    const count = 8;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = Phaser.Math.Between(55, 110);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const col = i % 2 === 0 ? color : shine;

      const dot = this.add.graphics().setDepth(14);
      const dotR = Phaser.Math.Between(3, 6);
      dot.fillStyle(col, 1);
      dot.fillCircle(x, y, dotR);

      this.tweens.add({
        targets: dot,
        x: vx * 0.55,
        y: vy * 0.55,
        alpha: 0,
        duration: 380,
        ease: "Sine.easeOut",
        onComplete: () => dot.destroy(),
      });
    }
  }

  private spawnStarBurst(x: number, y: number): void {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = Phaser.Math.Between(70, 140);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const colors = [0xfbbf24, 0xfef08a, 0xf59e0b, 0xfde68a];
      const col = colors[i % colors.length]!;

      const dot = this.add.graphics().setDepth(14);
      dot.fillStyle(col, 1);
      const r = Phaser.Math.Between(3, 7);
      dot.fillCircle(x, y, r);

      this.tweens.add({
        targets: dot,
        x: vx * 0.6,
        y: vy * 0.6,
        alpha: 0,
        scaleX: 1.5,
        scaleY: 1.5,
        duration: 480,
        ease: "Sine.easeOut",
        onComplete: () => dot.destroy(),
      });
    }
  }

  private spawnExplosion(x: number, y: number): void {
    const count = 14;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const speed = Phaser.Math.Between(60, 130);
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const colors = [0xff4444, 0xff8800, 0xffcc00, 0x1a1a2e];
      const col = colors[i % colors.length]!;

      const dot = this.add.graphics().setDepth(14);
      dot.fillStyle(col, 1);
      const r = Phaser.Math.Between(4, 8);
      dot.fillCircle(x, y, r);

      this.tweens.add({
        targets: dot,
        x: vx * 0.65,
        y: vy * 0.65,
        alpha: 0,
        duration: 450,
        ease: "Sine.easeOut",
        onComplete: () => dot.destroy(),
      });
    }

    // Smoke ring
    const smoke = this.add.graphics().setDepth(13);
    smoke.lineStyle(4, 0x888888, 0.7);
    smoke.strokeCircle(x, y, 8);
    this.tweens.add({
      targets: smoke,
      scaleX: 3.5,
      scaleY: 3.5,
      alpha: 0,
      duration: 380,
      ease: "Sine.easeOut",
      onComplete: () => smoke.destroy(),
    });
  }

  private basketBounce(): void {
    this.tweens.add({
      targets: this.basket,
      scaleY: 0.82,
      duration: 70,
      yoyo: true,
      ease: "Sine.easeInOut",
    });
  }

  private showComboLabel(): void {
    if (this.combo < 2) {
      this.comboLabel.setAlpha(0);
      return;
    }
    const labels: Record<number, string> = {
      2: "Nice! ×2",
      3: "Great! ×2",
      5: "Awesome! ×3",
      8: "UNSTOPPABLE! ×4",
    };
    const text =
      this.combo >= 8
        ? labels[8]!
        : this.combo >= 5
        ? labels[5]!
        : this.combo >= 3
        ? labels[3]!
        : labels[2]!;

    this.comboLabel.setText(text);
    this.tweens.add({ targets: this.comboLabel, alpha: 1, duration: 150 });
  }

  private resetComboTimer(): void {
    this.comboTimer?.remove();
    this.comboTimer = this.time.delayedCall(1900, () => {
      this.combo = 0;
      this.tweens.add({ targets: this.comboLabel, alpha: 0, duration: 200 });
    });
  }

  private updateScoreText(): void {
    this.scoreText.setText(String(this.score));
    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.22,
      scaleY: 1.22,
      duration: 90,
      yoyo: true,
      ease: "Sine.easeOut",
    });
  }

  private updateHearts(): void {
    this.heartIcons.forEach((h, i) => {
      if (i < this.lives) {
        h.setText("❤️");
        h.setAlpha(1);
      } else {
        h.setText("🖤");
        h.setAlpha(0.45);
      }
    });

    // Shake the lost heart
    const lostHeart = this.heartIcons[this.lives];
    if (lostHeart) {
      this.tweens.add({
        targets: lostHeart,
        x: lostHeart.x + 5,
        duration: 60,
        yoyo: true,
        repeat: 3,
        ease: "Sine.easeInOut",
      });
    }
  }

  private saveHighScore(): void {
    const prev = parseInt(localStorage.getItem(HS_KEY) ?? "0", 10);
    if (this.score > prev) {
      localStorage.setItem(HS_KEY, String(this.score));
    }
  }

  private destroyDrop(drop: Phaser.GameObjects.Image): void {
    this.tweens.killTweensOf(drop);
    drop.setActive(false);
    drop.destroy();
  }

  // ── Game Over ────────────────────────────────────────────────────────────────

  private triggerGameOver(): void {
    this.over = true;
    this.spawnTimer?.remove();
    this.diffTimer?.remove();
    this.comboTimer?.remove();

    // Fade out remaining drops
    this.drops.getChildren().forEach((obj) => {
      const d = obj as Phaser.GameObjects.Image;
      this.tweens.add({ targets: d, alpha: 0, duration: 300 });
    });

    playGameOverSound(this);
    this.time.delayedCall(500, () => this.showGameOverPanel());
  }

  private showGameOverPanel(): void {
    const hs = parseInt(localStorage.getItem(HS_KEY) ?? "0", 10);
    const isNewBest = this.score >= hs && this.score > 0;

    // Dim overlay
    const overlay = this.add.graphics().setDepth(18);
    overlay.fillStyle(0x000000, 0);
    overlay.fillRect(0, 0, VW, VH);
    this.tweens.add({ targets: overlay, fillAlpha: 0.55, duration: 350 });

    // Panel
    const panelW = 300;
    const panelH = isNewBest ? 310 : 290;
    const panelX = VW / 2 - panelW / 2;
    const panelY = VH / 2 - panelH / 2;

    const panel = this.add.graphics().setDepth(19);
    panel.fillStyle(0x1e3a5f, 0.96);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 20);
    panel.lineStyle(3, 0x38bdf8, 0.8);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 20);

    const cx = VW / 2;
    let ty = panelY + 32;

    this.add
      .text(cx, ty, "Game Over!", {
        fontFamily: "Fraunces, serif",
        fontSize: "38px",
        color: "#f87171",
        stroke: "#000000",
        strokeThickness: 4,
      })
      .setOrigin(0.5)
      .setDepth(20);
    ty += 50;

    this.add
      .text(cx, ty, `Score: ${this.score}`, {
        fontFamily: "Fraunces, serif",
        fontSize: "28px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(20);
    ty += 38;

    if (isNewBest) {
      const newBest = this.add
        .text(cx, ty, "🏆 NEW BEST!", {
          fontFamily: "Manrope, sans-serif",
          fontSize: "18px",
          color: "#fbbf24",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(20);
      this.tweens.add({
        targets: newBest,
        scaleX: 1.12,
        scaleY: 1.12,
        duration: 400,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      ty += 36;
    } else if (hs > 0) {
      this.add
        .text(cx, ty, `Best: ${hs}`, {
          fontFamily: "Manrope, sans-serif",
          fontSize: "16px",
          color: "#94a3b8",
        })
        .setOrigin(0.5)
        .setDepth(20);
      ty += 32;
    }

    this.add
      .text(cx, ty, `Level reached: ${this.level}`, {
        fontFamily: "Manrope, sans-serif",
        fontSize: "14px",
        color: "#7dd3fc",
      })
      .setOrigin(0.5)
      .setDepth(20);
    ty += 36;

    // Play Again button
    const btnW = 200;
    const btnH = 54;
    const btnX = cx - btnW / 2;
    const btnBg = this.add.graphics().setDepth(20);
    btnBg.fillStyle(0x15803d, 1);
    btnBg.fillRoundedRect(btnX, ty, btnW, btnH, 27);
    btnBg.fillStyle(0x22c55e, 1);
    btnBg.fillRoundedRect(btnX, ty - 3, btnW, btnH - 2, 26);

    const playBtn = this.add
      .text(cx, ty + btnH / 2 - 2, "▶  Play Again", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "22px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(21)
      .setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: [btnBg, playBtn],
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    ty += btnH + 14;

    // Menu button
    const menuBtn = this.add
      .text(cx, ty, "↩ Main Menu", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "15px",
        color: "#94a3b8",
      })
      .setOrigin(0.5)
      .setDepth(21)
      .setInteractive({ useHandCursor: true });

    playBtn.on("pointerdown", () => {
      this.cameras.main.fadeOut(220, 0, 0, 0);
      this.time.delayedCall(220, () => this.scene.restart());
    });
    menuBtn.on("pointerdown", () => {
      this.cameras.main.fadeOut(220, 0, 0, 0);
      this.time.delayedCall(220, () => this.scene.start("menu"));
    });

    // Keyboard shortcuts
    this.input.keyboard?.once("keydown-SPACE", () => {
      this.cameras.main.fadeOut(220, 0, 0, 0);
      this.time.delayedCall(220, () => this.scene.restart());
    });
    this.input.keyboard?.once("keydown-ENTER", () => {
      this.cameras.main.fadeOut(220, 0, 0, 0);
      this.time.delayedCall(220, () => this.scene.restart());
    });

    // Animate panel in
    panel.setScale(0.85);
    panel.setAlpha(0);
    this.tweens.add({
      targets: panel,
      scaleX: 1,
      scaleY: 1,
      alpha: 1,
      duration: 280,
      ease: "Back.easeOut",
    });
  }
}

// ─── Entry point ──────────────────────────────────────────────────────────────

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
    physics: {
      default: "arcade",
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [MenuScene, new PlayScene(onScore)],
  });

  return () => game.destroy(true);
}
