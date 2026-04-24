// ========== 游戏引擎 ==========
const PLAYER_SIZE = 64;
const PLAYER_SIZE_STEP = 8;
const PLAYER_SIZE_MIN = 32;
const PLAYER_SIZE_MAX = 96;
const GROUND_HEIGHT = 48;

class GameNavigator {
    constructor() {
        document.documentElement.style.setProperty('--player-size', PLAYER_SIZE + 'px');
        this.currentPlayerSize = PLAYER_SIZE;
        this.totalCoins = 0;
        
        this.player = {
            x: 400,
            y: 0,
            deceleration: 0.5,
            velocityX: 0,
            jumping: false,
            jumpCount: 0,
            maxJumpCount: 2,
            jumpForce: 12,
            gravity: 0.6,
            velocityY: 0,
            groundY: 0,
            element: null,
            direction: 1 // 1 表示向右，-1 表示向左
        };
        
        this.keys = {};
        this.jumpKeyHeld = false;
        this.doubleTap = { arrowleft: false, arrowright: false };
        this.lastTapTime = { arrowleft: 0, arrowright: 0 };
        this.keyReleased = { arrowleft: true, arrowright: true };
        this.siteCards = [];
        this.mapElement = null;
        
        this.init();
    }

    init() {
        this.mapElement = document.getElementById('gameMap');
        this.player.element = document.getElementById('player');
        this.player.transformWrapper = this.player.element.querySelector('.player-transform-wrapper');
        this.bubbleElement = document.getElementById('playerBubble');
        this.bubbleContent = document.getElementById('bubbleContent');
        this.bubbleTimer = null;
        this.helpDialogOpen = false;
        this.cameraX = 0;
        this.worldWidth = 0;
        this.worldElement = null;

        // 帮助按钮事件
        this.helpBtn = document.getElementById('helpBtn');
        this.helpDialog = document.getElementById('helpDialog');
        this.helpCloseBtn = document.getElementById('helpClose');
        
        this.helpBtn.addEventListener('click', () => this.showHelpDialog());
        this.helpCloseBtn.addEventListener('click', () => this.hideHelpDialog());
        this.helpDialog.querySelector('.dialog-overlay').addEventListener('click', () => this.hideHelpDialog());

        // 创建世界容器 - 根据sites数据动态计算地图宽度
        const maxXFromSites = sites.reduce((max, s) => {
            const w = s.size ? s.size.width : 120;
            return Math.max(max, s.position.x + w);
        }, 0);
        const initMapRect = this.mapElement.getBoundingClientRect();
        this.worldWidth = Math.max(initMapRect.width, maxXFromSites + 200);

        this.worldElement = document.createElement('div');
        this.worldElement.className = 'game-world';
        this.worldElement.style.width = this.worldWidth + 'px';

        // 创建地面、山丘、灌木 - 随世界滚动
        this.createGroundDecor(initMapRect.height);

        // 将玩家移入世界容器
        this.player.element.remove();
        this.worldElement.appendChild(this.player.element);
        this.mapElement.insertBefore(this.worldElement, this.mapElement.firstChild);

        // 初始化网站卡片
        this.createSiteCards();
        
        // 绑定键盘事件
        this.bindKeys();
        
        // 更新统计
        const websiteCount = sites.filter(s => s.category === 'website').length;
        document.getElementById('siteCount').textContent = websiteCount;
        
        // 设置玩家初始位置为地面上方
        this.player.groundY = initMapRect.height - GROUND_HEIGHT - this.currentPlayerSize;
        this.player.y = this.player.groundY;
        
        // 启动游戏循环
        this.gameLoop();
        
        // 窗口大小变化时重新定位
        window.addEventListener('resize', () => this.handleResize());
        
        // 初始定位
        this.handleResize();
    }

