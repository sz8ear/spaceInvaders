"use strict";
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
let gameOver = false;
let gameStarted = false; // スペースキーを押すまで開始しない
let moveLeft = false;
let moveRight = false;
let player;
let enemies = [];
let score = 0;
let wave = 1;
let previousEnemyCount = 3;
let spawningNewWave = false;
function resizeCanvas() {
    if (window.innerWidth > 800) {
        canvas.width = 800;
        canvas.height = 600;
    }
    else {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight - 100;
    }
}
// 初回実行
resizeCanvas();
// ウィンドウサイズ変更時にも対応
window.addEventListener("resize", resizeCanvas);
// プレイヤークラス
class Player {
    constructor() {
        this.speed = 5;
        this.bullets = [];
        this.x = canvas.width / 2;
        this.y = canvas.height - 40;
    }
    move() {
        if (moveLeft)
            this.x -= this.speed;
        if (moveRight)
            this.x += this.speed;
        this.x = Math.max(0, Math.min(canvas.width - 40, this.x));
    }
    shoot() {
        this.bullets.push(new Bullet(this.x, this.y - 10));
    }
    update() {
        this.move();
        this.bullets.forEach((bullet, index) => {
            bullet.update();
            if (bullet.y < 0)
                this.bullets.splice(index, 1);
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
    constructor(x, y) {
        this.speed = 3;
        this.width = 5;
        this.height = 10;
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
    constructor(x, y) {
        this.speed = 5;
        this.width = 5;
        this.height = 10;
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
// 敵クラス
class Enemy {
    constructor(x, y, speed) {
        this.width = 40;
        this.height = 30;
        this.direction = 1;
        this.bullets = [];
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
        if (Math.random() < 0.01)
            this.shoot();
        this.bullets.forEach((bullet, index) => {
            bullet.update();
            if (bullet.y > canvas.height)
                this.bullets.splice(index, 1);
        });
    }
    shoot() {
        this.bullets.push(new EnemyBullet(this.x + this.width / 2, this.y + this.height));
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
// スコアとウェーブ描画
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
    gameStarted = false; // 初期状態ではゲームを開始しない
    score = 0;
    wave = 1;
    previousEnemyCount = 3;
    player = new Player();
    spawnEnemies();
    drawStartScreen();
}
// スタート画面を表示
function drawStartScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    ctx.font = "30px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Press SPACE or Tap to Start", canvas.width / 2, canvas.height / 2);
}
// キーイベント処理
document.addEventListener("keydown", (e) => {
    if (!gameStarted && e.key === " ") {
        gameStarted = true;
        gameLoop();
        return;
    }
    if (gameOver && e.key === " ") {
        resetGame();
        return;
    }
    if (gameStarted) {
        if (e.key === "ArrowLeft")
            moveLeft = true;
        if (e.key === "ArrowRight")
            moveRight = true;
        if (e.key === " ")
            player.shoot();
    }
});
document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft")
        moveLeft = false;
    if (e.key === "ArrowRight")
        moveRight = false;
});
// 衝突判定
function checkCollisions() {
    player.bullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y) {
                player.bullets.splice(bulletIndex, 1);
                enemies.splice(enemyIndex, 1);
                score += 100;
            }
        });
    });
    enemies.forEach((enemy) => {
        if (player.x < enemy.x + enemy.width &&
            player.x + 30 > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + 30 > enemy.y) {
            gameOver = true;
        }
        enemy.bullets.forEach((bullet, bulletIndex) => {
            if (bullet.x < player.x + 30 &&
                bullet.x + bullet.width > player.x &&
                bullet.y < player.y + 30 &&
                bullet.y + bullet.height > player.y) {
                gameOver = true;
            }
        });
    });
    if (enemies.length === 0 && !spawningNewWave) {
        spawningNewWave = true;
        wave++;
        previousEnemyCount += 10;
        setTimeout(() => {
            spawnEnemies();
            spawningNewWave = false;
        }, 1000);
    }
}
canvas.addEventListener("touchstart", (e) => {
    if (!gameStarted) {
        gameStarted = true;
        gameLoop();
        return;
    }
    let touchX = e.touches[0].clientX;
    let canvasMiddle = canvas.width / 2;
    if (touchX < canvasMiddle * 0.4) {
        moveLeft = true;
    }
    else if (touchX > canvasMiddle * 1.6) {
        moveRight = true;
    }
    else {
        player.shoot();
    }
});
canvas.addEventListener("touchend", () => {
    moveLeft = false;
    moveRight = false;
});
// ゲームループ
function gameLoop() {
    if (gameOver) {
        ctx.fillStyle = "red";
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2);
        ctx.fillText("Press SPACE or Tap to Restart", canvas.width / 2, canvas.height / 2 + 40);
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
// 初期化
resetGame();
