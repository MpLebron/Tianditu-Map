// 这里是AI生成地图代码的控制器
const axios = require('axios');
require('dotenv').config();

// 流式对话函数
exports.chatWithAIStream = async (req, res) => {
    try {
        // 兼容GET和POST
        let messages = [];
        messages = req.body.messages;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ message: '消息不能为空且必须是数组格式' });
        }

        // 设置SSE头部
        res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no' // 禁用Nginx缓冲
        });

        // 发送初始事件
        res.write(`data: ${JSON.stringify({ type: 'thinking', content: '正在分析您的请求...' })}\n\n`);

        console.log(messages);


        // 创建请求配置
        const requestConfig = {
            method: 'post',
            url: 'https://aihubmix.com/v1/chat/completions',
            headers: {
                'Authorization': `Bearer ${process.env.CLAUDE_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream' // 关键：请求流式响应
            },
            data: {
                model: "claude-3-5-sonnet-20241022",
                messages: messages,
                max_tokens: 4000,
                stream: true // 关键：启用流式响应
            },
            responseType: 'stream', // 设置axios以流模式接收响应
            timeout: 60000 // 设置60秒超时
        };

        // 发送请求
        const response = await axios(requestConfig);

        // console.log('流式API响应已开始');

        // 处理流式响应
        response.data.on('data', (chunk) => {
            try {
                // 解析数据块
                const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = line.substring(6);

                        // 检查是否是结束标记
                        if (data === '[DONE]') {
                            // console.log('流式传输完成');
                            res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
                            return;
                        }

                        try {
                            const parsedData = JSON.parse(data);

                            // 提取内容
                            let content = '';
                            if (parsedData.choices && parsedData.choices[0] && parsedData.choices[0].delta) {
                                content = parsedData.choices[0].delta.content || '';
                            }

                            if (content) {
                                // 发送内容给客户端
                                res.write(`data: ${JSON.stringify({ type: 'content', content })}\n\n`);
                            }
                        } catch (e) {
                            console.error('解析流数据错误:', e, '原始数据:', data);
                        }
                    }
                }
            } catch (e) {
                console.error('处理数据块错误:', e);
            }
        });

        // 处理流结束
        response.data.on('end', () => {
            // console.log('流结束事件触发');
            res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
            res.end();
        });

        // 处理错误
        response.data.on('error', (err) => {
            console.error('流处理错误:', err);
            res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
            res.end();
        });

    } catch (error) {
        console.error('流式API调用错误:', error);
        console.error('错误详情:', error.response?.data || '无响应数据');
        console.error('错误状态:', error.response?.status || '无状态码');
        console.error('错误信息:', error.message);

        // 如果响应头尚未发送，则发送错误响应
        if (!res.headersSent) {
            return res.status(500).json({
                message: '与Claude AI对话失败',
                error: error.message,
                details: error.response?.data || '无详细信息'
            });
        }

        // 如果响应头已发送，则发送错误事件
        res.write(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`);
        res.end();
    }
};