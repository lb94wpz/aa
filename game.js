// ========== 游戏引擎 ==========
const PLAYER_SIZE = 64;
const PLAYER_SIZE_STEP = 8;
const PLAYER_SIZE_MIN = 32;
const PLAYER_SIZE_MAX = 96;

class GameNavigator {
    constructor() {
        document.documentElement.style.setProperty('--player-size', PLAYER_SIZE + 'px');
        this.currentPlayerSize = PLAYER_SIZE;
        
        this.player = {
            x: 400,
            y: 0,
            baseSpeed: 5,
            speed: 5,
            maxSpeed: 10,
            acceleration: 0.3,
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
        this.activeCard = null;
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
        
        // 帮助按钮事件
        this.helpBtn = document.getElementById('helpBtn');
        this.helpDialog = document.getElementById('helpDialog');
        this.helpCloseBtn = document.getElementById('helpClose');
        
        this.helpBtn.addEventListener('click', () => this.showHelpDialog());
        this.helpCloseBtn.addEventListener('click', () => this.hideHelpDialog());
        this.helpDialog.querySelector('.dialog-overlay').addEventListener('click', () => this.hideHelpDialog());
        
        // 初始化网站卡片
        this.createSiteCards();
        
        // 绑定键盘事件
        this.bindKeys();
        
        // 更新统计
        const websiteCount = sites.filter(s => s.category === 'website').length;
        document.getElementById('siteCount').textContent = websiteCount;
        
        // 设置玩家初始位置为底部
        const mapRect = this.mapElement.getBoundingClientRect();
        this.player.groundY = mapRect.height - this.currentPlayerSize;
        this.player.y = this.player.groundY;
        
        // 启动游戏循环
        this.gameLoop();
        
        // 窗口大小变化时重新定位
        window.addEventListener('resize', () => this.handleResize());
        
        // 初始定位
        this.handleResize();
    }

    createSiteCards() {
        sites.forEach((site, index) => {
            const card = document.createElement('div');
            card.className = 'site-card';
            card.style.background = site.color;
            card.style.left = site.position.x + 'px';
            card.style.top = site.position.y + 'px';
            
            const cardWidth = site.size ? site.size.width : 120;
            const cardHeight = site.size ? site.size.height : 120;
            card.style.width = cardWidth + 'px';
            card.style.height = cardHeight + 'px';
            
            card.innerHTML = `
                <div class="site-icon">${site.icon}</div>
                <div class="site-name">${site.name}</div>
            `;
            
            // 点击访问
            card.addEventListener('click', () => {
                window.open(site.url, '_blank');
            });
            
            this.mapElement.appendChild(card);
            
            this.siteCards.push({
                element: card,
                data: site,
                x: site.position.x,
                y: site.position.y,
                width: cardWidth,
                height: cardHeight
            });
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
        // 确保玩家在地图范围内
        const mapRect = this.mapElement.getBoundingClientRect();
        this.player.x = Math.min(Math.max(this.player.x, 0), mapRect.width - this.currentPlayerSize);
        this.player.groundY = Math.min(this.player.groundY, mapRect.height - this.currentPlayerSize);
        
        this.updatePlayerPosition();
    }

    updatePlayerPosition() {
        this.player.element.style.left = this.player.x + 'px';
        this.player.element.style.top = this.player.y + 'px';

        this.updateBubblePosition();
        
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
            const cardRect = {
                x: card.x,
                y: card.y,
                width: card.width,
                height: card.height
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
            } else if (category === 'block') {
                this.shakeCard(hitCardFromBelow.element);
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
                ? sites.find(s => s.category === 'grow')?.tip || '已经是最大了！'
                : sites.find(s => s.category === 'shrink')?.tip || '已经是最小了！';
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
        const maxY = mapRect.height - newSize;
        if (this.player.y > maxY) {
            this.player.y = maxY;
        }
        const maxX = mapRect.width - newSize;
        if (this.player.x > maxX) {
            this.player.x = maxX;
        }

        // 更新地面位置
        this.player.groundY = mapRect.height - newSize;
    }

    showBubble(text) {
        if (!this.bubbleElement || !this.bubbleContent) return;

        this.bubbleContent.textContent = text;
        this.bubbleElement.classList.add('visible');

        this.updateBubblePosition();

        if (this.bubbleTimer) {
            clearTimeout(this.bubbleTimer);
        }

        this.bubbleTimer = setTimeout(() => {
            this.hideBubble();
        }, 2000);
    }

    updateBubblePosition() {
        // 气泡框现在使用 CSS 定位，不需要 JavaScript 更新位置
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
        cardElement.offsetHeight; // 触发重排
        cardElement.style.animation = 'shake 0.5s ease-in-out';
        
        // 动画结束后清除
        setTimeout(() => {
            cardElement.style.animation = '';
        }, 500);
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
        const mapRect = this.mapElement.getBoundingClientRect();
        const maxX = mapRect.width - this.currentPlayerSize;
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
        this.checkCollisions();

        requestAnimationFrame(() => this.gameLoop());
    }
}

// ========== 启动游戏 ==========
document.addEventListener('DOMContentLoaded', () => {
    new GameNavigator();
});
