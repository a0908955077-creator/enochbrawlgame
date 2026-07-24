// ==========================================
// 海神召喚物實體: 幻星鯊 (Shark)
// ==========================================
class Shark {
    constructor(ownerId, x, y, angle, maxHp) {
        this.ownerId = ownerId; this.x = x; this.y = y; this.angle = angle;
        this.maxHp = maxHp; this.hp = maxHp; this.radius = 22; this.speed = 3.8; 
        this.isDashing = true; this.dashTraveled = 0; this.lastBiteTime = 0;
        this.dashHitPlayers = [];
    }
    update() {
        if (this.isDashing) {
            let step = 15;
            this.x += Math.cos(this.angle) * step;
            this.y += Math.sin(this.angle) * step;
            this.dashTraveled += step;
            players.forEach(p => {
                if (p.id !== this.ownerId && !p.isDead && p.invincibilityTimer <= 0 && !this.dashHitPlayers.includes(p.id)) {
                    if (Math.hypot(this.x - p.x, this.y - p.y) < this.radius + p.radius + 15) {
                        this.dashHitPlayers.push(p.id);
                        p.x += Math.cos(this.angle) * 60; p.y += Math.sin(this.angle) * 60;
                        createParticles(p.x, p.y, '#0284c7', 15);
                    }
                }
            });
            if (this.dashTraveled >= 150) this.isDashing = false;
        } else {
            const enemy = players.find(p => p.id !== this.ownerId && !p.isDead && p.invincibilityTimer <= 0);
            if (enemy) {
                let dx = enemy.x - this.x, dy = enemy.y - this.y;
                let dist = Math.hypot(dx, dy);
                let canMove = (Date.now() - this.lastBiteTime >= 500);

                if (dist > this.radius + enemy.radius) {
                    if (canMove) {
                        this.angle = Math.atan2(dy, dx);
                        let nx = this.x + Math.cos(this.angle) * this.speed;
                        let ny = this.y + Math.sin(this.angle) * this.speed;
                        
                        let hitWall = false;
                        walls.forEach(w => { if (circleRectCollide(nx, ny, this.radius, w)) hitWall = true; });
                        if (!hitWall) { this.x = nx; this.y = ny; } 
                        else { this.x += Math.cos(this.angle + Math.PI/2) * this.speed; this.y += Math.sin(this.angle + Math.PI/2) * this.speed; }
                    }
                } else {
                    if (Date.now() - this.lastBiteTime > 800) {
                        this.lastBiteTime = Date.now();
                        enemy.takeDamage(520, this.ownerId, true, 0.1); 
                        createParticles(enemy.x, enemy.y, '#ef4444', 10);
                        playSound('hit');
                    }
                }
            }
        }
        
        prisonerCages.forEach(cage => {
            if (this.ownerId !== cage.ownerId) {
                const distToCage = Math.hypot(this.x - cage.x, this.y - cage.y);
                if (distToCage > cage.radius - this.radius && distToCage < cage.radius) {
                    const ang = Math.atan2(this.y - cage.y, this.x - cage.x);
                    this.x = cage.x + Math.cos(ang) * (cage.radius - this.radius);
                    this.y = cage.y + Math.sin(ang) * (cage.radius - this.radius);
                }
                else if (distToCage < cage.radius + this.radius && distToCage >= cage.radius) {
                    const ang = Math.atan2(this.y - cage.y, this.x - cage.x);
                    this.x = cage.x + Math.cos(ang) * (cage.radius + this.radius);
                    this.y = cage.y + Math.sin(ang) * (cage.radius + this.radius);
                }
            }
        });

        this.x = Math.max(this.radius, Math.min(BASE_WIDTH - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(BASE_HEIGHT - this.radius, this.y));
    }
    draw() {
        ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle);
        ctx.fillStyle = '#0284c7'; ctx.beginPath();
        ctx.moveTo(22, 0); ctx.lineTo(-15, 12); ctx.lineTo(-15, -12); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#0ea5e9'; ctx.beginPath();
        ctx.moveTo(-15, 0); ctx.lineTo(-30, 15); ctx.lineTo(-30, -15); ctx.closePath(); ctx.fill();
        ctx.font = '20px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.save(); ctx.translate(5, 0); ctx.rotate(Math.PI/2); ctx.fillText('🦈', 0, 0); ctx.restore();
        ctx.restore();
        ctx.save(); ctx.translate(this.x, this.y);
        const barW = 40, barH = 5;
        ctx.fillStyle = '#1e293b'; ctx.fillRect(-barW/2, -this.radius - 12, barW, barH);
        ctx.fillStyle = '#38bdf8'; ctx.fillRect(-barW/2, -this.radius - 12, barW * (this.hp/this.maxHp), barH);
        ctx.strokeStyle = '#020617'; ctx.lineWidth = 1; ctx.strokeRect(-barW/2, -this.radius - 12, barW, barH);
        ctx.restore();
    }
}

// ==========================================
// 玩家類別與核心邏輯 (Player)
// ==========================================
class Player {
    constructor(id, brawler, x, y, angle, color) {
        this.id = id; this.brawler = brawler; this.x = x; this.y = y; this.baseX = x; this.baseY = y;
        this.radius = 24; this.angle = angle; this.color = color;
        this.maxHp = brawler.maxHp; this.hp = brawler.maxHp; this.speed = brawler.speed;
        this.ammo = 3; this.ultCharge = 0; this.crystalsCollected = 0; this.extraAtk = 0; this.extraHp = 0;
        this.lastShootTime = 0; this.lastReloadTime = Date.now(); this.isHiding = false;
        
        this.isDead = false; this.respawnTimer = 0; this.invincibilityTimer = 0; this.lastDamageTime = 0;
        this.dotTimer = 0; this.dotTicks = 0; this.dotAttackerId = null;
        this.isConfused = false; this.confusionTimer = 0;
        this.isStunned = false; this.stunTimer = 0;
        this.isRangerUlt = false; this.rangerUltTimer = 0;

        this.isSpraying = false; this.sprayTimer = 0;
        this.syrupSlowTimer = 0; this.picnicSlowTimer = 0;
        this.freezeValue = 0; 
        this.damageReductionTimer = 0; 
        
        this.isCharging = false; this.chargeStartTime = 0;
        this.isChannelingMageUlt = false; this.mageUltTimer = 0; this.mageUltTicks = 0;

        this.img = null;
        if (brawler.imgUrl) {
            this.img = new Image();
            this.img.src = brawler.imgUrl;
        }
        
        this.updateStatsFromCrystals(0);
    }

