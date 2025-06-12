<template>
    <div class="header-bar">
        <div class="header-content">
            <div class="title-container">
                <div class="logo-container">
                    <img src="/icon/天地图logo.png" alt="天地图logo" class="logo">
                </div>
                <img src="/icon/title.png" alt="天地图网页应用开发智能体" class="title-image">
            </div>
        </div>
    </div>
</template>

<script setup>
// 无需额外逻辑
</script>

<style scoped>
.header-bar {
    width: 100%;
    background-color: #ffffff;
    padding: 0 20px;
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
    position: relative;
    z-index: 100;
}

.header-bar::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: -1px;
    height: 1px;
    background-color: #e3e5e7;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.header-content {
    max-width: 100%;
    margin: 0 auto;
    padding: 0;
}

.title-container {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding-left: 10px;
}

.logo-container {
    display: flex;
    align-items: center;
    margin-right: 10px;
}

.logo {
    height: 40px;
    width: auto;
}

.title-image {
    max-height: 70px;
    width: auto;
}
</style>