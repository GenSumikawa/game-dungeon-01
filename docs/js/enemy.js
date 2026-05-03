const ENEMY_COUNT = 10;
const ENEMY_HP = 2;
const ENEMY_ATK = 1;

const ENEMY_TICK_MS = 500;        // 0.5秒
const ENEMY_MOVE_CHANCE = 0.20;   // 動く20%
const ENEMY_HIT_CHANCE = 0.60;    // 命中確率
const ENEMY_ATTACK_COOLDOWN_TICKS = 3; // 3 tick = 約1.5秒

function enemyIndexAt(enemies, x, y) {
  return enemies.findIndex(e => e.x === x && e.y === y);
}

function createEnemies(map, player, goal, randInt, DIR_LIST, ENEMY_HP) {
  const enemies = [];
  const used = new Set([`${player.x},${player.y}`, `${goal.x},${goal.y}`]);

  for (let i = 0; i < ENEMY_COUNT; i++) {
    for (let tries = 0; tries < 5000; tries++) {
      const x = randInt(1, map[0].length - 2);
      const y = randInt(1, map.length - 2);
      const key = `${x},${y}`;
      if (map[y][x] !== ".") continue;
      if (used.has(key)) continue;

      enemies.push({ x, y, hp: ENEMY_HP, dir: DIR_LIST[randInt(0, DIR_LIST.length - 1)], cool: 0 });
      used.add(key);
      break;
    }
  }

  return enemies;
}

function updateEnemies(enemies, player, goal, map, addMsg, randInt, DIR, DIR_LIST, playerState) {
  for (const e of enemies) if (e.cool > 0) e.cool--;

  const attackers = [];
  for (const e of enemies) {
    if (e.cool > 0) continue;
    const fx = e.x + DIR[e.dir].dx;
    const fy = e.y + DIR[e.dir].dy;
    if (fx === player.x && fy === player.y) attackers.push(e);
  }

  if (attackers.length > 0) {
    const a = attackers[randInt(0, attackers.length - 1)];
    a.cool = ENEMY_ATTACK_COOLDOWN_TICKS;

    if (Math.random() < ENEMY_HIT_CHANCE) {
      playerState.hp -= ENEMY_ATK;
      addMsg("敵の攻撃！");
      if (playerState.hp <= 0) {
        return true;
      }
    } else {
      addMsg("敵の攻撃…外れ");
    }
  }

  const occupied = new Set(enemies.map(e => `${e.x},${e.y}`));

  for (const e of enemies) {
    const fx = e.x + DIR[e.dir].dx;
    const fy = e.y + DIR[e.dir].dy;
    if (fx === player.x && fy === player.y) continue;

    if (Math.random() >= ENEMY_MOVE_CHANCE) continue;

    const options = [];
    for (const k of DIR_LIST) {
      const nx = e.x + DIR[k].dx;
      const ny = e.y + DIR[k].dy;

      if (nx <= 0 || ny <= 0 || nx >= map[0].length - 1 || ny >= map.length - 1) continue;
      if (map[ny][nx] === "#") continue;
      if (nx === goal.x && ny === goal.y) continue;
      if (nx === player.x && ny === player.y) continue;

      const key = `${nx},${ny}`;
      if (occupied.has(key)) continue;

      options.push(k);
    }

    if (options.length === 0) continue;

    const chosen = options[randInt(0, options.length - 1)];
    occupied.delete(`${e.x},${e.y}`);
    e.x += DIR[chosen].dx;
    e.y += DIR[chosen].dy;
    e.dir = chosen;
    occupied.add(`${e.x},${e.y}`);
  }

  return false;
}

export {
  ENEMY_COUNT,
  ENEMY_HP,
  ENEMY_ATK,
  ENEMY_TICK_MS,
  ENEMY_MOVE_CHANCE,
  ENEMY_HIT_CHANCE,
  ENEMY_ATTACK_COOLDOWN_TICKS,
  enemyIndexAt,
  createEnemies,
  updateEnemies
};
