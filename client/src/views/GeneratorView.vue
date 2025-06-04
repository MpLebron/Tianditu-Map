<template>
    <div ref="containerRef" class="generator-view h-screen w-full flex flex-col overflow-hidden">
        <!-- 桌面布局 -->
        <div class="hidden lg:flex flex-grow flex-row overflow-hidden">
            <!-- 聊天面板 -->
            <div :style="{ width: panelWidths.chat + '%' }" class="h-full">
                <ChatPanel class="h-full" />
            </div>

            <!-- 第一个分隔线 -->
            <div class="relative">
                <ResizableDivider direction="vertical" @resize="handleResizeChat" />
                <button @click="toggleCodeVisibility"
                    class="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 bg-white hover:bg-gray-100 text-gray-700 py-3 px-2 text-xs rounded-lg shadow-md flex items-center justify-center z-20 border border-gray-200 writing-vertical">
                    {{ isCodeVisible ? '隐藏代码' : '显示代码' }}
                </button>
            </div>

            <!-- 代码展示 -->
            <div :style="{ width: panelWidths.code + '%', display: isCodeVisible ? 'block' : 'none' }" class="h-full">
                <CodeArtifacts class="h-full" />
            </div>

            <!-- 第二个分隔线 -->
            <ResizableDivider v-if="isCodeVisible" direction="vertical" @resize="handleResizeCode" />

            <!-- 地图渲染 -->
            <div :style="{ width: isCodeVisible ? panelWidths.map + '%' : (panelWidths.code + panelWidths.map) + '%' }"
                class="h-full">
                <MapRenderer class="h-full" />
            </div>
        </div>

        <!-- 移动端布局 -->
        <div class="flex lg:hidden flex-grow flex-col overflow-hidden">
            <!-- 聊天面板 -->
            <div :style="{ height: panelHeights.chat + '%' }" class="w-full">
                <ChatPanel class="h-full" />
            </div>

            <!-- 第一个水平分隔线 -->
            <div class="relative">
                <ResizableDivider direction="horizontal" @resize="handleResizeChatMobile" />
                <button @click="toggleCodeVisibility"
                    class="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2 bg-white hover:bg-gray-100 text-gray-700 px-3 py-1 text-xs rounded-full shadow-md flex items-center justify-center z-20 border border-gray-200 whitespace-nowrap">
                    {{ isCodeVisible ? '隐藏代码' : '显示代码' }}
                </button>
            </div>

            <!-- 代码展示 -->
            <div :style="{ height: panelHeights.code + '%', display: isCodeVisible ? 'block' : 'none' }" class="w-full">
                <CodeArtifacts class="h-full" />
            </div>

            <!-- 第二个水平分隔线 -->
            <ResizableDivider v-if="isCodeVisible" direction="horizontal" @resize="handleResizeCodeMobile" />

            <!-- 地图渲染 -->
            <div :style="{ height: isCodeVisible ? panelHeights.map + '%' : (panelHeights.code + panelHeights.map) + '%' }"
                class="w-full">
                <MapRenderer class="h-full" />
            </div>
        </div>

        <div v-if="error" class="absolute bottom-2 left-2 right-2 p-2 bg-red-100 text-red-700 rounded text-sm">
            {{ error }}
        </div>
    </div>
</template>

<script setup>
import { computed, ref, onMounted, watch, shallowRef } from 'vue';
import { useMapStore } from '../store/mapStore';
import ChatPanel from '../components/ChatPanel.vue';
import CodeArtifacts from '../components/CodeArtifacts.vue';
import MapRenderer from '../components/MapRenderer.vue';
import ResizableDivider from '../components/ResizableDivider.vue';

const mapStore = useMapStore();
const error = computed(() => mapStore.error);

// 代码显示状态
const isCodeVisible = ref(true);

// 切换代码显示/隐藏状态
const toggleCodeVisibility = () => {
    isCodeVisible.value = !isCodeVisible.value;

    // 保存用户偏好到本地存储
    try {
        localStorage.setItem('tianditu-code-visibility', isCodeVisible.value.toString());
    } catch (e) {
        console.error('保存代码显示状态失败:', e);
    }

    // 调整布局以适应代码区域的显示/隐藏
    updateContainerSize();
};

// 在组件初始化时读取用户偏好
try {
    const savedVisibility = localStorage.getItem('tianditu-code-visibility');
    if (savedVisibility !== null) {
        isCodeVisible.value = savedVisibility === 'true';
    }
} catch (e) {
    console.error('读取代码显示状态失败:', e);
}

// 缓存DOM元素引用
const containerRef = shallowRef(null);
let containerWidth = 0;
let containerHeight = 0;

