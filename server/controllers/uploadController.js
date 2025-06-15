const path = require('path');
const fs = require('fs');
const fileProcessorFactory = require('./fileProcessors');

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

        // 构建文件URL和路径
        const protocol = req.secure ? 'https' : 'http';
        const host = req.get('host');
        const fileUrl = `${protocol}://${host}/static/uploads/${req.file.filename}`;
        const filePath = path.join(__dirname, '../public/uploads', req.file.filename);

        // 确保文件名正确处理
        const originalFilename = Buffer.from(req.file.originalname, 'latin1').toString('utf8');

        // 获取适合的文件处理器并处理文件
        try {
            const processor = fileProcessorFactory.getProcessor(filePath);
            // 传递文件URL到处理器
            const processResult = await processor.processFile(filePath, { fileUrl });

            if (!processResult.success) {
                return res.status(400).json({
                    success: false,
                    message: `无法处理文件: ${processResult.error}`
                });
            }

            // 返回文件信息和处理结果
            res.status(200).json({
                success: true,
                file: {
                    filename: originalFilename,
                    mimetype: req.file.mimetype,
                    size: req.file.size,
                    url: fileUrl,
                    type: path.extname(originalFilename).toLowerCase().substring(1) // 文件类型（不带点）
                },
                processResult: processResult
            });
        } catch (error) {
            console.error('文件处理错误:', error);
            res.status(400).json({
                success: false,
                message: `不支持的文件类型: ${path.extname(originalFilename)}`
            });
        }
    } catch (error) {
        console.error('文件上传错误:', error);
        res.status(500).json({ success: false, message: '服务器错误，上传失败' });
    }
}; 