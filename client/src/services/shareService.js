import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const shareMap = async (mapCode, description) => {
    try {
        const response = await axios.post(`${API_URL}/share`, { mapCode, description });
        return response.data;
    } catch (error) {
        console.error('分享地图失败:', error);
        throw error;
    }
};

export const getSharedMap = async (uniqueId) => {
    try {
        const response = await axios.get(`${API_URL}/share/${uniqueId}`);
        return response.data;
    } catch (error) {
        console.error('获取分享地图失败:', error);
        throw error;
    }
}; 