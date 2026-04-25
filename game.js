// ========== 游戏引擎 ==========
// 玩家尺寸常量
const PLAYER_SIZE = 64;              // 玩家初始大小（像素）
const PLAYER_SIZE_STEP = 8;          // 每次变大/缩小的步长（像素）
const PLAYER_SIZE_MIN = 32;          // 玩家最小尺寸（像素）
const PLAYER_SIZE_MAX = 96;          // 玩家最大尺寸（像素）
const GROUND_HEIGHT = 48;            // 地面高度（像素）

// 玩家初始位置和物理参数
const PLAYER_INIT_X = 400;           // 玩家初始X坐标
const PLAYER_INIT_Y = 0;             // 玩家初始Y坐标
const PLAYER_DECELERATION = 0.5;     // 减速度（每帧）
const PLAYER_JUMP_FORCE = 12;        // 跳跃力度
const PLAYER_GRAVITY = 0.6;          // 重力加速度
const PLAYER_MAX_JUMP_COUNT = 2;     // 最大跳跃次数（二段跳）

// 玩家移动倾斜参数
const PLAYER_TILT_FAST_THRESHOLD = 3;    // 快速移动速度阈值
const PLAYER_TILT_SLOW_THRESHOLD = 0.5;  // 慢速移动速度阈值
const PLAYER_TILT_MAX_ANGLE = 15;        // 最大倾斜角度

// 双击检测参数
const DOUBLE_TAP_TIME_WINDOW = 400;  // 双击时间窗口（毫秒）

// 日夜循环参数
const DAY_NIGHT_CHECK_INTERVAL = 60000;  // 日夜切换检查间隔（毫秒）
const DAY_START_HOUR = 6;                // 白天开始时间（小时）
const DAY_END_HOUR = 18;                 // 白天结束时间（小时）

// 世界生成参数
const WORLD_EXTRA_WIDTH = 200;       // 世界额外宽度（像素）

// 网站卡片默认尺寸
const CARD_DEFAULT_WIDTH = 120;      // 卡片默认宽度
const CARD_DEFAULT_HEIGHT = 120;     // 卡片默认高度

// 管道参数
const PIPE_HAT_HEIGHT = 32;          // 管道帽檐高度
const PIPE_HAT_EXTEND = 16;          // 管道帽檐左右延伸
const PIPE_COLLISION_OFFSET_TOP = 10;    // 管道碰撞顶部偏移
const PIPE_COLLISION_OFFSET_SIDE = 16;   // 管道碰撞左右偏移

// 装饰物默认尺寸
const CLOUD_DEFAULT_WIDTH = 80;      // 云朵默认宽度
const CLOUD_DEFAULT_HEIGHT = 36;     // 云朵默认高度
const BUSH_DEFAULT_WIDTH = 60;       // 灌木默认宽度
const BUSH_DEFAULT_HEIGHT = 24;      // 灌木默认高度
const HILL_DEFAULT_WIDTH = 140;      // 山丘默认宽度
const HILL_DEFAULT_HEIGHT = 55;      // 山丘默认高度

// 气泡提示参数
const BUBBLE_DISPLAY_DURATION = 2000;    // 气泡显示时长（毫秒）

// 方块震动参数
const SHAKE_ANIMATION_DURATION = 500;    // 震动动画时长（毫秒）

// 砖块碎裂参数
const BLOCK_BREAK_COLS = 4;          // 碎裂列数
const BLOCK_BREAK_ROWS = 4;          // 碎裂行数
const FRAGMENT_FLY_DURATION_MIN = 0.4;   // 碎片飞行最短时长（秒）
const FRAGMENT_FLY_DURATION_MAX = 0.4;   // 碎片飞行随机时长范围（秒）
const FRAGMENT_FLY_DELAY_MAX = 0.05;     // 碎片飞行延迟最大值（秒）

// 碰撞检测参数
const COLLISION_TOLERANCE = 0;       // 碰撞容差
const COLLISION_POSITION_OFFSET = 1; // 碰撞后位置偏移

