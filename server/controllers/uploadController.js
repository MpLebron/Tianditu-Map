const path = require('path');
const fs = require('fs');

/**
 * 上传文件
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
exports.uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: '没有文件被上传' });
        }

        // 构建文件URL
        const protocol = req.secure ? 'https' : 'http';
        const host = req.get('host');
        const fileUrl = `${protocol}://${host}/static/uploads/${req.file.filename}`;

        // 确保文件名正确处理
        const originalFilename = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

        // 返回文件信息
        res.status(200).json({
            success: true,
            file: {
                filename: originalFilename,
                mimetype: req.file.mimetype,
                size: req.file.size,
                url: fileUrl
            }
        });
    } catch (error) {
        console.error('文件上传错误:', error);
        res.status(500).json({ success: false, message: '服务器错误，上传失败' });
    }
}; 