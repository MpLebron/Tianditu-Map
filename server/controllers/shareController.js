const { nanoid } = require('nanoid');
const SharedMap = require('../models/SharedMap');

// 创建分享
exports.createShare = async (req, res) => {
    try {
        const { mapCode, description } = req.body;

        if (!mapCode) {
            return res.status(400).json({ message: '地图代码不能为空' });
        }

        const uniqueId = nanoid(10); // 生成10位唯一ID

        const sharedMap = new SharedMap({
            uniqueId,
            mapCode,
            description: description || '未提供描述'
        });

        await sharedMap.save();

        // 构建分享链接
        const protocol = req.secure ? 'https' : 'http';
        const host = req.get('host');
        const shareUrl = `${protocol}://${host}/shared/${uniqueId}`;

        res.status(201).json({
            message: '地图分享成功',
            uniqueId,
            shareUrl
        });
    } catch (error) {
        console.error('分享地图错误:', error);
        res.status(500).json({ message: '服务器错误，分享失败' });
    }
};

// 获取分享的地图
exports.getSharedMap = async (req, res) => {
    try {
        const { uniqueId } = req.params;

        const sharedMap = await SharedMap.findOne({ uniqueId });

        if (!sharedMap) {
            return res.status(404).json({ message: '未找到分享的地图' });
        }

        res.status(200).json({
            mapCode: sharedMap.mapCode,
            description: sharedMap.description,
            createdAt: sharedMap.createdAt
        });
    } catch (error) {
        console.error('获取分享地图错误:', error);
        res.status(500).json({ message: '服务器错误，获取分享失败' });
    }
}; 