// 玩家移动速度参数
const TAP_SPEED = 3;                 // 单次按键速度
const CONTINUOUS_ACCEL = 0.4;        // 连续加速
const CONTINUOUS_MAX = 10;           // 连续移动最大速度
const SPEED_BONUS_FACTOR = 0.3;      // 速度加成系数（跳跃时水平速度的加成）

// 游戏导航器类 - 管理整个游戏的核心逻辑
class GameNavigator {
    constructor() {
        // 初始化玩家尺寸的CSS变量
        document.documentElement.style.setProperty('--player-size', PLAYER_SIZE + 'px');
        this.currentPlayerSize = PLAYER_SIZE;  // 当前玩家尺寸
        this.totalCoins = 0;                    // 总金币数
        
        // 玩家状态对象
        this.player = {
            x: PLAYER_INIT_X,         // 玩家X坐标
            y: PLAYER_INIT_Y,         // 玩家Y坐标
            deceleration: PLAYER_DECELERATION,  // 减速度（每帧）
            velocityX: 0,              // 水平速度
            jumping: false,            // 是否正在跳跃
            jumpCount: 0,              // 当前跳跃次数（用于二段跳）
            maxJumpCount: PLAYER_MAX_JUMP_COUNT,  // 最大跳跃次数（二段跳）
            jumpForce: PLAYER_JUMP_FORCE,  // 跳跃力度
            gravity: PLAYER_GRAVITY,   // 重力加速度
            velocityY: 0,              // 垂直速度
            groundY: 0,                // 地面Y坐标
            element: null,             // 玩家DOM元素
            direction: 1               // 玩家朝向：1=向右，-1=向左
        };
        
        // 键盘状态
        this.keys = {};                                    // 当前按下的键
        this.jumpKeyHeld = false;                          // 跳跃键是否按住
        this.doubleTap = { arrowleft: false, arrowright: false };  // 双击方向键状态
        this.lastTapTime = { arrowleft: 0, arrowright: 0 };        // 上次按键时间
        this.keyReleased = { arrowleft: true, arrowright: true };  // 按键是否已释放
        
        this.siteCards = [];       // 网站卡片数组（用于碰撞检测）
        this.mapElement = null;    // 游戏地图DOM元素
        
        // 初始化游戏
        this.init();
    }

    // 初始化游戏
    init() {
        // 获取DOM元素引用
        this.mapElement = document.getElementById('gameMap');
        this.player.element = document.getElementById('player');
        this.player.transformWrapper = this.player.element.querySelector('.player-transform-wrapper');
        this.bubbleElement = document.getElementById('playerBubble');
        this.bubbleContent = document.getElementById('bubbleContent');
        this.bubbleTimer = null;
        this.helpDialogOpen = false;
        this.cameraX = 0;          // 摄像机X偏移
        this.worldElement = null;  // 世界容器元素

        // 帮助对话框相关元素
        this.helpBtn = document.getElementById('helpBtn');
        this.helpDialog = document.getElementById('helpDialog');
        this.helpCloseBtn = document.getElementById('helpClose');
        
        // 绑定帮助对话框事件
        this.helpBtn.addEventListener('click', () => this.showHelpDialog());
        this.helpCloseBtn.addEventListener('click', () => this.hideHelpDialog());
        this.helpDialog.querySelector('.dialog-overlay').addEventListener('click', () => this.hideHelpDialog());

        // 计算世界宽度并创建世界容器
        const mapRect = this.mapElement.getBoundingClientRect();
        this.worldWidth = this.calculateWorldWidth(mapRect);

        this.worldElement = document.createElement('div');
        this.worldElement.className = 'game-world';
        this.worldElement.style.width = this.worldWidth + 'px';

        // 创建地面装饰
        this.createGroundDecor(mapRect.height);

        // 将玩家移入世界容器，并插入到地图最前面
        this.player.element.remove();
        this.worldElement.appendChild(this.player.element);
        this.mapElement.insertBefore(this.worldElement, this.mapElement.firstChild);

        // 创建网站卡片
        this.createSiteCards();
        // 绑定键盘事件
        this.bindKeys();
        
        // 更新网站计数显示
        const websiteCount = sites.filter(s => s.category === 'website').length;
        document.getElementById('siteCount').textContent = websiteCount;
        
        // 设置玩家初始位置为地面上方
        this.player.groundY = mapRect.height - GROUND_HEIGHT - this.currentPlayerSize;
        this.player.y = this.player.groundY;
        
        // 启动游戏循环
        this.gameLoop();
        // 监听窗口大小变化
        window.addEventListener('resize', () => this.handleResize());
        this.handleResize();
        // 初始化日夜循环
        this.initDayNightCycle();
    }

