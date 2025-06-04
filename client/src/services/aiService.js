import axios from 'axios';

// 获取API基础URL
const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? '/api'
    : 'http://localhost:3000/api';

/**
 * 与AI对话（标准非流式）
 * @param {Array} messages 消息数组，格式为[{role: 'user', content: '消息内容'}, ...]
 * @returns {Promise} 返回AI回复
 */
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
 * @param {string} message 消息内容
 * @param {Function} onThinking 思考过程回调函数
 * @param {Function} onContent 内容回调函数
 * @param {Function} onDone 完成回调函数
 * @param {Function} onError 错误回调函数
 * @returns {Object} 返回控制对象，用于手动关闭连接
 */
export const chatWithAIStream = (message, onThinking, onContent, onDone, onError) => {
    // 只用EventSource GET，消息内容拼到URL参数q
    const eventSource = new EventSource(`${API_BASE_URL}/chat/stream?q=${encodeURIComponent(message)}`);

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