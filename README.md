# ✈️ 飞行物理实验室 | Airplane Physics Lab

一个基于 Three.js + React 的 3D 航空物理互动教育游戏。学生通过学习空气动力学核心概念（重力、升力、阻力、推力、气压与流体），亲手组装飞机并试飞，在 PBL 任务中掌握高中物理知识。

An interactive 3D aerodynamics education game built with Three.js + React. Students learn core physics concepts (gravity, lift, drag, thrust, air pressure) by assembling and flying an airplane.

![Game Preview](https://img.shields.io/badge/Tech-Three.js%20%2B%20React-blue) ![License](https://img.shields.io/badge/License-MIT-green)

## 🎮 游戏流程

1. **任务简报** — 了解学习目标
2. **五大知识站** — 逐步学习重力、升力、阻力、推力、气压
   - 每站都有 3D 可视化演示
   - 知识卡片 + 公式展示
   - 互动答题检验
3. **组装飞机** — 将学到的知识对应到五个飞机部件
4. **试飞测试** — 观察四种力的平衡让飞机飞行

## 🛠 技术栈

- **Three.js** — 3D 渲染（飞机模型、力学箭头、气流线可视化）
- **React 18** — UI 框架
- **Vite** — 构建工具
- **Claude API** — AI 物理老师对话

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/你的用户名/airplane-physics-game.git
cd airplane-physics-game
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置 AI（可选）

游戏在没有 AI 的情况下也能完整运行（所有知识卡片和答题功能都是内置的）。如果想启用 AI 对话功能：

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的 Anthropic API Key：

```
VITE_API_URL=https://api.anthropic.com/v1/messages
VITE_ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
```

> ⚠️ **注意**：直接在前端使用 API Key 仅适合本地开发。生产部署建议使用代理服务器方式（见下方）。

### 4. 启动开发服务器

```bash
npm run dev
```

打开 `http://localhost:3000` 即可开始游戏。

### （可选）使用代理服务器

如果不想在前端暴露 API Key：

```bash
# 终端 1：启动代理
ANTHROPIC_API_KEY=sk-ant-xxx node server.js

# 终端 2：启动前端（.env 中设置 VITE_API_URL=http://localhost:3001/api/messages）
npm run dev
```

代理服务器需要额外安装依赖：

```bash
npm install express cors
```

## 📦 构建部署

```bash
npm run build     # 生成 dist/ 目录
npm run preview   # 本地预览构建结果
```

构建产物在 `dist/` 目录，可以部署到任何静态托管服务（Vercel、Netlify、GitHub Pages 等）。

## 📁 项目结构

```
airplane-physics-game/
├── index.html                  # 入口 HTML
├── package.json
├── vite.config.js
├── server.js                   # API 代理服务器（可选）
├── .env.example                # 环境变量模板
├── .gitignore
└── src/
    ├── main.jsx                # React 入口
    ├── App.jsx                 # 根组件
    └── AirplanePhysicsGame.jsx # 游戏主组件
```

## 🎯 教学覆盖知识点

| 知识站 | 物理概念 | 核心公式 |
|--------|----------|----------|
| 重力 | 万有引力、质量与重力关系 | F = mg |
| 升力 | 伯努利原理、翼型气动 | L = ½ρv²SCₗ |
| 阻力 | 流体阻力、流线型设计 | D = ½ρv²SCd |
| 推力 | 牛顿第三定律、喷气推进 | F = ma |
| 气压 | 伯努利方程、压强与流速 | P₁+½ρv₁² = P₂+½ρv₂² |

## 📄 License

MIT
