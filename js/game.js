// ==========================================
// 遊戲主循環 (gameLoop) 與 控制邏輯
// ==========================================
function gameLoop() {
    if (!gameActive) return;
    ctx.fillStyle = '#1e293b'; ctx.fillRect(0, 0, BASE_WIDTH, BASE_HEIGHT);
    ctx.strokeStyle = '#334155'; ctx.lineWidth = 1;
    for (let i = 0; i < BASE_WIDTH; i += 60) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, BASE_HEIGHT); ctx.stroke(); }
    for (let j = 0; j < BASE_HEIGHT; j += 60) { ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(BASE_WIDTH, j); ctx.stroke(); }

    ctx.save(); ctx.translate(BASE_WIDTH/2, BASE_HEIGHT/2); ctx.rotate(Date.now() / 1000); ctx.beginPath(); ctx.setLineDash([10, 15]); ctx.arc(0, 0, 80, 0, Math.PI*2); ctx.strokeStyle = isSuddenDeath ? 'rgba(239, 68, 68, 0.8)' : 'rgba(6, 182, 212, 0.4)'; ctx.lineWidth = 4; ctx.stroke(); ctx.restore();

    picnicZones.forEach(z => {
        z.life--;
        ctx.save(); ctx.beginPath(); ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2); ctx.fillStyle = "rgba(244, 63, 94, 0.12)"; ctx.fill(); ctx.strokeStyle = "rgba(244, 63, 94, 0.5)"; ctx.lineWidth = 3; ctx.setLineDash([8, 12]); ctx.stroke(); ctx.clip();
        ctx.strokeStyle = "rgba(244, 63, 94, 0.08)"; ctx.lineWidth = 2; ctx.setLineDash([]);
        for (let lx = z.x - z.radius; lx <= z.x + z.radius; lx += 24) { ctx.beginPath(); ctx.moveTo(lx, z.y - z.radius); ctx.lineTo(lx, z.y + z.radius); ctx.stroke(); }
        for (let ly = z.y - z.radius; ly <= z.y + z.radius; ly += 24) { ctx.beginPath(); ctx.moveTo(z.x - z.radius, ly); ctx.lineTo(z.x + z.radius, ly); ctx.stroke(); } ctx.restore();
        if (z.life % 40 === 0) { const food = ['🍓', '🍰', '🍉', '🥪']; particles.push({ type: 'text', x: z.x + Math.cos(Math.random() * Math.PI * 2) * (Math.random() * (z.radius - 20)), y: z.y + Math.sin(Math.random() * Math.PI * 2) * (Math.random() * (z.radius - 20)), text: food[Math.floor(Math.random() * food.length)], color: '#ffffff', alpha: 1, vy: -0.5, life: 60 }); }
        players.forEach(p => { if (!p.isDead && Math.hypot(p.x - z.x, p.y - z.y) < p.radius + z.radius && p.id === z.ownerId && z.life % 30 === 0) { const heal = Math.floor(180 * (1 + 0.02 * p.crystalsCollected)); p.hp = Math.min(p.maxHp, p.hp + heal); createFloatingText(p.x, p.y - 30, `+${heal} 🍓`, "#f43f5e"); createParticles(p.x, p.y, "#f43f5e", 6); } });
    }); picnicZones = picnicZones.filter(z => z.life > 0);

    blizzardZones.forEach(z => {
        z.life--;
        ctx.save(); ctx.beginPath(); ctx.arc(z.x, z.y, z.radius, 0, Math.PI * 2); ctx.fillStyle = "rgba(14, 165, 233, 0.09)"; ctx.fill(); ctx.strokeStyle = "rgba(56, 189, 248, 0.5)"; ctx.lineWidth = 2.5; ctx.setLineDash([5, 8]); ctx.stroke(); ctx.clip();
        ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
        for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(z.x + (Math.sin(z.life * 0.04 + i * 1.5) * (z.radius - 25)), z.y + (Math.cos(z.life * 0.03 + i * 2.2) * (z.radius - 25)), Math.random() * 3 + 1, 0, Math.PI * 2); ctx.fill(); } ctx.restore();
        players.forEach(p => { if (!p.isDead && Math.hypot(p.x - z.x, p.y - z.y) < p.radius + z.radius && p.id !== z.ownerId && z.life % 30 === 0) { p.takeDamage(150, z.ownerId, true, 0.10); if (!p.isStunned) p.freezeValue = Math.min(100, p.freezeValue + 34); createParticles(p.x, p.y, "#38bdf8", 6); } });
    }); blizzardZones = blizzardZones.filter(z => z.life > 0);

    mageMeteors.forEach(m => {
        m.delay--;
        if (m.delay > 0) {
            ctx.save(); ctx.beginPath(); ctx.arc(m.x, m.y, 80, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(239, 68, 68, 0.2)"; ctx.fill(); 
            ctx.strokeStyle = "rgba(239, 68, 68, 0.8)"; ctx.lineWidth = 2; ctx.stroke();
            ctx.restore();
        } else if (m.delay === 0) {
            triggerExplosion(m.x, m.y, 95, m.damage, m.ownerId, true, 0.15);
        }
    });
    mageMeteors = mageMeteors.filter(m => m.delay >= 0);

    prisonerCages.forEach(cage => {
        cage.life--;
        ctx.save(); 
        ctx.beginPath(); ctx.arc(cage.x, cage.y, cage.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(87, 83, 78, 0.1)"; ctx.fill(); 
        ctx.strokeStyle = "rgba(168, 162, 158, 0.8)"; ctx.lineWidth = 6; 
        ctx.setLineDash([15, 10]); ctx.stroke();
        ctx.strokeStyle = "rgba(87, 83, 78, 0.5)"; ctx.lineWidth = 2; ctx.setLineDash([]);
        for (let i = 0; i < 8; i++) {
            const ang = (i / 8) * Math.PI * 2;
            ctx.beginPath(); ctx.moveTo(cage.x, cage.y); 
            ctx.lineTo(cage.x + Math.cos(ang) * cage.radius, cage.y + Math.sin(ang) * cage.radius); ctx.stroke();
        }
        ctx.restore();
    });
    prisonerCages = prisonerCages.filter(c => c.life > 0);

    bushes.forEach(b => { ctx.fillStyle = '#065f46'; ctx.fillRect(b.x, b.y, b.w, b.h); ctx.fillStyle = '#047857'; ctx.fillRect(b.x + 10, b.y + 10, b.w - 20, b.h - 20); });
    walls.forEach(w => { ctx.fillStyle = w.isDestructible ? '#b45309' : '#1e293b'; ctx.fillRect(w.x, w.y, w.w, w.h); ctx.strokeStyle = '#78350f'; ctx.lineWidth = 4; ctx.strokeRect(w.x, w.y, w.w, w.h); ctx.beginPath(); ctx.moveTo(w.x, w.y); ctx.lineTo(w.x + w.w, w.y + w.h); ctx.moveTo(w.x + w.w, w.y); ctx.lineTo(w.x, w.y + w.h); ctx.stroke(); });

    if (!isSuddenDeath) {
        crystalSpawnTimer++;
        if (crystalSpawnTimer > 360) { crystalSpawnTimer = 0; if (powerCrystals.length < 10) powerCrystals.push({ x: BASE_WIDTH / 2 + (Math.random() * 80 - 40), y: BASE_HEIGHT / 2 + (Math.random() * 80 - 40), pulse: 0 }); }
    }

    powerCrystals.forEach(c => { c.pulse += 0.05; ctx.save(); ctx.beginPath(); ctx.arc(c.x, c.y, 12 + Math.sin(c.pulse) * 4, 0, Math.PI*2); ctx.fillStyle = '#06b6d4'; ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 15; ctx.fill(); ctx.font = '14px Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('💎', c.x, c.y); ctx.restore(); });

    players.forEach(p => { p.update(); p.draw(); });
    sharks.forEach(s => { s.update(); s.draw(); }); sharks = sharks.filter(s => s.hp > 0);
    
    for (let i = bullets.length - 1; i >= 0; i--) { if (!bullets[i].update()) bullets.splice(i, 1); else bullets[i].draw(); }
    updateAndDrawParticles(); updateHUD();
    requestAnimationFrame(gameLoop);
}

function updateHUD() {
    const [p1, p2] = players; if (!p1 || !p2) return;
    document.getElementById('p1-hud-hp-bar').style.width = `${(p1.hp / p1.maxHp) * 100}%`; document.getElementById('p1-hud-hp-text').innerText = `${Math.round(p1.hp)}/${p1.maxHp}`;
    document.getElementById('p1-hud-ult').innerText = `大招: ${Math.round(p1.ultCharge)}%`; document.getElementById('p1-hud-ult').className = p1.ultCharge >= 100 ? "text-amber-400 font-extrabold animate-pulse" : "text-slate-400 font-bold";
    document.getElementById('p1-hud-gems').innerText = `💎 ${p1.crystalsCollected}`;
    const p1Ammo = document.getElementById('p1-hud-ammo'); p1Ammo.innerHTML = ''; for (let i = 0; i < p1.ammo; i++) { const a = document.createElement('div'); a.className = "w-3 h-2 bg-amber-500 rounded"; p1Ammo.appendChild(a); }

    document.getElementById('p2-hud-hp-bar').style.width = `${(p2.hp / p2.maxHp) * 100}%`; document.getElementById('p2-hud-hp-text').innerText = `${Math.round(p2.hp)}/${p2.maxHp}`;
    document.getElementById('p2-hud-ult').innerText = `大招: ${Math.round(p2.ultCharge)}%`; document.getElementById('p2-hud-ult').className = p2.ultCharge >= 100 ? "text-amber-400 font-extrabold animate-pulse" : "text-slate-400 font-bold";
    document.getElementById('p2-hud-gems').innerText = `💎 ${p2.crystalsCollected}`;
    const p2Ammo = document.getElementById('p2-hud-ammo'); p2Ammo.innerHTML = ''; for (let i = 0; i < p2.ammo; i++) { const a = document.createElement('div'); a.className = "w-3 h-2 bg-amber-500 rounded"; p2Ammo.appendChild(a); }
}

function resizeCanvas() { const p = canvas.parentElement; let w = p.clientWidth, h = w * (9/16); if (h > p.clientHeight) { h = p.clientHeight; w = h * (16/9); } canvas.width = BASE_WIDTH; canvas.height = BASE_HEIGHT; scale = w / BASE_WIDTH; }
window.addEventListener('resize', resizeCanvas); resizeCanvas();

function triggerSuddenDeath() {
    isSuddenDeath = true; playSound('ult');
    document.getElementById('game-timer').innerText = "💀黃金對決💀";
    document.getElementById('hud-sub-banner').innerHTML = "💀 延長賽：擊倒對手奪取水晶 (每顆強化 2%)";
    document.getElementById('hud-sub-banner').className = "text-xs text-red-400 mt-1 flex items-center gap-1 justify-center animate-bounce font-black";
    createFloatingText(BASE_WIDTH / 2, BASE_HEIGHT / 2 - 40, "💥 進入延長賽：黃金對決！ 💥", "#f59e0b");
    createFloatingText(BASE_WIDTH / 2, BASE_HEIGHT / 2 + 10, "率先擊殺對手者獲勝！", "#ef4444");
    powerCrystals = []; 
}

function startGame() {
    window.focus();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    document.getElementById('start-menu').classList.add('hidden');
    
    const b1 = BRAWLERS[p1SelectedIdx], b2 = BRAWLERS[p2SelectedIdx];
    
    const p1Avatar = document.getElementById('p1-hud-avatar');
    if (b1.imgUrl) p1Avatar.innerHTML = `<img src="${b1.imgUrl}" class="w-full h-full object-cover" onerror="this.outerHTML='<span>${b1.emoji}</span>'" />`;
    else p1Avatar.innerHTML = `<span>${b1.emoji}</span>`;
    
    const p2Avatar = document.getElementById('p2-hud-avatar');
    if (b2.imgUrl) p2Avatar.innerHTML = `<img src="${b2.imgUrl}" class="w-full h-full object-cover" onerror="this.outerHTML='<span>${b2.emoji}</span>'" />`;
    else p2Avatar.innerHTML = `<span>${b2.emoji}</span>`;

    document.getElementById('p1-hud-name').innerText = b1.name;
    document.getElementById('p2-hud-name').innerText = b2.name;

    isSuddenDeath = false;
    document.getElementById('hud-sub-banner').innerHTML = "擊倒對手奪取水晶 (每顆強化 2%)";
    document.getElementById('hud-sub-banner').className = "text-[10px] text-emerald-400 mt-1 flex items-center gap-1 justify-center animate-pulse";

    players = [new Player('p1', b1, 100, BASE_HEIGHT / 2, 0, '#3b82f6'), new Player('p2', b2, BASE_WIDTH - 100, BASE_HEIGHT / 2, Math.PI, '#ef4444')];
    bullets = []; particles = []; powerCrystals = []; picnicZones = []; blizzardZones = []; prisonerCages = []; sharks = []; mageMeteors = [];
    
    generateMap();

    timeLeft = 90; document.getElementById('game-timer').innerText = timeLeft;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if (isSuddenDeath) { document.getElementById('game-timer').innerText = "💀黃金對決💀"; return; }
        timeLeft--; document.getElementById('game-timer').innerText = timeLeft;
        if (timeLeft <= 0) {
            if (players[0].crystalsCollected === players[1].crystalsCollected) triggerSuddenDeath();
            else endGame();
        }
    }, 1000);

    gameActive = true; crystalSpawnTimer = 0; playSound('ult'); gameLoop();
}

function endGame() {
    gameActive = false; clearInterval(timerInterval); playSound('win');
    const [p1, p2] = players;
    const title = document.getElementById('winner-title'), avatar = document.getElementById('winner-avatar');
    document.getElementById('end-p1-gems').innerText = `${p1.crystalsCollected} 顆`; document.getElementById('end-p2-gems').innerText = `${p2.crystalsCollected} 顆`;

    if (p1.crystalsCollected > p2.crystalsCollected) { title.innerText = "1P (藍方) 獲得勝利！"; title.className = "text-4xl font-extrabold text-blue-400 arcade-font mb-4"; avatar.innerText = p1.brawler.emoji; }
    else if (p2.crystalsCollected > p1.crystalsCollected) { title.innerText = "2P (紅方) 獲得勝利！"; title.className = "text-4xl font-extrabold text-red-400 arcade-font mb-4"; avatar.innerText = p2.brawler.emoji; }
    else { title.innerText = "雙方平手！不分勝負"; title.className = "text-4xl font-extrabold text-amber-400 arcade-font mb-4"; avatar.innerText = "🤝"; }
    document.getElementById('game-over').classList.remove('hidden');
}

document.getElementById('start-btn').onclick = startGame;
document.getElementById('restart-btn').onclick = () => { document.getElementById('game-over').classList.add('hidden'); startGame(); };
document.getElementById('menu-btn').onclick = () => { document.getElementById('game-over').classList.add('hidden'); document.getElementById('start-menu').classList.remove('hidden'); updateLobbyUI(); };

updateLobbyUI();
