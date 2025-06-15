/**
 * 文件处理器模板
 * 用于创建新的文件类型处理器
 * 
 * 使用方法：
 * 1. 复制此文件并重命名为新文件类型的处理器名称，如shpProcessor.js
 * 2. 实现processFile方法
 * 3. 在index.js中注册新的处理器
 */

const fs = require('fs');
const path = require('path');

/**
 * 处理特定类型的文件
 * @param {String} filePath - 文件路径
 * @param {Object} options - 附加选项，如文件URL等
 * @returns {Promise<Object>} - 处理结果
 */
exports.processFile = async (filePath, options = {}) => {
    try {
        // 在这里实现文件处理逻辑
        // 例如：读取文件内容、解析数据、提取元数据等

        // 示例：读取文件前3000个字节作为预览
        const fileBuffer = Buffer.alloc(3000);
        const fd = fs.openSync(filePath, 'r');
        fs.readSync(fd, fileBuffer, 0, 3000, 0);
        fs.closeSync(fd);

        // 文件基本信息
        const fileSize = fs.statSync(filePath).size;
        const fileName = path.basename(filePath);
        const fileExt = path.extname(fileName).toLowerCase();
        const preview = fileBuffer.toString('utf8', 0, 3000);

        // 构建处理结果
        const summary = {
            // 在这里添加文件的元数据
            // 例如：类型、大小、特征数量等
            fileSize: fileSize,
            fileName: fileName,
            fileExt: fileExt,
            fileUrl: options.fileUrl || '', // 文件URL，用于后续获取完整数据
            preview: preview.substring(0, 100) + '...' // 前100个字符作为预览
        };

        // 构建人类可读的摘要文本
        const summaryText = `
文件名: ${fileName}
文件大小: ${formatFileSize(fileSize)}
文件类型: ${fileExt}
文件URL: ${options.fileUrl || '未提供'}
文件预览: 
${preview}
`;

        return {
            success: true,
            summary: summary,
            summaryText: summaryText,
            textContent: preview // 提取前1000个字符作为文本内容
        };
    } catch (error) {
        console.error('文件处理错误:', error);
        return {
            success: false,
            error: error.message,
            textContent: '无法处理文件'
        };
    }
};

/**
 * 格式化文件大小
 * @param {Number} bytes - 文件大小（字节）
 * @returns {String} - 格式化后的文件大小
 */
function formatFileSize(bytes) {
    if (bytes < 1024) {
        return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(2) + ' KB';
    } else if (bytes < 1024 * 1024 * 1024) {
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    } else {
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }
} 