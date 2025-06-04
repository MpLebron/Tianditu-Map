<template>
    <div class="code-highlighter">
        <highlightjs :language="language" :code="code" :autodetect="autodetect" class="rounded-md" />
    </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';
import hljsVuePlugin from '@highlightjs/vue-plugin';

// 正确导入组件
const highlightjs = hljsVuePlugin.component;

const props = defineProps({
    code: {
        type: String,
        required: true
    },
    language: {
        type: String,
        default: 'html'
    },
    autodetect: {
        type: Boolean,
        default: false
    }
});
</script>

<style scoped>
.code-highlighter {
    height: 100%;
    overflow: auto;
    background-color: #1e1e1e;
    border-radius: 0.375rem;
}

.code-highlighter :deep(pre) {
    margin: 0;
    padding: 1rem;
    height: 100%;
    overflow: auto;
    font-family: 'Consolas', 'Monaco', 'Andale Mono', 'Ubuntu Mono', monospace;
    font-size: 0.875rem;
    line-height: 1.5;
    white-space: pre-wrap;
    word-wrap: break-word;
}

/* 自定义滚动条样式 */
.code-highlighter :deep(pre)::-webkit-scrollbar {
    width: 6px;
    height: 6px;
}

.code-highlighter :deep(pre)::-webkit-scrollbar-track {
    background: #2d2d2d;
}

.code-highlighter :deep(pre)::-webkit-scrollbar-thumb {
    background: #555;
    border-radius: 3px;
}

.code-highlighter :deep(pre)::-webkit-scrollbar-thumb:hover {
    background: #777;
}

/* 确保代码内容也能自动换行 */
.code-highlighter :deep(code) {
    white-space: pre-wrap;
    word-wrap: break-word;
}
</style>