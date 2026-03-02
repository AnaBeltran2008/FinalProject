const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
// reusable AudioContext for sounds
let audioCtx = null;
function getAudioCtx() {
    if (!audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AC();
    }
    return audioCtx;
}
        
let score = 0;
const BASE_BIG_WIDTH = 60; // base reference size for big enemy
// speed boost: 5 seconds at 60fps, 2x normal speed
const SPEED_BOOST_DURATION = 300; // 5s at ~60fps
const SPEED_BOOST_MULTIPLIER = 2;
let bigEnemyDestructionCount = 0; // track how many times big enemy destroyed
let gameWon = false;
        
// Player
// load a rocket image from the game folder (drop rocket.png in the same folder as game.js/game.html)
const playerImage = new Image();
playerImage.src = 'rocket.png';

// load an enemy sprite image (place enemy.png in the game folder)
const enemyImage = new Image();
enemyImage.src = 'enemy.png';
enemyImage.loaded = false;
enemyImage.onload = () => { enemyImage.loaded = true; };

// load a background image (place background.png next to game.html)
const backgroundImage = new Image();
backgroundImage.src = 'background.png';
backgroundImage.loaded = false;
backgroundImage.onload = () => { backgroundImage.loaded = true; };

const player = {
    x: canvas.width / 2,
    y: canvas.height - 30,
    width: 36,    // increased size (modify to fit your rocket)
    height: 36,   // increased size (modify to fit your rocket)
    normalSpeed: 5,    // new: store normal speed
    speed: 5,          // use this for movement (may be overridden while chased)
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
            ctx.drawImage(this.sprite, this.x - this.width / 4, this.y - this.height / 4, this.width, this.height);
        } else {
            // fallback purple diamond while image loads
            ctx.fillStyle = '#9900ff';
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
        if (keys['ArrowLeft'] && this.x > this.width / 2) this.x -= this.speed;
        if (keys['ArrowRight'] && this.x < canvas.width - this.width / 2) this.x += this.speed;
        if (keys['ArrowUp'] && this.y > this.height / 2) this.y -= this.speed;
        if (keys['ArrowDown'] && this.y < canvas.height - this.height / 2) this.y += this.speed;
    }
};

// start image loading for player sprite
player.init();
        
// Projectiles
let projectiles = [];
const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
        
function shootBall(x, y) {
    projectiles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: -6,
        radius: 5,
        color: colors[Math.floor(Math.random() * colors.length)],
        source: 'player', // <--- mark as player projectile
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
    // play gunshot on player shot
    try { playGunshot(); } catch (e) { /* ignore audio errors */ }
}
        
// new: power-ups
let powerUps = [];
let powerupSpawnTimer = 0;
const POWERUP_SPAWN_INTERVAL = 600; // ~10s at 60fps
        
function spawnPowerUp() {
    powerUps.push({
        x: Math.random() * (canvas.width - 60) + 30,
        y: Math.random() * (canvas.height - 120) + 40,
        radius: 18, // medium circle
        color: '#ffea00', // yellow
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
            // subtle outline
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    });
}
        
