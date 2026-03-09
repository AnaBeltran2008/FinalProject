// collisions.js - Collision detection

function checkCollisions() {
  // projectile <-> small enemies (existing)
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];

    // only allow player-shot projectiles to damage the bigEnemy
    if (bigEnemy && bigEnemy.isChasing && p.source === "player") {
      const dxB = p.x - bigEnemy.x;
      const dyB = p.y - bigEnemy.y;
      const distB = Math.sqrt(dxB * dxB + dyB * dyB);
      if (distB < p.radius + bigEnemy.width / 2) {
        // explode big enemy only when hit by player's projectile
        createExplosion(bigEnemy.x, bigEnemy.y, bigEnemy.color);
        createExplosion(bigEnemy.x + 20, bigEnemy.y + 10, "#66ccff");
        createExplosion(bigEnemy.x - 20, bigEnemy.y - 10, "#66ccff");
        bigEnemyDestructionCount++;
        // check if player has won (destroyed 5 times)
        if (bigEnemyDestructionCount >= 5) {
          gameWon = true;
        } else {
          // respawn a bigger version and restore player speed
          const prev = bigEnemy;
          player.speed = player.normalSpeed;
          respawnBigEnemy(prev);
        }
        projectiles.splice(i, 1);
        score += 100;
        continue;
      }
    }

    // existing small-enemy collision loop (unchanged)
    for (let j = enemies.length - 1; j >= 0; j--) {
      const e = enemies[j];
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < p.radius + e.width / 2) {
        createExplosion(e.x, e.y, p.color);
        projectiles.splice(i, 1);
        enemies.splice(j, 1);
        score += 10;
        break;
      }
    }
  }

  // Player-enemy collision (change color)
  for (let j = enemies.length - 1; j >= 0; j--) {
    const e = enemies[j];
    const dx = player.x - e.x;
    const dy = player.y - e.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < player.width / 2 + e.width / 2) {
      // Change enemy to random color
      e.color = enemyColors[Math.floor(Math.random() * enemyColors.length)];
    }
  }

  // Player-powerUp collision
  for (let i = powerUps.length - 1; i >= 0; i--) {
    const pu = powerUps[i];
    const dx = player.x - pu.x;
    const dy = player.y - pu.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < player.width / 2 + pu.radius) {
      // grant power: many shots for a limited time (3 seconds)
      player.powered = true;
      player.powerTimer = 180; // 3s at ~60fps
      powerUps.splice(i, 1);
    }
  }

  // Big enemy - player collision
  if (bigEnemy && player.alive) {
    const dxB = player.x - bigEnemy.x;
    const dyB = player.y - bigEnemy.y;
    const distB = Math.sqrt(dxB * dxB + dyB * dyB);
    if (distB < player.width / 2 + bigEnemy.width / 2) {
      // player explodes
      createExplosion(player.x, player.y, "#00aaff");
      // add a few more explosion bursts for emphasis
      createExplosion(player.x + 10, player.y + 10, "#66ccff");
      createExplosion(player.x - 10, player.y - 10, "#66ccff");
      // play death sound
      playDeathSound();
      player.alive = false;
      player.powered = false;
      player.powerTimer = 0;
    }
  }

  // Enemy projectiles - player collision (fatal)
  for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
    const ep = enemyProjectiles[i];
    const dx = player.x - ep.x;
    const dy = player.y - ep.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const playerRadius = Math.sqrt((player.width / 2) ** 2 + (player.height / 2) ** 2);
    if (dist < playerRadius + ep.size) {
      // player dies instantly
      createExplosion(player.x, player.y, "#00aaff");
      createExplosion(player.x + 10, player.y + 10, "#66ccff");
      createExplosion(player.x - 10, player.y - 10, "#66ccff");
      playDeathSound();
      player.alive = false;
      player.powered = false;
      player.powerTimer = 0;
      enemyProjectiles.splice(i, 1); // remove the projectile
    }
  }

  // Triangles: player touch => explode into bullets
  for (let i = triangles.length - 1; i >= 0; i--) {
    const t = triangles[i];
    const dx = player.x - t.x;
    const dy = player.y - t.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // approximate collision radius: player half diag vs triangle size
    const playerRadius = Math.sqrt(
      (player.width / 2) ** 2 + (player.height / 2) ** 2
    );
    if (dist < playerRadius + t.size * 0.7) {
      triangleExplode(t.x, t.y);
      triangles.splice(i, 1);
      score += 5;
    }
  }
}