// projectiles.js - Projectile functions

function shootBall(x, y) {
  projectiles.push({
    x: x,
    y: y,
    vx: (Math.random() - 0.5) * 8,
    vy: -6,
    radius: 5,
    color: colors[Math.floor(Math.random() * colors.length)],
    source: "player", // <--- mark as player projectile
    draw() {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
    },
    update() {
      this.x += this.vx;
      this.y += this.vy;
    },
  });
  // play gunshot on player shot
  try {
    playGunshot();
  } catch (e) {
    /* ignore audio errors */
  }
}

// new: multi-shot when powered
function shootMulti(x, y) {
  const count = 12;
  // single gunshot for the multi-shot
  try {
    playGunshot();
  } catch (e) {}
  for (let i = 0; i < count; i++) {
    const spread = (i - (count - 1) / 2) * 0.8;
    projectiles.push({
      x: x,
      y: y,
      vx: spread + (Math.random() - 0.5) * 0.6,
      vy: -6 + (Math.random() - 0.5) * 0.6,
      radius: 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      source: "player", // <--- mark as player projectile
      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
      },
      update() {
        this.x += this.vx;
        this.y += this.vy;
      },
    });
  }
}