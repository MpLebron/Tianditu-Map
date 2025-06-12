import axios from "axios";

// 获取API基础URL - 优先使用环境变量中的API地址（用于花生壳等公网穿透）
// 在开发模式下也使用花生壳地址，确保别人访问时能正常工作
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://48715p9d60.zicp.vip/api";
export const chatWithAI = async (messages) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/chat`, { messages });
        return response.data;
    } catch (error) {
        console.error('AI对话错误:', error);
        throw error;
    }
};

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
    let url = `${API_BASE_URL}/chat/stream`;
    let eventSource;

    // 如果有历史消息，使用POST请求
    if (messageHistory && messageHistory.length > 0) {
        // 创建一个包含历史消息的数组
        const messages = [...messageHistory];

        // 检查最后一条消息是否已经是当前用户消息
        const lastMessage = messages[messages.length - 1];
        if (!lastMessage || lastMessage.role !== 'user' || lastMessage.content !== message) {
            // 只有当最后一条消息不是当前用户消息时，才添加当前用户消息
            if (message) {
                messages.push({ role: 'user', content: message });
            }
        }

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
    } else {
        // 如果没有历史消息，使用GET请求（兼容原有逻辑）
        eventSource = new EventSource(`${url}?q=${encodeURIComponent(message)}`);

        eventSource.onopen = () => {
            console.log('流式连接已建立');
        };
        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                switch (data.type) {
                    case 'thinking':
                        if (onThinking) onThinking(data.content);
                        break;
                    case 'content':
                        if (onContent) onContent(data.content);
                        break;
                    case 'done':
                        if (onDone) onDone();
                        eventSource.close();
                        break;
                    case 'error':
                        if (onError) onError(new Error(data.error));
                        eventSource.close();
                        break;
                    default:
                        break;
                }
            } catch (error) {
                if (onError) onError(error);
            }
        };
        eventSource.onerror = (error) => {
            if (onError) onError(error);
            eventSource.close();
        };
        return {
            close: () => eventSource.close()
        };
    }
};

/**
 * 生成地图
 * @param {string} description 地图描述
 * @returns {Promise} 返回生成的地图代码和思考过程
 */
export const generateMap = async (description) => {
    try {
        const response = await axios.post(`${API_BASE_URL}/generate-map`, { description });
        return response.data;
    } catch (error) {
        console.error('生成地图错误:', error);
        throw error;
    }
}; 
