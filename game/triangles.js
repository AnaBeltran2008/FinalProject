// triangles.js - Triangle functions

const starsImage = new Image();
starsImage.src = "stars.png";

let starsLoaded = false;

starsImage.onload = () => {
  starsLoaded = true;
};

function spawnTriangle() {
  triangles.push({
    x: Math.random() * (canvas.width - 120) + 60,
    y: Math.random() * (canvas.height - 240) + 40,
    size: 24,
    vx: (Math.random() - 0.5) * 4,
    vy: (Math.random() - 0.5) * 4,
    color: "#ff3333",

    draw() {
      if (starsLoaded) {
        ctx.drawImage(
          starsImage,
          this.x - this.size,
          this.y - this.size,
          this.size * 2,
          this.size * 2
        );
      } else {
        // Fallback while image loads
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - this.size);
        ctx.lineTo(this.x + this.size, this.y + this.size);
        ctx.lineTo(this.x - this.size, this.y + this.size);
        ctx.closePath();
        ctx.fill();
      }
    },

    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x - this.size < 0 || this.x + this.size > canvas.width) {
        this.vx *= -1;
      }

      if (this.y - this.size < 0 || this.y + this.size > canvas.height) {
        this.vy *= -1;
      }
    }
  });
}

// When triangle explodes, spawn many bullets
function triangleExplode(x, y) {
  createExplosion(x, y, "#ff6666");

  const pieces = 24;

  for (let i = 0; i < pieces; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4;

    projectiles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 4,
      color: ["#ff0000", "#ff5500", "#ff9900"][
        Math.floor(Math.random() * 3)
      ],
      source: "triangle",

      draw() {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
      },

      update() {
        this.x += this.vx;
        this.y += this.vy;
      }
    });
  }
}