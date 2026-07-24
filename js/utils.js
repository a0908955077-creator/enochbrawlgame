// ==========================================
// 幾何碰撞、粒子與大招觸發函式
// ==========================================
function circleRectCollide(cx, cy, radius, rect) { const cX = Math.max(rect.x, Math.min(cx, rect.x + rect.w)), cY = Math.max(rect.y, Math.min(cy, rect.y + rect.h)); return Math.sqrt((cx - cX)**2 + (cy - cY)**2) < radius; }
function pointInRect(px, py, rect) { return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h; }
function pointToSegmentDist(px, py, x1, y1, x2, y2) { let dx = x2 - x1, dy = y2 - y1; if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1); let t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy); t = Math.max(0, Math.min(1, t)); return Math.hypot(px - (x1 + t * dx), py - (y1 + t * dy)); }
function lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
    let uA = ((x4-x3)*(y1-y3) - (y4-y3)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
    let uB = ((x2-x1)*(y1-y3) - (y2-y1)*(x1-x3)) / ((y4-y3)*(x2-x1) - (x4-x3)*(y2-y1));
    return (uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1);
}
function lineIntersectsRect(x1, y1, x2, y2, rect) {
    if (pointInRect(x1, y1, rect) || pointInRect(x2, y2, rect)) return true;
    let left = lineIntersectsLine(x1, y1, x2, y2, rect.x, rect.y, rect.x, rect.y + rect.h);
    let right = lineIntersectsLine(x1, y1, x2, y2, rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + rect.h);
    let top = lineIntersectsLine(x1, y1, x2, y2, rect.x, rect.y, rect.x + rect.w, rect.y);
    let bottom = lineIntersectsLine(x1, y1, x2, y2, rect.x, rect.y + rect.h, rect.x + rect.w, rect.y + rect.h);
    return left || right || top || bottom;
}

function createParticles(x, y, color, count=10) { for(let i=0;i<count;i++){ const a=Math.random()*Math.PI*2, s=Math.random()*4+1; particles.push({type:'spark', x:x, y:y, vx:Math.cos(a)*s, vy:Math.sin(a)*s, radius:Math.random()*3+1, color:color, alpha:1, decay:Math.random()*0.03+0.01}); } }
function createFloatingText(x, y, text, color) { particles.push({type:'text', x:x, y:y, text:text, color:color, alpha:1, vy:-1.5, life:40}); }

function updateAndDrawParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        if (p.type === 'spark') { p.x += p.vx; p.y += p.vy; p.alpha -= p.decay; if (p.alpha <= 0) { particles.splice(i, 1); continue; } ctx.save(); ctx.globalAlpha = p.alpha; ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI*2); ctx.fillStyle = p.color; ctx.fill(); ctx.restore(); }
        else if (p.type === 'ring') { p.currentRadius += p.speed; if (p.currentRadius >= p.maxRadius) { particles.splice(i, 1); continue; } ctx.save(); ctx.beginPath(); ctx.arc(p.x, p.y, p.currentRadius, 0, Math.PI*2); ctx.strokeStyle = p.color; ctx.lineWidth = 4; ctx.stroke(); ctx.restore(); }
        else if (p.type === 'text') { p.y += p.vy; p.life--; if (p.life <= 0) { particles.splice(i, 1); continue; } ctx.save(); ctx.fillStyle = p.color; ctx.font = 'bold 16px Arial'; ctx.textAlign = 'center'; ctx.shadowColor = 'black'; ctx.shadowBlur = 4; ctx.fillText(p.text, p.x, p.y); ctx.restore(); }
        else if (p.type === 'cracks') { p.life--; if (p.life <= 0) { particles.splice(i, 1); continue; } ctx.save(); ctx.strokeStyle = `rgba(16, 185, 129, ${p.life / 55})`; ctx.lineWidth = 6; p.cracks.forEach(b => b.forEach(s => { ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.stroke(); })); ctx.restore(); }
        else if (p.type === 'lightning_cracks') { p.life--; if (p.life <= 0) { particles.splice(i, 1); continue; } ctx.save(); ctx.strokeStyle = `rgba(96, 165, 250, ${p.life / 20})`; ctx.lineWidth = 4; p.cracks.forEach(b => { ctx.beginPath(); b.forEach((s, idx) => { if (idx===0) ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); }); ctx.stroke(); }); ctx.restore(); }
        else if (p.type === 'swipe') {
            p.life--;
            if (p.life <= 0) { particles.splice(i, 1); continue; }
            const progress = 1 - (p.life / p.maxLife);
            ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
            ctx.beginPath(); ctx.arc(0, 0, p.radius * (0.5 + 0.5 * progress), -Math.PI/2.2, Math.PI/2.2);
            ctx.strokeStyle = `rgba(120, 113, 108, ${p.life / p.maxLife})`; ctx.lineWidth = 20 * (p.life / p.maxLife); ctx.lineCap = 'round'; ctx.stroke();
            ctx.beginPath(); ctx.arc(0, 0, p.radius * 0.8 * progress, -Math.PI/3, Math.PI/3);
            ctx.strokeStyle = `rgba(214, 211, 209, ${p.life / p.maxLife})`; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.stroke();
            ctx.restore();
        }
    }
}

