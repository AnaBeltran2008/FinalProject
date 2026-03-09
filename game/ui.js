// ui.js - UI functions

function drawRestartButton() {
  const btnWidth = 220;
  const btnHeight = 70;
  const x = canvas.width / 2 - btnWidth / 2;
  const y = canvas.height / 2 + 60;
  // Button background
  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = "#222";
  ctx.fillRect(x, y, btnWidth, btnHeight);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, btnWidth, btnHeight);
  // Button text
  ctx.font = "bold 2.2em Arial";
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("Restart", canvas.width / 2, y + btnHeight / 2);
  ctx.restore();
}

function isRestartButtonClicked(mx, my) {
  const btnWidth = 220;
  const btnHeight = 70;
  const x = canvas.width / 2 - btnWidth / 2;
  const y = canvas.height / 2 + 60;
  return mx >= x && mx <= x + btnWidth && my >= y && my <= y + btnHeight;
}