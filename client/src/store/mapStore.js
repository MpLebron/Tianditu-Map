import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useMapStore = defineStore('map', () => {
    // 生成的地图代码
    const generatedMapCode = ref('');

    // 地图描述
    const mapDescription = ref('');

    // 分享链接
    const shareLink = ref('');

    // 错误信息
    const error = ref('');

    // 设置生成的地图代码
    function setGeneratedMapCode(code) {
        generatedMapCode.value = code;
    }

    // 设置地图描述
    function setMapDescription(description) {
        mapDescription.value = description;
    }

    // 设置分享链接
    function setShareLink(link) {
        shareLink.value = link;
    }

    // 设置错误信息
    function setError(errorMessage) {
        error.value = errorMessage;
    }

    // 清除错误信息
    function clearError() {
        error.value = '';
    }

    return {
        generatedMapCode,
        mapDescription,
        shareLink,
        error,
        setGeneratedMapCode,
        setMapDescription,
        setShareLink,
        setError,
        clearError
    };
}); 