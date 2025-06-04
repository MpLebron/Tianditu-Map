<template>
    <div class="resizable-divider"
        :class="{ 'vertical': direction === 'vertical', 'horizontal': direction === 'horizontal', 'dragging': isDragging }"
        @mousedown="startResize" @touchstart="startTouchResize">
        <div class="divider-handle"></div>
    </div>
</template>

<script setup>
import { defineProps, defineEmits, ref } from 'vue';

const props = defineProps({
    direction: {
        type: String,
        default: 'vertical', // 'vertical' 或 'horizontal'
        validator: (value) => ['vertical', 'horizontal'].includes(value)
    }
});

const emit = defineEmits(['resize']);

// 拖拽状态
const isDragging = ref(false);

// 使用 requestAnimationFrame 优化拖拽性能
let rafId = null;
let initialPos = 0;
let lastPos = 0;
let lastEmitTime = 0;
const THROTTLE_DELAY = 5; // 更高的帧率，更流畅的体验

const startResize = (e) => {
    e.preventDefault();
    isDragging.value = true;

    // 记录初始位置
    initialPos = props.direction === 'vertical' ? e.clientX : e.clientY;
    lastPos = initialPos;

    // 添加拖动时的样式
    document.body.style.cursor = props.direction === 'vertical' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';

    // 添加全局事件监听
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseup', handleMouseUp);

    // 启动动画帧循环
    scheduleUpdate();
};

const handleMouseMove = (e) => {
    if (!isDragging.value) return;

    // 更新当前位置
    lastPos = props.direction === 'vertical' ? e.clientX : e.clientY;
};

const scheduleUpdate = () => {
    if (!isDragging.value) return;

    const now = Date.now();
    if (now - lastEmitTime >= THROTTLE_DELAY) {
        // 计算相对于上一次位置的增量，而不是相对于初始位置
        const delta = lastPos - initialPos;

        // 重置初始位置为当前位置，使下一次计算增量时是相对于当前位置
        initialPos = lastPos;

        // 只有当有实际移动时才发送更新
        if (delta !== 0) {
            emit('resize', delta);
            lastEmitTime = now;
        }
    }

    // 安排下一帧更新
    rafId = requestAnimationFrame(scheduleUpdate);
};

const handleMouseUp = () => {
    isDragging.value = false;

    // 移除事件监听
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);

    // 恢复默认样式
    document.body.style.cursor = '';
    document.body.style.userSelect = '';

    // 取消动画帧
    if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
};

// 触摸支持
const startTouchResize = (e) => {
    if (e.touches.length !== 1) return;
    e.preventDefault();
    isDragging.value = true;

    // 记录初始位置
    const touch = e.touches[0];
    initialPos = props.direction === 'vertical' ? touch.clientX : touch.clientY;
    lastPos = initialPos;

    // 添加触摸事件监听
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    // 启动动画帧循环
    scheduleUpdate();
};

const handleTouchMove = (e) => {
    if (!isDragging.value || e.touches.length !== 1) return;
    e.preventDefault();

    // 更新当前位置
    const touch = e.touches[0];
    lastPos = props.direction === 'vertical' ? touch.clientX : touch.clientY;
};

const handleTouchEnd = () => {
    isDragging.value = false;

    // 移除事件监听
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);

    // 取消动画帧
    if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = null;
    }
};
</script>

<style scoped>
.resizable-divider {
    position: relative;
    background-color: #e5e7eb;
    transition: background-color 0.2s;
    z-index: 10;
    touch-action: none;
    will-change: transform;
    /* 优化性能 */
}

.resizable-divider:hover {
    background-color: #d1d5db;
}

.resizable-divider.vertical {
    width: 6px;
    height: 100%;
    cursor: col-resize;
}

.resizable-divider.horizontal {
    width: 100%;
    height: 6px;
    cursor: row-resize;
}

.resizable-divider.dragging {
    background-color: #9ca3af;
}

.divider-handle {
    position: absolute;
    background-color: #9ca3af;
    opacity: 0;
    transition: opacity 0.2s;
}

.vertical .divider-handle {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 2px;
    height: 30px;
}

.horizontal .divider-handle {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 30px;
    height: 2px;
}

.resizable-divider:hover .divider-handle,
.resizable-divider.dragging .divider-handle {
    opacity: 1;
}

.resizable-divider.dragging .divider-handle {
    background-color: #6b7280;
}
</style>