    // 计算世界宽度（根据站点位置动态计算）
    calculateWorldWidth(mapRect) {
        const maxXFromSites = sites.reduce((max, s) => {
            const w = s.size ? s.size.width : CARD_DEFAULT_WIDTH;
            return Math.max(max, s.position.x + w);
        }, 0);
        return Math.max(mapRect.width, maxXFromSites + WORLD_EXTRA_WIDTH);
    }

    // 初始化日夜循环系统
    initDayNightCycle() {
        this.updateDayNightTheme();
        setInterval(() => this.updateDayNightTheme(), DAY_NIGHT_CHECK_INTERVAL);
    }

    // 更新日夜主题（根据当前时间切换白天/黑夜样式）
    updateDayNightTheme() {
        const hours = new Date().getHours();
        const isNight = hours < DAY_START_HOUR || hours >= DAY_END_HOUR;
        
        if (isNight) {
            document.body.classList.add('night');
        } else {
            document.body.classList.remove('night');
        }
    }

    // 创建管道的两个碰撞矩形（帽檐和主体）
    createPipeRects(card) {
        return {
            hat: {
                x: card.x - PIPE_HAT_EXTEND,
                y: card.y - PIPE_HAT_EXTEND,
                width: card.width + PIPE_HAT_EXTEND * 2,
                height: PIPE_HAT_HEIGHT
            },
            body: {
                x: card.x,
                y: card.y + PIPE_HAT_HEIGHT - PIPE_HAT_EXTEND,
                width: card.width,
                height: card.height - (PIPE_HAT_HEIGHT - PIPE_HAT_EXTEND)
            }
        };
    }

    // 计算两个矩形的重叠区域（四个方向的重叠量）
    calculateOverlap(playerRect, cardRect) {
        return {
            left: (playerRect.x + playerRect.width) - cardRect.x,       // 左侧重叠
            right: (cardRect.x + cardRect.width) - playerRect.x,        // 右侧重叠
            top: (playerRect.y + playerRect.height) - cardRect.y,       // 顶部重叠
            bottom: (cardRect.y + cardRect.height) - playerRect.y       // 底部重叠
        };
    }

    // 获取最小重叠方向（用于判断碰撞方向）
    getMinOverlapDirection(overlap) {
        const min = Math.min(overlap.left, overlap.right, overlap.top, overlap.bottom);
        return { min, direction: min === overlap.left ? 'left' : min === overlap.right ? 'right' : min === overlap.top ? 'top' : 'bottom' };
    }

    // 处理碰撞响应（根据碰撞方向调整玩家位置）
    handleCollisionResponse(playerRect, useRect, overlap, hitCard) {
        const { min, direction } = this.getMinOverlapDirection(overlap);
        let hitFromBelow = null;
        let onPlatform = false;

        if (direction === 'bottom' && this.player.velocityY < 0) {
            // 从下方碰撞：玩家向上顶到方块底部
            hitFromBelow = hitCard;
            this.player.y = useRect.y + useRect.height + COLLISION_POSITION_OFFSET;
            this.player.velocityY = 0;
        } else if (direction === 'top' && this.player.velocityY >= 0) {
            // 从上方碰撞：玩家落到方块顶部
            this.player.y = useRect.y - playerRect.height - COLLISION_POSITION_OFFSET;
            this.player.velocityY = 0;
            this.player.jumping = false;
            this.player.jumpCount = 0;
            onPlatform = true;
        } else if (direction === 'left' || direction === 'right') {
            // 侧边碰撞：将玩家推出方块
            this.player.x = direction === 'left' 
                ? useRect.x - playerRect.width - COLLISION_POSITION_OFFSET 
                : useRect.x + useRect.width + COLLISION_POSITION_OFFSET;
        }

        return { hitFromBelow, onPlatform };
    }

