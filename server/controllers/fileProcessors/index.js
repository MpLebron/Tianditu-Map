/**
 * 文件处理器工厂
 * 根据文件类型选择合适的处理器
 */

const path = require('path');
const geoJsonProcessor = require('./geoJsonProcessor');

/**
 * 根据文件类型获取合适的处理器
 * @param {String} filePath - 文件路径
 * @returns {Object} - 文件处理器对象
 */
exports.getProcessor = (filePath) => {
    const ext = path.extname(filePath).toLowerCase();

    // 根据文件扩展名选择处理器
    switch (ext) {
        case '.geojson':
        case '.json':
            return geoJsonProcessor;
        // 未来可以在这里添加更多文件类型的处理器
        // case '.shp':
        //   return shpProcessor;
        // case '.csv':
        //   return csvProcessor;
        // case '.kml':
        //   return kmlProcessor;
        default:
            throw new Error(`不支持的文件类型: ${ext}`);
    }
};

/**
 * 获取支持的文件类型列表
 * @returns {Array} - 支持的文件扩展名数组
 */
exports.getSupportedFileTypes = () => {
    return ['.geojson', '.json'];
    // 未来扩展时添加更多支持的类型
    // return ['.geojson', '.json', '.shp', '.csv', '.kml'];
};

/**
 * 检查文件类型是否受支持
 * @param {String} filePath - 文件路径
 * @returns {Boolean} - 是否支持该文件类型
 */
exports.isFileTypeSupported = (filePath) => {
    try {
        const ext = path.extname(filePath).toLowerCase();
        return exports.getSupportedFileTypes().includes(ext);
    } catch (error) {
        return false;
    }
}; 