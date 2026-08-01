import Phaser from "phaser";

// ─── Constants ────────────────────────────────────────────────────────────────
const VW = 400;
const VH = 640;

const MAX_LIVES = 3;
const HS_KEY = "fruitydropz_highscore";

// Fruit definitions: emoji char, fill color, shine color, point value, radius
const FRUITS: Array<{
  label: string;
  color: number;
  shine: number;
  pts: number;
  r: number;
}> = [
  { label: "🍎", color: 0xe63946, shine: 0xff8fa3, pts: 1, r: 18 },
  { label: "🍋", color: 0xffd60a, shine: 0xfff07c, pts: 2, r: 16 },
  { label: "🍇", color: 0x9b5de5, shine: 0xd4aaff, pts: 3, r: 14 },
  { label: "🍊", color: 0xf77f00, shine: 0xffc06e, pts: 2, r: 17 },
  { label: "🍓", color: 0xff4d6d, shine: 0xffb3c1, pts: 1, r: 15 },
  { label: "🫐", color: 0x4361ee, shine: 0x9db4ff, pts: 3, r: 13 },
  { label: "🍉", color: 0x2dc653, shine: 0x80ffaa, pts: 4, r: 20 },
];

// Bomb definition
const BOMB = { label: "💣", color: 0x2d2d2d, shine: 0x888888, r: 16 };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function drawFruitTexture(
  scene: Phaser.Scene,
  key: string,
  color: number,
  shine: number,
  r: number
): void {
  if (scene.textures.exists(key)) return;
  const size = r * 2 + 4;
  const g = scene.make.graphics({ add: false });
  // Shadow
  g.fillStyle(0x000000, 0.15);
  g.fillCircle(size / 2 + 2, size / 2 + 2, r);
  // Main body
  g.fillStyle(color, 1);
  g.fillCircle(size / 2, size / 2, r);
  // Shine
  g.fillStyle(shine, 0.55);
  g.fillCircle(size / 2 - r * 0.25, size / 2 - r * 0.25, r * 0.38);
  g.generateTexture(key, size, size);
  g.destroy();
}

function drawBombTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists("bomb")) return;
  const r = BOMB.r;
  const size = r * 2 + 4;
  const g = scene.make.graphics({ add: false });
  g.fillStyle(0x000000, 0.15);
  g.fillCircle(size / 2 + 2, size / 2 + 2, r);
  g.fillStyle(BOMB.color, 1);
  g.fillCircle(size / 2, size / 2, r);
  g.fillStyle(BOMB.shine, 0.4);
  g.fillCircle(size / 2 - r * 0.2, size / 2 - r * 0.2, r * 0.3);
  // Fuse
  g.lineStyle(3, 0x888888, 1);
  g.strokePoints(
    [
      new Phaser.Math.Vector2(size / 2 + r * 0.3, size / 2 - r * 0.7),
      new Phaser.Math.Vector2(size / 2 + r * 0.6, size / 2 - r * 1.0),
      new Phaser.Math.Vector2(size / 2 + r * 0.4, size / 2 - r * 1.3),
    ],
    false
  );
  g.generateTexture("bomb", size, size);
  g.destroy();
}

function drawBasketTexture(scene: Phaser.Scene): void {
  if (scene.textures.exists("basket")) return;
  const W = 90;
  const H = 28;
  const g = scene.make.graphics({ add: false });
  // Rim
  g.fillStyle(0xd97706, 1);
  g.fillRoundedRect(0, 0, W, H, 8);
  // Inner
  g.fillStyle(0xfbbf24, 1);
  g.fillRoundedRect(3, 3, W - 6, H - 6, 6);
  // Weave lines horizontal
  g.lineStyle(1.5, 0xd97706, 0.5);
  for (let y = 8; y < H - 3; y += 6) {
    g.strokeLineShape(new Phaser.Geom.Line(4, y, W - 4, y));
  }
  // Weave lines vertical
  for (let x = 10; x < W - 4; x += 10) {
    g.strokeLineShape(new Phaser.Geom.Line(x, 4, x, H - 4));
  }
  g.generateTexture("basket", W, H);
  g.destroy();
}

