import axios from 'axios';

// 获取API基础URL
const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'http://48715p9d60.zicp.vip:37189/api'
    : 'http://48715p9d60.zicp.vip:37189/api';

/**
 * 与AI对话（流式响应）
 * @param {string} message 当前消息内容
 * @param {Function} onThinking 思考过程回调函数
 * @param {Function} onContent 内容回调函数
 * @param {Function} onDone 完成回调函数
 * @param {Function} onError 错误回调函数
 * @param {Array} messageHistory 可选，历史消息数组
 * @returns {Object} 返回控制对象，用于手动关闭连接
 */
export const chatWithAIStream = (message, onThinking, onContent, onDone, onError, messageHistory = []) => {
    const url = `${API_BASE_URL}/chat/stream`;

    // 创建一个包含历史消息的数组
    const messages = [...messageHistory];

    // 检查最后一条消息是否已经是当前用户消息
    const lastMessage = messages[messages.length - 1];
    if (message && (!lastMessage || lastMessage.role !== 'user' || lastMessage.content !== message)) {
        // 只有当有消息内容，且最后一条消息不是当前用户消息时，才添加当前用户消息
        messages.push({ role: 'user', content: message });
    }

    console.log('发送给API的完整消息历史:', messages);

    // 使用POST请求
    const controller = new AbortController();
    const { signal } = controller;

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
        signal
    }).then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        function readStream() {
            reader.read().then(({ done, value }) => {
                if (done) {
                    if (onDone) onDone();
                    return;
                }

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n\n');
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.substring(6));

                            switch (data.type) {
                                case 'thinking':
                                    if (onThinking) onThinking(data.content);
                                    break;
                                case 'content':
                                    if (onContent) onContent(data.content);
                                    break;
                                case 'done':
                                    if (onDone) onDone();
                                    return;
                                case 'error':
                                    if (onError) onError(new Error(data.error));
                                    return;
                            }
                        } catch (error) {
                            console.error('解析SSE数据错误:', error);
                        }
                    }
                }

                readStream();
            }).catch(error => {
                if (onError) onError(error);
            });
        }

        readStream();
    }).catch(error => {
        if (onError) onError(error);
    });

    return {
        close: () => controller.abort()
    };
};