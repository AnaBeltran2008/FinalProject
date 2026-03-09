// player.js - Player object and related functions

const player = {
  x: canvas.width / 2,
  y: canvas.height - 30,
  width: 36, // increased size (modify to fit your rocket)
  height: 36, // increased size (modify to fit your rocket)
  normalSpeed: 5, // new: store normal speed
  speed: 5, // use this for movement (may be overridden while chased)
  powered: false,
  powerTimer: 0,
  // speed-boost state (triggered when score crosses 100-point thresholds)
  speedBoosted: false,
  speedBoostTimer: 0,
  speedBoostCount: 0, // how many 100-point boosts have been granted
  alive: true,
  // sprite support
  sprite: playerImage,
  spriteLoaded: false,
  init() {
    // when the image finishes loading we can start using it
    this.sprite.onload = () => {
      this.spriteLoaded = true;
      // optionally adjust width/height based on natural size
      // this.width = this.sprite.width;
      // this.height = this.sprite.height;
    };
  },
  draw() {
    if (!this.alive) return;
    if (this.spriteLoaded) {
      // draw the rocket centered on player coordinates
      ctx.drawImage(
        this.sprite,
        this.x - this.width / 4,
        this.y - this.height / 4,
        this.width,
        this.height
      );
    } else {
      // fallback purple diamond while image loads
      ctx.fillStyle = "#9900ff";
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - this.height / 2);
      ctx.lineTo(this.x + this.width / 2, this.y);
      ctx.lineTo(this.x, this.y + this.height / 2);
      ctx.lineTo(this.x - this.width / 2, this.y);
      ctx.closePath();
      ctx.fill();
    }
  },
  update(keys) {
    if (!this.alive) return; // no movement if dead
    if (keys["ArrowLeft"] && this.x > this.width / 2) this.x -= this.speed;
    if (keys["ArrowRight"] && this.x < canvas.width - this.width / 2)
      this.x += this.speed;
    if (keys["ArrowUp"] && this.y > this.height / 2) this.y -= this.speed;
    if (keys["ArrowDown"] && this.y < canvas.height - this.height / 2)
      this.y += this.speed;
  },
};

// start image loading for player sprite
player.init();