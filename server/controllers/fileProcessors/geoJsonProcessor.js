const fs = require('fs');
const path = require('path');

/**
 * 处理GeoJSON文件，提取有用信息
 * @param {String} filePath - GeoJSON文件路径
 * @param {Object} options - 附加选项，如文件URL等
 * @returns {Promise<Object>} - 处理结果
 */
exports.processGeoJson = async (filePath, options = {}) => {
    try {
        // 读取文件内容
        const fileContent = fs.readFileSync(filePath, 'utf8');

        // 解析JSON
        const geoJson = JSON.parse(fileContent);

        // 提取文件的前3000个字符
        const filePreview = fileContent.substring(0, 3000);

        // 提取基本信息
        const summary = {
            type: geoJson.type,
            featureCount: geoJson.features ? geoJson.features.length : 0,
            properties: geoJson.properties || {},
            bbox: geoJson.bbox || [],
            preview: filePreview, // 文件的前1000个字符
            fileName: path.basename(filePath),
            fileSize: fs.statSync(filePath).size,
            fileUrl: options.fileUrl || '' // 文件URL，用于后续获取完整数据
        };

        // 如果有features，提取第一个feature的属性
        if (geoJson.features && geoJson.features.length > 0) {
            summary.sampleFeature = geoJson.features[0].properties || {};

            // 计算所有features的属性字段
            const allProperties = new Set();
            geoJson.features.forEach(feature => {
                if (feature.properties) {
                    Object.keys(feature.properties).forEach(key => allProperties.add(key));
                }
            });
            summary.propertyFields = Array.from(allProperties);
        }

        // 构建人类可读的摘要文本
        const summaryText = `
文件名: ${summary.fileName}
文件大小: ${formatFileSize(summary.fileSize)}
GeoJSON类型: ${summary.type}
要素数量: ${summary.featureCount}
属性字段: ${summary.propertyFields ? summary.propertyFields.join(', ') : '无'}
边界框: ${summary.bbox.length > 0 ? summary.bbox.join(', ') : '未指定'}
文件URL: ${summary.fileUrl || '未提供'}
文件预览: 
${filePreview}
`;

        return {
            success: true,
            summary,
            summaryText,
            textContent: fileContent.substring(0, 2000) // 提取前2000个字符作为文本内容
        };
    } catch (error) {
        console.error('GeoJSON处理错误:', error);
        return {
            success: false,
            error: error.message,
            textContent: '无法解析GeoJSON文件'
        };
    }
};

/**
 * 处理文件
 * 这是一个通用接口，所有文件处理器都应该实现这个方法
 * @param {String} filePath - 文件路径
 * @param {Object} options - 附加选项，如文件URL等
 * @returns {Promise<Object>} - 处理结果
 */
exports.processFile = async (filePath, options = {}) => {
    return await exports.processGeoJson(filePath, options);
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