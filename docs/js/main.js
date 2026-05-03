import { PLAYER_HP_MAX, PLAYER_ATK, player, playerState, initPlayer, addMsg } from "./player.js";
import {
  ENEMY_COUNT,
  ENEMY_HP,
  ENEMY_ATK,
  ENEMY_TICK_MS,
  ENEMY_MOVE_CHANCE,
  ENEMY_ATTACK_COOLDOWN_TICKS,
  enemyIndexAt,
  createEnemies,
  updateEnemies
} from "./enemy.js";

function startGame() {

// ===== 調整ポイント =====
const WIDTH = 41;
const HEIGHT = 21;
const WALL_RATE = 0.25;

// =======================

// ★あなた指定で固定
const DIR = {
  U: { dx: 0, dy: -1, p: "△", e: "△", name: "上" },
  R: { dx: 1, dy: 0,  p: "＞", e: "＞", name: "右" },
  D: { dx: 0, dy: 1,  p: "▽", e: "▽", name: "下" },
  L: { dx: -1,dy: 0,  p: "＜", e: "＜", name: "左" }
};
const DIR_LIST = ["U","R","D","L"];

let map, goal, enemies;
let isPlaying = false;
let enemyTimer = null;

// ===== util =====
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function inBounds(x, y) { return x >= 0 && y >= 0 && x < WIDTH && y < HEIGHT; }

// ===== BFS（到達可能チェック）=====
function isReachable() {
  let visited = Array.from({ length: HEIGHT }, () => Array(WIDTH).fill(false));
  let q = [{ x: player.x, y: player.y }];
  visited[player.y][player.x] = true;

  while (q.length) {
    const { x, y } = q.shift();
    if (x === goal.x && y === goal.y) return true;

    for (const k of DIR_LIST) {
      const nx = x + DIR[k].dx;
      const ny = y + DIR[k].dy;
      if (!inBounds(nx, ny)) continue;
      if (visited[ny][nx]) continue;
      if (map[ny][nx] !== ".") continue;
      visited[ny][nx] = true;
      q.push({ x: nx, y: ny });
    }
  }
  return false;
}

// ===== 生成 =====
function generate() {
  while (true) {
    map = [];
    for (let y = 0; y < HEIGHT; y++) {
      const row = [];
      for (let x = 0; x < WIDTH; x++) row.push(Math.random() < WALL_RATE ? "#" : ".");
      map.push(row);
    }

    // 外周を壁に固定
    for (let x = 0; x < WIDTH; x++) { map[0][x] = "#"; map[HEIGHT - 1][x] = "#"; }
    for (let y = 0; y < HEIGHT; y++) { map[y][0] = "#"; map[y][WIDTH - 1] = "#"; }

    initPlayer();
    goal = { x: WIDTH - 2, y: HEIGHT - 2 };
    map[player.y][player.x] = ".";
    map[goal.y][goal.x] = ".";

    if (isReachable()) break;
  }

  // 敵配置（cool=0）
  enemies = createEnemies(map, player, goal, randInt, DIR_LIST, ENEMY_HP);
}

// ===== 描画 =====
function draw() {
  const el = document.getElementById("game");

  if (!isPlaying) {
    el.textContent =
      "スペースキーで開始\n" +
      "WASD: 移動（向き変更） / 1: 攻撃（前方1マス）\n" +
      `敵: ${ENEMY_TICK_MS/1000}秒ごとに各自${Math.round(ENEMY_MOVE_CHANCE*100)}%で移動\n` +
      `攻撃優先: 敵の正面にプレイヤーがいる場合、その敵は移動しない\n` +
      `敵攻撃CT: ${ENEMY_ATTACK_COOLDOWN_TICKS} tick\n`;
    return;
  }

  const fx = player.x + DIR[playerState.dir].dx;
  const fy = player.y + DIR[playerState.dir].dy;

  let out = "";
  out += `HP: ${playerState.hp}/${PLAYER_HP_MAX}  敵: ${enemies.length}  向き: ${DIR[playerState.dir].name}(${DIR[playerState.dir].p})\n`;
  out += (playerState.msg ? `メッセージ: ${playerState.msg}\n\n` : "\n\n");

  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      if (x === player.x && y === player.y) { out += "○"; continue; }
      if (x === goal.x && y === goal.y) { out += "◎"; continue; }

      const ei = enemyIndexAt(x, y);
      if (ei !== -1) { out += DIR[enemies[ei].dir].e; continue; }

      if (x === fx && y === fy && inBounds(fx, fy) && map[y][x] === ".") { out += "☆"; continue; }

      out += (map[y][x] === "#") ? "■" : "　";
    }
    out += "\n";
  }

  el.textContent = out;
}

