// 网站配置数据 - 易于扩展
const sites = [
    {
        id: 1,
        name: "Wii Menu",
        url: "https://wii.wpz.homes/",
        description: "Wii 游戏在线平台，重温经典体感游戏的乐趣",
        icon: "🎮",
        color: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        position: { x: 100, y: 100 },
        size: { width: 120, height: 120 },
        category: "website"
    },
    {
        id: 2,
        name: "GBA 2.0",
        url: "https://gba.wpz.homes/",
        description: "GBA 游戏模拟器，掌机经典随时畅玩",
        icon: "🕹️",
        color: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        position: { x: 300, y: 100 },
        size: { width: 120, height: 120 },
        category: "website"
    },
    {
        id: 3,
        name: "FC 游戏",
        url: "https://nes.wpz.homes/",
        description: "FC/NES 红白机游戏，魂斗罗、超级玛丽等经典回忆",
        icon: "👾",
        color: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        position: { x: 500, y: 100 },
        size: { width: 120, height: 120 },
        category: "website"
    },
    {
        id: 4,
        name: "DOS 游戏",
        url: "https://dos.wpz.homes/",
        description: "DOS 经典游戏模拟器，重返 80、90 年代",
        icon: "💻",
        color: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
        position: { x: 100, y: 300 },
        size: { width: 120, height: 120 },
        category: "website"
    },
    {
        id: 5,
        name: "ONS 游戏",
        url: "https://blog.wpz.homes/xxxxx/",
        description: "ONS 模拟器，视觉小说和 AVG 游戏在线运行",
        icon: "📦",
        color: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
        position: { x: 300, y: 300 },
        size: { width: 120, height: 120 },
        category: "website"
    },
    {
        id: 6,
        name: "金币方块",
        url: "",
        description: "顶一下获得金币",
        icon: "❓",
        color: "linear-gradient(135deg, #f5af19 0%, #f12711 100%)",
        position: { x: 500, y: 300 },
        size: { width: 120, height: 120 },
        category: "block"
    },
    {
        id: 7,
        name: "变大蘑菇",
        url: "",
        description: "顶一下变大一次",
        icon: "🔴",
        color: "linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)",
        position: { x: 1000, y: 300 },
        size: { width: 120, height: 120 },
        category: "grow",
        tip: "你是要上天吗？还想继续变大？"
    },
    {
        id: 8,
        name: "变小蘑菇",
        url: "",
        description: "顶一下变小一次",
        icon: "🔵",
        color: "linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)",
        position: { x: 700, y: 300 },
        size: { width: 120, height: 120 },
        category: "shrink",
        tip: "还顶！再小你就看不到我了！"
    }
];

// 可以添加更多网站...
// 只需按照上面的格式添加新的配置对象即可