    get damage() { let dmg = this.brawler.damage + this.extraAtk; if (this.isRangerUlt) dmg *= 1.3; return dmg; }

    updateStatsFromCrystals(healAmount = 0) {
        this.extraAtk = this.brawler.damage * 0.02 * this.crystalsCollected;
        const oldMaxHp = this.maxHp;
        this.maxHp = Math.floor(this.brawler.maxHp * (1 + 0.02 * this.crystalsCollected));
        if (this.maxHp > oldMaxHp) this.hp += (this.maxHp - oldMaxHp);
        if (healAmount > 0) this.hp = Math.min(this.maxHp, this.hp + healAmount);
        this.hp = Math.floor(this.hp);
    }

    takeDamage(amount, attackerId, triggerImmunity=true, chargeUlt=true) {
        if (this.isDead || this.invincibilityTimer > 0) return;
        
        if (this.damageReductionTimer > 0) amount *= 0.75; 
        
        this.hp = Math.floor(this.hp - amount);
        if (triggerImmunity) this.lastDamageTime = Date.now(); 
        playSound('hurt'); createFloatingText(this.x, this.y - 25, `-${Math.round(amount)}`, '#ef4444'); createParticles(this.x, this.y, '#ef4444', 8);

        if (this.isChannelingMageUlt) {
            this.isChannelingMageUlt = false; 
            createFloatingText(this.x, this.y - 45, "❌ 吟唱中斷!", "#ef4444");
        }

        if (this.brawler.id === 'titan') this.ultCharge = Math.min(100, this.ultCharge + (amount / 7680) * 100);

        if (this.hp <= 0) {
            this.hp = 0; this.isDead = true; this.respawnTimer = 180;
            this.isCharging = false; 
            const attacker = players.find(p => p.id === attackerId);
            if (attacker) {
                attacker.crystalsCollected += 1; attacker.updateStatsFromCrystals(0);
                createFloatingText(attacker.x, attacker.y - 45, `⚔️ 擊殺! 戰力 +2% 💎 (💎x${attacker.crystalsCollected})`, "#e11d48");
                createParticles(attacker.x, attacker.y, "#22d3ee", 15); playSound('crystal');
                if (chargeUlt) {
                    let baseDmgEquiv = attacker.brawler.damage * (amount / attacker.damage);
                    attacker.ultCharge = Math.min(100, attacker.ultCharge + (baseDmgEquiv / attacker.brawler.ultRequirement) * 100 * (typeof chargeUlt === 'number' ? chargeUlt : 1.0));
                }
                if (isSuddenDeath) setTimeout(endGame, 100);
            }
            createFloatingText(this.x, this.y - 25, "💀 被擊倒!", "#ef4444"); createParticles(this.x, this.y, "#ef4444", 25); playSound('hurt');
        } else {
            if (chargeUlt) {
                const attacker = players.find(p => p.id === attackerId);
                if (attacker) {
                    let baseDmgEquiv = attacker.brawler.damage * (amount / attacker.damage);
                    attacker.ultCharge = Math.min(100, attacker.ultCharge + (baseDmgEquiv / attacker.brawler.ultRequirement) * 100 * (typeof chargeUlt === 'number' ? chargeUlt : 1.0));
                }
            }
        }
    }