    // 处理管道碰撞检测（管道有帽檐和主体两个碰撞区域）
    handlePipeCollision(playerRect, card, isTransparent) {
        const { hat, body } = this.createPipeRects(card);
        const hitHat = this.isColliding(playerRect, hat, COLLISION_TOLERANCE);
        const hitBody = this.isColliding(playerRect, body, COLLISION_TOLERANCE);

        // 没有碰撞则直接返回
        if (!hitHat && !hitBody) {
            return { hitFromBelow: null, onPlatform: false };
        }

        // 如果是透明管道且未显示，碰撞后立即显示
        if (isTransparent && !card.revealed) {
            card.revealed = true;
            card.element.classList.add('revealed');
        }

        let useRect, overlap;

        if (hitHat && hitBody) {
            // 同时碰撞帽檐和主体，使用重叠更大的区域
            const hatOverlap = this.calculateOverlap(playerRect, hat);
            const bodyOverlap = this.calculateOverlap(playerRect, body);
            const hatMin = Math.min(hatOverlap.left, hatOverlap.right, hatOverlap.top, hatOverlap.bottom);
            const bodyMin = Math.min(bodyOverlap.left, bodyOverlap.right, bodyOverlap.top, bodyOverlap.bottom);

            if (hatMin <= bodyMin) {
                useRect = hat;
                overlap = hatOverlap;
            } else {
                useRect = body;
                overlap = bodyOverlap;
            }
        } else {
            // 只碰撞一个区域
            useRect = hitHat ? hat : body;
            overlap = this.calculateOverlap(playerRect, useRect);
        }

        return this.handleCollisionResponse(playerRect, useRect, overlap, card);
    }

    createSiteCards() {
        const mapHeight = this.mapElement.getBoundingClientRect().height;

        sites.forEach((site) => {
            if (site.category === 'cloud') {
                this.createDecorElement('bg-cloud', site, mapHeight, {
                    widthProp: '--cloud-w',
                    heightProp: '--cloud-h',
                    defaultWidth: CLOUD_DEFAULT_WIDTH,
                    defaultHeight: CLOUD_DEFAULT_HEIGHT
                });
                return;
            }

            if (site.category === 'bush') {
                this.createDecorElement('bg-bush', site, mapHeight, {
                    widthProp: '--bush-w',
                    heightProp: '--bush-h',
                    defaultWidth: BUSH_DEFAULT_WIDTH,
                    defaultHeight: BUSH_DEFAULT_HEIGHT
                });
                return;
            }

            if (site.category === 'hill') {
                this.createDecorElement('bg-hill', site, mapHeight, {
                    defaultWidth: HILL_DEFAULT_WIDTH,
                    defaultHeight: HILL_DEFAULT_HEIGHT,
                    useDirectStyle: true
                });
                return;
            }

            this.createCardElement(site, mapHeight);
        });
    }

    createDecorElement(className, site, mapHeight, options) {
        const element = document.createElement('div');
        element.className = className;
        
        const w = site.size ? site.size.width : options.defaultWidth;
        const h = site.size ? site.size.height : options.defaultHeight;

        if (options.widthProp) {
            element.style.setProperty(options.widthProp, w + 'px');
        } else if (options.useDirectStyle) {
            element.style.width = w + 'px';
        }

        if (options.heightProp) {
            element.style.setProperty(options.heightProp, h + 'px');
        } else if (options.useDirectStyle) {
            element.style.height = h + 'px';
        }

        element.style.left = site.position.x + 'px';
        const y = site.position.y != null ? site.position.y : (mapHeight - GROUND_HEIGHT - h);
        element.style.top = y + 'px';

        if (site.color) element.style.background = site.color;
        if (site.opacity != null) element.style.opacity = site.opacity;

        this.worldElement.appendChild(element);
    }