function triggerTitanRectFissure(attacker, length, width) {
    playSound('hit'); createParticles(attacker.x, attacker.y, '#10b981', 15);
    const cos = Math.cos(attacker.angle), sin = Math.sin(attacker.angle);
    const segmentCount = 6, step = length / segmentCount, stepDelay = 60;
    let cx = attacker.x, cy = attacker.y, hasHitEnemy = false;
    const allSegments = [];
    for (let i = 0; i < segmentCount; i++) {
        const nextDist = (i + 1) * step, perpNoise = (Math.random() * 24 - 12);
        const nextX = attacker.x + cos * nextDist - sin * perpNoise, nextY = attacker.y + sin * nextDist + cos * perpNoise;
        const segmentCracks = [[{ x1: cx, y1: cy, x2: nextX, y2: nextY }]];
        if (Math.random() < 0.65) { const branchAngle = attacker.angle + (Math.random() > 0.5 ? 0.75 : -0.75), branchLen = Math.random() * (width / 2) + 15; segmentCracks.push([{ x1: nextX, y1: nextY, x2: nextX + Math.cos(branchAngle) * branchLen, y2: nextY + Math.sin(branchAngle) * branchLen }]); }
        allSegments.push({ cracks: segmentCracks, startX: cx, startY: cy, endX: nextX, endY: nextY, minDist: i * step, maxDist: (i + 1) * step }); cx = nextX; cy = nextY;
    }
    allSegments.forEach((seg, i) => {
        setTimeout(() => {
            if (!gameActive || attacker.isDead) return;
            if (i > 0) playSound('hit'); createParticles(seg.endX, seg.endY, '#10b981', 8); particles.push({ type: 'cracks', cracks: seg.cracks, life: 55 });
            const enemy = players.find(p => p.id !== attacker.id);
            if (enemy && !enemy.isDead && enemy.invincibilityTimer <= 0 && !hasHitEnemy) {
                const localX = (enemy.x - attacker.x) * cos + (enemy.y - attacker.y) * sin, localY = -(enemy.x - attacker.x) * sin + (enemy.y - attacker.y) * cos, R = enemy.radius;
                if (localX >= seg.minDist - R && localX <= seg.maxDist + R && Math.abs(localY) <= (width / 2) + R) {
                    hasHitEnemy = true; enemy.takeDamage(attacker.damage * 1.5, attacker.id, true, 0.20); enemy.isStunned = true; enemy.stunTimer = 60; createFloatingText(enemy.x, enemy.y - 45, "🌀 擊暈 1 秒 + 引力拉近!", "#10b981");
                    const eDist = Math.hypot(attacker.x - enemy.x, attacker.y - enemy.y); if (eDist > 55) { const pD = 50; enemy.x += ((attacker.x - enemy.x) / eDist) * pD; enemy.y += ((attacker.y - enemy.y) / eDist) * pD; }
                }
            }
            walls = walls.filter(w => {
                const localX = (w.x + w.w/2 - attacker.x) * cos + (w.y + w.h/2 - attacker.y) * sin, localY = -(w.x + w.w/2 - attacker.x) * sin + (w.y + w.h/2 - attacker.y) * cos;
                if (localX >= seg.minDist && localX <= seg.maxDist && Math.abs(localY) <= (width / 2) && w.isDestructible) { createParticles(w.x + w.w/2, w.y + w.h/2, '#78350f', 12); return false; } return true;
            });
        }, i * stepDelay);
    });
}
function triggerRangerUltimateField(rx, ry, range, damage, ownerId) {
    playSound('hit'); createParticles(rx, ry, '#60a5fa', 22);
    for (let i = 0; i < 2; i++) particles.push({ type: 'ring', x: rx, y: ry, currentRadius: 10, maxRadius: range - i * 35, color: `rgba(96, 165, 250, ${0.8 - i * 0.25})`, speed: 7 + i * 2 });
    const lightningLines = [];
    for (let i = 0; i < 10; i++) {
        const baseAngle = (i / 10) * Math.PI * 2, segments = []; let cx = rx, cy = ry;
        for (let j = 0; j < 3; j++) { const nx = cx + Math.cos(baseAngle + (Math.random() * 0.6 - 0.3)) * (range / 3), ny = cy + Math.sin(baseAngle + (Math.random() * 0.6 - 0.3)) * (range / 3); segments.push({ x1: cx, y1: cy, x2: nx, y2: ny }); cx = nx; cy = ny; }
        lightningLines.push(segments);
    }
    particles.push({ type: 'lightning_cracks', cracks: lightningLines, life: 20 });
    players.forEach(p => { if (p.id !== ownerId && !p.isDead && p.invincibilityTimer <= 0 && Math.hypot(p.x - rx, p.y - ry) < p.radius + range) p.takeDamage(damage, ownerId, true, 0.10); });
}
function triggerExplosion(ex, ey, radius, damage, ownerId, canDestroyWalls = false, isUltimate = false) {
    playSound('hit'); createParticles(ex, ey, '#f97316', 20); particles.push({ type: 'ring', x: ex, y: ey, currentRadius: 10, maxRadius: radius, color: 'rgba(249, 115, 22, 0.4)', speed: 4 });
    players.forEach(p => { if (p.id !== ownerId && !p.isDead && p.invincibilityTimer <= 0 && Math.hypot(p.x - ex, p.y - ey) < p.radius + radius) p.takeDamage(damage, ownerId, true, typeof isUltimate === 'number' ? isUltimate : (isUltimate ? 0.15 : 1.0)); });
    if (canDestroyWalls) walls = walls.filter(w => { if (Math.hypot(ex - (w.x + w.w/2), ey - (w.y + w.h/2)) < radius && w.isDestructible) { createParticles(w.x + w.w/2, w.y + w.h/2, '#78350f', 10); return false; } return true; });
}
function triggerHunterUltExplosion(ex, ey, radius, damage, ownerId) {
    playSound('hit'); createParticles(ex, ey, '#84cc16', 30); particles.push({ type: 'ring', x: ex, y: ey, currentRadius: 10, maxRadius: radius, color: 'rgba(132, 204, 22, 0.4)', speed: 5 });
    players.forEach(p => { if (p.id !== ownerId && !p.isDead && p.invincibilityTimer <= 0 && Math.hypot(p.x - ex, p.y - ey) < p.radius + radius) { p.takeDamage(damage, ownerId, true, 0.15); p.isStunned = true; p.stunTimer = 120; createFloatingText(p.x, p.y - 45, "💫 擊暈 2 秒!", "#84cc16"); } });
    walls = walls.filter(w => { if (Math.hypot(ex - (w.x + w.w/2), ey - (w.y + w.h/2)) < radius && w.isDestructible) { createParticles(w.x + w.w/2, w.y + w.h/2, '#78350f', 12); return false; } return true; });
}
function triggerBlizzardField(bx, by, ownerId) {
    playSound('hit'); createParticles(bx, by, '#38bdf8', 25); blizzardZones.push({ ownerId: ownerId, x: bx, y: by, radius: 200, life: 270 });
}
function triggerPrisonerCage(cx, cy, ownerId) {
    playSound('ult'); createParticles(cx, cy, '#a8a29e', 30); prisonerCages.push({ x: cx, y: cy, radius: 160, life: 300, ownerId: ownerId });
}
