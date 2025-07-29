const GRAVITY = 0.7;
const FRICTION = 0.85;
const PLAYER_SPEED = 5;
const JUMP_FORCE = -15;
const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;

// Audio elements
const bgMusic = new Audio("http://codeskulptor-demos.commondatastorage.googleapis.com/GalaxyInvaders/theme_01.mp3");
bgMusic.loop = true;

// Get volume controls
const musicVolumeSlider = document.getElementById('music-volume');
const sfxVolumeSlider = document.getElementById('sfx-volume');

// Set initial volumes
bgMusic.volume = musicVolumeSlider.value / 100;

// Update music volume when slider changes
musicVolumeSlider.addEventListener('input', function() {
    if (!gameState.isMuted) {
        bgMusic.volume = this.value / 100;
    }
});

// Update SFX volume when slider changes
sfxVolumeSlider.addEventListener('input', function() {
    // We'll implement SFX later if needed
});

const gameState = {
    currentScreen: 'main-menu',
    isPaused: false,
    isMuted: false,
    player: null,
    enemies: [],
    platforms: [],
    items: [],
    particles: [],
    floatingTexts: [],
    camera: { x: 0, y: 0 },
    score: 0,
    keys: 0,
    level: 1,
    gameOver: false,
    keysPressed: {},
    levelEndX: 1500,
    levelWidth: 2000,
    inLevelTransition: false
};

const levelNames = [
    "Floating Gardens",
    "Cloud Citadel",
    "Sky Fortress",
    "Storm Peaks",
    "Dragon's Lair"
];

const levelThemes = [
    { bg: ['#1a237e', '#4a148c'], platforms: '#27ae60' },
    { bg: ['#0c2461', '#1e3799'], platforms: '#2980b9' },
    { bg: ['#1a1a2e', '#16213e'], platforms: '#8e44ad' },
    { bg: ['#2c3e50', '#34495e'], platforms: '#7f8c8d' },
    { bg: ['#6a1b9a', '#4527a0'], platforms: '#e74c3c' }
];

const screens = {
    'main-menu': document.getElementById('main-menu'),
    'settings-screen': document.getElementById('settings-screen'),
    'help-screen': document.getElementById('help-screen'),
    'credits-screen': document.getElementById('credits-screen'),
    'game-over': document.getElementById('game-over'),
    'level-complete': document.getElementById('level-complete'),
    'level-transition': document.getElementById('level-transition')
};

const gameCanvas = document.getElementById('game-canvas');
const bgCanvas = document.getElementById('background-canvas');
const parallaxCanvas = document.getElementById('parallax-canvas');
const miniMapCanvas = document.getElementById('mini-map-canvas');
const ctx = gameCanvas.getContext('2d');
const bgCtx = bgCanvas.getContext('2d');
const pxCtx = parallaxCanvas.getContext('2d');
const mmCtx = miniMapCanvas.getContext('2d');

gameCanvas.width = CANVAS_WIDTH;
gameCanvas.height = CANVAS_HEIGHT;
bgCanvas.width = CANVAS_WIDTH;
bgCanvas.height = CANVAS_HEIGHT;
parallaxCanvas.width = CANVAS_WIDTH;
parallaxCanvas.height = CANVAS_HEIGHT;
miniMapCanvas.width = miniMapCanvas.parentElement.clientWidth - 16;
miniMapCanvas.height = miniMapCanvas.parentElement.clientHeight - 16;

document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('settings-btn').addEventListener('click', () => showScreen('settings-screen'));
document.getElementById('help-btn').addEventListener('click', () => showScreen('help-screen'));
document.getElementById('credits-btn').addEventListener('click', () => showScreen('credits-screen'));

document.getElementById('settings-back').addEventListener('click', () => showScreen('main-menu'));
document.getElementById('help-back').addEventListener('click', () => showScreen('main-menu'));
document.getElementById('credits-back').addEventListener('click', () => showScreen('main-menu'));

