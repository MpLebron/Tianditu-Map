<template>
    <div class="shared-map-view h-screen w-full flex flex-col overflow-hidden">
        <!-- 顶部导航栏 -->
        <HeaderBar />

        <div class="flex-grow relative">
            <div v-if="isLoading" class="h-full flex items-center justify-center">
                <p class="text-gray-500">加载中...</p>
            </div>

            <div v-else-if="error" class="h-full flex items-center justify-center">
                <div class="text-center">
                    <p class="text-red-500 mb-2">{{ error }}</p>
                    <router-link to="/generator"
                        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-full shadow-md text-sm inline-block transition-all">
                        返回地图生成器
                    </router-link>
                </div>
            </div>

            <iframe v-else ref="mapFrame" class="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin"></iframe>

            <router-link to="/generator"
                class="absolute top-2 left-2 bg-white bg-opacity-80 hover:bg-opacity-100 text-gray-700 px-4 py-1 rounded-full text-sm shadow-md transition-all floating-control">
                返回
            </router-link>

            <div v-if="description"
                class="absolute top-2 right-2 bg-white bg-opacity-80 hover:bg-opacity-100 px-3 py-1 rounded-full text-sm max-w-xs truncate shadow-md transition-all floating-control">
                {{ description }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getSharedMap } from '../services/shareService';
import HeaderBar from '../components/HeaderBar.vue';

const route = useRoute();
const mapFrame = ref(null);
const description = ref('');
const isLoading = ref(true);
const error = ref(null);

onMounted(async () => {
    try {
        const uniqueId = route.params.uniqueId;
        if (!uniqueId) {
            error.value = '无效的分享链接';
            isLoading.value = false;
            return;
        }

        const result = await getSharedMap(uniqueId);

        if (result && result.mapCode) {
            description.value = result.description || '';

            // 等待DOM更新后设置iframe内容
            setTimeout(() => {
                if (mapFrame.value) {
                    mapFrame.value.srcdoc = result.mapCode;
                }
                isLoading.value = false;
            }, 100);
        } else {
            error.value = '无法加载地图数据';
            isLoading.value = false;
        }
    } catch (err) {
        console.error('加载分享地图失败:', err);
        error.value = '加载地图失败，该地图可能已被删除或链接无效';
        isLoading.value = false;
    }
});
</script>

<style scoped>
.floating-control {
    z-index: 1000;
    backdrop-filter: blur(4px);
}
</style>