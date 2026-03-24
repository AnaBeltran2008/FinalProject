// constants.js - Game constants and global variables

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const littleEnemyImage = new Image();
littleEnemyImage.src = "assets/littleenemy.png";
littleEnemyImage.loaded = false;
littleEnemyImage.onload = () => { littleEnemyImage.loaded = true; };

// reusable AudioContext for sounds
let audioCtx = null;

let score = 0;
const BASE_BIG_WIDTH = 60; // base reference size for big enemy
// speed boost: 5 seconds at 60fps, 2x normal speed
const SPEED_BOOST_DURATION = 300; // 5s at ~60fps
const SPEED_BOOST_MULTIPLIER = 2;
let bigEnemyDestructionCount = 0; // track how many times big enemy destroyed
let gameWon = false;

// Colors
const colors = [
  "#ff0000",
  "#00ff00",
  "#0000ff",
  "#ffff00",
  "#ff00ff",
  "#00ffff",
];

const enemyColors = [
  "#ff6600",
  "#00ff99",
  "#ff0099",
  "#00ccff",
  "#ffff00",
  "#ff9900",
  "#cc00ff",
  "#00ff00",
];

// Spawn intervals
const POWERUP_SPAWN_INTERVAL = 600; // ~10s at 60fps
const TRIANGLE_SPAWN_INTERVAL = 420; // spawn every ~7s

// Arrays
let projectiles = [];
let enemies = [];
let powerUps = [];
let triangles = [];
let explosions = [];
let enemyProjectiles = [];

// Timers
let enemySpawnTimer = 0;
let powerupSpawnTimer = 0;
let triangleSpawnTimer = 0;

// Big Enemy
let bigEnemy = null;

// Images
const playerImage = new Image();
playerImage.src = "rocket.png";

const enemyImage = new Image();
enemyImage.src = "enemy.png";
enemyImage.loaded = false;
enemyImage.onload = () => {
  enemyImage.loaded = true;
};

const backgroundImage = new Image();
backgroundImage.src = "background.png";
backgroundImage.loaded = false;
backgroundImage.onload = () => {
  backgroundImage.loaded = true;
};

const explosionImage = new Image();
explosionImage.src = 'explosion.png';
explosionImage.loaded = false;
explosionImage.onload = () => { explosionImage.loaded = true; };

const treasureImage = new Image();
treasureImage.src = 'treasure.png';
treasureImage.loaded = false;
treasureImage.onload = () => { treasureImage.loaded = true; };