document.getElementById('pause-btn').addEventListener('click', togglePause);
document.getElementById('mute-btn').addEventListener('click', toggleMute);
document.getElementById('menu-btn').addEventListener('click', () => showScreen('main-menu'));

document.getElementById('restart-btn').addEventListener('click', startGame);
document.getElementById('menu-btn').addEventListener('click', () => showScreen('main-menu'));
document.getElementById('level-menu-btn').addEventListener('click', () => showScreen('main-menu'));
document.getElementById('next-level-btn').addEventListener('click', nextLevel);

window.addEventListener('keydown', (e) => {
    gameState.keysPressed[e.key.toLowerCase()] = true;
    
    if (e.key === 'p' || e.key === 'P') {
        togglePause();
    }
    
    if (e.key === 'm' || e.key === 'M') {
        toggleMute();
    }
});

window.addEventListener('keyup', (e) => {
    gameState.keysPressed[e.key.toLowerCase()] = false;
});

function setupMobileControls() {
    const upBtn = document.querySelector('.d-pad-btn.up');
    const leftBtn = document.querySelector('.d-pad-btn.left');
    const rightBtn = document.querySelector('.d-pad-btn.right');
    const downBtn = document.querySelector('.d-pad-btn.down');
    const jumpBtn = document.querySelector('.action-btn.jump');
    const attackBtn = document.querySelector('.action-btn.attack');
    
    const handleTouchStart = (key) => (e) => {
        e.preventDefault();
        gameState.keysPressed[key] = true;
    };
    
    const handleTouchEnd = (key) => (e) => {
        e.preventDefault();
        gameState.keysPressed[key] = false;
    };
    
    upBtn.addEventListener('touchstart', handleTouchStart('w'));
    upBtn.addEventListener('touchend', handleTouchEnd('w'));
    upBtn.addEventListener('touchcancel', handleTouchEnd('w'));
    
    leftBtn.addEventListener('touchstart', handleTouchStart('a'));
    leftBtn.addEventListener('touchend', handleTouchEnd('a'));
    leftBtn.addEventListener('touchcancel', handleTouchEnd('a'));
    
    rightBtn.addEventListener('touchstart', handleTouchStart('d'));
    rightBtn.addEventListener('touchend', handleTouchEnd('d'));
    rightBtn.addEventListener('touchcancel', handleTouchEnd('d'));
    
    downBtn.addEventListener('touchstart', handleTouchStart('s'));
    downBtn.addEventListener('touchend', handleTouchEnd('s'));
    downBtn.addEventListener('touchcancel', handleTouchEnd('s'));
    
    jumpBtn.addEventListener('touchstart', handleTouchStart('w'));
    jumpBtn.addEventListener('touchend', handleTouchEnd('w'));
    jumpBtn.addEventListener('touchcancel', handleTouchEnd('w'));
    
    attackBtn.addEventListener('touchstart', handleTouchStart(' '));
    attackBtn.addEventListener('touchend', handleTouchEnd(' '));
    attackBtn.addEventListener('touchcancel', handleTouchEnd(' '));
}

setupMobileControls();

function showScreen(screenId) {
    Object.values(screens).forEach(screen => {
        screen.classList.add('hidden');
        screen.style.display = 'none';
    });
    if (screens[screenId]) {
        screens[screenId].classList.remove('hidden');
        screens[screenId].style.display = 'flex';
    }
    gameState.currentScreen = screenId;
    
    if (screenId === 'main-menu') {
        gameState.isPaused = true;
    }
}

function startGame() {
    showScreen('');
    gameState.currentScreen = 'game';
    gameState.level = 1;
    initGame();
    gameLoop();
    screens['game-over'].style.display = 'none';
    screens['level-complete'].style.display = 'none';
    
    // Start playing background music
    bgMusic.play().catch(e => {
        console.log("Audio play failed, user interaction might be required:", e);
    });
}