    update() {
        if (this.isDead) {
            this.respawnTimer--;
            if (this.respawnTimer <= 0) {
                this.isDead = false; this.hp = this.maxHp; this.x = this.baseX; this.y = this.baseY; this.invincibilityTimer = 120;
                this.dotTicks = 0; this.dotTimer = 0; this.dotAttackerId = null;
                this.isConfused = false; this.confusionTimer = 0;
                this.isStunned = false; this.stunTimer = 0;
                this.isSpraying = false; this.sprayTimer = 0;
                this.freezeValue = 0; this.syrupSlowTimer = 0; this.picnicSlowTimer = 0; 
                this.damageReductionTimer = 0; this.isRangerUlt = false; this.rangerUltTimer = 0;
                this.isCharging = false; this.isChannelingMageUlt = false;
            }
            return;
        }

        if (this.invincibilityTimer > 0) this.invincibilityTimer--;
        if (this.damageReductionTimer > 0) this.damageReductionTimer--;
        if (this.stunTimer > 0) { this.stunTimer--; this.isStunned = this.stunTimer > 0; if (this.isStunned) { this.isCharging = false; this.isChannelingMageUlt = false; } }
        if (this.confusionTimer > 0) { this.confusionTimer--; this.isConfused = this.confusionTimer > 0; }
        if (this.rangerUltTimer > 0) { this.rangerUltTimer--; this.isRangerUlt = this.rangerUltTimer > 0; if (this.isRangerUlt && Math.random() > 0.5) createParticles(this.x, this.y, '#60a5fa', 1); }

        if (this.dotTicks > 0) {
            this.dotTimer--;
            if (this.dotTimer <= 0) { this.dotTicks--; this.dotTimer = 60; this.takeDamage(Math.floor(this.maxHp * 0.05), this.dotAttackerId, true, false); }
        }

        if (this.isChannelingMageUlt) {
            this.mageUltTimer--;
            if (this.mageUltTimer % 30 === 0 && this.mageUltTicks > 0) {
                const enemy = players.find(p => p.id !== this.id && !p.isDead);
                if (enemy) {
                    let targetX = enemy.x + (Math.random() * 40 - 20);
                    let targetY = enemy.y + (Math.random() * 40 - 20);
                    targetX = Math.max(40, Math.min(BASE_WIDTH - 40, targetX));
                    targetY = Math.max(40, Math.min(BASE_HEIGHT - 40, targetY));
                    mageMeteors.push({ ownerId: this.id, x: targetX, y: targetY, delay: 21, damage: this.damage * 0.75 });
                    this.mageUltTicks--;
                } else {
                    this.isChannelingMageUlt = false;
                }
            }
            if (this.mageUltTicks <= 0 || this.mageUltTimer <= 0) {
                this.isChannelingMageUlt = false;
            }
        }

        const isRegenActive = (Date.now() - this.lastDamageTime > 4000) && (Date.now() - this.lastShootTime > 4000);
        if (isRegenActive) {
            if (this.hp < this.maxHp) this.hp = Math.min(this.maxHp, this.hp + this.maxHp * 0.15 / 60);
            this.freezeValue = Math.max(0, this.freezeValue - 0.25);
        }

        if (this.ammo < 3 && Date.now() - this.lastReloadTime > this.brawler.reloadSpeed) { this.ammo++; this.lastReloadTime = Date.now(); }

        if (this.freezeValue >= 100) {
            this.freezeValue = 0; this.isStunned = true; this.stunTimer = 60; this.isCharging = false; this.isChannelingMageUlt = false;
            createFloatingText(this.x, this.y - 45, "🥶 凍結 1 秒!", "#38bdf8"); createParticles(this.x, this.y, '#38bdf8', 15); playSound('hit');
        }

        powerCrystals.forEach((crystal, idx) => {
            if (Math.hypot(this.x - crystal.x, this.y - crystal.y) < this.radius + 15) {
                this.crystalsCollected++; this.updateStatsFromCrystals(600); powerCrystals.splice(idx, 1); playSound('crystal');
                createFloatingText(this.x, this.y - 30, `⚡ 戰力 +2% (💎x${this.crystalsCollected})`, "#22c55e");
                if (isSuddenDeath) setTimeout(endGame, 100);
            }
        });

        if (this.isSpraying) {
            this.sprayTimer--;
            let checkFreq = this.brawler.id === 'crafter' ? 6 : 9;
            if (this.sprayTimer % checkFreq === 0) {
                const enemy = players.find(p => p.id !== this.id);
                if (enemy && !enemy.isDead && enemy.invincibilityTimer <= 0) {
                    const sprayRange = this.brawler.id === 'crafter' ? 280 : 320;
                    const sprayWidth = this.brawler.id === 'crafter' ? 25 : 15;
                    const endX = this.x + Math.cos(this.angle) * sprayRange;
                    const endY = this.y + Math.sin(this.angle) * sprayRange;
                    const dist = pointToSegmentDist(enemy.x, enemy.y, this.x, this.y, endX, endY);
                    
                    let blockedByWall = false;
                    walls.forEach(w => { if (lineIntersectsRect(this.x, this.y, enemy.x, enemy.y, w)) blockedByWall = true; });
                    
                    let blockedByCage = false;
                    prisonerCages.forEach(cage => {
                        const distP1ToCage = Math.hypot(this.x - cage.x, this.y - cage.y);
                        const distP2ToCage = Math.hypot(enemy.x - cage.x, enemy.y - cage.y);
                        if ((distP1ToCage < cage.radius) !== (distP2ToCage < cage.radius)) {
                            if (dist < enemy.radius + sprayWidth) {
                                blockedByCage = true;
                                createParticles(cage.x + Math.cos(Math.atan2(enemy.y-cage.y, enemy.x-cage.x))*cage.radius, cage.y + Math.sin(Math.atan2(enemy.y-cage.y, enemy.x-cage.x))*cage.radius, '#a8a29e', 5);
                            }
                        }
                    });
                    
                    if (dist < enemy.radius + sprayWidth && !blockedByWall && !blockedByCage) {
                        if (this.brawler.id === 'crafter') {
                            enemy.takeDamage(this.damage, this.id, true, 1.0);
                            enemy.syrupSlowTimer = 60; 
                            const healAmount = Math.floor(60 * (1 + 0.02 * this.crystalsCollected));
                            this.hp = Math.min(this.maxHp, this.hp + healAmount);
                            createFloatingText(this.x, this.y - 30, `+${healAmount} 🍓`, "#f43f5e");
                            createParticles(enemy.x, enemy.y, "#fb7185", 8);
                        } else if (this.brawler.id === 'frost_witch') {
                            enemy.takeDamage(this.damage, this.id, true, 1.0);
                            if (!enemy.isStunned) enemy.freezeValue = Math.min(100, enemy.freezeValue + 20);
                            createParticles(enemy.x, enemy.y, "#38bdf8", 8);
                        }
                    }
                }
            }
            if (this.sprayTimer <= 0) this.isSpraying = false;
        }

        if (this.isStunned) return;

        let dx = 0, dy = 0, kUp = keys['w'], kDown = keys['s'], kLeft = keys['a'], kRight = keys['d'], jAtk = keys['j'], kUlt = keys['k'];
        if (this.id === 'p2') { kUp = keys['arrowup']; kDown = keys['arrowdown']; kLeft = keys['arrowleft']; kRight = keys['arrowright']; jAtk = keys['1']; kUlt = keys['2']; }
        if (this.isConfused) { let temp = kUp; kUp = kDown; kDown = temp; temp = kLeft; kLeft = kRight; kRight = temp; }

        if (kUp) dy -= 1; if (kDown) dy += 1; if (kLeft) dx -= 1; if (kRight) dx += 1;

        if (dx !== 0 || dy !== 0) {
            if (this.isChannelingMageUlt) {
                this.isChannelingMageUlt = false;
                createFloatingText(this.x, this.y - 45, "❌ 吟唱中斷!", "#ef4444");
            }
            
            let moveSpeed = this.speed; if (this.isRangerUlt) moveSpeed = 5.0; 
            if (this.isCharging) moveSpeed *= 0.6; 
            
            let isInsideBlizzardSlow = false;
            blizzardZones.forEach(z => { if (this.id !== z.ownerId && Math.hypot(this.x - z.x, this.y - z.y) < this.radius + z.radius) isInsideBlizzardSlow = true; });

            let slowMultiplier = 1.0;
            if (this.syrupSlowTimer > 0) { slowMultiplier -= 0.30; this.syrupSlowTimer--; }
            if (this.picnicSlowTimer > 0) { slowMultiplier -= 0.25; this.picnicSlowTimer--; }
            if (isInsideBlizzardSlow) slowMultiplier -= 0.40;
            moveSpeed *= Math.max(0.2, slowMultiplier);
            
            const len = Math.sqrt(dx*dx + dy*dy);
            let moveX = (dx / len) * moveSpeed; let moveY = (dy / len) * moveSpeed;
            let nextX = Math.max(this.radius, Math.min(BASE_WIDTH - this.radius, this.x + moveX)), nextY = Math.max(this.radius, Math.min(BASE_HEIGHT - this.radius, this.y + moveY));
            
            let collideX = false, collideY = false;
            walls.forEach(w => { if (circleRectCollide(nextX, this.y, this.radius, w)) collideX = true; if (circleRectCollide(this.x, nextY, this.radius, w)) collideY = true; });

            if (!collideX) this.x = nextX; if (!collideY) this.y = nextY;
            
            if (this.isCharging || (dx !== 0 || dy !== 0)) {
                this.angle = Math.atan2(dy, dx);
            }
        }

        prisonerCages.forEach(cage => {
            if (this.id !== cage.ownerId) {
                const distToCage = Math.hypot(this.x - cage.x, this.y - cage.y);
                if (distToCage > cage.radius - this.radius && distToCage < cage.radius + 50) {
                    const ang = Math.atan2(this.y - cage.y, this.x - cage.x);
                    this.x = cage.x + Math.cos(ang) * (cage.radius - this.radius);
                    this.y = cage.y + Math.sin(ang) * (cage.radius - this.radius);
                }
            }
        });

        this.isHiding = false; bushes.forEach(bush => { if (pointInRect(this.x, this.y, bush)) this.isHiding = true; });

        if (this.brawler.id === 'neptune') {
            if (jAtk && this.ammo > 0 && !this.isChannelingMageUlt) {
                if (!this.isCharging) {
                    this.isCharging = true;
                    this.chargeStartTime = Date.now();
                } else {
                    let holdTime = (Date.now() - this.chargeStartTime) / 1000;
                    if (holdTime >= 2.0) { 
                        this.executeChargeAttack();
                        this.isCharging = false;
                    }
                }
            } else if (!jAtk && this.isCharging) {
                this.executeChargeAttack();
                this.isCharging = false;
            }
        } else {
            if (jAtk && !this.isChannelingMageUlt) this.shootNormal(); 
        }
        
        if (kUlt && !this.isChannelingMageUlt) this.shootUltimate();
    }
    
