import { Obstacle } from "./obstacle.js";
import { Key } from "./key.js";
import { Door } from "./door.js";
import { Inventory } from "./inventory.js";

// ----------------------------
// Window size (what we see)
// ----------------------------
const WIDTH = 1000;
const HEIGHT = 700;

// ----------------------------
// World size (big map)
// ----------------------------
const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 2000;

const BG_COLOR = 0x50a0c8;

const playerRadius = 30;
const playerSpeed = 220;

let player;
let target;

let obstacles = [];
let key;
let door;
let inventory;

const config = {
  type: Phaser.AUTO,
  width: WIDTH,
  height: HEIGHT,
  backgroundColor: BG_COLOR,
  pixelArt:true,
  scene: { preload, create, update }
};

new Phaser.Game(config);

function preload() {
  this.load.image("player", "assets/player.png");
  this.load.image("key", "assets/key.png");
  this.load.image("obstacle", "assets/obstacle.png");
  this.load.image("door", "assets/door.png");
}

function create() {
  // ----------------------------
  // Camera bounds (world edges)
  // ----------------------------
  this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

  // ----------------------------
  // Player (start at 10,10)
  // ----------------------------
  player = this.add.image(10, 10, "player").setScale(0.6);

  // Camera follows the player (keeps them centered when possible)
  this.cameras.main.startFollow(player, true, 1, 1);

  // Target starts at player position
  target = new Phaser.Math.Vector2(player.x, player.y);

  // ----------------------------
  // Obstacles (place some off-screen!)
  // ----------------------------
  obstacles = [
    new Obstacle(this, 300, 200, 180, 120, "obstacle"),
    new Obstacle(this, 900, 700, 120, 60, "obstacle"),
    new Obstacle(this, 1500, 400, 160, 50, "obstacle"),
    new Obstacle(this, 400, 1500, 160, 50, "obstacle"),
  ];

  // ----------------------------
  // Key (test closer to player)
  // ----------------------------
  key = new Key(this, 200, 200, "key");

  // ----------------------------
  // Door (test closer to player)
  // ----------------------------
  door = new Door(this, 300, 300, 60, 90, "door");

  // ----------------------------
  // Inventory (UI)
  // ----------------------------
  inventory = new Inventory(this);
  inventory.setIcon("key", "key");

  // ----------------------------
  // Click to move (WORLD click!)
  // ----------------------------
  this.input.on("pointerdown", (pointer) => {
    // worldX/worldY already include camera scrolling
    target.x = pointer.worldX;
    target.y = pointer.worldY;
  });
}

function update(time, delta) {
  const dt = delta / 1000;

  // --- Move player toward target ---
  const dx = target.x - player.x;
  const dy = target.y - player.y;
  const distance = Math.hypot(dx, dy);

  if (distance > 1) {
    const step = playerSpeed * dt;
    const dirX = dx / distance;
    const dirY = dy / distance;

    // Try next position
    let nextX = player.x;
    let nextY = player.y;

    if (step >= distance) {
      nextX = target.x;
      nextY = target.y;
    } else {
      nextX += dirX * step;
      nextY += dirY * step;
    }

    // Keep player inside the world
    nextX = Phaser.Math.Clamp(nextX, 0, WORLD_WIDTH);
    nextY = Phaser.Math.Clamp(nextY, 0, WORLD_HEIGHT);

    const blockedByObstacle = obstacles.some(o => o.blocksCircle(nextX, nextY, playerRadius));
    const blockedByDoor = door.blocksCircle(nextX, nextY, playerRadius);

    if (!blockedByObstacle && !blockedByDoor) {
      player.x = nextX;
      player.y = nextY;
    } else {
      // Slide around (try X-only, then Y-only)
      const slideX = Phaser.Math.Clamp(player.x + dirX * step, 0, WORLD_WIDTH);
      const slideY = Phaser.Math.Clamp(player.y + dirY * step, 0, WORLD_HEIGHT);

      const slideXBlocked =
        obstacles.some(o => o.blocksCircle(slideX, player.y, playerRadius)) ||
        door.blocksCircle(slideX, player.y, playerRadius);

      const slideYBlocked =
        obstacles.some(o => o.blocksCircle(player.x, slideY, playerRadius)) ||
        door.blocksCircle(player.x, slideY, playerRadius);

      if (!slideXBlocked) {
        player.x = slideX;
      } else if (!slideYBlocked) {
        player.y = slideY;
      }
    }
  }

  // --- Pick up the key ---
  if (!key.collected && key.touchesCircle(player.x, player.y, playerRadius)) {
    key.collect();
    inventory.addItem("key");
  }

  // --- Try opening door ---
  door.tryOpen(player.x, player.y, playerRadius, inventory.hasItem("key"));
}