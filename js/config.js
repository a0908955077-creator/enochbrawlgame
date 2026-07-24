// ==========================================
// 角色資料庫 (BRAWLERS) 與 地圖預設 (MAP_PRESETS)
// ==========================================
const BRAWLERS = [
    { id: 'mage', name: '烈焰法師', emoji: '🔥', maxHp: 4200, speed: 3.6, damage: 900, attackRange: 320, attackCd: 400, bulletSpeed: 7, reloadSpeed: 800, ultRequirement: 3600, color: '#ef4444', bulletColor: '#f97316', imgUrl: 'https://raw.githubusercontent.com/a0908955077-creator/photo/refs/heads/main/lucid-origin_A_decorative_folk_flat_illustration_based_on_the_chibi-style_character_depicting-0.jpg', atkName: '烈焰火球', atkDesc: '朝前方射出高傷害大熔岩火球。', ultName: '熔岩流星雨', ultDesc: '原地吟唱，召喚預警流星轟炸對手。受傷或移動會中斷。' },
    { id: 'ranger', name: '閃電遊俠', emoji: '⚡', maxHp: 3500, speed: 4.0, damage: 400, attackRange: 450, attackCd: 350, bulletSpeed: 11, reloadSpeed: 1100, ultRequirement: 2800, color: '#3b82f6', bulletColor: '#60a5fa', imgUrl: 'https://raw.githubusercontent.com/a0908955077-creator/photo/refs/heads/main/%E9%96%83%E9%9B%BB%E9%81%8A%E4%BF%A0.jpg', atkName: '電磁雙連擊', atkDesc: '一前一後快速噴射兩發電磁彈。', ultName: '超載電磁領域', ultDesc: '釋放環形電磁風暴與連環雷擊。' },
    { id: 'titan', name: '大地泰坦', emoji: '🧱', maxHp: 6400, speed: 3.2, damage: 1500, attackRange: 150, attackCd: 600, bulletSpeed: 6, reloadSpeed: 1000, ultRequirement: 4000, color: '#10b981', bulletColor: '#34d399', imgUrl: 'https://raw.githubusercontent.com/a0908955077-creator/photo/refs/heads/main/gemini-2.5-flash-image_Head_Thick_short_brown_hair_interspersed_with_small_green_shoots._Skin_a_healthy-0.jpg', atkName: '碎石散彈', atkDesc: '揮舞重拳，噴射出 5 顆大地碎石。', ultName: '定向裂地重擊', ultDesc: '地裂震波，擊暈並將對手引力拉近。' },
    { id: 'assassin', name: '暗影刺客', emoji: '🥷', maxHp: 3600, speed: 4.3, damage: 1150, attackRange: 120, attackCd: 400, bulletSpeed: 15, reloadSpeed: 700, ultRequirement: 5750, color: '#a855f7', bulletColor: '#c084fc', imgUrl: 'https://raw.githubusercontent.com/a0908955077-creator/photo/refs/heads/main/gemini-2.5-flash-image_Head_A_head_of_flowing_short_purplish-black_hair_long_cat_ears_slightly_erect_ey-0.jpg', atkName: '暗影瞬突', atkDesc: '化為殘影向前突進並環形切割。', ultName: '暗影絕殺追擊', ultDesc: '超長距離狂暴衝鋒，破除障礙與撕裂。' },
    { id: 'hypnotist', name: '心靈催眠師', emoji: '🌀', maxHp: 4500, speed: 3.6, damage: 520, attackRange: 250, attackCd: 500, bulletSpeed: 8, reloadSpeed: 1200, ultRequirement: 2080, color: '#ec4899', bulletColor: '#f472b6', imgUrl: 'https://raw.githubusercontent.com/a0908955077-creator/photo/refs/heads/main/gemini-2.5-flash-image_Humanoid_Appearance_Design_Head_High_ponytail_in_candy_pink._Clothing_Wears_a_bl-0.jpg', atkName: '螺旋催眠波', atkDesc: '拋出旋轉花瓣，附加 5% 劇毒持續傷害。', ultName: '精神混亂電波', ultDesc: '巨大的心靈漩渦，使對手移動方向完全反轉。' },
    { id: 'hunter', name: '叢林射手', emoji: '🏹', maxHp: 3400, speed: 4.0, damage: 1200, attackRange: 450, attackCd: 800, bulletSpeed: 13, reloadSpeed: 1500, ultRequirement: 4800, color: '#84cc16', bulletColor: '#a3e635', imgUrl: 'https://raw.githubusercontent.com/a0908955077-creator/photo/refs/heads/main/%E6%A3%AE%E6%9E%97%E5%B0%84%E6%89%8B.jpg', atkName: '林地追獵箭', atkDesc: '若身處草叢中，箭矢速度與傷害大幅提升。', ultName: '金色破牆重箭', ultDesc: '射出貫穿掩體的金色神箭，終點爆發衝擊波。' },
    { id: 'crafter', name: '甜蜜果匠', emoji: '🍓', maxHp: 4800, speed: 3.6, damage: 300, attackRange: 280, attackCd: 900, bulletSpeed: 10, reloadSpeed: 1100, ultRequirement: 3300, color: '#f43f5e', bulletColor: '#fb7185', imgUrl: 'https://raw.githubusercontent.com/a0908955077-creator/photo/refs/heads/main/gemini-2.5-flash-image_Q-version_Humanoid_Appearance_Design_Head_A_girl_with_short_round_bubblegum-colo-0.jpg', atkName: '高壓糖漿噴槍', atkDesc: '寬範圍持續噴灑糖漿，不可穿牆，附帶 30% 緩速。', ultName: '甜蜜野餐領域', ultDesc: '施放瞬間治癒自己 20% 生命，並展開陣地。' },
    { id: 'frost_witch', name: '冰雪精靈', emoji: '❄️', maxHp: 5200, speed: 3.5, damage: 240, attackRange: 320, attackCd: 900, bulletSpeed: 10, reloadSpeed: 1100, ultRequirement: 3200, color: '#0ea5e9', bulletColor: '#38bdf8', imgUrl: 'https://raw.githubusercontent.com/a0908955077-creator/photo/refs/heads/main/gemini-2.5-flash-image_Face_and_Expression_She_has_a_very_delicate_and_adorable_chibi-style_face_with_a-0.jpg', atkName: '極寒冰錐噴霧', atkDesc: '長距離噴射冰霧，不可穿牆，疊滿冰凍值可眩暈對手。', ultName: '暴風雪結界', ultDesc: '展開暴風雪法陣，對手移速大減並持續增加冰凍值。' },
    { id: 'prisoner', name: '斷罪囚徒', emoji: '⛓️', maxHp: 5200, speed: 3.3, damage: 850, attackRange: 120, attackCd: 800, bulletSpeed: 0, reloadSpeed: 1500, ultRequirement: 2800, color: '#57534e', bulletColor: '#a8a29e', imgUrl: 'https://raw.githubusercontent.com/a0908955077-creator/photo/refs/heads/main/%E6%96%B7%E7%BD%AA%E5%9B%9A%E5%BE%92.jpg', atkName: '斷罪鐵拳', atkDesc: '手銬極近距扇形重擊，無法穿牆，攻擊帶有25%減傷。', ultName: '絕望衝鋒牢籠', ultDesc: '高速衝鋒，停下生成160px牢籠，敵人不可出且吸收子彈。' },
    { id: 'neptune', name: '滄海帝王', emoji: '🔱', maxHp: 4200, speed: 3.5, damage: 800, attackRange: 450, attackCd: 800, bulletSpeed: 12, reloadSpeed: 1200, ultRequirement: 6000, color: '#06b6d4', bulletColor: '#0891b2', imgUrl: 'https://raw.githubusercontent.com/a0908955077-creator/photo/refs/heads/main/%E6%B5%B7%E7%A5%9E.jpg', atkName: '潮汐蓄力波', atkDesc: '按住蓄力發射寬廣海浪(貫穿)，威力隨蓄力最高2倍。', ultName: '幻星鯊召喚', ultDesc: '召喚高血量幻星鯊，衝刺擊退並自動追擊撕咬擋子彈。' }
];

