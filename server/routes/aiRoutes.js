const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// 生成地图
router.post('/generate-map', aiController.generateMap);

// 与AI对话（标准非流式）
router.post('/chat', aiController.chatWithAI);

// 与AI对话（流式响应）
router.post('/chat/stream', aiController.chatWithAIStream);
router.get('/chat/stream', aiController.chatWithAIStream);

module.exports = router; 