    createCardElement(site, mapHeight) {
        const card = document.createElement('div');
        card.className = 'site-card ' + site.category;
        if (site.category !== 'pipe') {
            card.style.background = site.color;
        }
        card.style.left = site.position.x + 'px';
        card.style.top = site.position.y + 'px';

        const cardWidth = site.size ? site.size.width : CARD_DEFAULT_WIDTH;
        const cardHeight = site.category === 'pipe'
            ? mapHeight - GROUND_HEIGHT - site.position.y
            : (site.size ? site.size.height : CARD_DEFAULT_HEIGHT);
        card.style.width = cardWidth + 'px';
        card.style.height = cardHeight + 'px';

        card.title = site.description;
        card.innerHTML = `
            <div class="site-icon">${site.icon}</div>
            <div class="site-name">${site.name}</div>
        `;

        if (site.transparent) {
            card.style.opacity = '0';
            card.style.pointerEvents = 'none';
        }

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
            collisionOffsetTop: site.category === 'pipe' ? PIPE_COLLISION_OFFSET_TOP : 0,
            collisionOffsetLeft: site.category === 'pipe' ? PIPE_COLLISION_OFFSET_SIDE : 0,
            collisionOffsetRight: site.category === 'pipe' ? PIPE_COLLISION_OFFSET_SIDE : 0,
            transparent: site.transparent === true,
            revealed: false
        });
    }

    createGroundDecor(mapHeight) {
        // 地面 - 铺满世界宽度
        const ground = document.createElement('div');
        ground.className = 'bg-ground';
        this.worldElement.appendChild(ground);
    }

    bindKeys() {
        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;

            if (['arrowleft', 'arrowright', 'arrowup', ' '].includes(key)) {
                e.preventDefault();
            }

            // 检测连续按两次：上次按键松开过 且 在时间窗口内再次按下
            if ((key === 'arrowleft' || key === 'arrowright') && !e.repeat) {
                const now = Date.now();
                if (this.keyReleased[key] && (now - this.lastTapTime[key]) < DOUBLE_TAP_TIME_WINDOW) {
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
        const mapRect = this.mapElement.getBoundingClientRect();
        this.worldWidth = this.calculateWorldWidth(mapRect);
        this.worldElement.style.width = this.worldWidth + 'px';

        this.siteCards.forEach(card => {
            if (card.data.category === 'pipe') {
                card.height = mapRect.height - GROUND_HEIGHT - card.y;
                card.element.style.height = card.height + 'px';
            }
        });

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

    // 更新玩家位置和旋转角度
    updatePlayerPosition() {
        this.player.element.style.left = this.player.x + 'px';
        this.player.element.style.top = this.player.y + 'px';

        // 跳跃时：保持跳跃前的方向，不旋转
        if (this.player.jumping) {
            this.player.transformWrapper.style.transform = `scaleX(${this.player.direction})`;
            return;
        }
        
        const velocity = this.player.velocityX;
        let direction = this.player.direction;
        let transform = '';

        if (velocity > PLAYER_TILT_FAST_THRESHOLD) {
            // 向右快速移动：添加向右倾斜效果
            direction = 1;
            const tilt = Math.min((velocity - PLAYER_TILT_FAST_THRESHOLD) * 2, PLAYER_TILT_MAX_ANGLE);
            transform = `scaleX(1) rotate(${tilt}deg)`;
        } else if (velocity < -PLAYER_TILT_FAST_THRESHOLD) {
            // 向左快速移动：添加向左倾斜效果
            // 注意：scaleX(-1) 会翻转坐标系，所以需要用正的 tilt 值来实现向左倾斜的视觉效果
            direction = -1;
            const tilt = Math.min((Math.abs(velocity) - PLAYER_TILT_FAST_THRESHOLD) * 2, PLAYER_TILT_MAX_ANGLE);
            transform = `scaleX(-1) rotate(${tilt}deg)`;
        } else if (velocity > PLAYER_TILT_SLOW_THRESHOLD) {
            // 向右慢速移动：不倾斜
            direction = 1;
            transform = `scaleX(1)`;
        } else if (velocity < -PLAYER_TILT_SLOW_THRESHOLD) {
            // 向左慢速移动：不倾斜
            direction = -1;
            transform = `scaleX(-1)`;
        } else {
            // 静止状态：保持当前方向
            transform = `scaleX(${direction})`;
        }

        this.player.direction = direction;
        this.player.transformWrapper.style.transform = transform;
    }

    checkCollisions() {
        const playerRect = {
            x: this.player.x,
            y: this.player.y,
            width: this.currentPlayerSize,
            height: this.currentPlayerSize
        };

        let hitCardFromBelow = null;
        let onPlatform = false;

        this.siteCards.forEach(card => {
            let result = null;

            if (card.transparent && !card.revealed) {
                const cardRect = {
                    x: card.x - (card.collisionOffsetLeft || 0),
                    y: card.y - card.collisionOffsetTop,
                    width: card.width + (card.collisionOffsetLeft || 0) + (card.collisionOffsetRight || 0),
                    height: card.height + card.collisionOffsetTop
                };

                if (this.isColliding(playerRect, cardRect, COLLISION_TOLERANCE)) {
                    if (card.data.category === 'pipe') {
                        result = this.handlePipeCollision(playerRect, card, true);
                    } else {
                        const overlap = this.calculateOverlap(playerRect, cardRect);
                        const { min, direction } = this.getMinOverlapDirection(overlap);
                        
                        if (direction === 'bottom' && this.player.velocityY < 0) {
                            hitCardFromBelow = card;
                            card.revealed = true;
                            card.element.classList.add('revealed');
                            this.player.y = cardRect.y + cardRect.height + COLLISION_POSITION_OFFSET;
                            this.player.velocityY = 0;
                        }
                    }
                }
                return;
            }

            if (card.data.category === 'pipe') {
                result = this.handlePipeCollision(playerRect, card, false);
            } else {
                const offsetTop = card.collisionOffsetTop;
                const offsetLeft = card.collisionOffsetLeft || 0;
                const offsetRight = card.collisionOffsetRight || 0;
                const cardRect = {
                    x: card.x - offsetLeft,
                    y: card.y - offsetTop,
                    width: card.width + offsetLeft + offsetRight,
                    height: card.height + offsetTop
                };

                if (this.isColliding(playerRect, cardRect, COLLISION_TOLERANCE)) {
                    const overlap = this.calculateOverlap(playerRect, cardRect);
                    result = this.handleCollisionResponse(playerRect, cardRect, overlap, card);
                }
            }

            if (result) {
                if (result.hitFromBelow) {
                    hitCardFromBelow = result.hitFromBelow;
                }
                if (result.onPlatform) {
                    onPlatform = true;
                }
            }
        });

        // 更新玩家的 onPlatform 状态
        this.player.onPlatform = onPlatform;

        // 只有从下方碰撞才触发震动和对应效果
        if (hitCardFromBelow) {
            // 如果是透明方块且未显示，先显示它
            if (hitCardFromBelow.transparent && !hitCardFromBelow.revealed) {
                hitCardFromBelow.revealed = true;
                hitCardFromBelow.element.classList.add('revealed');
            }

            const category = hitCardFromBelow.data.category;
            
            // 先给方块添加震动效果
            this.shakeCard(hitCardFromBelow.element);
            
            // 根据方块类型处理碰撞效果
            if (category === 'grow') {
                // 变大方块：玩家变大
                this.changePlayerSize(PLAYER_SIZE_STEP);
                this.player.velocityY = 0;
            } else if (category === 'shrink') {
                // 缩小方块：玩家缩小
                this.changePlayerSize(-PLAYER_SIZE_STEP);
                this.player.velocityY = 0;
            } else if (category === 'coin') {
                // 金币方块：收集金币
                this.collectCoin(hitCardFromBelow);
                this.player.velocityY = 0;
            } else if (category === 'pipe') {
                // 水管：只停止向上移动，不弹出对话框
                this.player.velocityY = 0;
            } else if (category === 'block') {
                // 砖块：如果玩家足够大则打破砖块
                if (this.currentPlayerSize >= PLAYER_SIZE_MAX) {
                    this.breakCard(hitCardFromBelow);
                }
                this.player.velocityY = 0;
            } else if (category === 'website') {
                // 网站卡片：弹出对话框
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
        }, BUBBLE_DISPLAY_DURATION);
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
        cardElement.style.animation = `shake ${SHAKE_ANIMATION_DURATION}ms ease-in-out`;
        
        setTimeout(() => {
            cardElement.style.animation = '';
        }, SHAKE_ANIMATION_DURATION);
    }

    breakCard(cardObj) {
        const el = cardObj.element;
        const cardW = cardObj.width;
        const cardH = cardObj.height;
        const relX = cardObj.x;
        const relY = cardObj.y;

        const cols = BLOCK_BREAK_COLS;
        const rows = BLOCK_BREAK_ROWS;
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
                frag.style.animation = `fragmentFly ${FRAGMENT_FLY_DURATION_MIN + Math.random() * FRAGMENT_FLY_DURATION_MAX}s ease-out forwards`;
                frag.style.animationDelay = (Math.random() * FRAGMENT_FLY_DELAY_MAX) + 's';

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

        const leftKey = this.keys['arrowleft'];
        const rightKey = this.keys['arrowright'];

        if (leftKey || rightKey) {
            const direction = leftKey ? -1 : 1;
            const doubleTapKey = leftKey ? this.doubleTap.arrowleft : this.doubleTap.arrowright;

            if (doubleTapKey) {
                this.player.velocityX += CONTINUOUS_ACCEL * direction;
                const maxVelocity = CONTINUOUS_MAX * direction;
                if ((direction === -1 && this.player.velocityX < maxVelocity) ||
                    (direction === 1 && this.player.velocityX > maxVelocity)) {
                    this.player.velocityX = maxVelocity;
                }
            } else {
                const targetSpeed = TAP_SPEED * direction;
                if ((direction === -1 && this.player.velocityX > targetSpeed) ||
                    (direction === 1 && this.player.velocityX < targetSpeed)) {
                    this.player.velocityX = targetSpeed;
                }
            }
        } else {
            if (this.player.velocityX > 0) {
                this.player.velocityX = Math.max(0, this.player.velocityX - this.player.deceleration);
            } else if (this.player.velocityX < 0) {
                this.player.velocityX = Math.min(0, this.player.velocityX + this.player.deceleration);
            }
        }

        const jumpKeyPressed = this.keys[' '] || this.keys['arrowup'];
        if (jumpKeyPressed && !this.jumpKeyHeld && this.player.jumpCount < this.player.maxJumpCount) {
            this.player.jumping = true;
            this.player.jumpCount++;
            const speedBonus = Math.abs(this.player.velocityX) * SPEED_BONUS_FACTOR;
            this.player.velocityY = -(this.player.jumpForce + speedBonus);
        }
        this.jumpKeyHeld = jumpKeyPressed;

        if (this.player.jumping || !this.player.onPlatform) {
            this.player.velocityY += this.player.gravity;
            this.player.y += this.player.velocityY;

            if (this.player.y >= this.player.groundY) {
                this.player.y = this.player.groundY;
                this.player.jumping = false;
                this.player.jumpCount = 0;
                this.player.velocityY = 0;
            }
        }

        this.player.x += this.player.velocityX;
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
