import Phaser from "phaser";

// ─── Constants ────────────────────────────────────────────────────────────────
const VW = 400;
const VH = 640;
const MAX_LIVES = 3;
const HS_KEY = "fruitydropz_highscore";

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
  const size = r * 2 + 8;
  const cx = size / 2;
  const cy = size / 2;
  const g = scene.make.graphics({ add: false });

  // Drop shadow
  g.fillStyle(0x000000, 0.18);
  g.fillCircle(cx + 3, cy + 3, r);

  // Dark base (gives depth)
  g.fillStyle(def.dark, 1);
  g.fillCircle(cx, cy, r);

  // Main color
  g.fillStyle(def.color, 1);
  g.fillCircle(cx, cy, r - 2);

  // Shine highlight
  g.fillStyle(def.shine, 0.7);
  g.fillCircle(cx - r * 0.28, cy - r * 0.28, r * 0.38);

  // Tiny specular dot
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(cx - r * 0.22, cy - r * 0.22, r * 0.12);

  g.generateTexture(key, size, size);
  g.destroy();
}

function buildStarTex(scene: Phaser.Scene): void {
  if (scene.textures.exists("star_fruit")) return;
  const r = STAR_FRUIT.r;
  const size = r * 2 + 8;
  const cx = size / 2;
  const cy = size / 2;
  const g = scene.make.graphics({ add: false });

  // Glow
  g.fillStyle(0xfef08a, 0.35);
  g.fillCircle(cx, cy, r + 4);

  // Star shape (5-pointed)
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < 10; i++) {
    const ang = (i * Math.PI) / 5 - Math.PI / 2;
    const rad = i % 2 === 0 ? r : r * 0.45;
    pts.push({ x: cx + Math.cos(ang) * rad, y: cy + Math.sin(ang) * rad });
  }
  g.fillStyle(STAR_FRUIT.dark, 1);
  g.fillPoints(pts, true);
  g.fillStyle(STAR_FRUIT.color, 1);
  const pts2: { x: number; y: number }[] = [];
  for (let i = 0; i < 10; i++) {
    const ang = (i * Math.PI) / 5 - Math.PI / 2;
    const rad = i % 2 === 0 ? r - 1 : r * 0.42;
    pts2.push({ x: cx + Math.cos(ang) * rad, y: cy + Math.sin(ang) * rad });
  }
  g.fillPoints(pts2, true);
  g.fillStyle(STAR_FRUIT.shine, 0.8);
  g.fillCircle(cx - r * 0.2, cy - r * 0.25, r * 0.3);

  g.generateTexture("star_fruit", size, size);
  g.destroy();
}

function buildBombTex(scene: Phaser.Scene): void {
  if (scene.textures.exists("bomb")) return;
  const r = 16;
  const size = r * 2 + 8;
  const cx = size / 2;
  const cy = size / 2;
  const g = scene.make.graphics({ add: false });

  g.fillStyle(0x000000, 0.2);
  g.fillCircle(cx + 3, cy + 3, r);
  g.fillStyle(0x1a1a1a, 1);
  g.fillCircle(cx, cy, r);
  g.fillStyle(0x444444, 0.6);
  g.fillCircle(cx - r * 0.25, cy - r * 0.25, r * 0.35);

  // Fuse
  g.lineStyle(3, 0x888888, 1);
  g.beginPath();
  g.moveTo(cx + r * 0.5, cy - r * 0.65);
  g.lineTo(cx + r * 0.75, cy - r * 1.0);
  g.lineTo(cx + r * 0.55, cy - r * 1.3);
  g.strokePath();

  // Spark at fuse tip
  g.fillStyle(0xfbbf24, 1);
  g.fillCircle(cx + r * 0.55, cy - r * 1.35, 4);
  g.fillStyle(0xfef08a, 0.9);
  g.fillCircle(cx + r * 0.55, cy - r * 1.35, 2);

  g.generateTexture("bomb", size, size);
  g.destroy();
}

