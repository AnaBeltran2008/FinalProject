// main.js - Main game logic

// Game loop
const keys = {};

window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  // use Spacebar to shoot (use e.code for reliable detection)
  if (e.code === "Space") {
    e.preventDefault();
    if (!player.alive) return;
    if (player.powered) shootMulti(player.x, player.y);
    else shootBall(player.x, player.y);
  }
});

window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// replace click handler to use multi-shot when powered
canvas.addEventListener("click", (e) => {
  if (!player.alive) return; // cannot shoot when dead
  if (player.powered) shootMulti(player.x, player.y);
  else shootBall(player.x, player.y);
});

canvas.addEventListener("click", function (e) {
  if (!player.alive) {
    // Get mouse position relative to canvas
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    if (isRestartButtonClicked(mx, my)) {
      globalThis.location.reload();
    }
  }
});

function gameLoop() {
  // draw background image if available
  if (backgroundImage.loaded) {
    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // Update and draw
  player.update(keys);
  player.draw();

  // Spawn enemies
  enemySpawnTimer++;
  if (enemySpawnTimer > 60) {
    spawnEnemy();
    enemySpawnTimer = 0;
  }

  // Spawn power-ups every interval
  powerupSpawnTimer++;
  if (powerupSpawnTimer > POWERUP_SPAWN_INTERVAL) {
    spawnPowerUp();
    powerupSpawnTimer = 0;
  }

  // Spawn triangles periodically
  triangleSpawnTimer++;
  if (triangleSpawnTimer > TRIANGLE_SPAWN_INTERVAL) {
    spawnTriangle();
    triangleSpawnTimer = 0;
  }

  // Update and draw enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].update();
    enemies[i].draw();
    if (enemies[i].y > canvas.height) {
      enemies.splice(i, 1);
    }
  }

  // Update and draw triangles
  for (let i = triangles.length - 1; i >= 0; i--) {
    triangles[i].update();
    triangles[i].draw();
  }

  // Update and draw projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    projectiles[i].update();
    projectiles[i].draw();
    if (projectiles[i].y < 0) {
      projectiles.splice(i, 1);
    }
  }

  // Update and draw enemy projectiles
  for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
    enemyProjectiles[i].update();
    enemyProjectiles[i].draw();
    if (enemyProjectiles[i].y > canvas.height || enemyProjectiles[i].y < 0 || enemyProjectiles[i].x < 0 || enemyProjectiles[i].x > canvas.width) {
      enemyProjectiles.splice(i, 1);
    }
  }

  // Update and draw explosions
  for (let i = explosions.length - 1; i >= 0; i--) {
    explosions[i].update();
    explosions[i].draw();
    if (explosions[i].alpha <= 0) {
      explosions.splice(i, 1);
    }
  }

  // Draw and update power-ups
  for (let i = powerUps.length - 1; i >= 0; i--) {
    powerUps[i].draw();
    // optional: could add lifetime removal here
  }

  // Update and draw bigEnemy
  if (bigEnemy) {
    bigEnemy.update();
    bigEnemy.draw();
  }

  // power duration countdown
  if (player.powered) {
    player.powerTimer--;
    // visual hint: slight tint to player while powered (only if alive)
    if (player.alive) {
      ctx.fillStyle = "rgba(153, 0, 255, 0.3)";
      ctx.fillRect(
        player.x - player.width / 2,
        player.y - player.height / 2,
        player.width,
        player.height
      );
    }
    if (player.powerTimer <= 0) {
      player.powered = false;
      player.powerTimer = 0;
    }
  }

  // Speed-boost: trigger when crossing each 50-point threshold
  const thresholdsReached = Math.floor(score / 50);
  if (thresholdsReached > player.speedBoostCount) {
    player.speedBoostCount = thresholdsReached;
    player.speedBoosted = true;
    player.speedBoostTimer = SPEED_BOOST_DURATION;
    player.speed = player.normalSpeed * SPEED_BOOST_MULTIPLIER;
  }

  // handle speed-boost countdown and restore
  if (player.speedBoosted) {
    player.speedBoostTimer--;
    // subtle visual while boosted
    if (player.alive) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.06)";
      ctx.fillRect(
        player.x - player.width / 2 - 4,
        player.y - player.height / 2 - 4,
        player.width + 8,
        player.height + 8
      );
    }
    if (player.speedBoostTimer <= 0) {
      player.speedBoosted = false;
      player.speedBoostTimer = 0;
      player.speed = player.normalSpeed;
    }
  }

  // Check collisions
  checkCollisions();

  // Update score
  document.getElementById("score").textContent = "Score: " + score;

  // show game over text if player dead
  if (!player.alive) {
    ctx.fillStyle = "#fff";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2);
    drawRestartButton();
    return; // stop loop
  }

  // show win text if player won (stop loop)
  if (gameWon) {
    ctx.fillStyle = "#fff";
    ctx.font = "56px Arial";
    ctx.textAlign = "center";
    ctx.fillText("You Win!", canvas.width / 2, canvas.height / 2 - 20);
    ctx.font = "20px Arial";
    ctx.fillText(
      "The blue ball grew 5x!",
      canvas.width / 2,
      canvas.height / 2 + 20
    );
    return; // stop loop
  }

  requestAnimationFrame(gameLoop);
}

gameLoop();
