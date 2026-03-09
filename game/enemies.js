// enemies.js - Enemy functions

function spawnEnemy() {
  // small enemies stay a fixed size and use colored rectangles
  const w = 20;
  const h = 20;

  enemies.push({
    x: Math.random() * (canvas.width - w) + w / 2,
    y: Math.random() * 100 + 20,
    width: w,
    height: h,
    vx: (Math.random() - 0.5) * 4,
    vy: Math.random() * 2 + 1,
    health: 1,
    color: enemyColors[Math.floor(Math.random() * enemyColors.length)],
    draw() {
      ctx.fillStyle = this.color;
      ctx.fillRect(
        this.x - this.width / 2,
        this.y - this.height / 2,
        this.width,
        this.height
      );
    },
    update() {
      this.x += this.vx;
      this.y += this.vy;

      if (this.x - this.width / 2 < 0 || this.x + this.width / 2 > canvas.width)
        this.vx *= -1;
      if (
        this.y - this.height / 2 < 0 ||
        this.y + this.height / 2 > canvas.height
      )
        this.vy *= -1;
    },
  });
}

function spawnBigEnemy() {
  bigEnemy = {
    x: Math.random() * (canvas.width - 160) + 80,
    y: Math.random() * 100 + 20,
    width: 60,
    height: 60,
    vx: (Math.random() < 0.5 ? -1 : 1) * (6 + Math.random() * 4), // initial fast
    vy: (Math.random() - 0.5) * 4,
    color: "#0077ff",
    changeTimer: 0,
    changeInterval: 30 + Math.floor(Math.random() * 90),
    maxSpeed: 8,
    // chase properties: every 15s (900 frames) chase for short duration
    chaseTimer: 0,
    chaseInterval: 900, // ~15s at 60fps
    chaseDuration: 480, // changed: chase for ~8s (was 120)
    isChasing: false,
    chaseTimeLeft: 0,
    shootTimer: 0,
    draw() {
      if (enemyImage.loaded) {
        ctx.drawImage(
          enemyImage,
          this.x - this.width / 2,
          this.y - this.height / 2,
          this.width,
          this.height
        );
      } else {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#004ecc";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    },
    update() {
      // handle chase timing
      this.chaseTimer++;
      if (!this.isChasing && this.chaseTimer >= this.chaseInterval) {
        this.isChasing = true;
        this.chaseTimeLeft = this.chaseDuration;
        this.chaseTimer = 0;
      }

      // if chasing, head toward player and set player's speed to match
      if (this.isChasing && this.chaseTimeLeft > 0) {
        const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
        const speed = Math.min(this.maxSpeed + 2, this.maxSpeed + 3);
        this.vx = Math.cos(angleToPlayer) * speed;
        this.vy = Math.sin(angleToPlayer) * speed;

        // make player move at same speed while being chased
        player.speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);

        this.chaseTimeLeft--;
        if (this.chaseTimeLeft <= 0) {
          this.isChasing = false;
          // restore player speed when chase ends
          player.speed = player.normalSpeed;
          if (player.speedBoosted)
            player.speed = player.normalSpeed * SPEED_BOOST_MULTIPLIER;
          this.changeInterval = 30 + Math.floor(Math.random() * 90);
          this.changeTimer = 0;
        }
      } else {
        // roaming behavior
        this.changeTimer++;
        if (this.changeTimer >= this.changeInterval) {
          this.changeTimer = 0;
          this.changeInterval = 30 + Math.floor(Math.random() * 90);
          const angle = Math.random() * Math.PI * 2;
          const speed = 3 + Math.random() * (this.maxSpeed - 3);
          this.vx = Math.cos(angle) * speed;
          this.vy = Math.sin(angle) * speed;
        }
      }

      // apply velocity and bounce on edges (same as before)
      this.x += this.vx;
      this.y += this.vy;

      if (this.x - this.width / 2 < 0) {
        this.x = this.width / 2;
        this.vx = Math.abs(this.vx) * (0.8 + Math.random() * 0.4);
      } else if (this.x + this.width / 2 > canvas.width) {
        this.x = canvas.width - this.width / 2;
        this.vx = -Math.abs(this.vx) * (0.8 + Math.random() * 0.4);
      }
      if (this.y - this.height / 2 < 0) {
        this.y = this.height / 2;
        this.vy = Math.abs(this.vy) * (0.8 + Math.random() * 0.4);
      } else if (this.y + this.height / 2 > canvas.height) {
        this.y = canvas.height - this.height / 2;
        this.vy = -Math.abs(this.vy) * (0.8 + Math.random() * 0.4);
      }

      // clamp speed
      const sp = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (sp > this.maxSpeed) {
        this.vx = (this.vx / sp) * this.maxSpeed;
        this.vy = (this.vy / sp) * this.maxSpeed;
      }

      // shooting logic
      this.shootTimer++;
      if (this.shootTimer >= 120) {
        this.shootTimer = 0;
        const angle = Math.random() * Math.PI * 2;
        enemyProjectiles.push({
          x: this.x,
          y: this.y,
          vx: Math.cos(angle) * 4,
          vy: Math.sin(angle) * 4,
          size: 20,
          color: "#00ff00",
          draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - this.size);
            ctx.lineTo(this.x + this.size, this.y);
            ctx.lineTo(this.x, this.y + this.size);
            ctx.lineTo(this.x - this.size, this.y);
            ctx.closePath();
            ctx.fill();
          },
          update() {
            this.x += this.vx;
            this.y += this.vy;
          },
        });
      }
    },
  };
}

