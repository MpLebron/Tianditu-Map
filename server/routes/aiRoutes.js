const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const uploadController = require('../controllers/uploadController');
const fileProcessorFactory = require('../controllers/fileProcessors');
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

// 文件过滤器，根据支持的文件类型列表进行过滤
const fileFilter = (req, file, cb) => {
    // 获取文件扩展名
    let originalname = file.originalname;
    try {
        originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
    } catch (e) {
        console.error('文件名编码转换失败:', e);
    }

    const ext = path.extname(originalname).toLowerCase();

    // 检查是否是支持的文件类型
    const supportedTypes = fileProcessorFactory.getSupportedFileTypes();
    if (!supportedTypes.includes(ext)) {
        return cb(new Error(`不支持的文件类型: ${ext}。支持的类型: ${supportedTypes.join(', ')}`), false);
    }

    // 检查MIME类型（可选，有些文件类型可能没有标准MIME类型）
    if (ext === '.geojson' || ext === '.json') {
        if (file.mimetype !== 'application/json' && file.mimetype !== 'application/geo+json') {
            return cb(new Error('MIME类型不匹配'), false);
        }
    }
    // 未来可以在这里添加其他文件类型的MIME检查

    cb(null, true);
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 限制文件大小为10MB
    }
});

// 与AI对话（流式响应）
router.post('/chat/stream', aiController.chatWithAIStream);

// 文件上传路由
router.post('/upload', upload.single('file'), uploadController.uploadFile);

module.exports = router; 