// ─── MenuScene ────────────────────────────────────────────────────────────────

class MenuScene extends Phaser.Scene {
  constructor() {
    super("menu");
  }

  create(): void {
    // Sky gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x87ceeb, 0x87ceeb, 0xc8e6ff, 0xc8e6ff, 1);
    bg.fillRect(0, 0, VW, VH);

    // Ground
    this.add.rectangle(VW / 2, VH - 20, VW, 40, 0x4ade80);
    this.add.rectangle(VW / 2, VH - 8, VW, 16, 0x16a34a);

    // Floating fruit decorations
    const demoFruits = [
      { fi: 0, x: 60, y: 180 },
      { fi: 1, x: 340, y: 140 },
      { fi: 2, x: 200, y: 100 },
      { fi: 3, x: 100, y: 320 },
      { fi: 4, x: 310, y: 300 },
      { fi: 6, x: 50, y: 480 },
      { fi: 5, x: 360, y: 450 },
    ];
    for (const df of demoFruits) {
      const fr = FRUITS[df.fi]!;
      drawFruitTexture(this, `fruit_${df.fi}`, fr.color, fr.shine, fr.r);
      const img = this.add.image(df.x, df.y, `fruit_${df.fi}`).setAlpha(0.7);
      this.tweens.add({
        targets: img,
        y: df.y - 18,
        duration: 1400 + df.fi * 200,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
    }

    // Title
    this.add
      .text(VW / 2, 220, "🍉", { fontSize: "64px" })
      .setOrigin(0.5)
      .setAlpha(0);
    const emojiText = this.add
      .text(VW / 2, 220, "🍉", { fontSize: "64px" })
      .setOrigin(0.5);
    this.tweens.add({
      targets: emojiText,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.add
      .text(VW / 2, 296, "FruityDrop", {
        fontFamily: "Fraunces, serif",
        fontSize: "52px",
        color: "#1a5c2a",
        stroke: "#ffffff",
        strokeThickness: 6,
      })
      .setOrigin(0.5);

    this.add
      .text(VW / 2, 352, "Catch the fruit, dodge the bombs!", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "16px",
        color: "#3d6b3f",
        wordWrap: { width: 300 },
        align: "center",
      })
      .setOrigin(0.5);

    // High score
    const hs = parseInt(localStorage.getItem(HS_KEY) ?? "0", 10);
    if (hs > 0) {
      this.add
        .text(VW / 2, 388, `🏆 Best: ${hs}`, {
          fontFamily: "Manrope, sans-serif",
          fontSize: "18px",
          color: "#92400e",
          fontStyle: "bold",
        })
        .setOrigin(0.5);
    }

    // Play button
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0x16a34a, 1);
    btnBg.fillRoundedRect(VW / 2 - 90, 430, 180, 56, 28);
    btnBg.fillStyle(0x22c55e, 1);
    btnBg.fillRoundedRect(VW / 2 - 88, 428, 176, 50, 26);

    const btnText = this.add
      .text(VW / 2, 456, "▶  Play", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "26px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    this.tweens.add({
      targets: [btnBg, btnText],
      scaleX: 1.04,
      scaleY: 1.04,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // How to play
    this.add
      .text(VW / 2, 520, "Move: drag / arrow keys", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "13px",
        color: "#4b7a50",
      })
      .setOrigin(0.5);
    this.add
      .text(VW / 2, 540, "Miss 3 fruits → game over", {
        fontFamily: "Manrope, sans-serif",
        fontSize: "13px",
        color: "#4b7a50",
      })
      .setOrigin(0.5);

    const startGame = (): void => {
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.time.delayedCall(300, () => this.scene.start("play"));
    };
    btnText.on("pointerdown", startGame);
    this.input.keyboard?.once("keydown-SPACE", startGame);
    this.input.keyboard?.once("keydown-ENTER", startGame);
  }
}

// ─── PlayScene ────────────────────────────────────────────────────────────────

interface FruitData {
  fruitIndex: number; // index into FRUITS, or -1 for bomb
  isBomb: boolean;
}

class PlayScene extends Phaser.Scene {
  private readonly onScore: (n: number) => void;
  private score = 0;
  private lives = MAX_LIVES;
  private over = false;
  private basket!: Phaser.GameObjects.Image;
  private drops!: Phaser.Physics.Arcade.Group;
  private cursors?: Phaser.Types.Input.Keyboard.CursorKeys;
  private spawnTimer?: Phaser.Time.TimerEvent;
  private diffTimer?: Phaser.Time.TimerEvent;
  private heartIcons: Phaser.GameObjects.Text[] = [];
  private scoreText!: Phaser.GameObjects.Text;
  private comboCount = 0;
  private comboTimer?: Phaser.Time.TimerEvent;
  private spawnDelay = 900;
  private dropSpeed = 140;
  private bombChance = 0.08;

  constructor(onScore: (n: number) => void) {
    super("play");
    this.onScore = onScore;
  }

  create(): void {
    this.score = 0;
    this.lives = MAX_LIVES;
    this.over = false;
    this.comboCount = 0;
    this.spawnDelay = 900;
    this.dropSpeed = 140;
    this.bombChance = 0.08;
    this.onScore(0);

    // Pre-generate all textures
    for (let i = 0; i < FRUITS.length; i++) {
      const fr = FRUITS[i]!;
      drawFruitTexture(this, `fruit_${i}`, fr.color, fr.shine, fr.r);
    }
    drawBombTexture(this);
    drawBasketTexture(this);

    // Sky gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x87ceeb, 0x87ceeb, 0xc8e6ff, 0xc8e6ff, 1);
    bg.fillRect(0, 0, VW, VH);

    // Scrolling clouds (simple rects)
    for (let i = 0; i < 4; i++) {
      const cx = Phaser.Math.Between(0, VW);
      const cy = Phaser.Math.Between(40, 200);
      const cw = Phaser.Math.Between(60, 120);
      const cloud = this.add.graphics();
      cloud.fillStyle(0xffffff, 0.6);
      cloud.fillEllipse(0, 0, cw, 28);
      cloud.fillEllipse(-cw * 0.2, -8, cw * 0.6, 22);
      cloud.fillEllipse(cw * 0.2, -8, cw * 0.6, 22);
      cloud.x = cx;
      cloud.y = cy;
      this.tweens.add({
        targets: cloud,
        x: cx + VW + cw,
        duration: 18000 + i * 4000,
        repeat: -1,
        onRepeat: () => {
          cloud.x = -cw;
        },
      });
    }

    // Ground
    this.add.rectangle(VW / 2, VH - 14, VW, 28, 0x4ade80);
    this.add.rectangle(VW / 2, VH - 5, VW, 10, 0x16a34a);

    // HUD background strip
    const hudBg = this.add.graphics();
    hudBg.fillStyle(0x000000, 0.25);
    hudBg.fillRoundedRect(6, 6, VW - 12, 44, 10);
    hudBg.setDepth(10);

    // Score
    this.scoreText = this.add
      .text(VW / 2, 28, "0", {
        fontFamily: "Fraunces, serif",
        fontSize: "28px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(11);

    // Lives (hearts)
    this.heartIcons = [];
    for (let i = 0; i < MAX_LIVES; i++) {
      const h = this.add
        .text(VW - 20 - i * 32, 28, "❤️", {
          fontSize: "22px",
        })
        .setOrigin(0.5, 0.5)
        .setDepth(11);
      this.heartIcons.push(h);
    }

    // Basket
    this.basket = this.add.image(VW / 2, VH - 50, "basket").setDepth(5);
    this.physics.add.existing(this.basket);
    const bBody = this.basket.body as Phaser.Physics.Arcade.Body;
    bBody.setImmovable(true);
    bBody.setAllowGravity(false);
    bBody.setSize(86, 24);

    // Input
    this.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!this.over)
        this.basket.x = Phaser.Math.Clamp(p.x, 48, VW - 48);
    });
    this.cursors = this.input.keyboard?.createCursorKeys();

    // Drops group
    this.drops = this.physics.add.group();

    // Overlap: basket catches drops
    this.physics.add.overlap(this.basket, this.drops, (_b, dropObj) => {
      const drop = dropObj as Phaser.GameObjects.Image;
      const data = drop.getData("fd") as FruitData;
      if (data.isBomb) {
        this.hitBomb(drop);
      } else {
        this.catchFruit(drop, data.fruitIndex);
      }
    });

    // Spawn timer
    this.spawnTimer = this.time.addEvent({
      delay: this.spawnDelay,
      loop: true,
      callback: this.spawnDrop,
      callbackScope: this,
    });

    // Difficulty ramp every 10 seconds
    this.diffTimer = this.time.addEvent({
      delay: 10000,
      loop: true,
      callback: this.rampDifficulty,
      callbackScope: this,
    });

    // Fade in
    this.cameras.main.fadeIn(300, 0, 0, 0);
  }

  private spawnDrop(): void {
    if (this.over) return;
    const isBomb = Math.random() < this.bombChance;
    let key: string;
    let r: number;
    let fi = -1;

    if (isBomb) {
      key = "bomb";
      r = BOMB.r;
    } else {
      // Weight towards lower-index (more common) fruits
      fi = Phaser.Math.Between(0, FRUITS.length - 1);
      key = `fruit_${fi}`;
      r = FRUITS[fi]!.r;
    }

    const x = Phaser.Math.Between(r + 8, VW - r - 8);
    const drop = this.add.image(x, -r - 10, key).setDepth(4);
    drop.setData("fd", { fruitIndex: fi, isBomb } as FruitData);

    this.physics.add.existing(drop);
    const body = drop.body as Phaser.Physics.Arcade.Body;
    body.setAllowGravity(false);
    body.setCircle(r, drop.width / 2 - r, drop.height / 2 - r);
    const speed = this.dropSpeed + Phaser.Math.Between(-20, 30);
    body.setVelocityY(speed);

    // Slight wobble
    this.tweens.add({
      targets: drop,
      angle: Phaser.Math.Between(-12, 12),
      duration: 400 + Phaser.Math.Between(0, 300),
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    this.drops.add(drop);
  }

  private catchFruit(drop: Phaser.GameObjects.Image, fi: number): void {
    const fr = FRUITS[fi]!;
    drop.destroy();

    this.comboCount++;
    const pts = fr.pts * (this.comboCount >= 3 ? 2 : 1);
    this.score += pts;
    this.onScore(this.score);
    this.updateScoreText();

    // Combo reset timer
    this.comboTimer?.remove();
    this.comboTimer = this.time.delayedCall(1500, () => {
      this.comboCount = 0;
    });

    // Pop-up score label
    const label = this.add
      .text(
        this.basket.x,
        this.basket.y - 30,
        this.comboCount >= 3 ? `+${pts} 🔥` : `+${pts}`,
        {
          fontFamily: "Fraunces, serif",
          fontSize: this.comboCount >= 3 ? "26px" : "20px",
          color: this.comboCount >= 3 ? "#ffd60a" : "#ffffff",
          stroke: "#000000",
          strokeThickness: 3,
        }
      )
      .setOrigin(0.5)
      .setDepth(20);
    this.tweens.add({
      targets: label,
      y: label.y - 50,
      alpha: 0,
      duration: 900,
      ease: "Cubic.easeOut",
      onComplete: () => label.destroy(),
    });

    // Burst particles (simple circles)
    for (let i = 0; i < 7; i++) {
      const angle = (i / 7) * Math.PI * 2;
      const particle = this.add
        .circle(
          this.basket.x + Math.cos(angle) * 10,
          this.basket.y + Math.sin(angle) * 10,
          Phaser.Math.Between(3, 7),
          fr.color
        )
        .setDepth(15);
      this.tweens.add({
        targets: particle,
        x: particle.x + Math.cos(angle) * Phaser.Math.Between(30, 60),
        y: particle.y + Math.sin(angle) * Phaser.Math.Between(30, 60),
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 500,
        ease: "Cubic.easeOut",
        onComplete: () => particle.destroy(),
      });
    }

    // Save high score
    const hs = parseInt(localStorage.getItem(HS_KEY) ?? "0", 10);
    if (this.score > hs) localStorage.setItem(HS_KEY, String(this.score));
  }

  private hitBomb(drop: Phaser.GameObjects.Image): void {
    drop.destroy();
    this.loseLife(true);
    // Flash red
    this.cameras.main.flash(300, 200, 0, 0);
    this.cameras.main.shake(250, 0.012);
  }

  private loseLife(fromBomb = false): void {
    if (this.over) return;
    this.lives--;
    this.comboCount = 0;
    this.updateHearts();
    if (!fromBomb) {
      // Shake basket
      this.tweens.add({
        targets: this.basket,
        x: this.basket.x + 8,
        duration: 60,
        yoyo: true,
        repeat: 3,
      });
    }
    if (this.lives <= 0) {
      this.gameOver();
    }
  }

  private updateHearts(): void {
    for (let i = 0; i < this.heartIcons.length; i++) {
      const h = this.heartIcons[i]!;
      h.setText(i < this.lives ? "❤️" : "🖤");
    }
  }

  private updateScoreText(): void {
    this.scoreText.setText(String(this.score));
    this.tweens.add({
      targets: this.scoreText,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 100,
      yoyo: true,
    });
  }

  private rampDifficulty(): void {
    if (this.over) return;
    this.spawnDelay = Math.max(350, this.spawnDelay - 55);
    this.dropSpeed = Math.min(380, this.dropSpeed + 22);
    this.bombChance = Math.min(0.22, this.bombChance + 0.015);
    // Restart spawn timer with new delay
    this.spawnTimer?.remove();
    this.spawnTimer = this.time.addEvent({
      delay: this.spawnDelay,
      loop: true,
      callback: this.spawnDrop,
      callbackScope: this,
    });
  }

  update(): void {
    if (this.over) return;

    // Keyboard movement
    const speed = 7;
    if (this.cursors?.left.isDown)
      this.basket.x = Math.max(48, this.basket.x - speed);
    if (this.cursors?.right.isDown)
      this.basket.x = Math.min(VW - 48, this.basket.x + speed);

    // Update physics body position to match basket image
    const bBody = this.basket.body as Phaser.Physics.Arcade.Body;
    bBody.reset(this.basket.x, this.basket.y);

    // Check drops that fell past bottom
    for (const obj of [...this.drops.getChildren()]) {
      const drop = obj as Phaser.GameObjects.Image;
      if (drop.y > VH + 30) {
        const data = drop.getData("fd") as FruitData;
        drop.destroy();
        if (!data.isBomb) {
          // Lost a fruit
          this.loseLife(false);
          if (this.over) return;
        }
        // Bombs that fall off are fine
      }
    }
  }

  private gameOver(): void {
    this.over = true;
    this.spawnTimer?.remove();
    this.diffTimer?.remove();
    this.comboTimer?.remove();

    // Clear remaining drops with animations
    for (const obj of [...this.drops.getChildren()]) {
      const drop = obj as Phaser.GameObjects.Image;
      this.tweens.add({
        targets: drop,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 300,
        onComplete: () => drop.destroy(),
      });
    }

    const hs = parseInt(localStorage.getItem(HS_KEY) ?? "0", 10);
    const isNew = this.score > 0 && this.score >= hs;

    this.time.delayedCall(400, () => {
      // Dim overlay
      const overlay = this.add.graphics().setDepth(30);
      overlay.fillStyle(0x000000, 0);
      overlay.fillRect(0, 0, VW, VH);
      this.tweens.add({
        targets: overlay,
        alpha: 1,
        duration: 400,
        onUpdate: (tween) => {
          overlay.clear();
          overlay.fillStyle(0x000000, tween.progress * 0.55);
          overlay.fillRect(0, 0, VW, VH);
        },
      });

      this.time.delayedCall(300, () => {
        // Card
        const cardX = VW / 2;
        const cardY = VH / 2;
        const card = this.add.graphics().setDepth(31);
        card.fillStyle(0xffffff, 1);
        card.fillRoundedRect(cardX - 150, cardY - 140, 300, 280, 20);
        card.fillStyle(0xf0fdf4, 1);
        card.fillRoundedRect(cardX - 147, cardY - 137, 294, 274, 18);

        const titleEmoji = this.add
          .text(cardX, cardY - 110, isNew ? "🏆" : "😢", {
            fontSize: "52px",
          })
          .setOrigin(0.5)
          .setDepth(32)
          .setAlpha(0);
        const titleTxt = this.add
          .text(cardX, cardY - 50, "Game Over", {
            fontFamily: "Fraunces, serif",
            fontSize: "36px",
            color: "#1a5c2a",
          })
          .setOrigin(0.5)
          .setDepth(32)
          .setAlpha(0);
        const scoreTxt = this.add
          .text(cardX, cardY + 8, `Score: ${this.score}`, {
            fontFamily: "Manrope, sans-serif",
            fontSize: "28px",
            color: "#166534",
            fontStyle: "bold",
          })
          .setOrigin(0.5)
          .setDepth(32)
          .setAlpha(0);

        const hsTxt = this.add
          .text(
            cardX,
            cardY + 48,
            isNew ? "🎉 New Best!" : `Best: ${hs}`,
            {
              fontFamily: "Manrope, sans-serif",
              fontSize: "18px",
              color: isNew ? "#d97706" : "#6b7280",
            }
          )
          .setOrigin(0.5)
          .setDepth(32)
          .setAlpha(0);

        // Play again button
        const btnG = this.add.graphics().setDepth(32).setAlpha(0);
        btnG.fillStyle(0x16a34a, 1);
        btnG.fillRoundedRect(cardX - 80, cardY + 82, 160, 50, 25);
        btnG.fillStyle(0x22c55e, 1);
        btnG.fillRoundedRect(cardX - 78, cardY + 80, 156, 46, 23);

        const btnTxt = this.add
          .text(cardX, cardY + 104, "▶  Play Again", {
            fontFamily: "Manrope, sans-serif",
            fontSize: "20px",
            color: "#ffffff",
            fontStyle: "bold",
          })
          .setOrigin(0.5)
          .setDepth(33)
          .setAlpha(0)
          .setInteractive({ useHandCursor: true });

        // Animate in
        this.tweens.add({
          targets: [titleEmoji, titleTxt, scoreTxt, hsTxt, btnG, btnTxt],
          alpha: 1,
          y: (target: Phaser.GameObjects.GameObject) => {
            const go = target as Phaser.GameObjects.Text;
            return go.y - 8;
          },
          duration: 500,
          ease: "Back.easeOut",
          delay: (_t: unknown, _k: unknown, _v: unknown, i: number) => i * 80,
        });

        const restart = (): void => {
          this.cameras.main.fadeOut(250, 0, 0, 0);
          this.time.delayedCall(250, () => this.scene.restart());
        };
        btnTxt.on("pointerdown", restart);
        this.input.keyboard?.once("keydown-SPACE", restart);
        this.input.keyboard?.once("keydown-ENTER", restart);

        const menuBtn = this.add
          .text(cardX, cardY + 148, "← Menu", {
            fontFamily: "Manrope, sans-serif",
            fontSize: "14px",
            color: "#6b7280",
          })
          .setOrigin(0.5)
          .setDepth(33)
          .setAlpha(0)
          .setInteractive({ useHandCursor: true });
        this.tweens.add({
          targets: menuBtn,
          alpha: 1,
          duration: 400,
          delay: 600,
        });
        menuBtn.on("pointerdown", () => {
          this.cameras.main.fadeOut(250, 0, 0, 0);
          this.time.delayedCall(250, () => this.scene.start("menu"));
        });
      });
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
    backgroundColor: "#87ceeb",
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