// ===== プレイヤー移動（移動できなくても向きは変える）=====
function movePlayer(dirKey) {
  playerState.msg = "";
  playerState.dir = dirKey;

  const nx = player.x + DIR[dirKey].dx;
  const ny = player.y + DIR[dirKey].dy;

  if (!inBounds(nx, ny)) { addMsg("外"); draw(); return; }
  if (map[ny][nx] === "#") { addMsg("壁"); draw(); return; }

  // 敵マスへは入れない
  if (enemyIndexAt(nx, ny) !== -1) { addMsg("敵がいる（1で攻撃）"); draw(); return; }

  player.x = nx;
  player.y = ny;

  if (player.x === goal.x && player.y === goal.y) {
    stopEnemyTimer();
    alert("クリア！");
    isPlaying = false;
    draw();
    return;
  }

  draw();
}

// ===== プレイヤー攻撃（前方1マス）=====
function playerAttack() {
  playerState.msg = "";

  const tx = player.x + DIR[playerState.dir].dx;
  const ty = player.y + DIR[playerState.dir].dy;

  if (!inBounds(tx, ty)) { addMsg("攻撃：外れ"); draw(); return; }

  const idx = enemyIndexAt(tx, ty);
  if (idx === -1) { addMsg("攻撃：空振り"); draw(); return; }

  enemies[idx].hp -= PLAYER_ATK;
  if (enemies[idx].hp <= 0) {
    enemies.splice(idx, 1);
    addMsg("攻撃：撃破");
  } else {
    addMsg("攻撃：ヒット");
  }

  draw();
}

// ===== 敵tick =====
function enemyTick() {
  if (!isPlaying) return;

  const playerDied = updateEnemies(enemies, player, goal, map, addMsg, randInt, DIR, DIR_LIST, playerState);
  if (playerDied) {
    alert("やられた！");
    isPlaying = false;
    draw();
    return;
  }

  draw();
}

// ===== タイマー制御 =====
function startEnemyTimer() {
  stopEnemyTimer();
  enemyTimer = setInterval(enemyTick, ENEMY_TICK_MS);
}
function stopEnemyTimer() {
  if (enemyTimer !== null) {
    clearInterval(enemyTimer);
    enemyTimer = null;
  }
}

// ===== 入力 =====
function isStartKey(e) {
  return e.code === "Space" || e.key === " " || e.key === "Spacebar";
}

document.addEventListener("keydown", e => {
  if (isStartKey(e)) {
    if (!isPlaying) {
      generate();
      isPlaying = true;
      startEnemyTimer();
      draw();
    }
    return;
  }

  if (!isPlaying) return;

  if (e.key === "1" || e.code === "Digit1" || e.code === "Numpad1") {
    playerAttack();
    return;
  }

  switch (e.key.toLowerCase()) {
    case "w": movePlayer("U"); break;
    case "d": movePlayer("R"); break;
    case "s": movePlayer("D"); break;
    case "a": movePlayer("L"); break;
  }
});

// 初期表示
draw();

}    // ← これ絶対必要
export { startGame };
