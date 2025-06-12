<template>
    <div class="map-renderer flex flex-col h-full">
        <div class="flex-grow relative">
            <iframe ref="mapFrame" class="w-full h-full border-0" sandbox="allow-scripts allow-same-origin"></iframe>

            <!-- 悬浮分享控件 -->
            <div class="absolute top-2 right-2 flex items-center share-controls">
                <input v-if="shareLink" type="text" :value="shareLink" readonly
                    class="mr-2 px-3 py-1 text-xs border rounded-full bg-white bg-opacity-80 hover:bg-opacity-100 w-40 focus:outline-none shadow-md transition-all" />
                <button @click="shareMap" :disabled="isSharing"
                    class="group relative h-8 w-24 overflow-hidden rounded-2xl bg-green-500 text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed">
                    {{ isSharing ? '分享中...' : shareLink ? '重新分享' : '分享' }}
                    <div
                        class="absolute inset-0 h-full w-full scale-0 rounded-2xl transition-all duration-300 group-hover:scale-100 group-hover:bg-white/30">
                    </div>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useMapStore } from '../store/mapStore';
import { shareMap as shareMapService } from '../services/shareService';

const mapStore = useMapStore();
const mapFrame = ref(null);
const isSharing = ref(false);

const generatedMapCode = computed(() => mapStore.generatedMapCode);
const shareLink = computed(() => mapStore.shareLink);
const mapDescription = computed(() => mapStore.mapDescription);

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

// 获取当前显示的代码（生成的或默认的）
const currentMapCode = computed(() => {
    return generatedMapCode.value || defaultMapCode;
});

// 监听代码变化，更新iframe内容
watch(generatedMapCode, (newCode) => {
    if (newCode && mapFrame.value) {
        mapFrame.value.srcdoc = newCode;
    }
});

// 组件挂载时，如果没有生成的代码，则显示默认地图
onMounted(() => {
    if (mapFrame.value) {
        if (generatedMapCode.value) {
            mapFrame.value.srcdoc = generatedMapCode.value;
        } else {
            mapFrame.value.srcdoc = defaultMapCode;
        }
    }
});

const shareMap = async () => {
    if (isSharing.value) return;

    try {
        isSharing.value = true;
        const codeToShare = currentMapCode.value;
        const descToShare = mapDescription.value || '默认北京市中心地图';

        const result = await shareMapService(codeToShare, descToShare);
        mapStore.setShareLink(result.shareUrl);

        // 复制分享链接到剪贴板
        navigator.clipboard.writeText(result.shareUrl)
            .then(() => {
                alert('分享链接已复制到剪贴板');
            })
            .catch(() => {
                alert('分享成功，但复制链接失败，请手动复制');
            });
    } catch (error) {
        console.error('分享地图失败:', error);
        alert('分享地图失败，请重试');
    } finally {
        isSharing.value = false;
    }
};
</script>

<style scoped>
.share-controls {
    z-index: 1000;
}

.share-controls input,
.share-controls button {
    backdrop-filter: blur(4px);
}
</style>