    executeChargeAttack() {
        if(this.ammo <= 0) return;
        this.ammo--; this.lastShootTime = Date.now(); this.lastReloadTime = Date.now(); playSound('shoot');
        
        let holdTime = (Date.now() - this.chargeStartTime) / 1000;
        let ratio = 0;
        if (holdTime > 0.5) {
            ratio = Math.min((holdTime - 0.5) / 1.5, 1.0);
        }
        
        let baseDmg = this.damage; 
        let maxDmg = this.damage * 2.0; 
        let finalDmg = baseDmg + (maxDmg - baseDmg) * ratio;
        let finalRange = 150 + 300 * ratio;
        let waveWidth = 20 + 20 * ratio;
        
        bullets.push(new Bullet(this.id, this.x, this.y, this.angle, this.brawler.bulletSpeed, finalDmg, finalRange, this.brawler.bulletColor, waveWidth, false, 'wave'));
    }

    shootNormal() {
        if (this.isSpraying) return;
        const now = Date.now();
        if (this.ammo > 0 && now - this.lastShootTime > this.brawler.attackCd) {
            this.ammo--; this.lastShootTime = now; this.lastReloadTime = now; playSound('shoot');

            if (this.brawler.id === 'titan') {
                for (let i = -2; i <= 2; i++) bullets.push(new Bullet(this.id, this.x, this.y, this.angle + i * 0.15, this.brawler.bulletSpeed, this.damage * 0.2, this.brawler.attackRange, this.brawler.bulletColor, 12, false));
            } else if (this.brawler.id === 'mage') {
                bullets.push(new Bullet(this.id, this.x, this.y, this.angle, this.brawler.bulletSpeed, this.damage, this.brawler.attackRange, this.brawler.bulletColor, 16, false, 'explode'));
            } else if (this.brawler.id === 'assassin') {
                bullets.push(new Bullet(this.id, this.x, this.y, this.angle, this.brawler.bulletSpeed, this.damage, this.brawler.attackRange, this.brawler.bulletColor, 20, true));
                let dashDist = 50; let currentDist = 0; let dashAngle = this.angle; let step = this.brawler.bulletSpeed;
                const dashInterval = setInterval(() => {
                    if (!gameActive || this.isDead) { clearInterval(dashInterval); return; }
                    let moveStep = Math.min(step, dashDist - currentDist);
                    let nextX = this.x + Math.cos(dashAngle) * moveStep; let nextY = this.y + Math.sin(dashAngle) * moveStep;
                    let collide = false; for (let w of walls) { if (circleRectCollide(nextX, nextY, this.radius, w)) { collide = true; break; } }
                    if (!collide) { this.x = Math.max(this.radius, Math.min(BASE_WIDTH - this.radius, nextX)); this.y = Math.max(this.radius, Math.min(BASE_HEIGHT - this.radius, nextY)); } 
                    else { clearInterval(dashInterval); return; }
                    currentDist += moveStep; if (currentDist >= dashDist) clearInterval(dashInterval);
                }, 16);
            } else if (this.brawler.id === 'hypnotist') {
                for (let i = -1; i <= 1; i++) bullets.push(new Bullet(this.id, this.x, this.y, this.angle + i * 0.35, this.brawler.bulletSpeed, this.damage, this.brawler.attackRange, this.brawler.bulletColor, 14, false, 'poison'));
            } else if (this.brawler.id === 'ranger') {
                bullets.push(new Bullet(this.id, this.x, this.y, this.angle, this.brawler.bulletSpeed, this.damage, this.brawler.attackRange, this.brawler.bulletColor, 8, false));
                setTimeout(() => { if (!gameActive || this.isDead) return; bullets.push(new Bullet(this.id, this.x, this.y, this.angle, this.brawler.bulletSpeed, this.damage, this.brawler.attackRange, this.brawler.bulletColor, 8, false)); playSound('shoot'); }, 100);
            } else if (this.brawler.id === 'hunter') {
                let inBush = this.isHiding, bDmg = this.damage, bSpd = this.brawler.bulletSpeed, bClr = this.brawler.bulletColor, bRad = 6, bEff = inBush ? 'hunter_buffed' : 'hunter_normal';
                if (inBush) { bDmg *= 1.20; bSpd *= 1.45; bClr = '#38bdf8'; bRad = 5; createParticles(this.x, this.y, '#22c55e', 8); }
                bullets.push(new Bullet(this.id, this.x, this.y, this.angle, bSpd, bDmg, this.brawler.attackRange, bClr, bRad, false, bEff));
            } else if (this.brawler.id === 'crafter' || this.brawler.id === 'frost_witch') {
                this.isSpraying = true; this.sprayTimer = 36;
            } else if (this.brawler.id === 'prisoner') {
                this.damageReductionTimer = 18; 
                const checkAndDamage = (entity) => {
                    const dist = Math.hypot(this.x - entity.x, this.y - entity.y);
                    if (dist < 120 + entity.radius) {
                        let angleToEnemy = Math.atan2(entity.y - this.y, entity.x - this.x);
                        let diff = Math.abs(this.angle - angleToEnemy);
                        if (diff > Math.PI) diff = 2 * Math.PI - diff;
                        if (diff < Math.PI / 2) { 
                            let blockedByWall = false;
                            walls.forEach(w => { if (lineIntersectsRect(this.x, this.y, entity.x, entity.y, w)) blockedByWall = true; });
                            if (!blockedByWall) {
                                if (entity.hp !== undefined && entity.id) { 
                                    entity.takeDamage(this.damage, this.id, true, 1.0); createParticles(entity.x, entity.y, '#a8a29e', 15);
                                } else if (entity.hp !== undefined && !entity.id) { 
                                    entity.hp -= this.damage; createParticles(entity.x, entity.y, '#a8a29e', 15); playSound('hit');
                                }
                            }
                        }
                    }
                };
                const enemy = players.find(p => p.id !== this.id && !p.isDead && p.invincibilityTimer <= 0);
                if (enemy) checkAndDamage(enemy);
                sharks.forEach(s => { if (s.ownerId !== this.id) checkAndDamage(s); });
                particles.push({ type: 'swipe', x: this.x, y: this.y, angle: this.angle, radius: 120, life: 12, maxLife: 12, color: 'rgba(168, 162, 158, 1)' });
                createParticles(this.x + Math.cos(this.angle) * 40, this.y + Math.sin(this.angle) * 40, '#a8a29e', 20);
                createParticles(this.x + Math.cos(this.angle) * 60, this.y + Math.sin(this.angle) * 60, '#71717a', 15);
            }
        }
    }

