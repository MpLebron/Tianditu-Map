<template>
    <div class="code-artifacts flex flex-col h-full relative">
        <div class="flex-grow overflow-hidden">
            <!-- 添加编辑模式切换按钮 -->
            <div class="absolute top-2 left-2 z-10">
                <button @click="toggleEditMode"
                    class="group relative h-8 w-24 overflow-hidden rounded-2xl bg-blue-500 text-sm font-bold text-white">
                    {{ isEditing ? '预览模式' : '编辑模式' }}
                    <div
                        class="absolute inset-0 h-full w-full scale-0 rounded-2xl transition-all duration-300 group-hover:scale-100 group-hover:bg-white/30">
                    </div>
                </button>
            </div>

            <!-- 编辑模式 -->
            <div v-if="isEditing" class="w-full h-full">
                <textarea v-model="editableCode"
                    class="w-full h-full p-4 font-mono text-sm bg-gray-900 text-white resize-none focus:outline-none"
                    @input="handleCodeChange" spellcheck="false"></textarea>
            </div>

            <!-- 预览模式 -->
            <div v-else class="w-full h-full">
                <CodeHighlighter :code="editableCode" language="html" class="h-full" />
            </div>
        </div>

        <div class="absolute top-2 right-2 flex items-center z-10">
            <button @click="copyCode" :disabled="!editableCode"
                class="group relative h-8 w-20 overflow-hidden rounded-2xl bg-green-500 text-sm font-bold text-white mr-2 disabled:opacity-50 disabled:cursor-not-allowed">
                复制
                <div
                    class="absolute inset-0 h-full w-full scale-0 rounded-2xl transition-all duration-300 group-hover:scale-100 group-hover:bg-white/30">
                </div>
            </button>
            <button @click="downloadCode" :disabled="!editableCode"
                class="group relative h-8 w-20 overflow-hidden rounded-2xl bg-green-500 text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed">
                下载
                <div
                    class="absolute inset-0 h-full w-full scale-0 rounded-2xl transition-all duration-300 group-hover:scale-100 group-hover:bg-white/30">
                </div>
            </button>
        </div>
    </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from 'vue';
import { useMapStore } from '../store/mapStore';
import CodeHighlighter from './CodeHighlighter.vue';

const mapStore = useMapStore();
const isEditing = ref(false);
const editableCode = ref('');

// 默认的初始化地图代码
const defaultMapCode = `<!DOCTYPE html>
<html>
<head>
    <meta http-equiv="content-type" content="text/html; charset=utf-8"/>
    <meta name="keywords" content="天地图"/>
    <title>天地图－地图API－范例－经纬度直投地图</title>
    <script type="text/javascript" src="https://api.tianditu.gov.cn/api?v=4.0&tk=1d0dcde810c40ba139e57ec790e56a05"><\/script>
    <style type="text/css">
        body,
        html {
            width: 100%;
            height: 100%;
            margin: 0;
            font-family: "Microsoft YaHei"
        }

        #mapDiv {
            width: 100%;
            height: 100%
        }

        input,
        b,
        p {
            margin-left: 5px;
            font-size: 14px
        }
    </style>
    <script>
        var map;
        var zoom = 12;
        function onLoad() {
            map = new T.Map('mapDiv', {
                projection: 'EPSG:4326'
            });
            map.centerAndZoom(new T.LngLat(116.40769, 39.89945), zoom);
        }
    <\/script>
</head>

<body onLoad="onLoad()">
    <div id="mapDiv"></div>
</body>

</html>`;

// 监听store中的代码变化
const storeCode = computed(() => mapStore.generatedMapCode || defaultMapCode);

// 在组件挂载时初始化编辑器的代码
onMounted(() => {
    editableCode.value = storeCode.value;
});

// 监听store代码变化
watch(storeCode, (newCode) => {
    if (!isEditing.value) {
        editableCode.value = newCode;
    }
});

// 切换编辑模式
const toggleEditMode = () => {
    isEditing.value = !isEditing.value;
};

// 处理代码变化
const handleCodeChange = (event) => {
    editableCode.value = event.target.value;
    mapStore.setGeneratedMapCode(event.target.value);
};

const copyCode = () => {
    if (!editableCode.value) return;

    navigator.clipboard.writeText(editableCode.value)
        .then(() => {
            alert('代码已复制到剪贴板');
        })
        .catch(err => {
            console.error('复制失败:', err);
            alert('复制失败，请手动复制');
        });
};

const downloadCode = () => {
    if (!editableCode.value) return;

    const blob = new Blob([editableCode.value], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'tianditu-map.html';
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
};
</script>

<style scoped>
/* 添加按钮半透明效果 */
.code-artifacts button {
    backdrop-filter: blur(4px);
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

/* 自定义滚动条样式 */
textarea::-webkit-scrollbar {
    width: 8px;
}

textarea::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
}

textarea::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 4px;
}

textarea::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.4);
}

/* 设置textarea的字体和tab大小 */
textarea {
    font-family: 'Consolas', 'Monaco', 'Andale Mono', 'Ubuntu Mono', monospace;
    tab-size: 4;
}
</style>