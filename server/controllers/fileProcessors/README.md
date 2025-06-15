# 文件处理器模块

这个目录包含了用于处理不同类型文件的处理器模块。每个处理器负责解析特定类型的文件，提取元数据和内容，并返回标准化的处理结果。

## 目录结构

- `index.js` - 文件处理器工厂，根据文件类型选择合适的处理器
- `geoJsonProcessor.js` - GeoJSON 文件处理器
- `fileProcessorTemplate.js` - 文件处理器模板，用于创建新的处理器
- 其他文件处理器...

## 如何添加新的文件类型处理器

1. 复制`fileProcessorTemplate.js`并重命名为新文件类型的处理器名称，如`shpProcessor.js`
2. 实现`processFile`方法，处理特定类型的文件
3. 在`index.js`中注册新的处理器：
   - 在`getSupportedFileTypes`方法中添加新的文件扩展名
   - 在`getProcessor`方法的 switch 语句中添加新的 case

### 示例：添加 CSV 文件处理器

1. 创建`csvProcessor.js`：

```javascript
const fs = require("fs");
const path = require("path");

exports.processFile = async (filePath) => {
  try {
    // 读取CSV文件内容
    const content = fs.readFileSync(filePath, "utf8");

    // 解析CSV头部
    const lines = content.split("\n");
    const headers = lines[0].split(",");

    // 构建处理结果
    const summary = {
      rowCount: lines.length - 1,
      columns: headers,
      preview: lines.slice(0, 5).join("\n"),
    };

    return {
      success: true,
      summary: summary,
      textContent: content.substring(0, 2000), // 提取前2000个字符
    };
  } catch (error) {
    console.error("CSV处理错误:", error);
    return {
      success: false,
      error: error.message,
      textContent: "无法解析CSV文件",
    };
  }
};
```

2. 在`index.js`中注册 CSV 处理器：

```javascript
// 引入CSV处理器
const csvProcessor = require("./csvProcessor");

// 在getProcessor方法中添加
exports.getProcessor = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case ".geojson":
    case ".json":
      return geoJsonProcessor;
    case ".csv":
      return csvProcessor;
    // ...其他处理器
    default:
      throw new Error(`不支持的文件类型: ${ext}`);
  }
};

// 在getSupportedFileTypes方法中添加
exports.getSupportedFileTypes = () => {
  return [".geojson", ".json", ".csv"];
};
```

3. 在`aiRoutes.js`中更新 MIME 类型检查（如需要）：

```javascript
// 检查MIME类型
if (ext === ".csv") {
  if (file.mimetype !== "text/csv" && file.mimetype !== "application/csv") {
    return cb(new Error("MIME类型不匹配"), false);
  }
}
```

## 处理器接口规范

每个文件处理器必须实现以下接口：

```javascript
/**
 * 处理文件
 * @param {String} filePath - 文件路径
 * @param {Object} options - 附加选项，如文件URL等
 * @returns {Promise<Object>} - 处理结果
 */
exports.processFile = async (filePath, options = {}) => {
  // 实现文件处理逻辑
  return {
    success: true | false, // 处理是否成功
    summary: {
      // 文件摘要信息，结构可根据文件类型自定义
      // 文件元数据
      fileName: String, // 文件名
      fileSize: Number, // 文件大小（字节）
      fileUrl: String, // 文件URL，用于后续获取完整数据
      // 其他元数据...
    },
    summaryText: String, // 人类可读的摘要文本，包含文件的关键信息和预览
    textContent: String, // 提取的文本内容，用于发送给AI
  };
};
```

### summaryText 格式推荐

建议`summaryText`包含以下内容：

```
文件名: example.geojson
文件大小: 1.23 MB
文件类型: GeoJSON
文件URL: http://example.com/static/uploads/file-123456.geojson
[文件类型特有的元数据，如要素数量、属性字段等]
文件预览:
[文件前3000个字符]
```

这样的格式既便于人类阅读，也便于 AI 理解文件内容。