const MAP_PRESETS = [
    {
        name: "經典荒野 (Classic Arena)",
        obstacles: [ { x: 350, y: 320, w: 100, h: 80 }, { x: 830, y: 320, w: 100, h: 80 }, { x: 590, y: 150, w: 100, h: 80 }, { x: 590, y: 490, w: 100, h: 80 }, { x: 200, y: 120, w: 120, h: 60 }, { x: 200, y: 540, w: 120, h: 60 }, { x: 960, y: 120, w: 120, h: 60 }, { x: 960, y: 540, w: 120, h: 60 } ],
        bushes: [ { x: 150, y: 240, w: 160, h: 240 }, { x: 970, y: 240, w: 160, h: 240 }, { x: 450, y: 220, w: 100, h: 280 }, { x: 730, y: 220, w: 100, h: 280 } ]
    },
    {
        name: "迷宮遺蹟 (Maze Ruins)",
        obstacles: [ { x: 590, y: 260, w: 100, h: 200 }, { x: 440, y: 320, w: 400, h: 80 }, { x: 250, y: 150, w: 80, h: 120 }, { x: 950, y: 150, w: 80, h: 120 }, { x: 250, y: 450, w: 80, h: 120 }, { x: 950, y: 450, w: 80, h: 120 } ],
        bushes: [ { x: 100, y: 100, w: 120, h: 120 }, { x: 1060, y: 100, w: 120, h: 120 }, { x: 100, y: 500, w: 120, h: 120 }, { x: 1060, y: 500, w: 120, h: 120 }, { x: 540, y: 40, w: 200, h: 80 }, { x: 540, y: 600, w: 200, h: 80 } ]
    },
    {
        name: "命運草原 (Overgrown Wilds)",
        obstacles: [ { x: 590, y: 100, w: 100, h: 80 }, { x: 590, y: 540, w: 100, h: 80 }, { x: 250, y: 320, w: 120, h: 80 }, { x: 910, y: 320, w: 120, h: 80 } ],
        bushes: [ { x: 150, y: 100, w: 350, h: 180 }, { x: 780, y: 100, w: 350, h: 180 }, { x: 150, y: 440, w: 350, h: 180 }, { x: 780, y: 440, w: 350, h: 180 }, { x: 490, y: 260, w: 300, h: 200 } ]
    }
];