    createSiteCards() {
        const mapHeight = this.mapElement.getBoundingClientRect().height;

        sites.forEach((site) => {
            const card = document.createElement('div');
            card.className = 'site-card ' + site.category;
            if (site.category !== 'pipe') {
                card.style.background = site.color;
            }
            card.style.left = site.position.x + 'px';
            card.style.top = site.position.y + 'px';

            const cardWidth = site.size ? site.size.width : 120;
            const cardHeight = site.category === 'pipe'
                ? mapHeight - GROUND_HEIGHT - site.position.y
                : (site.size ? site.size.height : 120);
            card.style.width = cardWidth + 'px';
            card.style.height = cardHeight + 'px';

            card.title = site.description;
            card.innerHTML = `
                <div class="site-icon">${site.icon}</div>
                <div class="site-name">${site.name}</div>
            `;

            // 点击访问
            card.addEventListener('click', () => {
                if (site.category === 'website') {
                    window.open(site.url, '_blank');
                }
            });

            this.worldElement.appendChild(card);

            this.siteCards.push({
                element: card,
                data: site,
                x: site.position.x,
                y: site.position.y,
                width: cardWidth,
                height: cardHeight,
                // 碰撞框向上扩展的偏移量（管道的 ::before 帽檐向上延伸16px）
                collisionOffsetTop: site.category === 'pipe' ? 10 : 0
            });
        });
    }

    createGroundDecor(mapHeight) {
        // 地面 - 铺满世界宽度
        const ground = document.createElement('div');
        ground.className = 'bg-ground';
        this.worldElement.appendChild(ground);

        // 山丘
        const hills = [
            { left: '2%', width: 200, height: 80, cls: 'bg-hill-far' },
            { left: '20%', width: 140, height: 55, cls: 'bg-hill-near' },
            { left: '42%', width: 180, height: 70, cls: 'bg-hill-far' },
            { left: '68%', width: 120, height: 48, cls: 'bg-hill-near' },
            { left: '82%', width: 160, height: 65, cls: 'bg-hill-far' }
        ];
        hills.forEach(h => {
            const el = document.createElement('div');
            el.className = 'bg-hill ' + h.cls;
            el.style.left = h.left;
            el.style.width = h.width + 'px';
            el.style.height = h.height + 'px';
            this.worldElement.appendChild(el);
        });

        // 灌木
        const bushes = [
            { left: '12%', cls: '' },
            { left: '50%', cls: 'bg-bush-lg' },
            { left: '88%', cls: '' }
        ];
        bushes.forEach(b => {
            const el = document.createElement('div');
            el.className = 'bg-bush ' + b.cls;
            el.style.left = b.left;
            this.worldElement.appendChild(el);
        });
    }

