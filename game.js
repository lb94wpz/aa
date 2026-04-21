// ========== 游戏引擎 ==========
const PLAYER_SIZE = 64;

class GameNavigator {
    constructor() {
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
        this.siteCards = [];
        this.activeCard = null;
        this.mapElement = null;
        
        this.init();
    }

    init() {
        this.mapElement = document.getElementById('gameMap');
        this.player.element = document.getElementById('player');
        
        // 初始化网站卡片
        this.createSiteCards();
        
        // 绑定键盘事件
        this.bindKeys();
        
        // 更新统计
        document.getElementById('siteCount').textContent = sites.length;
        
        // 设置玩家初始位置为底部
        const mapRect = this.mapElement.getBoundingClientRect();
        this.player.groundY = mapRect.height - PLAYER_SIZE;
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
            
            card.innerHTML = `
                <div class="site-icon">${site.icon}</div>
                <div class="site-name">${site.name}</div>
            `;
            
            // 点击访问
            card.addEventListener('click', () => {
                window.open(site.url, '_blank');
            });
            
            // 鼠标悬停显示信息
            card.addEventListener('mouseenter', () => {
                this.showInfo(site);
            });
            
            card.addEventListener('mouseleave', () => {
                if (this.activeCard !== site) {
                    this.hideInfo();
                }
            });
            
            this.mapElement.appendChild(card);
            
            this.siteCards.push({
                element: card,
                data: site,
                x: site.position.x,
                y: site.position.y,
                width: 120,
                height: 120
            });
        });
    }

    bindKeys() {
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            // 阻止方向键和空格键滚动页面
            if (['arrowleft', 'arrowright', 'arrowup', ' '].includes(e.key.toLowerCase())) {
                e.preventDefault();
            }
        });

        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }

    handleResize() {
        // 确保玩家在地图范围内
        const mapRect = this.mapElement.getBoundingClientRect();
        this.player.x = Math.min(Math.max(this.player.x, 0), mapRect.width - PLAYER_SIZE);
        this.player.groundY = Math.min(this.player.groundY, mapRect.height - PLAYER_SIZE);
        
        this.updatePlayerPosition();
    }

    updatePlayerPosition() {
        this.player.element.style.left = this.player.x + 'px';
        this.player.element.style.top = this.player.y + 'px';
        
        // 跳跃时：保持跳跃前的方向，不旋转
        if (this.player.jumping) {
            this.player.element.style.transform = `scaleX(${this.player.direction})`;
            return;
        }
        
        // 根据移动速度添加倾斜效果（向右时）
        if (this.player.velocityX > 0.5) {
            this.player.direction = 1;
            const tilt = Math.min(this.player.velocityX * 2, 15);
            this.player.element.style.transform = `scaleX(1) rotate(${tilt}deg)`;
        }
        // 向左移动时的倾斜效果
        else if (this.player.velocityX < -0.5) {
            this.player.direction = -1;
            const tilt = Math.min(Math.abs(this.player.velocityX) * 2, 15);
            this.player.element.style.transform = `scaleX(-1) rotate(${tilt}deg)`;
        }
        // 速度很小时，保持最后的方向
        else {
            this.player.element.style.transform = `scaleX(${this.player.direction})`;
        }
    }

    checkCollisions() {
        const playerRect = {
            x: this.player.x,
            y: this.player.y,
            width: PLAYER_SIZE,
            height: PLAYER_SIZE
        };

        let foundCard = null;
        let hitCardFromBelow = null;

        this.siteCards.forEach(card => {
            const cardRect = {
                x: card.x,
                y: card.y,
                width: card.width,
                height: card.height
            };

            // 检测碰撞（扩大碰撞范围）
            if (this.isColliding(playerRect, cardRect, 20)) {
                foundCard = card;
                card.element.classList.add('active');
                
                // 检测是否从下方跳跃碰撞（玩家向上跳时撞到卡片底部）
                if (this.player.jumping && this.player.velocityY < 0) {
                    // 玩家顶部进入卡片底部区域（从下方撞上来）
                    // 上一帧玩家在卡片下方，这一帧玩家顶部进入卡片
                    const playerTop = playerRect.y;
                    const cardBottom = cardRect.y + cardRect.height;
                    const cardTop = cardRect.y;
                    
                    // 玩家顶部在卡片底部之上，但在卡片顶部之下，说明是从下方撞上来的
                    if (playerTop < cardBottom && playerTop > cardTop - 20) {
                        hitCardFromBelow = card;
                    }
                }
            } else {
                card.element.classList.remove('active');
            }
        });

        // 处理从下方撞击卡片
        if (hitCardFromBelow) {
            this.hitCardFromBelow(hitCardFromBelow.data, hitCardFromBelow.element);
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
        const maxX = mapRect.width - PLAYER_SIZE;

        // 左右移动（去掉上下移动）
        if (this.keys['arrowleft']) {
            // 连续按键加速
            this.player.velocityX -= this.player.acceleration;
            if (this.player.velocityX < -this.player.maxSpeed) {
                this.player.velocityX = -this.player.maxSpeed;
            }
        } else if (this.keys['arrowright']) {
            // 连续按键加速
            this.player.velocityX += this.player.acceleration;
            if (this.player.velocityX > this.player.maxSpeed) {
                this.player.velocityX = this.player.maxSpeed;
            }
        } else {
            // 没有按键时减速
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
        if (this.player.jumping) {
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
