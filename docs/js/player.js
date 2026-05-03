const PLAYER_HP_MAX = 6;
const PLAYER_ATK = 1;

const player = { x: 1, y: 1 };
const playerState = {
  hp: PLAYER_HP_MAX,
  dir: "D",
  msg: ""
};

function addMsg(s) {
  if (!s) return;
  playerState.msg = playerState.msg ? `${playerState.msg} / ${s}` : s;
}

function initPlayer() {
  player.x = 1;
  player.y = 1;
  playerState.hp = PLAYER_HP_MAX;
  playerState.dir = "D";
  playerState.msg = "";
}

export { PLAYER_HP_MAX, PLAYER_ATK, player, playerState, initPlayer, addMsg };
``