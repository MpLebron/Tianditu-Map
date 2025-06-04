const express = require('express');
const router = express.Router();
const shareController = require('../controllers/shareController');

// 创建分享
router.post('/', shareController.createShare);

// 获取分享的地图
router.get('/:uniqueId', shareController.getSharedMap);

module.exports = router; 