function buildBasketTex(scene: Phaser.Scene): void {
  if (scene.textures.exists("basket")) return;
  const W = 96;
  const H = 32;
  const g = scene.make.graphics({ add: false });

  // Shadow
  g.fillStyle(0x000000, 0.15);
  g.fillRoundedRect(3, 3, W, H, 8);

  // Outer rim (dark wood)
  g.fillStyle(0x92400e, 1);
  g.fillRoundedRect(0, 0, W, H, 8);

  // Inner basket body
  g.fillStyle(0xfbbf24, 1);
  g.fillRoundedRect(3, 3, W - 6, H - 6, 6);

  // Weave pattern - horizontal
  g.lineStyle(1.5, 0xd97706, 0.7);
  for (let y = 9; y < H - 4; y += 7) {
    g.strokeLineShape(new Phaser.Geom.Line(5, y, W - 5, y));
  }
  // Weave pattern - vertical
  for (let x = 12; x < W - 5; x += 11) {
    g.strokeLineShape(new Phaser.Geom.Line(x, 4, x, H - 4));
  }

  // Top highlight
  g.fillStyle(0xfde68a, 0.5);
  g.fillRoundedRect(5, 4, W - 10, 6, 3);

  g.generateTexture("basket", W, H);
  g.destroy();
}

function buildTreeTex(scene: Phaser.Scene): void {
  if (scene.textures.exists("tree")) return;
  const g = scene.make.graphics({ add: false });
  // Trunk
  g.fillStyle(0x92400e, 1);
  g.fillRect(18, 50, 14, 30);
  // Canopy layers
  g.fillStyle(0x16a34a, 1);
  g.fillTriangle(25, 0, 0, 40, 50, 40);
  g.fillStyle(0x22c55e, 1);
  g.fillTriangle(25, 10, 3, 45, 47, 45);
  g.fillStyle(0x4ade80, 0.6);
  g.fillTriangle(25, 15, 8, 42, 42, 42);
  g.generateTexture("tree", 50, 80);
  g.destroy();
}

function buildCloudTex(scene: Phaser.Scene): void {
  if (scene.textures.exists("cloud")) return;
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0xffffff, 0.85);
  g.fillEllipse(60, 30, 80, 36);
  g.fillEllipse(40, 26, 56, 32);
  g.fillEllipse(80, 26, 52, 30);
  g.fillEllipse(60, 24, 50, 28);
  g.generateTexture("cloud", 120, 56);
  g.destroy();
}

// ─── Audio helpers ────────────────────────────────────────────────────────────

function playTone(
  scene: Phaser.Scene,
  freq: number,
  duration: number,
  vol = 0.18,
  type: OscillatorType = "sine"
): void {
  try {
    const ctx = (scene.sound as Phaser.Sound.WebAudioSoundManager)
      .context as AudioContext;
    if (!ctx || ctx.state === "suspended") return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio unavailable — silent fail
  }
}

function playCatchSound(scene: Phaser.Scene, combo: number): void {
  const base = 440 + combo * 55;
  playTone(scene, base, 0.12, 0.2, "sine");
  scene.time.delayedCall(70, () => playTone(scene, base * 1.5, 0.1, 0.12, "sine"));
}

function playBombSound(scene: Phaser.Scene): void {
  playTone(scene, 80, 0.35, 0.3, "sawtooth");
  scene.time.delayedCall(80, () => playTone(scene, 55, 0.3, 0.25, "square"));
}

function playMissSound(scene: Phaser.Scene): void {
  playTone(scene, 220, 0.2, 0.18, "triangle");
  scene.time.delayedCall(100, () => playTone(scene, 180, 0.25, 0.14, "triangle"));
}

function playStarSound(scene: Phaser.Scene): void {
  [523, 659, 784, 1047].forEach((f, i) => {
    scene.time.delayedCall(i * 60, () => playTone(scene, f, 0.18, 0.22, "sine"));
  });
}

// ─── MenuScene ────────────────────────────────────────────────────────────────

class MenuScene extends Phaser.Scene {
  constructor() {
    super("menu");
  }

  preload(): void {
    // Build textures in preload so they exist for create
  }

  create(): void {
    // Build all shared textures here so they're ready for PlayScene too
    buildFruitTex(this, "fruit_0", FRUITS[0]!);
    buildFruitTex(this, "fruit_1", FRUITS[1]!);
    buildFruitTex(this, "fruit_2", FRUITS[2]!);
    buildFruitTex(this, "fruit_3", FRUITS[3]!);
    buildFruitTex(this, "fruit_4", FRUITS[4]!);
    buildFruitTex(this, "fruit_5", FRUITS[5]!);
    buildFruitTex(this, "fruit_6", FRUITS[6]!);
    buildStarTex(this);
    buildBombTex(this);
    buildBasketTex(this);
    buildTreeTex(this);
    buildCloudTex(this);

    this.drawBackground();
    this.drawScenery();
    this.drawFloatingFruits();
    this.drawUI();
  }

