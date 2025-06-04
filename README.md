# 天地图 AI 助手

一个基于天地图 API 的 AI 地图生成应用，用户可以通过自然语言描述来创建和分享地图。

## 功能特点

- 自然语言描述：用户只需用文字描述想要的地图，AI 将理解需求
- AI 智能生成：查看 AI 的思考过程，并获取生成的天地图代码
- 实时预览：在浏览器中实时预览生成的地图
- 一键分享：轻松分享生成的地图给他人

## 技术栈

- 前端：Vue 3 + Pinia + Vue Router + TailwindCSS
- 后端：Node.js + Express + MongoDB
- 地图：天地图 JavaScript API

## 项目结构

```
tianditu-map/
├── client/              # 前端Vue应用
│   ├── src/
│   │   ├── components/  # UI组件
│   │   ├── views/       # 页面视图
│   │   ├── store/       # Pinia状态管理
│   │   ├── services/    # API服务
│   │   └── router/      # 路由配置
│   └── ...
└── server/              # 后端Express应用
    ├── controllers/     # 控制器
    ├── models/          # 数据模型
    ├── routes/          # API路由
    ├── config/          # 配置文件
    └── ...
```

## 快速开始

### 前端

```bash
# 进入前端目录
cd client

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 后端

```bash
# 进入后端目录
cd server

# 安装依赖
npm install

# 创建.env文件
cp .env.example .env

# 启动开发服务器
npm run dev
```

## 使用说明

1. 访问首页，点击"开始创建地图"
2. 在聊天面板中输入地图描述，如"显示北京市中心，并标记故宫"
3. 点击"生成地图"按钮
4. 查看 AI 的思考过程和生成的代码
5. 在地图预览区域查看生成的地图
6. 点击"分享地图"生成分享链接

## 注意事项

- 需要申请天地图 API 密钥，并在生成的代码中替换"您的天地图密钥"
- 在生产环境中，建议将 AI 模型部署在专用服务器上

## 许可证

MIT
