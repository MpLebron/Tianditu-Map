const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        // 如果环境变量中没有设置MongoDB URI，使用默认的本地MongoDB地址
        const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tianditu-map';

        const conn = await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`MongoDB 连接成功: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB 连接错误: ${error.message}`);
        // 不退出进程，允许应用继续运行，即使数据库连接失败
        // process.exit(1);
    }
};

module.exports = connectDB; 