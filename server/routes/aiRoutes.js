const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const uploadController = require('../controllers/uploadController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置文件存储
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);

        // 处理文件名，确保中文文件名正确保存
        let originalname = file.originalname;
        try {
            // 尝试将latin1编码转换为utf8
            originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
        } catch (e) {
            console.error('文件名编码转换失败:', e);
        }

        // 提取扩展名
        const ext = path.extname(originalname);

        // 生成安全的文件名
        const safeName = `file-${uniqueSuffix}${ext}`;

        cb(null, safeName);
    }
});

const upload = multer({ storage: storage });

// 与AI对话（标准非流式）
router.post('/chat', aiController.chatWithAI);

// 与AI对话（流式响应）
router.post('/chat/stream', aiController.chatWithAIStream);
router.get('/chat/stream', aiController.chatWithAIStream);

// 文件上传路由
router.post('/upload', upload.single('file'), uploadController.uploadFile);

module.exports = router; 