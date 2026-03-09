// explosions.js - Explosion functions

function createExplosion(x, y, color) {
  for (let i = 0; i < 8; i++) {
    explosions.push({
      x: x,
      y: y,
      vx: Math.cos((i * Math.PI) / 4) * 3,
      vy: Math.sin((i * Math.PI) / 4) * 3,
      radius: 15,
      maxRadius: 40,
      color: color,
      alpha: 1,
      draw() {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      },
      update() {
        this.x += this.vx;
        this.y += this.vy;
        this.radius += 1;
        this.alpha -= 0.04;
      },
    });
  }
}