function togglePause() {
    gameState.isPaused = !gameState.isPaused;
    document.getElementById('pause-btn').innerHTML = 
        gameState.isPaused ? '<i class="fas fa-play"></i>' : '<i class="fas fa-pause"></i>';
    
    // Pause/resume music
    if (gameState.isPaused) {
        bgMusic.pause();
    } else if (!gameState.isMuted) {
        bgMusic.play();
    }
}

function toggleMute() {
    gameState.isMuted = !gameState.isMuted;
    
    if (gameState.isMuted) {
        bgMusic.volume = 0;
        document.getElementById('mute-btn').innerHTML = '<i class="fas fa-volume-mute"></i>';
    } else {
        bgMusic.volume = musicVolumeSlider.value / 100;
        document.getElementById('mute-btn').innerHTML = '<i class="fas fa-volume-up"></i>';
        
        // Resume music if not paused
        if (!gameState.isPaused) {
            bgMusic.play();
        }
    }
}

function generateLevel(level) {
    gameState.player = new Player(CANVAS_WIDTH / 4, CANVAS_HEIGHT / 2);
    
    gameState.platforms = [];
    
    createPlatform(0, CANVAS_HEIGHT - 50, gameState.levelWidth, 50);
    
    const platformCount = 8 + level * 2;
    let lastX = 200;
    
    for (let i = 0; i < platformCount; i++) {
        const x = lastX + 100 + Math.random() * 200;
        const y = 300 + Math.random() * 200;
        const width = 80 + Math.random() * 120;
        
        createPlatform(x, y, width, 20);
        lastX = x;
        
        if (Math.random() > 0.5) {
            const itemType = Math.random() > 0.7 ? 'heart' : (Math.random() > 0.9 ? 'key' : 'gem');
            createItem(x + width/2, y - 30, itemType);
        }
        
        if (Math.random() > 0.6) {
            const enemyType = Math.random() > 0.8 ? 'flying' : 'ground';
            createEnemy(x + width/2, y - 40, enemyType);
        }
    }
    
    createItem(gameState.levelWidth - 100, 300, 'door');
    createPlatform(gameState.levelWidth - 150, 350, 150, 20);
    
    createItem(250, 460, 'gem');
    createItem(gameState.levelWidth - 300, 300, 'key');
    
    gameState.score = 0;
    gameState.keys = 0;
    gameState.camera = { x: 0, y: 0 };
    gameState.gameOver = false;
    gameState.particles = [];
    gameState.floatingTexts = [];
    
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('keys').textContent = gameState.keys;
    document.getElementById('level-display').textContent = gameState.level;
    document.getElementById('level-name-display').textContent = levelNames[gameState.level-1];
    document.getElementById('health-fill').style.width = '100%';
}