    shootUltimate() {
        if (this.ultCharge >= 100) {
            this.ultCharge = 0; playSound('ult'); createFloatingText(this.x, this.y - 40, "🔥 SUPER! 🔥", "#f59e0b"); this.lastShootTime = Date.now();
            const enemy = players.find(p => p.id !== this.id);

            if (this.brawler.id === 'mage') {
                this.isChannelingMageUlt = true;
                this.mageUltTimer = 180; 
                this.mageUltTicks = 6;   
                createFloatingText(this.x, this.y - 65, "🔴 吟唱中...", "#ef4444");
            } else if (this.brawler.id === 'ranger') {
                this.isRangerUlt = true; this.rangerUltTimer = 300; triggerRangerUltimateField(this.x, this.y, 200, this.damage * 2.5, this.id);
            } else if (this.brawler.id === 'titan') {
                triggerTitanRectFissure(this, 360, 120);
            } else if (this.brawler.id === 'assassin') {
                const dashDist = 380; const angle = this.angle; const step = 22; let currentDist = 0;
                const interval = setInterval(() => {
                    if (!gameActive || this.isDead) { clearInterval(interval); return; }
                    this.x += Math.cos(angle) * step; this.y += Math.sin(angle) * step;
                    this.x = Math.max(this.radius, Math.min(BASE_WIDTH - this.radius, this.x)); this.y = Math.max(this.radius, Math.min(BASE_HEIGHT - this.radius, this.y));
                    walls = walls.filter(w => { if (circleRectCollide(this.x, this.y, this.radius + 15, w) && w.isDestructible) { createParticles(w.x + w.w/2, w.y + w.h/2, '#78350f', 12); return false; } return true; });
                    const enemy = players.find(p => p.id !== this.id);
                    if (enemy && !enemy.isDead && enemy.invincibilityTimer <= 0 && Math.hypot(this.x - enemy.x, this.y - enemy.y) < enemy.radius + this.radius + 15) {
                        enemy.takeDamage(this.damage * 0.25, this.id, true, 0.15); createParticles(enemy.x, enemy.y, '#c084fc', 20); enemy.x += Math.cos(angle) * 40; enemy.y += Math.sin(angle) * 40;
                    }
                    createParticles(this.x, this.y, '#c084fc', 3); currentDist += step; if (currentDist >= dashDist) clearInterval(interval);
                }, 16);
            } else if (this.brawler.id === 'hypnotist') {
                bullets.push(new Bullet(this.id, this.x, this.y, this.angle, 10, this.damage * 2.5, 550, '#db2777', 22, true, 'confuse', true));
            } else if (this.brawler.id === 'hunter') {
                bullets.push(new Bullet(this.id, this.x, this.y, this.angle, 18, this.damage * 2.0, 600, '#eab308', 36, false, 'hunter_ult', true));
            } else if (this.brawler.id === 'crafter') {
                const instantHeal = Math.floor(this.maxHp * 0.20); this.hp = Math.min(this.maxHp, this.hp + instantHeal); createFloatingText(this.x, this.y - 30, `+${instantHeal} 🍓`, "#f43f5e");
                picnicZones.push({ ownerId: this.id, x: this.x, y: this.y, radius: 180, life: 240 }); createParticles(this.x, this.y, '#f43f5e', 30);
            } else if (this.brawler.id === 'frost_witch') {
                bullets.push(new Bullet(this.id, this.x, this.y, this.angle, 11, this.damage, 220, '#0ea5e9', 14, false, 'blizzard_proj', true));
            } else if (this.brawler.id === 'prisoner') {
                const dashDist = 200; const angle = this.angle; const step = 10; let currentDist = 0;
                const interval = setInterval(() => {
                    if (!gameActive || this.isDead) { clearInterval(interval); return; }
                    let nextX = this.x + Math.cos(angle) * step, nextY = this.y + Math.sin(angle) * step;
                    let hitWall = false;
                    walls.forEach(w => { if (circleRectCollide(nextX, nextY, this.radius, w)) { hitWall = true; if (w.isDestructible) { w.hp -= 500; if(w.hp <= 0) createParticles(w.x+w.w/2, w.y+w.h/2, '#78350f', 15); } } });
                    if (hitWall) { clearInterval(interval); triggerPrisonerCage(this.x, this.y, this.id); return; }
                    this.x = Math.max(this.radius, Math.min(BASE_WIDTH - this.radius, nextX)); this.y = Math.max(this.radius, Math.min(BASE_HEIGHT - this.radius, nextY));
                    const enemy = players.find(p => p.id !== this.id);
                    if (enemy && !enemy.isDead && enemy.invincibilityTimer <= 0 && Math.hypot(this.x - enemy.x, this.y - enemy.y) < enemy.radius + this.radius) {
                        enemy.takeDamage(this.damage * 0.75, this.id, true, 0.15); clearInterval(interval); triggerPrisonerCage(this.x, this.y, this.id); return;
                    }
                    createParticles(this.x, this.y, '#57534e', 3); currentDist += step;
                    if (currentDist >= dashDist) { clearInterval(interval); triggerPrisonerCage(this.x, this.y, this.id); }
                }, 16);
            } else if (this.brawler.id === 'neptune') {
                createParticles(this.x, this.y, '#0ea5e9', 30);
                let sharkHp = 2000 * (1 + 0.02 * this.crystalsCollected); 
                sharks.push(new Shark(this.id, this.x, this.y, this.angle, sharkHp));
            }
        }
    }