// new: respawn a bigger bigEnemy after explosion
function respawnBigEnemy(prev) {
  // increase size and slightly bump speed, with caps
  const newWidth = Math.min((prev ? prev.width : BASE_BIG_WIDTH) * 1.25, 140);
  const newMaxSpeed = Math.min((prev ? prev.maxSpeed : 8) + 1, 12);

  // if new width reaches 5x base, player wins
  if (newWidth >= BASE_BIG_WIDTH * 5) {
    gameWon = true;
    // still create a final bigEnemy for visuals (optional)
    bigEnemy = {
      x: canvas.width / 2,
      y: canvas.height / 2,
      width: newWidth,
      height: newWidth,
      vx: 0,
      vy: 0,
      color: "#0077ff",
      draw() {
        if (enemyImage.loaded) {
          ctx.drawImage(
            enemyImage,
            this.x - this.width / 2,
            this.y - this.height / 2,
            this.width,
            this.height
          );
        } else {
          ctx.fillStyle = this.color;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#004ecc";
          ctx.lineWidth = 3;
          ctx.stroke();
        }
      },
      update() {
        /* no movement when win */
      },
    };
    return;
  }

  bigEnemy = {
    x: Math.random() * (canvas.width - newWidth - 40) + newWidth / 2 + 20,
    y: Math.random() * 100 + 20,
    width: newWidth,
    height: newWidth,
    vx: (Math.random() < 0.5 ? -1 : 1) * (4 + Math.random() * 4),
    vy: (Math.random() - 0.5) * 4,
    color: "#0077ff",
    changeTimer: 0,
    changeInterval: 30 + Math.floor(Math.random() * 90),
    maxSpeed: newMaxSpeed,
    chaseTimer: 0,
    chaseInterval: 900,
    chaseDuration: 480,
    isChasing: false,
    chaseTimeLeft: 0,
    shootTimer: 0,
    draw() {
      if (enemyImage.loaded) {
        ctx.drawImage(
          enemyImage,
          this.x - this.width / 2,
          this.y - this.height / 2,
          this.width,
          this.height
        );
      } else {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#004ecc";
        ctx.lineWidth = 3;
        ctx.stroke();
      }
    },
    update() {
      // reuse existing bigEnemy update logic (roam + chase)
      this.chaseTimer++;
      if (!this.isChasing && this.chaseTimer >= this.chaseInterval) {
        this.isChasing = true;
        this.chaseTimeLeft = this.chaseDuration;
        this.chaseTimer = 0;
      }
      if (this.isChasing && this.chaseTimeLeft > 0) {
        const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
        const speed = Math.min(this.maxSpeed + 2, this.maxSpeed + 3);
        this.vx = Math.cos(angleToPlayer) * speed;
        this.vy = Math.sin(angleToPlayer) * speed;
        player.speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        this.chaseTimeLeft--;
        if (this.chaseTimeLeft <= 0) {
          this.isChasing = false;
          player.speed = player.normalSpeed;
          if (player.speedBoosted)
            player.speed = player.normalSpeed * SPEED_BOOST_MULTIPLIER;
          this.changeInterval = 30 + Math.floor(Math.random() * 90);
          this.changeTimer = 0;
        }
      } else {
        this.changeTimer++;
        if (this.changeTimer >= this.changeInterval) {
          this.changeTimer = 0;
          this.changeInterval = 30 + Math.floor(Math.random() * 90);
          const angle = Math.random() * Math.PI * 2;
          const speed = 3 + Math.random() * (this.maxSpeed - 3);
          this.vx = Math.cos(angle) * speed;
          this.vy = Math.sin(angle) * speed;
        }
      }
      this.x += this.vx;
      this.y += this.vy;
      if (this.x - this.width / 2 < 0) {
        this.x = this.width / 2;
        this.vx = Math.abs(this.vx) * (0.8 + Math.random() * 0.4);
      } else if (this.x + this.width / 2 > canvas.width) {
        this.x = canvas.width - this.width / 2;
        this.vx = -Math.abs(this.vx) * (0.8 + Math.random() * 0.4);
      }
      if (this.y - this.height / 2 < 0) {
        this.y = this.height / 2;
        this.vy = Math.abs(this.vy) * (0.8 + Math.random() * 0.4);
      } else if (this.y + this.height / 2 > canvas.height) {
        this.y = canvas.height - this.height / 2;
        this.vy = -Math.abs(this.vy) * (0.8 + Math.random() * 0.4);
      }
      const sp = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (sp > this.maxSpeed) {
        this.vx = (this.vx / sp) * this.maxSpeed;
        this.vy = (this.vy / sp) * this.maxSpeed;
      }

      // shooting logic
      this.shootTimer++;
      if (this.shootTimer >= 120) {
        this.shootTimer = 0;
        const angle = Math.random() * Math.PI * 2;
        enemyProjectiles.push({
          x: this.x,
          y: this.y,
          vx: Math.cos(angle) * 4,
          vy: Math.sin(angle) * 4,
          size: 20,
          color: "#00ff00",
          draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - this.size);
            ctx.lineTo(this.x + this.size, this.y);
            ctx.lineTo(this.x, this.y + this.size);
            ctx.lineTo(this.x - this.size, this.y);
            ctx.closePath();
            ctx.fill();
          },
          update() {
            this.x += this.vx;
            this.y += this.vy;
          },
        });
      }
    },
  };
}

// spawn big enemy once at start
spawnBigEnemy();