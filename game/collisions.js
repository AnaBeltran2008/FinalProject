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

  // Player-enemy collision is intentionally disabled: only the "super nova" (bigEnemy)
  // can destroy the player. Small enemies just exist as obstacles the player can shoot.

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
    const playerLeft = player.x - player.width / 2;
    const playerRight = player.x + player.width / 2;
    const playerTop = player.y - player.height / 2;
    const playerBottom = player.y + player.height / 2;

    const enemyLeft = bigEnemy.x - bigEnemy.width / 2;
    const enemyRight = bigEnemy.x + bigEnemy.width / 2;
    const enemyTop = bigEnemy.y - bigEnemy.height / 2;
    const enemyBottom = bigEnemy.y + bigEnemy.height / 2;

    const overlapX = Math.min(playerRight, enemyRight) - Math.max(playerLeft, enemyLeft);
    const overlapY = Math.min(playerBottom, enemyBottom) - Math.max(playerTop, enemyTop);

    const requiredOverlapX = player.width * 0.75;
    const requiredOverlapY = player.height * 0.75;

    if (
      overlapX > 0 &&
      overlapY > 0 &&
      overlapX >= requiredOverlapX &&
      overlapY >= requiredOverlapY
    ) {
      // player explodes (white explosion)
      createExplosion(player.x, player.y, "#ffffff");
      createExplosion(player.x + 10, player.y + 10, "#ffffff");
      createExplosion(player.x - 10, player.y - 10, "#ffffff");
      // play death sound
      playDeathSound();
      player.alive = false;
      player.powered = false;
      player.powerTimer = 0;
    }
  }

  // Enemy projectiles (green diamonds) - player collision (fatal)
  // Only kill the player if the projectile overlaps at least 50% of the player.
  for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
    const ep = enemyProjectiles[i];

    const playerLeft = player.x - player.width / 2;
    const playerRight = player.x + player.width / 2;
    const playerTop = player.y - player.height / 2;
    const playerBottom = player.y + player.height / 2;

    const projHalf = ep.size; // diamond is drawn from center +/- size
    const projLeft = ep.x - projHalf;
    const projRight = ep.x + projHalf;
    const projTop = ep.y - projHalf;
    const projBottom = ep.y + projHalf;

    const overlapX = Math.min(playerRight, projRight) - Math.max(playerLeft, projLeft);
    const overlapY = Math.min(playerBottom, projBottom) - Math.max(playerTop, projTop);

    const requiredOverlapX = player.width * 0.5;
    const requiredOverlapY = player.height * 0.5;

    if (
      overlapX > 0 &&
      overlapY > 0 &&
      overlapX >= requiredOverlapX &&
      overlapY >= requiredOverlapY
    ) {
      // player dies instantly (white explosion)
      createExplosion(player.x, player.y, "#ffffff");
      createExplosion(player.x + 10, player.y + 10, "#ffffff");
      createExplosion(player.x - 10, player.y - 10, "#ffffff");
      playDeathSound();
      player.alive = false;
      player.powered = false;
      player.powerTimer = 0;
      enemyProjectiles.splice(i, 1); // remove the projectile
    }
  }

  // Triangles: player touch => explode into bullets
  // Only trigger if triangle overlaps at least 50% of the player's size
  for (let i = triangles.length - 1; i >= 0; i--) {
    const t = triangles[i];

    // Use axis-aligned bounding box overlap to require a deeper "hit".
    const playerLeft = player.x - player.width / 2;
    const playerRight = player.x + player.width / 2;
    const playerTop = player.y - player.height / 2;
    const playerBottom = player.y + player.height / 2;

    const triLeft = t.x - t.size;
    const triRight = t.x + t.size;
    const triTop = t.y - t.size;
    const triBottom = t.y + t.size;

    const overlapX = Math.min(playerRight, triRight) - Math.max(playerLeft, triLeft);
    const overlapY = Math.min(playerBottom, triBottom) - Math.max(playerTop, triTop);

    const requiredOverlapX = player.width * 0.5;
    const requiredOverlapY = player.height * 0.5;

    if (
      overlapX > 0 &&
      overlapY > 0 &&
      overlapX >= requiredOverlapX &&
      overlapY >= requiredOverlapY
    ) {
      triangleExplode(t.x, t.y);
      triangles.splice(i, 1);
      score += 5;
    }
  }
}