    draw() {
        if (this.isDead) {
            ctx.save(); ctx.font = '30px Arial'; ctx.textAlign = 'center'; ctx.fillText('🪦', this.x, this.y); ctx.fillStyle = '#ef4444'; ctx.font = '16px Arial'; ctx.fillText(Math.ceil(this.respawnTimer / 60), this.x, this.y - 20); ctx.restore();
            return;
        }
        const otherPlayer = players.find(p => p.id !== this.id);
        let opacity = this.isHiding ? (otherPlayer && otherPlayer.isHiding ? 0.8 : 0.35) : 1.0;

        ctx.save(); ctx.globalAlpha = opacity; ctx.translate(this.x, this.y);
        
        if (this.isChannelingMageUlt) {
            const ratio = this.mageUltTimer / 180;
            const chargeBarW = 40, chargeBarH = 6;
            ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-chargeBarW/2, -this.radius - 20, chargeBarW, chargeBarH);
            ctx.fillStyle = '#ef4444'; ctx.fillRect(-chargeBarW/2, -this.radius - 20, chargeBarW * ratio, chargeBarH);
            ctx.strokeStyle = '#fff'; ctx.strokeRect(-chargeBarW/2, -this.radius - 20, chargeBarW, chargeBarH);
        }
        
        if (this.damageReductionTimer > 0) {
            ctx.beginPath(); ctx.arc(0, 0, this.radius + 12, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(168, 162, 158, 0.9)"; ctx.lineWidth = 4; ctx.setLineDash([8, 5]); ctx.stroke(); ctx.setLineDash([]);
        }
        
        if (this.invincibilityTimer > 0) { 
            ctx.beginPath(); ctx.arc(0, 0, this.radius + 10, 0, Math.PI * 2); ctx.fillStyle = "rgba(250, 204, 21, 0.3)"; ctx.fill(); ctx.strokeStyle = "#facc15"; ctx.lineWidth = 3; ctx.stroke(); 
        }

        ctx.save();
        ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.clip();

        if (this.img && this.img.complete && this.img.naturalWidth > 0) {
            const aspect = this.img.naturalWidth / this.img.naturalHeight;
            let drawW = this.radius * 2, drawH = this.radius * 2;
            let offsetX = -this.radius, offsetY = -this.radius;
            if (aspect > 1) { drawW = drawH * aspect; offsetX = -drawW / 2; } 
            else { drawH = drawW / aspect; offsetY = -drawH / 2; }
            ctx.drawImage(this.img, offsetX, offsetY, drawW, drawH);
        } else {
            ctx.fillStyle = this.color + "22"; ctx.fill();
            ctx.font = `${this.radius * 1.5}px Arial`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(this.brawler.emoji, 0, 0);
        }
        ctx.restore(); 

        ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.strokeStyle = this.color; ctx.lineWidth = 3; ctx.stroke();
        ctx.rotate(this.angle); ctx.beginPath(); ctx.moveTo(this.radius - 2, -6); ctx.lineTo(this.radius + 8, 0); ctx.lineTo(this.radius - 2, 6); ctx.fillStyle = this.color; ctx.fill(); ctx.rotate(-this.angle);
        
        if (this.isConfused) { ctx.font = '20px Arial'; ctx.fillText('🌀', 0, -this.radius - 12); }
        if (this.isStunned) { ctx.font = '20px Arial'; ctx.fillText('💫', 0, -this.radius - 12); }
        if (this.dotTicks > 0) { ctx.font = '16px Arial'; ctx.fillText('☠️', 15, -this.radius - 5); }
        ctx.restore();

        if (this.isCharging) {
            ctx.save(); ctx.globalAlpha = opacity; ctx.translate(this.x, this.y);
            let holdTime = (Date.now() - this.chargeStartTime) / 1000;
            let ratio = 0; if (holdTime > 0.5) ratio = Math.min((holdTime - 0.5) / 1.5, 1.0);
            
            const chargeBarW = 40, chargeBarH = 6;
            ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-chargeBarW/2, -this.radius - 40, chargeBarW, chargeBarH);
            ctx.fillStyle = '#06b6d4'; ctx.fillRect(-chargeBarW/2, -this.radius - 40, chargeBarW * ratio, chargeBarH);
            ctx.strokeStyle = '#fff'; ctx.strokeRect(-chargeBarW/2, -this.radius - 40, chargeBarW, chargeBarH);
            ctx.restore();
        }

