// 网站配置数据 - 易于扩展
const sites = [
    // === 云朵：背景装饰，不参与碰撞 ===
    {
        name: "云朵",
        description: "背景装饰",
        icon: "",
        color: "",
        position: { x: 60, y: 60 },
        size: { width: 80, height: 36 },
        category: "cloud"
    },
    {
        name: "云朵",
        description: "背景装饰",
        icon: "",
        color: "",
        position: { x: 700, y: 110 },
        size: { width: 110, height: 44 },
        category: "cloud"
    },
    {
        name: "云朵",
        description: "背景装饰",
        icon: "",
        color: "",
        position: { x: 1400, y: 50 },
        size: { width: 80, height: 36 },
        category: "cloud"
    },
    {
        name: "云朵",
        description: "背景装饰",
        icon: "",
        color: "",
        position: { x: 2000, y: 140 },
        size: { width: 110, height: 44 },
        category: "cloud"
    },

    // === 起步区：教学区域 ===
    {
        name: "金币",
        description: "从下方顶一下试试！",
        icon: "💰",
        color: "linear-gradient(135deg, #f5af19 0%, #f12711 100%)",
        position: { x: 150, y: 300 },
        size: { width: 120, height: 120 },
        category: "coin",
        coins: 10,
        mario: "新手运气不错嘛！一口气 10 枚！"
    },
    {
        name: "DOS 游戏",
        url: "https://dos.wpz.homes/",
        description: "DOS 经典游戏模拟器，重返 80、90 年代",
        icon: "💻",
        color: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
        position: { x: 400, y: 300 },
        size: { width: 120, height: 120 },
        category: "website"
    },
    {
        name: "砖块",
        description: "我是一块砖，哪里需要往哪搬！",
        icon: "🧱",
        color: "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)",
        position: { x: 600, y: 300 },
        size: { width: 120, height: 120 },
        category: "block"
    },

    // === 第一平台区：初次攀爬 ===
    {
        name: "金币",
        description: "跳上来获取奖励！",
        icon: "💰",
        color: "linear-gradient(135deg, #f5af19 0%, #f12711 100%)",
        position: { x: 800, y: 480 },
        size: { width: 120, height: 120 },
        category: "coin",
        coins: 15,
        mario: "哇哦！一发入魂 10 金币！"
    },
    {
        name: "FC 游戏",
        url: "https://nes.wpz.homes/",
        description: "FC/NES 红白机游戏，魂斗罗、超级玛丽等经典回忆",
        icon: "👾",
        color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        position: { x: 800, y: 100 },
        size: { width: 120, height: 120 },
        category: "website"
    },
    {
        name: "管道",
        description: "跳上去才能通过！",
        icon: "",
        color: "",
        position: { x: 935, y: 700 },
        size: { width: 100 },
        category: "pipe"
    },
    {
        name: "变大蘑菇",
        description: "顶一下变大一次",
        icon: "🔴",
        color: "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
        position: { x: 1050, y: 300 },
        size: { width: 120, height: 120 },
        category: "grow",
        mario: "你是要上天吗？还想继续变大？"
    },
    {
        name: "金币",
        description: "双跳才能到这里！",
        icon: "💰",
        color: "linear-gradient(135deg, #f5af19 0%, #f12711 100%)",
        position: { x: 1250, y: 100 },
        size: { width: 120, height: 120 },
        category: "coin",
        coins: 20,
        mario: "双跳的奖励！10 金币到手！"
    },

    // === 挑战区：小心障碍 ===
    {
        name: "变小蘑菇",
        description: "顶一下变小一次",
        icon: "🔵",
        color: "linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)",
        position: { x: 1450, y: 300 },
        size: { width: 120, height: 120 },
        category: "shrink",
        mario: "还顶！再小你就看不到我了！"
    },
    {
        name: "GBA 2.0",
        url: "https://gba.wpz.homes/",
        description: "GBA 游戏模拟器，掌机经典随时畅玩",
        icon: "🕹️",
        color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        position: { x: 1650, y: 100 },
        size: { width: 120, height: 120 },
        category: "website"
    },
    {
        name: "砖块",
        description: "我是一块砖，哪里需要往哪搬！",
        icon: "🧱",
        color: "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)",
        position: { x: 1650, y: 480 },
        size: { width: 120, height: 120 },
        category: "block"
    },

    // === 最终冲刺：登顶 ===
    {
        name: "管道",
        description: "跳上去才能通过！",
        icon: "",
        color: "",
        position: { x: 1785, y: 600 },
        size: { width: 100 },
        category: "pipe"
    },
    {
        name: "ONS 游戏",
        url: "https://ons.wpz.homes/",
        description: "ONS 模拟器，视觉小说和 AVG 游戏在线运行",
        icon: "📦",
        color: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
        position: { x: 1900, y: 300 },
        size: { width: 120, height: 120 },
        category: "website"
    },
    {
        name: "砖块",
        description: "我是一块砖，哪里需要往哪搬！",
        icon: "🧱",
        color: "linear-gradient(135deg, #8B4513 0%, #A0522D 100%)",
        position: { x: 2100, y: 300 },
        size: { width: 120, height: 120 },
        category: "block"
    },
    {
        name: "金币",
        description: "取之不尽的宝藏！",
        icon: "💰",
        color: "linear-gradient(135deg, #f5af19 0%, #f12711 100%)",
        position: { x: 2100, y: 100 },
        size: { width: 120, height: 120 },
        category: "coin",
        coins: Infinity,
        mario: "永动机！10 金币源源不断！"
    },
    {
        name: "Wii Menu",
        url: "https://wii.wpz.homes/",
        description: "Wii 游戏在线平台，重温经典体感游戏的乐趣",
        icon: "🎮",
        color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        position: { x: 2350, y: 100 },
        size: { width: 120, height: 120 },
        category: "website"
    }
];

// 可以添加更多网站...
// 只需按照上面的格式添加新的配置对象即可