  private drawBackground(): void {
    const bg = this.add.graphics();
    // Sky gradient (top sky blue → lower lighter blue)
    bg.fillGradientStyle(0x38bdf8, 0x38bdf8, 0x7dd3fc, 0x7dd3fc, 1);
    bg.fillRect(0, 0, VW, VH * 0.75);
    // Ground gradient
    bg.fillGradientStyle(0x4ade80, 0x4ade80, 0x16a34a, 0x16a34a, 1);
    bg.fillRect(0, VH * 0.75, VW, VH * 0.25);
    // Darker ground strip
    bg.fillStyle(0x15803d, 1);
    bg.fillRect(0, VH - 20, VW, 20);
  }

  private drawScenery(): void {
    // Clouds
    for (let i = 0; i < 3; i++) {
      const cx = 60 + i * 130;
      const cy = 50 + i * 25;
      const cloud = this.add.image(cx, cy, "cloud").setAlpha(0.9).setScale(0.7 + i * 0.15);
      this.tweens.add({
        targets: cloud,
        x: cx + 30,
        duration: 6000 + i * 2000,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    // Trees on ground
    this.add.image(30, VH - 50, "tree").setScale(0.9).setOrigin(0.5, 1);
    this.add.image(VW - 30, VH - 50, "tree").setScale(1.1).setOrigin(0.5, 1);
    this.add.image(80, VH - 45, "tree").setScale(0.7).setOrigin(0.5, 1);
    this.add.image(VW - 85, VH - 45, "tree").setScale(0.75).setOrigin(0.5, 1);
  }

  private drawFloatingFruits(): void {
    const positions = [
      { fi: 0, x: 55,       y: 200 },
      { fi: 1, x: VW - 55,  y: 160 },
      { fi: 2, x: 195,      y: 110 },
      { fi: 3, x: 90,       y: 330 },
      { fi: 4, x: VW - 90,  y: 310 },
      { fi: 6, x: 40,       y: 470 },
      { fi: 5, x: VW - 45,  y: 455 },
    ];
    for (const p of positions) {
      const img = this.add.image(p.x, p.y, `fruit_${p.fi}`).setAlpha(0.75).setScale(1.2);
      this.tweens.add({
        targets: img,
        y: p.y - 16,
        angle: Phaser.Math.Between(-10, 10),
        duration: 1300 + p.fi * 220,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }
  }

  private drawUI(): void {
    // Title
    const titleBg = this.add.graphics();
    titleBg.fillStyle(0x000000, 0.12);
    titleBg.fillRoundedRect(VW / 2 - 155, 200, 310, 120, 16);

    this.add
      .text(VW / 2, 230, "FruityDrop", {
        fontFamily: "Fraunces, serif",
        fontSize: "56px",
        color: "#ffffff",
        stroke: "#15803d",
        strokeThickness: 7,
      })
      .setOrigin(0.5);

    this.add
      .text(VW / 2, 292, "Catch the fruit! Dodge the bombs! 🍉", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "14px",
        color: "#e0f2fe",
        wordWrap: { width: 300 },
        align: "center",
      })
      .setOrigin(0.5);

    // High score badge
    const hs = parseInt(localStorage.getItem(HS_KEY) ?? "0", 10);
    if (hs > 0) {
      const hsBg = this.add.graphics();
      hsBg.fillStyle(0x92400e, 0.85);
      hsBg.fillRoundedRect(VW / 2 - 75, 316, 150, 32, 16);
      this.add
        .text(VW / 2, 332, `🏆  Best: ${hs}`, {
          fontFamily: "Manrope, sans-serif",
          fontSize: "16px",
          color: "#fde68a",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
    }

    // Play button
    const btnY = hs > 0 ? 380 : 360;
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x15803d, 1);
    btnBg.fillRoundedRect(VW / 2 - 100, btnY, 200, 60, 30);
    btnBg.fillStyle(0x22c55e, 1);
    btnBg.fillRoundedRect(VW / 2 - 98, btnY - 2, 196, 56, 28);

    const btnTxt = this.add
      .text(VW / 2, btnY + 28, "▶  Play Now", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "26px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: [btnBg, btnTxt],
      scaleX: 1.05,
      scaleY: 1.05,
      duration: 750,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Controls hint
    const hintY = btnY + 80;
    this.add
      .text(VW / 2, hintY, "🖱️ drag / ← → arrow keys", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "13px",
        color: "#bae6fd",
      })
      .setOrigin(0.5);
    this.add
      .text(VW / 2, hintY + 20, "Miss 3 fruits = game over  •  Bombs cost a life!", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "12px",
        color: "#bae6fd",
        wordWrap: { width: 320 },
        align: "center",
      })
      .setOrigin(0.5);

    // Fruit legend row
    const legendY = hintY + 58;
    this.add
      .text(VW / 2, legendY, "Collect for bonus points:", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "12px",
        color: "#fde68a",
      })
      .setOrigin(0.5);
    const legendFruits = [0, 1, 2, 6];
    legendFruits.forEach((fi, i) => {
      const lx = VW / 2 - 60 + i * 40;
      const img = this.add.image(lx, legendY + 24, `fruit_${fi}`).setScale(0.9);
      const fr = FRUITS[fi]!;
      this.add
        .text(lx, legendY + 42, `+${fr.pts}`, {
          fontFamily: "Manrope, sans-serif",
          fontSize: "11px",
          color: "#ffffff",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
      this.tweens.add({
        targets: img,
        y: legendY + 20,
        duration: 600 + i * 100,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    });

    const start = (): void => {
      this.cameras.main.fadeOut(280, 0, 0, 0);
      this.time.delayedCall(280, () => this.scene.start("play"));
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

  private spawnDelay = 950;
  private dropSpeed = 135;
  private bombChance = 0.07;
  private starChance = 0.04;
  private level = 1;

  constructor(onScore: (n: number) => void) {
    super("play");
    this.onScore = onScore;
  }

  create(): void {
    this.score = 0;
    this.lives = MAX_LIVES;
    this.over = false;
    this.combo = 0;
    this.spawnDelay = 950;
    this.dropSpeed = 135;
    this.bombChance = 0.07;
    this.starChance = 0.04;
    this.level = 1;
    this.onScore(0);

    this.drawBackground();
    this.drawScenery();
    this.buildHUD();
    this.buildBasket();
    this.buildInput();
    this.buildPhysics();
    this.startTimers();

    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  // ── Scene setup ────────────────────────────────────────────────────────────

  private drawBackground(): void {
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x38bdf8, 0x38bdf8, 0x7dd3fc, 0x7dd3fc, 1);
    bg.fillRect(0, 0, VW, VH * 0.78);
    bg.fillGradientStyle(0x4ade80, 0x4ade80, 0x16a34a, 0x16a34a, 1);
    bg.fillRect(0, VH * 0.78, VW, VH * 0.22);
    bg.fillStyle(0x15803d, 1);
    bg.fillRect(0, VH - 18, VW, 18);
  }

  private drawScenery(): void {
    // Animated clouds
    for (let i = 0; i < 4; i++) {
      const startX = Phaser.Math.Between(0, VW);
      const cy = 55 + i * 30;
      const sc = 0.55 + i * 0.1;
      const cloud = this.add.image(startX, cy, "cloud").setAlpha(0.75).setScale(sc);
      const speed = 22000 + i * 5000;
      this.tweens.add({
        targets: cloud,
        x: VW + 80,
        duration: speed - (startX / VW) * speed,
        onComplete: () => {
          cloud.x = -80;
          this.tweens.add({
            targets: cloud,
            x: VW + 80,
            duration: speed,
            repeat: -1,
            onRepeat: () => { cloud.x = -80; },
          });
        },
      });
    }

    // Trees flanking the play area
    this.add.image(22, VH - 18, "tree").setScale(0.85).setOrigin(0.5, 1).setAlpha(0.9);
    this.add.image(VW - 22, VH - 18, "tree").setScale(1.0).setOrigin(0.5, 1).setAlpha(0.9);
  }

  private buildHUD(): void {
    // HUD bar background
    const hudBg = this.add.graphics().setDepth(10);
    hudBg.fillStyle(0x000000, 0.3);
    hudBg.fillRoundedRect(6, 6, VW - 12, 48, 10);

    // Level pill (left)
    this.levelText = this.add
      .text(18, 30, "Lv.1", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "15px",
        color: "#fde68a",
        fontStyle: "bold",
      })
      .setOrigin(0, 0.5)
      .setDepth(11);

    // Score (center)
    this.scoreText = this.add
      .text(VW / 2, 30, "0", {
        fontFamily: "Fraunces, serif",
        fontSize: "30px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(11);

    // Hearts (right)
    this.heartIcons = [];
    for (let i = 0; i < MAX_LIVES; i++) {
      const h = this.add
        .text(VW - 18 - i * 28, 30, "❤️", { fontSize: "20px" })
        .setOrigin(0.5, 0.5)
        .setDepth(11);
      this.heartIcons.push(h);
    }

    // Combo label (hidden until combo ≥ 3)
    this.comboLabel = this.add
      .text(VW / 2, 64, "", {
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

  private buildBasket(): void {
    this.basket = this.add.image(VW / 2, VH - 48, "basket").setDepth(5);
    this.physics.add.existing(this.basket);
    const body = this.basket.body as Phaser.Physics.Arcade.Body;
    body.setImmovable(true);
    body.setAllowGravity(false);
    body.setSize(90, 24);
  }

  private buildInput(): void {
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!this.over)
        this.basket.x = Phaser.Math.Clamp(p.x, 50, VW - 50);
    });
    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (!this.over)
        this.basket.x = Phaser.Math.Clamp(p.x, 50, VW - 50);
    });
    this.cursors = this.input.keyboard?.createCursorKeys();
  }

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

  private startTimers(): void {
    this.spawnTimer = this.time.addEvent({
      delay: this.spawnDelay,
      loop: true,
      callback: this.spawnDrop,
      callbackScope: this,
    });
    this.diffTimer = this.time.addEvent({
      delay: 12000,
      loop: true,
      callback: this.rampDifficulty,
      callbackScope: this,
    });
  }

  // ── Drop spawning ───────────────────────────────────────────────────────────

  private spawnDrop(): void {
    if (this.over) return;

    const roll = Math.random();
    let key: string;
    let r: number;
    const fd: FruitData = { fruitIndex: 0, isBomb: false, isStar: false };

    if (roll < this.bombChance) {
      key = "bomb";
      r = 16;
      fd.isBomb = true;
      fd.fruitIndex = -1;
    } else if (roll < this.bombChance + this.starChance) {
      key = "star_fruit";
      r = STAR_FRUIT.r;
      fd.isStar = true;
      fd.fruitIndex = -2;
    } else {
      const fi = Phaser.Math.Between(0, FRUITS.length - 1);
      key = `fruit_${fi}`;
      r = FRUITS[fi]!.r;
      fd.fruitIndex = fi;
    }

    const x = Phaser.Math.Between(r + 10, VW - r - 10);
    const drop = this.add.image(x, -r - 12, key).setDepth(4);
    drop.setData("fd", fd);
    drop.setActive(true);

    this.physics.add.existing(drop);
    const body = drop.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setCircle(r, drop.width / 2 - r, drop.height / 2 - r);
    body.setVelocityY(this.dropSpeed + Phaser.Math.Between(-15, 25));

    // Gentle spin
    this.tweens.add({
      targets: drop,
      angle: Phaser.Math.Between(-15, 15),
      duration: 350 + Phaser.Math.Between(0, 300),
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Star fruit pulses
    if (fd.isStar) {
      this.tweens.add({
        targets: drop,
        scaleX: 1.2,
        scaleY: 1.2,
        duration: 300,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    this.drops.add(drop);
  }

  // ── Catch/hit handlers ──────────────────────────────────────────────────────

  private onFruitCaught(drop: Phaser.GameObjects.Image, fi: number): void {
    const fr = FRUITS[fi]!;
    this.combo++;
    const multiplier = this.combo >= 5 ? 3 : this.combo >= 3 ? 2 : 1;
    const pts = fr.pts * multiplier;
    this.score += pts;
    this.onScore(this.score);
    this.saveHighScore();

    // Reset combo timer
    this.comboTimer?.remove();
    this.comboTimer = this.time.delayedCall(1800, () => {
      this.combo = 0;
      this.tweens.add({ targets: this.comboLabel, alpha: 0, duration: 200 });
    });

    this.updateScoreText();
    this.showComboLabel();
    this.spawnScorePopup(pts, fr.color, this.combo);
    this.spawnBurst(this.basket.x, this.basket.y, fr.color, fr.shine);
    playCatchSound(this, this.combo);
    this.destroyDrop(drop);
  }

  private onStarCaught(drop: Phaser.GameObjects.Image): void {
    this.combo += 2;
    const pts = STAR_FRUIT.pts;
    this.score += pts;
    this.onScore(this.score);
    this.saveHighScore();

    this.comboTimer?.remove();
    this.comboTimer = this.time.delayedCall(1800, () => {
      this.combo = 0;
      this.tweens.add({ targets: this.comboLabel, alpha: 0, duration: 200 });
    });

    this.updateScoreText();
    this.showComboLabel();
    this.spawnScorePopup(pts, STAR_FRUIT.color, this.combo);
    this.spawnBurst(this.basket.x, this.basket.y, STAR_FRUIT.color, STAR_FRUIT.shine);
    playStarSound(this);

    // Star screen flash
    this.cameras.main.flash(200, 255, 240, 80);
    this.destroyDrop(drop);
  }

  private onBombCaught(drop: Phaser.GameObjects.Image): void {
    this.combo = 0;
    this.tweens.add({ targets: this.comboLabel, alpha: 0, duration: 150 });
    this.cameras.main.flash(350, 220, 30, 30);
    this.cameras.main.shake(280, 0.014);
    playBombSound(this);
    this.spawnExplosion(drop.x, drop.y);
    this.destroyDrop(drop);
    this.loseLife();
  }

  private loseLife(): void {
    if (this.over) return;
    this.lives--;
    this.updateHearts();
    if (this.lives <= 0) {
      this.triggerGameOver();
    }
  }

  private missedFruit(): void {
    this.combo = 0;
    this.tweens.add({ targets: this.comboLabel, alpha: 0, duration: 150 });
    playMissSound(this);
    this.loseLife();
  }

  // ── Visual feedback ─────────────────────────────────────────────────────────

  private spawnScorePopup(pts: number, _color: number, combo: number): void {
    const isHot = combo >= 3;
    const label = this.add
      .text(this.basket.x, this.basket.y - 28, isHot ? `+${pts} 🔥` : `+${pts}`, {
        fontFamily: "Fraunces, serif",
        fontSize: isHot ? "28px" : "22px",
        color: isHot ? "#fbbf24" : "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5)
      .setDepth(20);
    this.tweens.add({
      targets: label,
      y: label.y - 55,
      alpha: 0,
      duration: 850,
      ease: "Cubic.easeOut",
      onComplete: () => label.destroy(),
    });
  }

  private spawnBurst(
    x: number,
    y: number,
    color: number,
    shine: number
  ): void {
    const count = 10;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const dist = Phaser.Math.Between(28, 58);
      const c = i % 2 === 0 ? color : shine;
      const p = this.add
        .circle(x + Math.cos(angle) * 8, y + Math.sin(angle) * 8, Phaser.Math.Between(3, 7), c)
        .setDepth(15);
      this.tweens.add({
        targets: p,
        x: p.x + Math.cos(angle) * dist,
        y: p.y + Math.sin(angle) * dist,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 480,
        ease: "Cubic.easeOut",
        onComplete: () => p.destroy(),
      });
    }
  }

  private spawnExplosion(x: number, y: number): void {
    for (let i = 0; i < 14; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Phaser.Math.Between(20, 70);
      const colors = [0xff4500, 0xfbbf24, 0xff8c00, 0xfef08a];
      const c = colors[i % colors.length]!;
      const p = this.add
        .circle(x, y, Phaser.Math.Between(4, 9), c)
        .setDepth(15);
      this.tweens.add({
        targets: p,
        x: p.x + Math.cos(angle) * dist,
        y: p.y + Math.sin(angle) * dist,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 600,
        ease: "Cubic.easeOut",
        onComplete: () => p.destroy(),
      });
    }
  }

  private showComboLabel(): void {
    if (this.combo < 3) {
      this.comboLabel.setAlpha(0);
      return;
    }
    const labels = ["", "", "", "Nice! ×2", "Great! ×2", "AMAZING! ×3", "ON FIRE! ×3"];
    const txt = labels[Math.min(this.combo, labels.length - 1)] ?? `COMBO ×${this.combo}!`;
    this.comboLabel.setText(txt);
    this.tweens.killTweensOf(this.comboLabel);
    this.comboLabel.setAlpha(1).setScale(1.2);
    this.tweens.add({
      targets: this.comboLabel,
      scaleX: 1,
      scaleY: 1,
      duration: 200,
      ease: "Back.easeOut",
    });
  }

  // ── HUD updates ─────────────────────────────────────────────────────────────

  private updateScoreText(): void {
    this.scoreText.setText(String(this.score));
    this.tweens.killTweensOf(this.scoreText);
    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.35,
      scaleY: 1.35,
      duration: 90,
      yoyo: true,
    });
  }

  private updateHearts(): void {
    for (let i = 0; i < this.heartIcons.length; i++) {
      const h = this.heartIcons[i]!;
      if (i < this.lives) {
        h.setText("❤️");
      } else {
        h.setText("🖤");
        this.tweens.add({
          targets: h,
          scaleX: 1.5,
          scaleY: 1.5,
          duration: 100,
          yoyo: true,
        });
      }
    }
  }

  // ── Difficulty ramp ─────────────────────────────────────────────────────────

  private rampDifficulty(): void {
    if (this.over) return;
    this.level++;
    this.spawnDelay = Math.max(340, this.spawnDelay - 60);
    this.dropSpeed = Math.min(400, this.dropSpeed + 24);
    this.bombChance = Math.min(0.22, this.bombChance + 0.014);

    this.spawnTimer?.remove();
    this.spawnTimer = this.time.addEvent({
      delay: this.spawnDelay,
      loop: true,
      callback: this.spawnDrop,
      callbackScope: this,
    });

    // Level-up banner
    this.levelText.setText(`Lv.${this.level}`);
    const banner = this.add
      .text(VW / 2, VH / 2 - 20, `Level ${this.level}! 🎉`, {
        fontFamily: "Fraunces, serif",
        fontSize: "38px",
        color: "#fbbf24",
        stroke: "#000000",
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setDepth(25)
      .setAlpha(0);
    this.tweens.add({
      targets: banner,
      alpha: 1,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 300,
      yoyo: false,
      onComplete: () => {
        this.tweens.add({
          targets: banner,
          alpha: 0,
          y: banner.y - 40,
          duration: 700,
          delay: 600,
          ease: "Cubic.easeIn",
          onComplete: () => banner.destroy(),
        });
      },
    });
  }

  // ── Utility ─────────────────────────────────────────────────────────────────

  private destroyDrop(drop: Phaser.GameObjects.Image): void {
    this.tweens.killTweensOf(drop);
    drop.destroy();
  }

  private saveHighScore(): void {
    const hs = parseInt(localStorage.getItem(HS_KEY) ?? "0", 10);
    if (this.score > hs) localStorage.setItem(HS_KEY, String(this.score));
  }

  // ── Update loop ─────────────────────────────────────────────────────────────

  update(): void {
    if (this.over) return;

    // Keyboard control
    const spd = 7;
    if (this.cursors?.left.isDown)
      this.basket.x = Math.max(50, this.basket.x - spd);
    if (this.cursors?.right.isDown)
      this.basket.x = Math.min(VW - 50, this.basket.x + spd);

    // Sync physics body to image position
    (this.basket.body as Phaser.Physics.Arcade.Body).reset(this.basket.x, this.basket.y);

    // Check for drops that fell off screen
    for (const obj of [...this.drops.getChildren()]) {
      const drop = obj as Phaser.GameObjects.Image;
      if (drop.y > VH + 30) {
        const data = drop.getData("fd") as FruitData | undefined;
        this.tweens.killTweensOf(drop);
        drop.destroy();
        if (data && !data.isBomb && drop.active) {
          this.missedFruit();
          if (this.over) return;
        }
      }
    }
  }

  // ── Game Over ────────────────────────────────────────────────────────────────

  private triggerGameOver(): void {
    this.over = true;
    this.spawnTimer?.remove();
    this.diffTimer?.remove();
    this.comboTimer?.remove();

    // Fade out remaining drops
    for (const obj of [...this.drops.getChildren()]) {
      const drop = obj as Phaser.GameObjects.Image;
      this.tweens.killTweensOf(drop);
      this.tweens.add({
        targets: drop,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 350,
        onComplete: () => drop.destroy(),
      });
    }

    const hs = parseInt(localStorage.getItem(HS_KEY) ?? "0", 10);
    const isNewBest = this.score > 0 && this.score >= hs;

    this.time.delayedCall(450, () => this.showGameOverCard(isNewBest, hs));
  }

  private showGameOverCard(isNewBest: boolean, hs: number): void {
    // Dim overlay
    const overlay = this.add.graphics().setDepth(30);
    overlay.fillStyle(0x000000, 0.6);
    overlay.fillRect(0, 0, VW, VH);
    overlay.setAlpha(0);
    this.tweens.add({ targets: overlay, alpha: 1, duration: 350 });

    const cx = VW / 2;
    const cy = VH / 2;

    this.time.delayedCall(250, () => {
      // Card background
      const card = this.add.graphics().setDepth(31);
      card.fillStyle(0x000000, 0.4);
      card.fillRoundedRect(cx - 154, cy - 158, 308, 316, 22);
      card.fillStyle(0xf0fdf4, 1);
      card.fillRoundedRect(cx - 152, cy - 156, 304, 312, 20);
      // Card top accent bar
      card.fillStyle(isNewBest ? 0xfbbf24 : 0x22c55e, 1);
      card.fillRoundedRect(cx - 152, cy - 156, 304, 44, 20);
      card.fillRect(cx - 152, cy - 136, 304, 24);

      const topLabel = this.add
        .text(cx, cy - 134, isNewBest ? "🏆  NEW BEST!" : "Game Over", {
          fontFamily: "Fraunces, serif",
          fontSize: isNewBest ? "22px" : "20px",
          color: "#ffffff",
          fontStyle: "bold",
        })
        .setOrigin(0.5, 0.5)
        .setDepth(32);

      const emoji = this.add
        .text(cx, cy - 80, isNewBest ? "🎉" : "😢", { fontSize: "52px" })
        .setOrigin(0.5)
        .setDepth(32)
        .setAlpha(0);

      const scoreTxt = this.add
        .text(cx, cy - 18, `${this.score}`, {
          fontFamily: "Fraunces, serif",
          fontSize: "54px",
          color: "#15803d",
          stroke: "#000000",
          strokeThickness: 2,
        })
        .setOrigin(0.5)
        .setDepth(32)
        .setAlpha(0);

      const scoreLabel = this.add
        .text(cx, cy + 34, "points", {
          fontFamily: "Manrope, sans-serif",
          fontSize: "16px",
          color: "#6b7280",
        })
        .setOrigin(0.5)
        .setDepth(32)
        .setAlpha(0);

      const hsTxt = this.add
        .text(cx, cy + 62, isNewBest ? "New high score! 🌟" : `Best: ${hs}`, {
          fontFamily: "Manrope, sans-serif",
          fontSize: "15px",
          color: isNewBest ? "#d97706" : "#9ca3af",
          fontStyle: isNewBest ? "bold" : "normal",
        })
        .setOrigin(0.5)
        .setDepth(32)
        .setAlpha(0);

      // Play again button
      const btnG = this.add.graphics().setDepth(32).setAlpha(0);
      btnG.fillStyle(0x15803d, 1);
      btnG.fillRoundedRect(cx - 90, cy + 86, 180, 54, 27);
      btnG.fillStyle(0x22c55e, 1);
      btnG.fillRoundedRect(cx - 88, cy + 84, 176, 50, 25);

      const btnTxt = this.add
        .text(cx, cy + 110, "▶  Play Again", {
          fontFamily: "Manrope, sans-serif",
          fontSize: "20px",
          color: "#ffffff",
          fontStyle: "bold",
        })
        .setOrigin(0.5)
        .setDepth(33)
        .setAlpha(0)
        .setInteractive({ useHandCursor: true });

      const menuTxt = this.add
        .text(cx, cy + 148, "← Menu", {
          fontFamily: "Manrope, sans-serif",
          fontSize: "14px",
          color: "#6b7280",
        })
        .setOrigin(0.5)
        .setDepth(33)
        .setAlpha(0)
        .setInteractive({ useHandCursor: true });

      // Staggered fade-in
      const items = [emoji, scoreTxt, scoreLabel, hsTxt, btnG, btnTxt, menuTxt];
      items.forEach((item, i) => {
        this.tweens.add({
          targets: item,
          alpha: 1,
          y: (item as Phaser.GameObjects.Text).y - 6,
          duration: 400,
          delay: 80 + i * 70,
          ease: "Back.easeOut",
        });
      });

      // Bounce emoji
      this.tweens.add({
        targets: emoji,
        scaleX: 1.15,
        scaleY: 1.15,
        duration: 600,
        delay: 500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      // Top label pop
      this.tweens.add({
        targets: topLabel,
        scaleX: 1.08,
        scaleY: 1.08,
        duration: 500,
        delay: 100,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });

      const restart = (): void => {
        this.cameras.main.fadeOut(250, 0, 0, 0);
        this.time.delayedCall(250, () => this.scene.restart());
      };
      const toMenu = (): void => {
        this.cameras.main.fadeOut(250, 0, 0, 0);
        this.time.delayedCall(250, () => this.scene.start("menu"));
      };

      btnTxt.on("pointerdown", restart);
      menuTxt.on("pointerdown", toMenu);
      this.input.keyboard?.once("keydown-SPACE", restart);
      this.input.keyboard?.once("keydown-ENTER", restart);
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
    parent,
    width: VW,
    height: VH,
    backgroundColor: "#38bdf8",
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: "arcade",
      arcade: { gravity: { x: 0, y: 0 }, debug: false },
    },
    scene: [MenuScene, new PlayScene(onScore)],
    banner: false,
  });

  return () => game.destroy(true);
}