        if (this.isSpraying) {
            ctx.save(); ctx.globalAlpha = opacity; ctx.translate(this.x, this.y); ctx.rotate(this.angle);
            const isCrafter = this.brawler.id === 'crafter';
            const sprayRange = isCrafter ? 280 : 320;
            const sprayWidth = isCrafter ? 25 : 15;
            const grad = ctx.createLinearGradient(0, 0, sprayRange, 0);
            if (isCrafter) { grad.addColorStop(0, "rgba(244, 63, 94, 0.8)"); grad.addColorStop(0.5, "rgba(251, 113, 133, 0.5)"); grad.addColorStop(1, "rgba(251, 113, 133, 0.0)"); }
            else { grad.addColorStop(0, "rgba(14, 165, 233, 0.8)"); grad.addColorStop(0.5, "rgba(56, 189, 248, 0.5)"); grad.addColorStop(1, "rgba(56, 189, 248, 0.0)"); }
            
            ctx.fillStyle = grad; ctx.beginPath();
            ctx.moveTo(10, -5); ctx.lineTo(sprayRange, -sprayWidth); ctx.lineTo(sprayRange, sprayWidth); ctx.lineTo(10, 5);
            ctx.closePath(); ctx.fill(); ctx.restore();

            if (Math.random() < 0.6) {
                const pAngle = this.angle + (Math.random() * (isCrafter ? 0.3 : 0.15) - (isCrafter ? 0.15 : 0.075)); 
                const pDist = Math.random() * (sprayRange - 20) + 20;
                createParticles(this.x + Math.cos(pAngle) * pDist, this.y + Math.sin(pAngle) * pDist, isCrafter ? '#fb7185' : '#38bdf8', 1);
            }
        }

        const barYOffset = this.isChannelingMageUlt ? -this.radius - 32 : -this.radius - 20;
        ctx.save(); ctx.globalAlpha = opacity; ctx.translate(this.x, this.y);
        const barW = 50, barH = 6; ctx.fillStyle = '#1e293b'; ctx.fillRect(-barW/2, barYOffset, barW, barH); ctx.fillStyle = (this.hp/this.maxHp) > 0.4 ? '#22c55e' : '#ef4444'; ctx.fillRect(-barW/2, barYOffset, barW * (this.hp/this.maxHp), barH); ctx.strokeStyle = '#020617'; ctx.lineWidth = 1; ctx.strokeRect(-barW/2, barYOffset, barW, barH);
        for (let i = 0; i < 3; i++) { ctx.fillStyle = i < this.ammo ? '#f59e0b' : '#475569'; ctx.fillRect(-barW/2 + i * 18, barYOffset - 8, 14, 4); }
        if (this.freezeValue > 0) { ctx.fillStyle = "rgba(56, 189, 248, 0.9)"; ctx.font = "bold 10px Arial"; ctx.textAlign = "center"; ctx.fillText(`❄️ ${Math.floor(this.freezeValue)}%`, 0, barYOffset - 14); }
        ctx.restore();
    }
}