// new: multi-shot when powered
function shootMulti(x, y) {
    const count = 12;
    // single gunshot for the multi-shot
    try { playGunshot(); } catch (e) { }
    for (let i = 0; i < count; i++) {
        const spread = (i - (count - 1) / 2) * 0.8;
        projectiles.push({
            x: x,
            y: y,
            vx: spread + (Math.random() - 0.5) * 0.6,
            vy: -6 + (Math.random() - 0.5) * 0.6,
            radius: 5,
            color: colors[Math.floor(Math.random() * colors.length)],
            source: 'player', // <--- mark as player projectile
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

// generate a quick 'gunshot' using noise + a short oscillator
function playGunshot() {
    const ac = getAudioCtx();
    const now = ac.currentTime;

    // short noise burst
    const bufferSize = Math.floor(ac.sampleRate * 0.18);
    const buffer = ac.createBuffer(1, bufferSize, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);

    const noise = ac.createBufferSource();
    noise.buffer = buffer;
    const bp = ac.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 1000 + Math.random() * 1200;
    bp.Q.value = 0.7;

    const ng = ac.createGain();
    ng.gain.setValueAtTime(0.0001, now);
    ng.gain.linearRampToValueAtTime(1.0, now + 0.005);
    ng.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    noise.connect(bp);
    bp.connect(ng);
    ng.connect(ac.destination);
    noise.start(now);
    noise.stop(now + 0.18);

    // add a high 'click' for impact
    const osc = ac.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = 2800 + Math.random() * 800;
    const og = ac.createGain();
    og.gain.setValueAtTime(0.0001, now);
    og.gain.linearRampToValueAtTime(0.7, now + 0.004);
    og.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
    osc.connect(og);
    og.connect(ac.destination);
    osc.start(now);
    osc.stop(now + 0.06);
}
        
// Enemies
let enemies = [];
let enemySpawnTimer = 0;
const enemyColors = ['#ff6600', '#00ff99', '#ff0099', '#00ccff', '#ffff00', '#ff9900', '#cc00ff', '#00ff00'];
        
function spawnEnemy() {
    // small enemies stay a fixed size and use colored rectangles
    const w = 20;
    const h = 20;

    enemies.push({
        x: Math.random() * (canvas.width - w) + w/2,
        y: Math.random() * 100 + 20,
        width: w,
        height: h,
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 2 + 1,
        health: 1,
        color: enemyColors[Math.floor(Math.random() * enemyColors.length)],
        draw() {
            ctx.fillStyle = this.color;
            ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
        },
        update() {
            this.x += this.vx;
            this.y += this.vy;
            
            if (this.x - this.width / 2 < 0 || this.x + this.width / 2 > canvas.width) this.vx *= -1;
            if (this.y - this.height / 2 < 0 || this.y + this.height / 2 > canvas.height) this.vy *= -1;
        }
    });
}
        
// Big Enemy
let bigEnemy = null;
        
function spawnBigEnemy() {
    bigEnemy = {
        x: Math.random() * (canvas.width - 160) + 80,
        y: Math.random() * 100 + 20,
        width: 60,
        height: 60,
        vx: (Math.random() < 0.5 ? -1 : 1) * (6 + Math.random() * 4), // initial fast
        vy: (Math.random() - 0.5) * 4,
        color: '#0077ff',
        changeTimer: 0,
        changeInterval: 30 + Math.floor(Math.random() * 90),
        maxSpeed: 8,
        // chase properties: every 15s (900 frames) chase for short duration
        chaseTimer: 0,
        chaseInterval: 900,   // ~15s at 60fps
        chaseDuration: 480,   // changed: chase for ~8s (was 120)
        isChasing: false,
        chaseTimeLeft: 0,
        draw() {
            if (enemyImage.loaded) {
                ctx.drawImage(enemyImage,
                              this.x - this.width/2,
                              this.y - this.height/2,
                              this.width,
                              this.height);
            } else {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#004ecc';
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
                    if (player.speedBoosted) player.speed = player.normalSpeed * SPEED_BOOST_MULTIPLIER;
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
        }
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
            color: '#0077ff',
            draw() {
                if (enemyImage.loaded) {
                    ctx.drawImage(enemyImage,
                                  this.x - this.width/2,
                                  this.y - this.height/2,
                                  this.width,
                                  this.height);
                } else {
                    ctx.fillStyle = this.color;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#004ecc';
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }
            },
            update() { /* no movement when win */ }
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
        color: '#0077ff',
        changeTimer: 0,
        changeInterval: 30 + Math.floor(Math.random() * 90),
        maxSpeed: newMaxSpeed,
        chaseTimer: 0,
        chaseInterval: 900,
        chaseDuration: 480,
        isChasing: false,
        chaseTimeLeft: 0,
        draw() {
            if (enemyImage.loaded) {
                ctx.drawImage(enemyImage,
                              this.x - this.width/2,
                              this.y - this.height/2,
                              this.width,
                              this.height);
            } else {
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#004ecc';
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
                        if (player.speedBoosted) player.speed = player.normalSpeed * SPEED_BOOST_MULTIPLIER;
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
        }
    };
}
        
// spawn big enemy once at start
spawnBigEnemy();
        
// Explosions
let explosions = [];
        
function createExplosion(x, y, color) {
    for (let i = 0; i < 8; i++) {
        explosions.push({
            x: x,
            y: y,
            vx: Math.cos(i * Math.PI / 4) * 3,
            vy: Math.sin(i * Math.PI / 4) * 3,
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
            }
        });
    }
}

// play a short descending 'death' sound using Web Audio API
function playDeathSound() {
    try {
        const AC = window.AudioContext || window.webkitAudioContext;
        const ac = new AC();
        const now = ac.currentTime;
        const freqs = [880, 740, 620, 520, 420];
        let t = 0;
        freqs.forEach((f) => {
            const o = ac.createOscillator();
            const g = ac.createGain();
            o.type = 'sine';
            o.frequency.value = f;
            o.connect(g);
            g.connect(ac.destination);
            const dur = 0.14;
            g.gain.setValueAtTime(0, now + t);
            g.gain.linearRampToValueAtTime(0.9, now + t + 0.01);
            g.gain.linearRampToValueAtTime(0.0, now + t + dur);
            o.start(now + t);
            o.stop(now + t + dur + 0.02);
            t += dur;
        });
        // close the context shortly after sounds finish if supported
        setTimeout(() => { if (ac.close) ac.close(); }, (t + 0.1) * 1000);
    } catch (e) {
        console.warn('Audio unavailable', e);
    }
}
        
// new: red triangles
let triangles = [];
let triangleSpawnTimer = 0;
const TRIANGLE_SPAWN_INTERVAL = 420; // spawn every ~7s
        
function spawnTriangle() {
    triangles.push({
        x: Math.random() * (canvas.width - 120) + 60,
        y: Math.random() * (canvas.height - 240) + 40,
        size: 24,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        color: '#ff3333',
        draw() {
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(this.x, this.y - this.size);
            ctx.lineTo(this.x + this.size, this.y + this.size);
            ctx.lineTo(this.x - this.size, this.y + this.size);
            ctx.closePath();
            ctx.fill();
        },
        update() {
            this.x += this.vx;
            this.y += this.vy;
            if (this.x - this.size < 0 || this.x + this.size > canvas.width) this.vx *= -1;
            if (this.y - this.size < 0 || this.y + this.size > canvas.height) this.vy *= -1;
        }
    });
}
        
// when triangle explodes spawn many bullets
function triangleExplode(x, y) {
    createExplosion(x, y, '#ff6666');
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
            color: ['#ff0000', '#ff5500', '#ff9900'][Math.floor(Math.random() * 3)],
            source: 'triangle', // <--- mark as triangle projectile
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
        
// Collision detection
function checkCollisions() {
    // projectile <-> small enemies (existing)
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];

        // only allow player-shot projectiles to damage the bigEnemy
        if (bigEnemy && bigEnemy.isChasing && p.source === 'player') {
            const dxB = p.x - bigEnemy.x;
            const dyB = p.y - bigEnemy.y;
            const distB = Math.sqrt(dxB * dxB + dyB * dyB);
            if (distB < p.radius + bigEnemy.width / 2) {
                // explode big enemy only when hit by player's projectile
                createExplosion(bigEnemy.x, bigEnemy.y, bigEnemy.color);
                createExplosion(bigEnemy.x + 20, bigEnemy.y + 10, '#66ccff');
                createExplosion(bigEnemy.x - 20, bigEnemy.y - 10, '#66ccff');
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
        
        if (distance < (player.width / 2 + e.width / 2)) {
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
        if (dist < (player.width / 2 + pu.radius)) {
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
        if (distB < (player.width / 2 + bigEnemy.width / 2)) {
            // player explodes
            createExplosion(player.x, player.y, '#00aaff');
            // add a few more explosion bursts for emphasis
            createExplosion(player.x + 10, player.y + 10, '#66ccff');
            createExplosion(player.x - 10, player.y - 10, '#66ccff');
            // play death sound
            playDeathSound();
            player.alive = false;
            player.powered = false;
            player.powerTimer = 0;
        }
    }
    
    // Triangles: player touch => explode into bullets
    for (let i = triangles.length - 1; i >= 0; i--) {
        const t = triangles[i];
        const dx = player.x - t.x;
        const dy = player.y - t.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // approximate collision radius: player half diag vs triangle size
        const playerRadius = Math.sqrt((player.width/2)**2 + (player.height/2)**2);
        if (dist < playerRadius + t.size * 0.7) {
            triangleExplode(t.x, t.y);
            triangles.splice(i, 1);
            score += 5;
        }
    }
}
        
// Game loop
const keys = {};
        
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    // use Spacebar to shoot (use e.code for reliable detection)
    if (e.code === 'Space') {
        e.preventDefault();
        if (!player.alive) return;
        if (player.powered) shootMulti(player.x, player.y);
        else shootBall(player.x, player.y);
    }
});
        
window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});
        
// replace click handler to use multi-shot when powered
canvas.addEventListener('click', (e) => {
    if (!player.alive) return; // cannot shoot when dead
    if (player.powered) shootMulti(player.x, player.y);
    else shootBall(player.x, player.y);
});
        
function gameLoop() {
    // draw background image if available
    if (backgroundImage.loaded) {
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = '#000';
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
            ctx.fillStyle = 'rgba(153, 0, 255, 0.3)';
            ctx.fillRect(player.x - player.width / 2, player.y - player.height / 2, player.width, player.height);
        }
        if (player.powerTimer <= 0) {
            player.powered = false;
            player.powerTimer = 0;
        }
    }

    // Speed-boost: trigger when crossing each 100-point threshold
    const thresholdsReached = Math.floor(score / 100);
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
            ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
            ctx.fillRect(player.x - player.width / 2 - 4, player.y - player.height / 2 - 4, player.width + 8, player.height + 8);
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
    document.getElementById('score').textContent = 'Score: ' + score;
    
    // show game over text if player dead
    if (!player.alive) {
        ctx.fillStyle = '#fff';
        ctx.font = '48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over', canvas.width / 2, canvas.height / 2);
        return; // stop loop
    }

    // show win text if player won (stop loop)
    if (gameWon) {
        ctx.fillStyle = '#fff';
        ctx.font = '56px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('You Win!', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '20px Arial';
        ctx.fillText('The blue ball grew 5x!', canvas.width / 2, canvas.height / 2 + 20);
        return; // stop loop
    }

    requestAnimationFrame(gameLoop);
}

gameLoop();