function initGame() {
    gameState.levelWidth = 1500 + gameState.level * 200;
    
    screens['level-transition'].style.display = 'flex';
    document.getElementById('level-name').textContent = 
        levelNames[gameState.level - 1] || `Level ${gameState.level}`;
    
    setTimeout(() => {
        screens['level-transition'].style.display = 'none';
        generateLevel(gameState.level);
        gameState.inLevelTransition = false;
    }, 2000);
}

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 60;
        this.velocity = { x: 0, y: 0 };
        this.speed = PLAYER_SPEED;
        this.jumping = false;
        this.health = 100;
        this.facing = 'right';
        this.attackCooldown = 0;
        this.attackPower = 25;
        this.invincible = 0;
        this.animation = 0;
    }
    
    update() {
        this.velocity.y += GRAVITY;
        
        if (gameState.keysPressed['a'] || gameState.keysPressed['arrowleft']) {
            this.velocity.x = -this.speed;
            this.facing = 'left';
        } else if (gameState.keysPressed['d'] || gameState.keysPressed['arrowright']) {
            this.velocity.x = this.speed;
            this.facing = 'right';
        } else {
            this.velocity.x *= FRICTION;
        }
        
        if ((gameState.keysPressed['w'] || gameState.keysPressed['arrowup'] || gameState.keysPressed[' ']) && !this.jumping) {
            this.velocity.y = JUMP_FORCE;
            this.jumping = true;
            createParticles(this.x + this.width/2, this.y + this.height, 8, '#3498db');
        }
        
        if (gameState.keysPressed[' '] && this.attackCooldown <= 0) {
            this.attack();
        }
        
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }
        
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        
        this.jumping = true;
        gameState.platforms.forEach(platform => {
            if (this.collidesWith(platform)) {
                if (this.velocity.y > 0 && this.y + this.height < platform.y + platform.height/2) {
                    this.y = platform.y - this.height;
                    this.velocity.y = 0;
                    this.jumping = false;
                }
                else if (this.velocity.y < 0) {
                    this.y = platform.y + platform.height;
                    this.velocity.y = 0;
                }
            }
        });
        
        if (this.y > CANVAS_HEIGHT) {
            this.takeDamage(10);
            this.y = 100;
            this.x = Math.max(0, this.x - 100);
        }
        
        gameState.camera.x = this.x - CANVAS_WIDTH / 3;
        if (gameState.camera.x < 0) gameState.camera.x = 0;
        if (gameState.camera.x > gameState.levelWidth - CANVAS_WIDTH) {
            gameState.camera.x = gameState.levelWidth - CANVAS_WIDTH;
        }
        
        if (this.x > gameState.levelWidth - 150) {
            levelComplete();
        }
        
        if (this.invincible > 0) {
            this.invincible--;
        }
        
        this.animation += 0.1;
    }
    
    attack() {
        this.attackCooldown = 20;
        createParticles(this.x + (this.facing === 'right' ? this.width : 0), 
                       this.y + this.height/2, 15, '#ff7f50');
        
        gameState.enemies.forEach(enemy => {
            const attackRange = 70;
            const inRangeX = enemy.x > this.x - attackRange && enemy.x < this.x + this.width + attackRange;
            const inRangeY = enemy.y > this.y - attackRange && enemy.y < this.y + this.height + attackRange;
            
            if (inRangeX && inRangeY) {
                enemy.takeDamage(this.attackPower);
            }
        });
    }
    
    takeDamage(amount) {
        if (this.invincible > 0) return;
        
        this.health -= amount;
        this.invincible = 60;
        createParticles(this.x + this.width/2, this.y + this.height/2, 20, '#ff4757');
        
        if (this.health <= 0) {
            this.health = 0;
            gameOver();
        }
        
        document.getElementById('health-fill').style.width = `${this.health}%`;
    }
    
    draw(ctx) {
        const x = this.x - gameState.camera.x;
        const y = this.y;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x + this.width/2, y + this.height + 5, 
                   this.width/2 * (1 - Math.abs(Math.sin(this.animation))/2), 
                   5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#3498db';
        ctx.beginPath();
        ctx.moveTo(x + 10, y + 10);
        ctx.bezierCurveTo(x + 5, y + 30, x + 5, y + 50, x + 10, y + 60);
        ctx.bezierCurveTo(x + 30, y + 60, x + 30, y + 60, x + 30, y + 60);
        ctx.bezierCurveTo(x + 35, y + 50, x + 35, y + 30, x + 30, y + 10);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#f0d9b5';
        ctx.beginPath();
        ctx.arc(x + 20, y, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        const eyeX = this.facing === 'right' ? x + 25 : x + 15;
        ctx.beginPath();
        ctx.arc(eyeX, y, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(eyeX, y, 2, 0, Math.PI * 2);
        ctx.fill();
        
        const legOffset = Math.sin(this.animation) * 5;
        ctx.fillStyle = '#2980b9';
        ctx.fillRect(x + 10, y + 60, 8, 20);
        ctx.fillRect(x + 22, y + 60 - legOffset, 8, 20 + legOffset);
        
        ctx.fillStyle = '#3498db';
        ctx.fillRect(x - 5, y + 25, 10, 25);
        ctx.fillRect(x + 35, y + 25, 10, 25);
        
        if (this.invincible > 0 && this.invincible % 10 < 5) {
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(x + 20, y, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }
    
    collidesWith(object) {
        return this.x < object.x + object.width &&
               this.x + this.width > object.x &&
               this.y < object.y + object.height &&
               this.y + this.height > object.y;
    }
}

class Platform {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    
    draw(ctx) {
        const theme = levelThemes[gameState.level-1] || levelThemes[0];
        
        ctx.fillStyle = theme.platforms;
        ctx.beginPath();
        ctx.moveTo(this.x - gameState.camera.x, this.y);
        ctx.lineTo(this.x - gameState.camera.x + this.width, this.y);
        ctx.lineTo(this.x - gameState.camera.x + this.width, this.y + this.height);
        ctx.lineTo(this.x - gameState.camera.x, this.y + this.height);
        ctx.closePath();
        ctx.fill();
        
        const gradient = ctx.createLinearGradient(
            this.x - gameState.camera.x, this.y,
            this.x - gameState.camera.x, this.y - 10
        );
        gradient.addColorStop(0, '#2ecc71');
        gradient.addColorStop(1, '#27ae60');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(this.x - gameState.camera.x, this.y);
        ctx.bezierCurveTo(
            this.x - gameState.camera.x + this.width/4, this.y - 8,
            this.x - gameState.camera.x + this.width*3/4, this.y - 8,
            this.x - gameState.camera.x + this.width, this.y
        );
        ctx.lineTo(this.x - gameState.camera.x + this.width, this.y);
        ctx.lineTo(this.x - gameState.camera.x, this.y);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#1e8449';
        for (let i = 5; i < this.width; i += 15) {
            ctx.beginPath();
            ctx.arc(this.x - gameState.camera.x + i, this.y, 3, 0, Math.PI);
            ctx.fill();
        }
    }
}

class Item {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.type = type;
        this.collected = false;
        this.animation = 0;
    }
    
    update() {
        this.animation += 0.05;
        this.y += Math.sin(this.animation) * 0.5;
    }
    
    draw(ctx) {
        if (this.collected) return;
        
        this.update();
        const x = this.x - gameState.camera.x;
        const y = this.y;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(x + 10, y + 10, 15, 0, Math.PI * 2);
        ctx.fill();
        
        if (this.type === 'gem') {
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.moveTo(x + 10, y);
            ctx.lineTo(x + 20, y + 10);
            ctx.lineTo(x + 10, y + 20);
            ctx.lineTo(x, y + 10);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.moveTo(x + 10, y + 5);
            ctx.lineTo(x + 15, y + 10);
            ctx.lineTo(x + 10, y + 15);
            ctx.lineTo(x + 5, y + 10);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.beginPath();
            ctx.arc(x + 15, y + 5, 2, 0, Math.PI * 2);
            ctx.fill();
        } 
        else if (this.type === 'key') {
            ctx.fillStyle = '#e67e22';
            ctx.beginPath();
            ctx.arc(x + 15, y + 10, 8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillRect(x, y + 8, 15, 4);
            
            ctx.fillRect(x + 5, y + 4, 3, 4);
            ctx.fillRect(x + 10, y + 12, 3, 4);
        } 
        else if (this.type === 'heart') {
            ctx.fillStyle = '#ff4757';
            ctx.beginPath();
            ctx.moveTo(x + 10, y + 5);
            ctx.bezierCurveTo(x + 5, y, x, y + 10, x + 10, y + 15);
            ctx.bezierCurveTo(x + 20, y + 10, x + 15, y, x + 10, y + 5);
            ctx.fill();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.moveTo(x + 10, y + 8);
            ctx.bezierCurveTo(x + 7, y + 5, x + 5, y + 10, x + 10, y + 13);
            ctx.fill();
        } 
        else if (this.type === 'door') {
            ctx.fillStyle = '#8e44ad';
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + 20, y);
            ctx.lineTo(x + 20, y + 40);
            ctx.lineTo(x, y + 40);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#9b59b6';
            ctx.fillRect(x + 3, y + 3, 14, 34);
            
            ctx.fillStyle = '#f1c40f';
            ctx.beginPath();
            ctx.arc(x + 15, y + 20, 3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#f39c12';
            ctx.beginPath();
            ctx.arc(x + 10, y + 10, 4, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

class Enemy {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.type = type;
        this.health = 100;
        this.direction = 1;
        this.speed = type === 'flying' ? 2 : 1;
        this.attackCooldown = 0;
        this.attackPower = 5;
        this.moveTimer = 0;
        this.animation = 0;
    }
    
    update() {
        if (this.type === 'ground') {
            this.x += this.speed * this.direction;
            
            this.moveTimer++;
            if (this.moveTimer > 100 || this.x < 0 || this.x > gameState.levelWidth - 50) {
                this.direction *= -1;
                this.moveTimer = 0;
            }
        } else if (this.type === 'flying') {
            this.x += this.speed * this.direction;
            this.y += Math.sin(Date.now() / 500) * 0.5;
            
            if (Math.random() < 0.01) {
                this.direction *= -1;
            }
        }
        
        if (this.attackCooldown <= 0) {
            const dx = Math.abs(this.x - gameState.player.x);
            const dy = Math.abs(this.y - gameState.player.y);
            
            if (dx < 100 && dy < 100) {
                gameState.player.takeDamage(this.attackPower);
                this.attackCooldown = 120;
            }
        } else {
            this.attackCooldown--;
        }
        
        this.animation += 0.1;
    }
    
    takeDamage(amount) {
        this.health -= amount;
        createParticles(this.x + this.width/2, this.y + this.height/2, 15, '#ff4757');
        
        if (this.health <= 0) {
            this.health = 0;
            gameState.score += 50;
            document.getElementById('score').textContent = gameState.score;
            createParticles(this.x + this.width/2, this.y + this.height/2, 35, '#e74c3c');
            gameState.floatingTexts.push({
                x: this.x,
                y: this.y,
                text: "+50",
                color: '#f1c40f',
                life: 60
            });
            const index = gameState.enemies.indexOf(this);
            if (index > -1) {
                gameState.enemies.splice(index, 1);
            }
        }
    }
    
    draw(ctx) {
        const x = this.x - gameState.camera.x;
        const y = this.y;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(x + this.width/2, y + this.height + 5, 
                   this.width/2 * (1 - Math.abs(Math.sin(this.animation))/2), 
                   5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const color = this.type === 'flying' ? '#9b59b6' : '#e74c3c';
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x + 20, y + 15, 15, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'white';
        const eyeX = this.direction > 0 ? x + 25 : x + 15;
        ctx.beginPath();
        ctx.arc(eyeX, y + 15, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(eyeX, y + 15, 3, 0, Math.PI * 2);
        ctx.fill();
        
        if (this.type === 'flying') {
            ctx.fillStyle = 'rgba(155, 89, 182, 0.7)';
            const wingY = y + 10 + Math.sin(this.animation) * 5;
            ctx.beginPath();
            ctx.ellipse(x + 5, wingY, 10, 15, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(x + 35, wingY, 10, 15, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        if (this.type === 'ground') {
            ctx.fillStyle = color;
            const legOffset = Math.sin(this.animation) * 5;
            ctx.fillRect(x + 10, y + 30, 6, 15);
            ctx.fillRect(x + 24, y + 30 - legOffset, 6, 15 + legOffset);
        }
        
        const barWidth = 40;
        const barHeight = 6;
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(x, y - 10, barWidth, barHeight);
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(x, y - 10, barWidth * (this.health / 100), barHeight);
    }
}

function createPlatform(x, y, width, height) {
    gameState.platforms.push(new Platform(x, y, width, height));
}

function createItem(x, y, type) {
    gameState.items.push(new Item(x, y, type));
}

function createEnemy(x, y, type) {
    gameState.enemies.push(new Enemy(x, y, type));
}

function createParticles(x, y, count, color) {
    for (let i = 0; i < count; i++) {
        gameState.particles.push({
            x: x,
            y: y,
            size: Math.random() * 6 + 3,
            speedX: Math.random() * 8 - 4,
            speedY: Math.random() * 8 - 4,
            color: color,
            life: 30
        });
    }
}

function drawBackground() {
    const theme = levelThemes[gameState.level-1] || levelThemes[0];
    
    const skyGradient = pxCtx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    skyGradient.addColorStop(0, theme.bg[0]);
    skyGradient.addColorStop(1, theme.bg[1]);
    pxCtx.fillStyle = skyGradient;
    pxCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    pxCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 100; i++) {
        const x = Math.random() * CANVAS_WIDTH;
        const y = Math.random() * CANVAS_HEIGHT / 3;
        const size = Math.random() * 2;
        pxCtx.beginPath();
        pxCtx.arc(x, y, size, 0, Math.PI * 2);
        pxCtx.fill();
    }
    
    const layers = [
        { speed: 0.05, height: 200, color: 'rgba(0, 0, 0, 0.2)' },
        { speed: 0.1, height: 150, color: 'rgba(0, 0, 0, 0.3)' },
        { speed: 0.2, height: 100, color: 'rgba(0, 0, 0, 0.4)' }
    ];
    
    for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];
        const offset = gameState.camera.x * layer.speed;
        
        pxCtx.fillStyle = layer.color;
        for (let x = -offset % 300; x < CANVAS_WIDTH; x += 300) {
            pxCtx.beginPath();
            pxCtx.moveTo(x, CANVAS_HEIGHT);
            pxCtx.lineTo(x + 150, CANVAS_HEIGHT - layer.height);
            pxCtx.lineTo(x + 300, CANVAS_HEIGHT);
            pxCtx.closePath();
            pxCtx.fill();
        }
    }
}

function drawMiniMap() {
    mmCtx.clearRect(0, 0, miniMapCanvas.width, miniMapCanvas.height);
    
    mmCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    mmCtx.fillRect(0, 0, miniMapCanvas.width, miniMapCanvas.height);
    
    const scale = miniMapCanvas.width / gameState.levelWidth;
    
    const theme = levelThemes[gameState.level-1] || levelThemes[0];
    mmCtx.fillStyle = theme.platforms;
    gameState.platforms.forEach(platform => {
        mmCtx.fillRect(
            platform.x * scale, 
            platform.y * scale, 
            platform.width * scale, 
            platform.height * scale
        );
    });
    
    mmCtx.fillStyle = '#3498db';
    mmCtx.beginPath();
    mmCtx.arc(
        gameState.player.x * scale, 
        gameState.player.y * scale, 
        4, 0, Math.PI * 2
    );
    mmCtx.fill();
    
    mmCtx.fillStyle = '#e74c3c';
    gameState.enemies.forEach(enemy => {
        mmCtx.beginPath();
        mmCtx.arc(
            enemy.x * scale, 
            enemy.y * scale, 
            3, 0, Math.PI * 2
        );
        mmCtx.fill();
    });
    
    gameState.items.forEach(item => {
        if (!item.collected) {
            if (item.type === 'gem') {
                mmCtx.fillStyle = '#f1c40f';
            } else if (item.type === 'key') {
                mmCtx.fillStyle = '#e67e22';
            } else if (item.type === 'heart') {
                mmCtx.fillStyle = '#ff4757';
            } else if (item.type === 'door') {
                mmCtx.fillStyle = '#9b59b6';
            }
            mmCtx.beginPath();
            mmCtx.arc(
                item.x * scale, 
                item.y * scale, 
                2, 0, Math.PI * 2
            );
            mmCtx.fill();
        }
    });
    
    mmCtx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    mmCtx.lineWidth = 1;
    mmCtx.strokeRect(
        gameState.camera.x * scale, 
        0, 
        CANVAS_WIDTH * scale, 
        miniMapCanvas.height
    );
}

function updateParticles() {
    for (let i = gameState.particles.length - 1; i >= 0; i--) {
        const p = gameState.particles[i];
        p.x += p.speedX;
        p.y += p.speedY;
        p.life--;
        
        if (p.life <= 0) {
            gameState.particles.splice(i, 1);
        }
    }
}

function drawParticles(ctx) {
    gameState.particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 30;
        ctx.beginPath();
        ctx.arc(p.x - gameState.camera.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;
}

function updateFloatingTexts() {
    for (let i = gameState.floatingTexts.length - 1; i >= 0; i--) {
        const text = gameState.floatingTexts[i];
        text.y -= 0.5;
        text.life--;
        
        if (text.life <= 0) {
            gameState.floatingTexts.splice(i, 1);
        }
    }
}

function drawFloatingTexts(ctx) {
    gameState.floatingTexts.forEach(text => {
        ctx.fillStyle = text.color;
        ctx.font = 'bold 18px Arial';
        ctx.globalAlpha = text.life / 60;
        ctx.fillText(text.text, text.x - gameState.camera.x, text.y);
    });
    ctx.globalAlpha = 1.0;
}

function nextLevel() {
    gameState.level++;
    screens['level-complete'].style.display = 'none';
    gameState.isPaused = false;
    document.getElementById('pause-btn').innerHTML = '<i class="fas fa-pause"></i>';
    initGame();
}

function levelComplete() {
    screens['level-complete'].style.display = 'flex';
    gameState.isPaused = true;
}

function gameOver() {
    gameState.gameOver = true;
    document.getElementById('final-score').textContent = gameState.score;
    screens['game-over'].style.display = 'flex';
}

function gameLoop() {
    if (gameState.currentScreen !== 'game' || gameState.isPaused || gameState.gameOver || gameState.inLevelTransition) {
        requestAnimationFrame(gameLoop);
        return;
    }
    
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    drawBackground();
    
    gameState.player.update();
    
    gameState.enemies.forEach(enemy => {
        enemy.update();
    });
    
    updateParticles();
    updateFloatingTexts();
    
    gameState.platforms.forEach(platform => {
        platform.draw(ctx);
    });
    
    gameState.items.forEach(item => {
        item.draw(ctx);
        
        if (!item.collected && gameState.player.collidesWith(item)) {
            item.collected = true;
            if (item.type === 'gem') {
                gameState.score += 100;
                document.getElementById('score').textContent = gameState.score;
                createParticles(item.x + item.width/2, item.y + item.height/2, 20, '#f1c40f');
                gameState.floatingTexts.push({
                    x: item.x,
                    y: item.y,
                    text: "+100",
                    color: '#f1c40f',
                    life: 60
                });
            } else if (item.type === 'key') {
                gameState.keys++;
                document.getElementById('keys').textContent = gameState.keys;
                createParticles(item.x + item.width/2, item.y + item.height/2, 20, '#e67e22');
            } else if (item.type === 'heart') {
                gameState.player.health = Math.min(100, gameState.player.health + 30);
                document.getElementById('health-fill').style.width = `${gameState.player.health}%`;
                createParticles(item.x + item.width/2, item.y + item.height/2, 20, '#ff4757');
            } else if (item.type === 'door' && gameState.keys > 0) {
                levelComplete();
            }
        }
    });
    
    gameState.enemies.forEach(enemy => {
        enemy.draw(ctx);
    });
    
    gameState.player.draw(ctx);
    
    drawParticles(ctx);
    drawFloatingTexts(ctx);
    
    drawMiniMap();
    
    requestAnimationFrame(gameLoop);
}

function initBackground() {
    drawBackground();
    requestAnimationFrame(initBackground);
}

initBackground();