// ==========================================
// 子彈與投射物 (Bullet)
// ==========================================
class Bullet {
    constructor(ownerId, x, y, angle, speed, damage, maxRange, color, radius=8, isPiercing=false, effect=null, isUltimate=false) {
        this.ownerId = ownerId; this.x = x; this.y = y; this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed; this.damage = damage; this.maxRange = maxRange; this.color = color; this.radius = radius; this.isPiercing = isPiercing; this.effect = effect; this.isUltimate = isUltimate; this.distanceTraveled = 0; this.hitPlayers = []; 
    }
    update() {
        this.x += this.vx; this.y += this.vy; this.distanceTraveled += Math.hypot(this.vx, this.vy);
        if (this.effect === 'hunter_buffed' && Math.random() < 0.4) { particles.push({ type: 'spark', x: this.x, y: this.y, vx: -this.vx * 0.1 + (Math.random() * 1 - 0.5), vy: -this.vy * 0.1 + (Math.random() * 1 - 0.5), radius: Math.random() * 2 + 0.5, color: '#38bdf8', alpha: 0.8, decay: 0.05 }); }
        if (this.effect === 'confuse' && this.isUltimate && Math.random() < 0.4) { particles.push({ type: 'spark', x: this.x, y: this.y, vx: (Math.random() * 2 - 1), vy: (Math.random() * 2 - 1), radius: Math.random() * 3 + 1, color: '#ec4899', alpha: 0.8, decay: 0.05 }); }

        let hitCageBoundary = false;
        prisonerCages.forEach(cage => {
            if (this.ownerId !== cage.ownerId) {
                const distToCage = Math.hypot(this.x - cage.x, this.y - cage.y);
                if (distToCage >= cage.radius - this.radius && distToCage <= cage.radius + this.radius) {
                    hitCageBoundary = true;
                    createParticles(this.x, this.y, '#a8a29e', 8);
                }
            }
        });
        if (hitCageBoundary) return false;

        let hitShark = false;
        sharks.forEach(s => {
            if (s.ownerId !== this.ownerId && Math.hypot(this.x - s.x, this.y - s.y) < s.radius + this.radius) {
                hitShark = true; s.hp -= this.damage; createParticles(s.x, s.y, '#0ea5e9', 5); playSound('hit');
            }
        });
        if (hitShark && !this.isPiercing) return false;

        if (this.distanceTraveled >= this.maxRange) {
            if (this.effect === 'explode') triggerExplosion(this.x, this.y, 80, this.damage, this.ownerId, false, this.isUltimate ? 0.15 : 1.0);
            else if (this.effect === 'hunter_ult') triggerHunterUltExplosion(this.x, this.y, 160, this.damage, this.ownerId); 
            else if (this.effect === 'blizzard_proj') triggerBlizzardField(this.x, this.y, this.ownerId);
            return false;
        }

        if (this.x < 0 || this.x > BASE_WIDTH || this.y < 0 || this.y > BASE_HEIGHT) return false;

        let hitWall = false;
        walls.forEach(w => {
            if (pointInRect(this.x, this.y, w)) { hitWall = true; if (!this.isPiercing) { w.hp -= this.damage * 0.5; if (w.hp <= 0) createParticles(w.x + w.w/2, w.y + w.h/2, '#78350f', 15); } }
        });
        
        if (hitWall && !this.isPiercing) {
            if (this.effect === 'explode') triggerExplosion(this.x, this.y, 80, this.damage, this.ownerId, false, this.isUltimate ? 0.15 : 1.0);
            else if (this.effect === 'hunter_ult') triggerHunterUltExplosion(this.x, this.y, 160, this.damage, this.ownerId); 
            else if (this.effect === 'blizzard_proj') triggerBlizzardField(this.x, this.y, this.ownerId);
            return false; 
        }

        let hitPlayer = false;
        players.forEach(p => {
            if (p.id !== this.ownerId && !p.isDead && p.invincibilityTimer <= 0) {
                if (Math.hypot(this.x - p.x, this.y - p.y) < p.radius + this.radius) {
                    if (this.hitPlayers.includes(p.id)) return;
                    this.hitPlayers.push(p.id); hitPlayer = true;
                    if (this.effect !== 'explode' && this.effect !== 'hunter_ult' && this.effect !== 'blizzard_proj') {
                        let multiplier = 1.0;
                        if (this.isUltimate) { const shooter = players.find(pl => pl.id === this.ownerId); if (shooter) { if (shooter.brawler.id === 'ranger') multiplier = 0.10; else if (shooter.brawler.id === 'hypnotist') multiplier = 0.20; } }
                        p.takeDamage(this.damage, this.ownerId, true, multiplier);
                        if (this.effect === 'poison') { p.dotTicks = 3; p.dotTimer = 60; p.dotAttackerId = this.ownerId; createFloatingText(p.x, p.y - 45, "🤢 劇毒中斷自動回血!", "#ec4899"); }
                        if (this.effect === 'confuse') { p.confusionTimer = 180; p.isConfused = true; createFloatingText(p.x, p.y - 45, "🌀 控制混亂 3 秒!", "#db2777"); }
                    }
                }
            }
        });

        if (hitPlayer && !this.isPiercing) {
            if (this.effect === 'explode') triggerExplosion(this.x, this.y, 80, this.damage, this.ownerId, false, this.isUltimate ? 0.15 : 1.0);
            else if (this.effect === 'hunter_ult') triggerHunterUltExplosion(this.x, this.y, 160, this.damage, this.ownerId); 
            else if (this.effect === 'blizzard_proj') triggerBlizzardField(this.x, this.y, this.ownerId);
            return false;
        }
        return true;
    }
    draw() {
        if (this.effect === 'wave') {
            ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(Math.atan2(this.vy, this.vx));
            ctx.beginPath(); ctx.arc(0, 0, this.radius, -Math.PI/2, Math.PI/2);
            ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.stroke();
            ctx.fillStyle = 'rgba(6, 182, 212, 0.4)'; ctx.fill();
            ctx.restore(); return;
        }
        if (this.effect === 'hunter_ult' || this.effect === 'hunter_buffed' || this.effect === 'hunter_normal') {
            ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(Math.atan2(this.vy, this.vx));
            let shadowColor = '#fbbf24', strokeColor = '#f59e0b', fillColor = '#fbbf24', arrowLength = this.radius * 1.5; 
            if (this.effect === 'hunter_buffed') { shadowColor = '#38bdf8'; strokeColor = '#0284c7'; fillColor = '#38bdf8'; }
            else if (this.effect === 'hunter_normal') { shadowColor = '#a3e635'; strokeColor = '#65a30d'; fillColor = '#a3e635'; }
            ctx.shadowColor = shadowColor; ctx.shadowBlur = 15; ctx.fillStyle = fillColor; ctx.strokeStyle = strokeColor; ctx.lineWidth = Math.max(2, this.radius / 6);
            ctx.beginPath(); ctx.moveTo(-arrowLength, 0); ctx.lineTo(arrowLength * 0.4, 0); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(arrowLength * 0.4, -this.radius * 0.5); ctx.lineTo(arrowLength, 0); ctx.lineTo(arrowLength * 0.4, this.radius * 0.5); ctx.closePath(); ctx.fill();
            ctx.beginPath(); ctx.moveTo(-arrowLength, 0); ctx.lineTo(-arrowLength - 6, -this.radius * 0.4); ctx.moveTo(-arrowLength + 5, 0); ctx.lineTo(-arrowLength - 1, -this.radius * 0.4); ctx.moveTo(-arrowLength, 0); ctx.lineTo(-arrowLength - 6, this.radius * 0.4); ctx.moveTo(-arrowLength + 5, 0); ctx.lineTo(-arrowLength - 1, this.radius * 0.4); ctx.stroke();
            ctx.restore(); return;
        }
        if (this.effect === 'confuse' && this.isUltimate) {
            ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(Date.now() / 150); ctx.strokeStyle = '#db2777'; ctx.lineWidth = 4; ctx.beginPath();
            for (let i = 0; i < 30; i++) { let angle = i * 0.3, r = (i / 30) * this.radius, x = Math.cos(angle) * r, y = Math.sin(angle) * r; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); } ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.strokeStyle = '#f472b6'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); return;
        }
        if (this.effect === 'poison') {
            ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(Date.now() / 250); ctx.shadowColor = '#f472b6'; ctx.shadowBlur = 8; ctx.strokeStyle = '#f472b6'; ctx.lineWidth = 2.5; ctx.beginPath();
            for (let i = 0; i < 360; i += 10) { let rad = i * Math.PI / 180, r = this.radius * (0.5 + 0.5 * Math.sin(rad * 3)), px = Math.cos(rad) * r, py = Math.sin(rad) * r; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); } ctx.closePath(); ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 0, this.radius * 0.3, 0, Math.PI * 2); ctx.fillStyle = '#ec4899'; ctx.fill(); ctx.restore(); return;
        }
        if (this.effect === 'blizzard_proj') {
            ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(Date.now() / 120); ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 12; ctx.fillStyle = '#0ea5e9'; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(0, 0, this.radius, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5;
            for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 4); ctx.beginPath(); ctx.moveTo(-this.radius, 0); ctx.lineTo(this.radius, 0); ctx.stroke(); } ctx.restore(); return;
        }
        ctx.save(); ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fillStyle = this.color; ctx.shadowColor = this.color; ctx.shadowBlur = 10; ctx.fill(); ctx.restore();
    }
}