    bindKeys() {
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;

            if (['arrowleft', 'arrowright', 'arrowup', ' '].includes(key)) {
                e.preventDefault();
            }

            // 检测连续按两次：上次按键松开过 且 在400ms内再次按下
            if ((key === 'arrowleft' || key === 'arrowright') && !e.repeat) {
                const now = Date.now();
                if (this.keyReleased[key] && (now - this.lastTapTime[key]) < 400) {
                    this.doubleTap[key] = true;
                }
                this.lastTapTime[key] = now;
                this.keyReleased[key] = false;
            }

            if (e.key === 'Escape') {
                if (this.helpDialogOpen) {
                    this.hideHelpDialog();
                } else if (this.dialogOpen) {
                    this.hideDialog();
                }
            }
        });

        document.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = false;

            if (key === 'arrowleft' || key === 'arrowright') {
                this.keyReleased[key] = true;
                this.doubleTap[key] = false;
            }
        });
    }
    
    showHelpDialog() {
        this.helpDialogOpen = true;
        this.helpDialog.classList.add('visible');
    }
    
    hideHelpDialog() {
        this.helpDialogOpen = false;
        this.helpDialog.classList.remove('visible');
    }

    handleResize() {
        // 重新计算世界宽度
        const mapRect = this.mapElement.getBoundingClientRect();
        const maxXFromSites = sites.reduce((max, s) => {
            const w = s.size ? s.size.width : 120;
            return Math.max(max, s.position.x + w);
        }, 0);
        this.worldWidth = Math.max(mapRect.width, maxXFromSites + 200);
        this.worldElement.style.width = this.worldWidth + 'px';

        // 更新管道高度
        this.siteCards.forEach(card => {
            if (card.data.category === 'pipe') {
                card.height = mapRect.height - GROUND_HEIGHT - card.y;
                card.element.style.height = card.height + 'px';
            }
        });

        // 确保玩家在地图范围内
        this.player.x = Math.min(Math.max(this.player.x, 0), this.worldWidth - this.currentPlayerSize);
        this.player.groundY = Math.min(this.player.groundY, mapRect.height - GROUND_HEIGHT - this.currentPlayerSize);

        this.updateCamera();
        this.updatePlayerPosition();
    }

    updateCamera() {
        const mapRect = this.mapElement.getBoundingClientRect();
        const viewportWidth = mapRect.width;
        const targetCameraX = this.player.x - viewportWidth / 2 + this.currentPlayerSize / 2;
        this.cameraX = Math.max(0, Math.min(targetCameraX, this.worldWidth - viewportWidth));
        this.worldElement.style.transform = `translateX(${-this.cameraX}px)`;
    }

    updatePlayerPosition() {
        this.player.element.style.left = this.player.x + 'px';
        this.player.element.style.top = this.player.y + 'px';

        // 跳跃时：保持跳跃前的方向，不旋转
        if (this.player.jumping) {
            this.player.transformWrapper.style.transform = `scaleX(${this.player.direction})`;
            return;
        }
        
        // 根据移动速度添加倾斜效果（向右时）
        if (this.player.velocityX > 3) {
            this.player.direction = 1;
            const tilt = Math.min((this.player.velocityX - 3) * 2, 15);
            this.player.transformWrapper.style.transform = `scaleX(1) rotate(${tilt}deg)`;
        }
        else if (this.player.velocityX < -3) {
            this.player.direction = -1;
            const tilt = Math.min((Math.abs(this.player.velocityX) - 3) * 2, 15);
            this.player.transformWrapper.style.transform = `scaleX(-1) rotate(${tilt}deg)`;
        }
        else if (this.player.velocityX > 0.5) {
            this.player.direction = 1;
            this.player.transformWrapper.style.transform = `scaleX(1)`;
        }
        else if (this.player.velocityX < -0.5) {
            this.player.direction = -1;
            this.player.transformWrapper.style.transform = `scaleX(-1)`;
        }
        else {
            this.player.transformWrapper.style.transform = `scaleX(${this.player.direction})`;
        }
    }

    checkCollisions() {
        const playerRect = {
            x: this.player.x,
            y: this.player.y,
            width: this.currentPlayerSize,
            height: this.currentPlayerSize
        };

        let hitCardFromBelow = null;
        let hasAnyCollision = false;
        let collidedCards = [];
        let onPlatform = false;

        this.siteCards.forEach(card => {
            const offsetTop = card.collisionOffsetTop;
            const cardRect = {
                x: card.x,
                y: card.y - offsetTop,
                width: card.width,
                height: card.height + offsetTop
            };

            // 检测基础碰撞（不使用 padding，精确检测）
            if (this.isColliding(playerRect, cardRect, 0)) {
                hasAnyCollision = true;
                card.element.classList.add('active');
                collidedCards.push(card);
                
                // 计算碰撞重叠区域
                const overlapLeft = (playerRect.x + playerRect.width) - cardRect.x;
                const overlapRight = (cardRect.x + cardRect.width) - playerRect.x;
                const overlapTop = (playerRect.y + playerRect.height) - cardRect.y;
                const overlapBottom = (cardRect.y + cardRect.height) - playerRect.y;
                
                // 找出最小重叠方向
                const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                
                // 从下方碰撞：玩家向上移动，顶部撞到卡片底部
                if (minOverlap === overlapBottom && this.player.velocityY < 0) {
                    hitCardFromBelow = card;
                    // 将玩家推出到卡片下方
                    this.player.y = cardRect.y + cardRect.height + 1;
                    this.player.velocityY = 0;
                }
                // 从上方碰撞：玩家向下移动，底部撞到卡片顶部
                else if (minOverlap === overlapTop && this.player.velocityY >= 0) {
                    // 将玩家推出到卡片上方
                    this.player.y = cardRect.y - playerRect.height - 1;
                    this.player.velocityY = 0;
                    this.player.jumping = false;
                    this.player.jumpCount = 0;
                    onPlatform = true;
                }
                // 侧边碰撞
                else if (minOverlap === overlapLeft || minOverlap === overlapRight) {
                    // 从左边碰撞：将玩家推出到卡片左侧
                    if (overlapLeft < overlapRight) {
                        this.player.x = cardRect.x - playerRect.width - 1;
                    }
                    // 从右边碰撞：将玩家推出到卡片右侧
                    else {
                        this.player.x = cardRect.x + cardRect.width + 1;
                    }
                    // 停止水平移动
                    this.player.velocityX = 0;
                }
            } else {
                card.element.classList.remove('active');
            }
        });

        // 更新 onPlatform 状态
        this.player.onPlatform = onPlatform;

        // 任何接触都触发震动
        if (hasAnyCollision && collidedCards.length > 0) {
            // 触发第一个碰撞卡片的震动
            this.shakeCard(collidedCards[0].element);
        }

        // 只有从下方碰撞才弹窗（仅对 website 类型）
        if (hitCardFromBelow) {
            const category = hitCardFromBelow.data.category;
            
            if (category === 'grow') {
                this.changePlayerSize(PLAYER_SIZE_STEP);
                this.shakeCard(hitCardFromBelow.element);
                this.player.velocityY = 0;
            } else if (category === 'shrink') {
                this.changePlayerSize(-PLAYER_SIZE_STEP);
                this.shakeCard(hitCardFromBelow.element);
                this.player.velocityY = 0;
            } else if (category === 'coin') {
                this.collectCoin(hitCardFromBelow);
                this.player.velocityY = 0;
            } else if (category === 'pipe') {
                this.player.velocityY = 0;
            } else if (category === 'block') {
                if (this.currentPlayerSize >= PLAYER_SIZE_MAX) {
                    this.breakCard(hitCardFromBelow);
                } else {
                    this.shakeCard(hitCardFromBelow.element);
                }
                this.player.velocityY = 0;
            } else {
                this.hitCardFromBelow(hitCardFromBelow.data, hitCardFromBelow.element);
            }
        }
    }

    changePlayerSize(delta) {
        const currentSize = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--player-size'));
        const newSize = Math.max(PLAYER_SIZE_MIN, Math.min(PLAYER_SIZE_MAX, currentSize + delta));

        const isMax = currentSize >= PLAYER_SIZE_MAX && delta > 0;
        const isMin = currentSize <= PLAYER_SIZE_MIN && delta < 0;

        if (isMax || isMin) {
            const tip = isMax
                ? sites.find(s => s.category === 'grow')?.mario || '已经是最大了！'
                : sites.find(s => s.category === 'shrink')?.mario || '已经是最小了！';
            this.showBubble(tip);
            return;
        }

        if (newSize === currentSize) return;

        document.documentElement.style.setProperty('--player-size', newSize + 'px');

        // 同步更新 JS 中的尺寸（用于碰撞检测）
        // PLAYER_SIZE 是 const，所以用实例属性覆盖
        this.currentPlayerSize = newSize;

        // 调整玩家位置，防止变大时卡进地面
        const mapRect = this.mapElement.getBoundingClientRect();
        const maxY = mapRect.height - GROUND_HEIGHT - newSize;
        if (this.player.y > maxY) {
            this.player.y = maxY;
        }
        const maxX = this.worldWidth - newSize;
        if (this.player.x > maxX) {
            this.player.x = maxX;
        }

        // 更新地面位置
        this.player.groundY = mapRect.height - GROUND_HEIGHT - newSize;
    }

    showBubble(text) {
        if (!this.bubbleElement || !this.bubbleContent) return;

        this.bubbleContent.textContent = text;
        this.bubbleElement.classList.add('visible');

        if (this.bubbleTimer) {
            clearTimeout(this.bubbleTimer);
        }

        this.bubbleTimer = setTimeout(() => {
            this.hideBubble();
        }, 2000);
    }

    hideBubble() {
        if (this.bubbleElement) {
            this.bubbleElement.classList.remove('visible');
        }
    }

    hitCardFromBelow(site, cardElement) {
        // 给方块添加震动效果
        this.shakeCard(cardElement);

        // 立即停止向上移动，开始下落
        this.player.velocityY = 0;

        // 如果对话框已经打开，先关闭当前的，再显示新的
        if (this.dialogOpen) {
            this.hideDialog();
        }

        // 显示对话框
        this.showDialog(site);
    }

    shakeCard(cardElement) {
        cardElement.style.animation = 'none';
        cardElement.offsetHeight;
        cardElement.style.animation = 'shake 0.5s ease-in-out';
        
        setTimeout(() => {
            cardElement.style.animation = '';
        }, 500);
    }

    breakCard(cardObj) {
        const el = cardObj.element;
        const cardW = cardObj.width;
        const cardH = cardObj.height;
        const relX = cardObj.x;
        const relY = cardObj.y;

        const cols = 4;
        const rows = 4;
        const fragW = cardW / cols;
        const fragH = cardH / rows;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const frag = document.createElement('div');
                frag.className = 'block-fragment';
                frag.style.width = fragW + 'px';
                frag.style.height = fragH + 'px';
                frag.style.left = (relX + c * fragW) + 'px';
                frag.style.top = (relY + r * fragH) + 'px';
                frag.style.background = el.style.background || el.style.backgroundColor || '#f5af19';
                frag.style.backgroundSize = `${cardW}px ${cardH}px`;
                frag.style.backgroundPosition = `-${c * fragW}px -${r * fragH}px`;

                const fx = (Math.random() - 0.5) * 200;
                const fy = -(Math.random() * 120 + 30);
                const fr = (Math.random() - 0.5) * 720;
                frag.style.setProperty('--fx', fx + 'px');
                frag.style.setProperty('--fy', fy + 'px');
                frag.style.setProperty('--fr', fr + 'deg');
                frag.style.animation = `fragmentFly ${0.4 + Math.random() * 0.4}s ease-out forwards`;
                frag.style.animationDelay = (Math.random() * 0.05) + 's';

                this.worldElement.appendChild(frag);

                setTimeout(() => frag.remove(), 1000);
            }
        }

        el.classList.add('block-break');
        el.style.pointerEvents = 'none';

        setTimeout(() => {
            el.style.display = 'none';
        }, 200);

        const idx = this.siteCards.indexOf(cardObj);
        if (idx !== -1) {
            this.siteCards.splice(idx, 1);
        }
    }

    collectCoin(card) {
        const infinite = card.data.coins === Infinity;
        // 方块不足10金币永远获取1，否则10%概率获取10
        let reward = 1;
        let lucky = false;
        if ((infinite || card.data.coins >= 10) && Math.random() < 0.1) {
            reward = 10;
            lucky = true;
        }
        if (!infinite) {
            reward = Math.min(reward, card.data.coins);
        }

        if (!infinite) {
            card.data.coins -= reward;
        }
        this.totalCoins += reward;
        document.getElementById('coinCount').textContent = this.totalCoins;

        // 显示获得金币的浮动文字
        const counter = document.getElementById('coinCounter');
        const floater = document.createElement('span');
        floater.className = 'coin-float';
        floater.textContent = '+' + reward;
        counter.appendChild(floater);
        setTimeout(() => floater.remove(), 800);

        // 金币耗尽变为砖块（无限金币方块不会耗尽）
        if (!infinite && card.data.coins <= 0) {
            card.data.category = 'block';
            card.data.name = '砖块';
            card.data.description = '金币已被掏空，只剩一块砖了';
            card.element.querySelector('.site-icon').textContent = '🧱';
            card.element.querySelector('.site-name').textContent = '砖块';
            card.element.style.background = 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)';
            card.element.title = card.data.description;
        } else {
            const remaining = infinite ? '∞' : card.data.coins;
            card.element.title = `还剩 ${remaining} 枚金币`;
        }

        this.shakeCard(card.element);

        // 幸运 10 金币时显示 mario 对话
        if (lucky && card.data.mario) {
            this.showBubble(card.data.mario);
        }
    }

    showDialog(site) {
        this.dialogOpen = true;
        const dialog = document.getElementById('siteDialog');
        document.getElementById('dialogSiteName').textContent = site.name;
        document.getElementById('dialogSiteUrl').textContent = site.url;
        document.getElementById('dialogSiteDescription').textContent = site.description;
        
        // 设置打开按钮事件
        const openBtn = document.getElementById('dialogOpenBtn');
        openBtn.onclick = () => {
            window.open(site.url, '_blank');
            this.hideDialog();
        };
        
        // 设置取消按钮事件
        const cancelBtn = document.getElementById('dialogCancelBtn');
        cancelBtn.onclick = () => {
            this.hideDialog();
        };
        
        dialog.classList.add('visible');
    }

    hideDialog() {
        this.dialogOpen = false;
        const dialog = document.getElementById('siteDialog');
        dialog.classList.remove('visible');
    }

    isColliding(rect1, rect2, padding = 0) {
        return !(
            rect1.x + padding > rect2.x + rect2.width ||
            rect1.x + rect1.width - padding < rect2.x ||
            rect1.y + padding > rect2.y + rect2.height ||
            rect1.y + rect1.height - padding < rect2.y
        );
    }

    gameLoop() {
        const maxX = this.worldWidth - this.currentPlayerSize;
        const TAP_SPEED = 3;
        const CONTINUOUS_ACCEL = 0.4;
        const CONTINUOUS_MAX = 10;

        if (this.keys['arrowleft']) {
            if (this.doubleTap.arrowleft) {
                this.player.velocityX -= CONTINUOUS_ACCEL;
                if (this.player.velocityX < -CONTINUOUS_MAX) {
                    this.player.velocityX = -CONTINUOUS_MAX;
                }
            } else {
                if (this.player.velocityX > -TAP_SPEED) {
                    this.player.velocityX = -TAP_SPEED;
                }
            }
        } else if (this.keys['arrowright']) {
            if (this.doubleTap.arrowright) {
                this.player.velocityX += CONTINUOUS_ACCEL;
                if (this.player.velocityX > CONTINUOUS_MAX) {
                    this.player.velocityX = CONTINUOUS_MAX;
                }
            } else {
                if (this.player.velocityX < TAP_SPEED) {
                    this.player.velocityX = TAP_SPEED;
                }
            }
        } else {
            if (this.player.velocityX > 0) {
                this.player.velocityX -= this.player.deceleration;
                if (this.player.velocityX < 0) this.player.velocityX = 0;
            } else if (this.player.velocityX < 0) {
                this.player.velocityX += this.player.deceleration;
                if (this.player.velocityX > 0) this.player.velocityX = 0;
            }
        }

        // 跳跃（空格键或上方向键）- 速度越快跳跃高度越高
        // 支持二段跳：最多可跳2次，落地后重置
        const jumpKeyPressed = this.keys[' '] || this.keys['arrowup'];
        if (jumpKeyPressed && !this.jumpKeyHeld && this.player.jumpCount < this.player.maxJumpCount) {
            this.player.jumping = true;
            this.player.jumpCount++;
            // 基础跳跃力 + 速度加成（速度越快跳得越高）
            const speedBonus = Math.abs(this.player.velocityX) * 0.3;
            this.player.velocityY = -(this.player.jumpForce + speedBonus);
        }
        this.jumpKeyHeld = jumpKeyPressed;

        // 应用重力
        if (this.player.jumping || !this.player.onPlatform) {
            this.player.velocityY += this.player.gravity;
            this.player.y += this.player.velocityY;

            // 检测是否落地
            if (this.player.y >= this.player.groundY) {
                this.player.y = this.player.groundY;
                this.player.jumping = false;
                this.player.jumpCount = 0;
                this.player.velocityY = 0;
            }
        }

        // 应用水平速度
        this.player.x += this.player.velocityX;

        // 边界检测
        this.player.x = Math.max(0, Math.min(this.player.x, maxX));

        this.updatePlayerPosition();
        this.updateCamera();
        this.checkCollisions();

        requestAnimationFrame(() => this.gameLoop());
    }
}

// ========== 启动游戏 ==========
document.addEventListener('DOMContentLoaded', () => {
    new GameNavigator();
});
