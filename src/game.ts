const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

canvas.width = 800;
canvas.height = 600;
let gameOver = false;
let moveLeft = false;
let moveRight = false;
let player: Player;
let enemies: Enemy[] = [];
let score = 0;
let wave = 1;
let previousEnemyCount = 3; // 最初の敵の数を記録
let spawningNewWave = false; // ウェーブ更新中フラグ

// プレイヤー
class Player {
  x: number;
  y: number;
  speed = 5;
  bullets: Bullet[] = [];

  constructor() {
    this.x = canvas.width / 2;
    this.y = canvas.height - 40; // 🚀の表示位置調整
  }

  move() {
    if (moveLeft) this.x -= this.speed;
    if (moveRight) this.x += this.speed;
    this.x = Math.max(0, Math.min(canvas.width - 40, this.x)); // 画面外に出ないように調整
  }

  shoot() {
    this.bullets.push(new Bullet(this.x, this.y - 10)); // 中央から発射
  }

  update() {
    this.move();
    this.bullets.forEach((bullet, index) => {
      bullet.update();
      if (bullet.y < 0) this.bullets.splice(index, 1); // 画面外の弾を削除
    });
  }

  draw() {
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("🚀", this.x, this.y);
    this.bullets.forEach((bullet) => bullet.draw());
  }
}
// 弾
class EnemyBullet {
  x: number;
  y: number;
  speed = 3;
  width = 5;
  height = 10;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  update() {
    this.y += this.speed;
  }

  draw() {
    ctx.fillStyle = "yellow";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

class Bullet {
  x: number;
  y: number;
  speed = 5;
  width = 5;
  height = 10;

  constructor(x: number, y: number) {
    this.x = x - this.width / 2;
    this.y = y;
  }

  update() {
    this.y -= this.speed;
  }

  draw() {
    ctx.fillStyle = "red";
    ctx.fillRect(this.x, this.y, this.width, this.height);
  }
}

// 敵
class Enemy {
  x: number;
  y: number;
  width = 40;
  height = 30;
  speed: number;
  direction = 1;
  bullets: EnemyBullet[] = [];

  constructor(x: number, y: number, speed: number) {
    this.x = x;
    this.y = y;
    this.speed = speed;
  }

  update() {
    this.x += this.speed * this.direction;
    if (this.x < 0 || this.x + this.width > canvas.width) {
      this.direction *= -1;
      this.y += this.height;
    }

    // ランダムで弾を撃つ（確率 1% に調整）
    if (Math.random() < 0.01) {
      this.shoot();
    }

    this.bullets.forEach((bullet, index) => {
      bullet.update();
      if (bullet.y > canvas.height) {
        this.bullets.splice(index, 1);
      }
    });
  }

  shoot() {
    this.bullets.push(
      new EnemyBullet(this.x + this.width / 2, this.y + this.height)
    );
  }

  draw() {
    ctx.fillText("👾", this.x, this.y);
    this.bullets.forEach((bullet) => bullet.draw());
  }
}

// 敵を生成
function spawnEnemies() {
  enemies = [];
  let startY = 50;
  let enemySpeed = 1 + wave * 0.2;

  for (let i = 0; i < previousEnemyCount; i++) {
    let x = (i % 6) * 80 + 50;
    let y = startY + Math.floor(i / 6) * 40;
    enemies.push(new Enemy(x, y, enemySpeed));
  }
}

// スコアとウェーブを描画
function drawScoreAndWave() {
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, 150, 50);

  ctx.fillStyle = "white";
  ctx.font = "18px Arial";
  ctx.textAlign = "left";
  ctx.fillText("Score: " + score, 20, 30);
  ctx.fillText("Wave: " + wave, 20, 50);
}

// ゲームリセット
function resetGame() {
  gameOver = false;
  score = 0;
  wave = 1;
  previousEnemyCount = 3; // 初期敵数
  player = new Player();
  spawnEnemies();
  gameLoop();
}

// キーイベント処理
document.addEventListener("keydown", (e) => {
  if (gameOver) {
    if (e.key === " ") resetGame();
    return;
  }

  if (e.key === "ArrowLeft") moveLeft = true;
  if (e.key === "ArrowRight") moveRight = true;
  if (e.key === " ") player.shoot();
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft") moveLeft = false;
  if (e.key === "ArrowRight") moveRight = false;
});

// 衝突判定
function checkCollisions() {
  player.bullets.forEach((bullet, bulletIndex) => {
    enemies.forEach((enemy, enemyIndex) => {
      if (
        bullet.x < enemy.x + enemy.width &&
        bullet.x + bullet.width > enemy.x &&
        bullet.y < enemy.y + enemy.height &&
        bullet.y + bullet.height > enemy.y
      ) {
        player.bullets.splice(bulletIndex, 1);
        enemies.splice(enemyIndex, 1);
        score += 100;
      }
    });
  });

  // 敵とプレイヤーの衝突判定（ゲームオーバー処理）
  enemies.forEach((enemy) => {
    if (
      player.x < enemy.x + enemy.width &&
      player.x + 30 > enemy.x &&
      player.y < enemy.y + enemy.height &&
      player.y + 30 > enemy.y
    ) {
      gameOver = true;
    }

    // 敵の弾とプレイヤーの当たり判定
    enemy.bullets.forEach((bullet, bulletIndex) => {
      if (
        bullet.x < player.x + 30 &&
        bullet.x + bullet.width > player.x &&
        bullet.y < player.y + 30 &&
        bullet.y + bullet.height > player.y
      ) {
        gameOver = true;
      }
    });
  });

  // 敵を全滅したら次のウェーブへ（前回の敵数+10で増やす）
  if (enemies.length === 0 && !spawningNewWave) {
    spawningNewWave = true;
    wave++;
    previousEnemyCount += 10; // 次のウェーブでは敵を+10増やす
    setTimeout(() => {
      spawnEnemies();
      spawningNewWave = false;
    }, 1000);
  }
}

// ゲームループ
function gameLoop() {
  if (gameOver) {
    ctx.fillStyle = "red";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
    ctx.fillText(
      "Press SPACE to Restart",
      canvas.width / 2,
      canvas.height / 2 + 40
    );
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawScoreAndWave();
  player.update();
  player.draw();

  // プレイヤーの弾を更新＆描画
  player.bullets.forEach((bullet) => bullet.update());
  player.bullets.forEach((bullet) => bullet.draw());

  enemies.forEach((enemy) => {
    enemy.update();
    enemy.draw();
  });

  checkCollisions();

  requestAnimationFrame(gameLoop);
}

// ゲーム開始
resetGame();
