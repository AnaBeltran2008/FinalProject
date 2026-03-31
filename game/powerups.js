// powerups.js - Power-up functions

function spawnPowerUp() {
  powerUps.push({
    x: Math.random() * (canvas.width - 60) + 30,
    y: Math.random() * (canvas.height - 120) + 40,
    radius: 18, // medium circle
    color: "#ffea00", // yellow
    draw() {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fill();
      // subtle outline
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = 2;
      ctx.stroke();
    },
  });
    powerUps.push({
        x: Math.random() * (canvas.width - 60) + 30,
        y: Math.random() * (canvas.height - 120) + 40,
        radius: 18, // medium circle
        color: '#ffea00', // yellow
        draw() {
            if (treasureImage.loaded) {
                const w = this.radius * 2;
                const h = this.radius * 2;
                ctx.drawImage(treasureImage, this.x - w/2, this.y - h/2, w, h);
            
        }
    }});
}