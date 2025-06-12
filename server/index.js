const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();

// 中间件
app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 静态资源服务
app.use('/static', express.static(path.join(__dirname, 'public')));

// 添加调试日志
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// 路由
app.use('/api/share', require('./routes/shareRoutes'));
app.use('/api', require('./routes/aiRoutes'));

// 前端静态文件服务（生产环境）
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));

    app.get('/shared/:uniqueId', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../client/dist/index.html'));
    });

    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../client/dist/index.html'));
    });
}

// 端口
const PORT = process.env.PORT || 3000;

// 启动服务器
app.listen(PORT, () => {
    console.log(`服务器运行在端口 ${PORT}`);
});

// 尝试连接数据库，但不阻塞服务器启动
connectDB().catch(err => {
    console.error('数据库连接失败，但API服务仍将继续运行:', err.message);
}); 