// 尝试从本地存储加载布局
const loadLayout = () => {
    try {
        const savedDesktopLayout = localStorage.getItem('tianditu-desktop-layout');
        const savedMobileLayout = localStorage.getItem('tianditu-mobile-layout');

        if (savedDesktopLayout) {
            panelWidths.value = JSON.parse(savedDesktopLayout);
        }

        if (savedMobileLayout) {
            panelHeights.value = JSON.parse(savedMobileLayout);
        }
    } catch (e) {
        console.error('加载布局失败:', e);
    }
};

// 桌面端面板宽度百分比
const panelWidths = ref({
    chat: 33.33,
    code: 33.33,
    map: 33.33
});

// 移动端面板高度百分比
const panelHeights = ref({
    chat: 33.33,
    code: 33.33,
    map: 33.33
});

// 保存布局到本地存储（使用防抖）
let saveTimeout = null;
const saveLayout = () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        try {
            localStorage.setItem('tianditu-desktop-layout', JSON.stringify(panelWidths.value));
            localStorage.setItem('tianditu-mobile-layout', JSON.stringify(panelHeights.value));
        } catch (e) {
            console.error('保存布局失败:', e);
        }
    }, 500); // 延迟保存，避免频繁写入
};

// 监听布局变化并保存
watch([panelWidths, panelHeights], () => {
    saveLayout();
}, { deep: true });

// 更新容器尺寸
const updateContainerSize = () => {
    if (!containerRef.value) {
        containerRef.value = document.querySelector('.generator-view');
    }

    if (containerRef.value) {
        containerWidth = containerRef.value.clientWidth;
        containerHeight = containerRef.value.clientHeight;
    }
};

// 组件挂载时加载布局和初始化容器尺寸
onMounted(() => {
    loadLayout();
    updateContainerSize();

    // 监听窗口大小变化
    window.addEventListener('resize', updateContainerSize);
});

// 处理聊天面板和代码面板之间的调整（桌面端）
const handleResizeChat = (delta) => {
    if (!containerWidth) updateContainerSize();

    // 将像素转换为百分比
    const percentDelta = (delta / containerWidth) * 100;

    // 确保面板宽度不小于20%且不大于60%
    const newChatWidth = panelWidths.value.chat + percentDelta;
    const newCodeWidth = panelWidths.value.code - percentDelta;

    if (newChatWidth >= 20 && newChatWidth <= 200 && newCodeWidth >= 20) {
        // 只更新响应式数据
        panelWidths.value.chat = newChatWidth;
        panelWidths.value.code = newCodeWidth;
    }
};

// 处理代码面板和地图面板之间的调整（桌面端）
const handleResizeCode = (delta) => {
    if (!containerWidth) updateContainerSize();

    // 将像素转换为百分比
    const percentDelta = (delta / containerWidth) * 100;

    // 确保面板宽度不小于20%且不大于60%
    const newCodeWidth = panelWidths.value.code + percentDelta;
    const newMapWidth = panelWidths.value.map - percentDelta;

    if (newCodeWidth >= 20 && newCodeWidth <= 60 && newMapWidth >= 20) {
        // 只更新响应式数据
        panelWidths.value.code = newCodeWidth;
        panelWidths.value.map = newMapWidth;
    }
};

// 处理聊天面板和代码面板之间的调整（移动端）
const handleResizeChatMobile = (delta) => {
    if (!containerHeight) updateContainerSize();

    // 将像素转换为百分比
    const percentDelta = (delta / containerHeight) * 100;

    // 确保面板高度不小于20%且不大于60%
    const newChatHeight = panelHeights.value.chat + percentDelta;
    const newCodeHeight = panelHeights.value.code - percentDelta;

    if (newChatHeight >= 20 && newChatHeight <= 60 && newCodeHeight >= 20) {
        // 只更新响应式数据
        panelHeights.value.chat = newChatHeight;
        panelHeights.value.code = newCodeHeight;
    }
};

// 处理代码面板和地图面板之间的调整（移动端）
const handleResizeCodeMobile = (delta) => {
    if (!containerHeight) updateContainerSize();

    // 将像素转换为百分比
    const percentDelta = (delta / containerHeight) * 100;

    // 确保面板高度不小于20%且不大于60%
    const newCodeHeight = panelHeights.value.code + percentDelta;
    const newMapHeight = panelHeights.value.map - percentDelta;

    if (newCodeHeight >= 20 && newCodeHeight <= 60 && newMapHeight >= 20) {
        // 只更新响应式数据
        panelHeights.value.code = newCodeHeight;
        panelHeights.value.map = newMapHeight;
    }
};
</script>

<style>
html,
body {
    margin: 0;
    padding: 0;
    height: 100%;
    width: 100%;
    overflow: hidden;
}

::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

::-webkit-scrollbar-track {
    background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
    background: #888;
    border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
    background: #555;
}

.writing-vertical {
    writing-mode: vertical-lr;
    text-orientation: upright;
}
</style>