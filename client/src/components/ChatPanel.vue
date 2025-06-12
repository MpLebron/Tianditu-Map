<template>
  <div class="flex flex-col h-full w-full">
    <!-- Prompt Messages -->
    <div class="flex-1 overflow-y-auto bg-white text-sm leading-6 text-slate-900 shadow-md sm:text-base sm:leading-7"
      ref="messagesContainer">
      <div class="space-y-6 py-4 px-4 sm:px-4">
        <div v-for="(msg, idx) in chatHistory" :key="idx">
          <template v-if="msg.role === 'user'">
            <div class="flex items-start gap-3">
              <img class="h-8 w-8 rounded-full" :src="userAvatar" />
              <div class="bg-slate-100 rounded-xl px-4 py-3 max-w-xl">
                <div v-if="msg.file" class="file-attachment mb-2">
                  <div class="file-info">
                    <div class="file-icon">{{ getFileIcon(msg.file.mimetype) }}</div>
                    <div class="file-details overflow-hidden">
                      <div class="file-name truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px]"
                        :title="msg.file.filename">{{ msg.file.filename }}</div>
                      <div class="file-size">{{ formatFileSize(msg.file.size) }}</div>
                    </div>
                  </div>
                  <a :href="msg.file.url" target="_blank" class="file-link flex-shrink-0">查看文件</a>
                </div>
                <div v-html="formatMessage(msg.content)"></div>
              </div>
            </div>
          </template>
          <template v-else>
            <!-- AI思考过程和正式回复合并在同一个卡片 -->
            <div class="flex items-start gap-3 mt-2">
              <img class="h-8 w-8 rounded-full" :src="aiAvatar" />
              <div class="bg-blue-50 rounded-xl px-4 py-3 max-w-xl">
                <template v-if="msg.thinking">
                  <div class="ai-thinking-block mb-2 relative">
                    <div class="flex items-center justify-between">
                      <div class="text-xs text-slate-500 font-semibold">思考过程</div>
                      <button class="collapse-btn" @click="toggleThinking(idx)">
                        <svg v-if="!thinkingCollapsed[idx]" width="20" height="20" viewBox="0 0 20 20">
                          <path d="M5 12l5-5 5 5" stroke="#374151" stroke-width="2" fill="none" stroke-linecap="round"
                            stroke-linejoin="round" />
                        </svg>
                        <svg v-else width="20" height="20" viewBox="0 0 20 20">
                          <path d="M5 8l5 5 5-5" stroke="#374151" stroke-width="2" fill="none" stroke-linecap="round"
                            stroke-linejoin="round" />
                        </svg>
                      </button>
                    </div>
                    <transition name="collapse-fade" @before-enter="beforeEnter" @enter="enter"
                      @after-enter="afterEnter" @before-leave="beforeLeave" @leave="leave" @after-leave="afterLeave">
                      <div v-if="!thinkingCollapsed[idx]" class="mt-1" v-html="formatMessage(msg.thinking)"></div>
                    </transition>
                  </div>
                </template>
                <div v-html="formatMessage(msg.content)"></div>
                <div v-if="isLoading && idx === chatHistory.length - 1 && !msg.content" class="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Prompt message input -->
    <div class="w-full border-t border-slate-100 bg-white p-3">
      <!-- 文件上传预览区 -->
      <div v-if="uploadedFile" class="file-preview mb-2 p-2 bg-blue-50 rounded-lg flex items-center justify-between">
        <div class="flex items-center overflow-hidden">
          <div class="file-icon mr-2 flex-shrink-0">{{ getFileIcon(uploadedFile.mimetype) }}</div>
          <div class="overflow-hidden">
            <div class="text-sm font-medium truncate max-w-[200px] sm:max-w-[300px] md:max-w-[400px]"
              :title="uploadedFile.filename">{{ uploadedFile.filename }}</div>
            <div class="text-xs text-gray-500">{{ formatFileSize(uploadedFile.size) }}</div>
          </div>
        </div>
        <button @click="removeFile" class="text-gray-500 hover:text-red-500 flex-shrink-0 ml-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clip-rule="evenodd" />
          </svg>
        </button>
      </div>

      <!-- 输入区域 -->
      <div class="flex flex-col relative" @dragenter.prevent="isDragging = true" @dragover.prevent
        @dragleave.prevent="handleDragLeave" @drop.prevent="onDrop" :class="{ 'drag-active': isDragging }">
        <div class="flex items-stretch">
          <textarea v-model="description" @keydown.enter.prevent="handleEnterKey" rows="3"
            class="w-full rounded-lg border border-slate-200 bg-white p-3 text-base text-slate-900 placeholder-slate-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none resize-none transition-all duration-200"
            placeholder="描述您想要的地图，例如：显示北京市中心，并标记故宫" :disabled="isLoading"></textarea>
          <div class="ml-2 flex flex-col justify-between">
            <button @click="handleEnterKey"
              class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center"
              :disabled="isLoading || (!description.trim() && !uploadedFile)">
              <span v-if="!isLoading">发送</span>
              <span v-else>请稍候</span>
            </button>
            <button @click="triggerFileUpload"
              class="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center mt-2"
              :disabled="isLoading">
              <span>+</span>
            </button>
          </div>
        </div>

        <!-- 拖拽提示 -->
        <div v-if="isDragging" class="drag-overlay">
          <div class="drag-message">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24"
              stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            <span>将文件拖放到此处</span>
          </div>
        </div>

        <!-- 隐藏的文件上传输入 -->
        <input type="file" ref="fileInput" @change="handleFileChange" class="hidden" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue';
import hljs from 'highlight.js/lib/core';
import html from 'highlight.js/lib/languages/xml';
import javascript from 'highlight.js/lib/languages/javascript';
import css from 'highlight.js/lib/languages/css';
import { chatWithAI, chatWithAIStream } from '../services/aiService';
import { useMapStore } from '../store/mapStore';
import axios from 'axios';

hljs.registerLanguage('html', html);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('css', css);

const description = ref('');
const mapStore = useMapStore();
const messagesContainer = ref(null);
const fileInput = ref(null);
const uploadedFile = ref(null);
const isDragging = ref(false);
const dragCounter = ref(0);

const userAvatar = "../../public/icon/user.png";
const aiAvatar = '../../public/icon/chatbot.png';

// 聊天历史
const chatHistory = ref([
  {
    role: 'assistant',
    content: '您好，我是天地图网页应用开发智能体，能根据用户描述基于地理底图API生成应用代码。'
  }
]);

// 加载状态
const isLoading = ref(false);

// 流式响应控制
const streamController = ref(null);

// 折叠状态对象，key为消息索引
const thinkingCollapsed = ref({});

function toggleThinking(idx) {
  thinkingCollapsed.value[idx] = !thinkingCollapsed.value[idx];
}

// 监听聊天历史变化，自动滚动到底部
watch(chatHistory, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}, { deep: true });

// transition钩子实现丝滑动画
function beforeEnter(el) {
  el.style.maxHeight = '0';
  el.style.opacity = '0';
}
function enter(el) {
  el.style.transition = 'max-height 0.3s cubic-bezier(.4,0,.2,1), opacity 0.3s cubic-bezier(.4,0,.2,1)';
  nextTick(() => {
    el.style.maxHeight = el.scrollHeight + 'px';
    el.style.opacity = '1';
  });
}
function afterEnter(el) {
  el.style.maxHeight = '';
  el.style.transition = '';
}
function beforeLeave(el) {
  el.style.maxHeight = el.scrollHeight + 'px';
  el.style.opacity = '1';
}
function leave(el) {
  el.style.transition = 'max-height 0.3s cubic-bezier(.4,0,.2,1), opacity 0.3s cubic-bezier(.4,0,.2,1)';
  nextTick(() => {
    el.style.maxHeight = '0';
    el.style.opacity = '0';
  });
}
function afterLeave(el) {
  el.style.maxHeight = '';
  el.style.transition = '';
}

function formatMessage(content) {
  if (!content) return '';

  // 处理代码块，包括未闭合的代码块
  return content.replace(/```(html|javascript|js|css)?([\s\S]*?)(?:```|$)/g, (match, lang, code) => {
    if (!code) return match;
    try {
      const language = lang || 'html';
      let highlighted = '';

      // 尝试高亮代码
      try {
        highlighted = hljs.highlight(code.trim(), { language }).value;
      } catch (e) {
        highlighted = code; // 如果高亮失败，使用原始代码
      }

      // 判断是否是未闭合的代码块（没有结束的```）
      const isUnclosed = !match.endsWith('```');

      // 根据是否闭合使用不同的样式
      if (isUnclosed) {
        return `<div class="code-block code-block-partial"><div class="code-header">${language || 'code'} (正在输入...)</div><pre class="hljs"><code>${highlighted}</code></pre></div>`;
      } else {
        return `<div class="code-block"><div class="code-header">${language || 'code'}</div><pre class="hljs"><code>${highlighted}</code></pre></div>`;
      }
    } catch (e) {
      return `<div class="code-block"><pre class="hljs"><code>${code}</code></pre></div>`;
    }
  });
}

// 文件上传相关函数
function triggerFileUpload() {
  fileInput.value.click();
}

function handleFileChange(event) {
  const file = event.target.files[0];
  if (file) {
    console.log('选择的文件名:', file.name);
    uploadFile(file);
  }
}

function onDragOver(event) {
  event.preventDefault();
}

function handleDragLeave(event) {
  // 检查是否是真正的离开事件，而不是进入子元素
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX;
  const y = event.clientY;

  // 如果鼠标位置在元素外部，才认为是真正的离开
  if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
    isDragging.value = false;
  }
}

function onDrop(event) {
  isDragging.value = false;
  const file = event.dataTransfer.files[0];
  if (file) {
    console.log('拖放的文件名:', file.name);
    uploadFile(file);
  }
}

async function uploadFile(file) {
  try {
    isLoading.value = true;

    const formData = new FormData();
    formData.append('file', file);

    console.log('开始上传文件:', file.name);
    console.log('上传到: /api/upload');

    const response = await axios.post('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    console.log('上传响应:', response);

    if (response.data.success) {
      // 确保文件名正确显示
      const fileData = response.data.file;
      console.log('服务器返回的文件名:', fileData.filename);

      uploadedFile.value = fileData;
      console.log('文件上传成功:', uploadedFile.value);
    } else {
      console.error('服务器返回错误:', response.data.message);
      alert('文件上传失败: ' + response.data.message);
    }
  } catch (error) {
    console.error('文件上传错误详情:', error);
    if (error.response) {
      console.error('错误状态:', error.response.status);
      console.error('错误数据:', error.response.data);
      alert(`文件上传失败 (${error.response.status}): ${error.response.data?.message || '未知错误'}`);
    } else if (error.request) {
      console.error('未收到响应:', error.request);
      alert('文件上传失败: 服务器未响应，请检查服务器是否运行');
    } else {
      console.error('请求配置错误:', error.message);
      alert('文件上传失败: ' + error.message);
    }
  } finally {
    isLoading.value = false;
    // 清空文件输入以便再次选择同一文件
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
}

function removeFile() {
  uploadedFile.value = null;
}

function getFileIcon(mimetype) {
  if (mimetype.startsWith('image/')) {
    return '🖼️';
  } else if (mimetype.startsWith('video/')) {
    return '🎬';
  } else if (mimetype.startsWith('audio/')) {
    return '🎵';
  } else if (mimetype.includes('pdf')) {
    return '📄';
  } else if (mimetype.includes('word') || mimetype.includes('document')) {
    return '📝';
  } else if (mimetype.includes('excel') || mimetype.includes('spreadsheet')) {
    return '📊';
  } else if (mimetype.includes('zip') || mimetype.includes('rar') || mimetype.includes('tar')) {
    return '📦';
  } else {
    return '📎';
  }
}

function formatFileSize(bytes) {
  if (bytes < 1024) {
    return bytes + ' B';
  } else if (bytes < 1024 * 1024) {
    return (bytes / 1024).toFixed(2) + ' KB';
  } else if (bytes < 1024 * 1024 * 1024) {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  } else {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  }
}

// 处理发送消息
const handleEnterKey = async (event) => {
  if (event && event.shiftKey) return; // 如果按下Shift+Enter，不发送
  if (event && event.preventDefault) event.preventDefault();

  if ((!description.value.trim() && !uploadedFile.value) || isLoading.value) return;

  // 如果有正在进行的流式响应，先关闭它
  if (streamController.value) {
    streamController.value.close();
    streamController.value = null;
  }

  // 添加用户消息到聊天历史
  const userMsg = {
    role: 'user',
    content: description.value.trim()
  };

  // 如果有上传的文件，添加到消息中
  if (uploadedFile.value) {
    userMsg.file = uploadedFile.value;
  }

  chatHistory.value.push(userMsg);

  // 清空输入框和文件
  const userMessage = description.value;
  description.value = '';
  const fileInfo = uploadedFile.value;
  uploadedFile.value = null;

  // 添加AI思考中的消息
  const aiMessageIndex = chatHistory.value.length;
  chatHistory.value.push({
    role: 'ai',
    content: '',
    thinking: '正在分析您的请求...'
  });

  // 设置加载状态
  isLoading.value = true;

  try {
    // 准备历史消息数组，只保留最近的10条消息
    const messageHistory = chatHistory.value
      .slice(0, aiMessageIndex) // 不包含当前添加的AI消息
      .filter(msg => msg.role === 'user' || msg.role === 'assistant') // 只保留用户和助手消息
      .map(msg => ({
        role: msg.role === 'ai' ? 'assistant' : msg.role, // 将'ai'角色转换为'assistant'
        content: msg.content
      }))
      .slice(-10); // 只保留最近10条消息

    // 使用流式响应，传入历史消息
    let accumulatedContent = '';
    streamController.value = chatWithAIStream(
      userMessage + (fileInfo ? `\n(用户上传了文件: ${fileInfo.filename}, 可通过 ${fileInfo.url} 访问)` : ''),
      // 思考过程回调
      (thinking) => {
        chatHistory.value[aiMessageIndex].thinking = thinking;
      },
      // 内容回调
      (content) => {
        accumulatedContent += content;
        chatHistory.value[aiMessageIndex].content = accumulatedContent;

        // 检查是否包含代码块（包括未闭合的）
        const codeBlockRegex = /```(html|javascript|js|css)([\s\S]*?)(?:```|$)/;
        const mapCodeMatch = accumulatedContent.match(codeBlockRegex);

        if (mapCodeMatch) {
          // 提取代码内容，无论是否闭合
          const codeContent = mapCodeMatch[2];
          mapStore.setGeneratedMapCode(codeContent);
          mapStore.setMapDescription(userMessage);
        }
      },
      // 完成回调
      () => {
        isLoading.value = false;
        streamController.value = null;
      },
      // 错误回调
      (error) => {
        console.error('流式对话错误:', error);
        chatHistory.value[aiMessageIndex].content = '抱歉，发生了错误，无法获取回复。';
        chatHistory.value[aiMessageIndex].thinking = `错误详情: ${error.message || '未知错误'}`;
        isLoading.value = false;
        streamController.value = null;
      },
      // 传入历史消息
      messageHistory
    );
  } catch (error) {
    console.error('AI对话错误:', error);
    // 更新为错误消息
    chatHistory.value[aiMessageIndex] = {
      role: 'ai',
      content: '抱歉，发生了错误，无法获取回复。',
      thinking: `错误详情: ${error.message || '未知错误'}`
    };
    // 取消加载状态
    isLoading.value = false;
  }
};
</script>

<style scoped>
.thinking-process {
  white-space: pre-wrap;
  color: #374151;
  padding: 1rem;
}

.thinking-process :deep(.code-block),
:deep(.code-block) {
  margin: 1rem 0;
  border-radius: 0.75rem;
  overflow: hidden;
  background-color: #1e1e1e;
}

.thinking-process :deep(.code-header),
:deep(.code-block) .code-header {
  background-color: #2d2d2d;
  color: #e5e7eb;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-family: monospace;
  border-top-left-radius: 0.75rem;
  border-top-right-radius: 0.75rem;
}

.thinking-process :deep(pre.hljs),
:deep(.code-block) pre.hljs {
  margin: 0;
  padding: 1rem;
  overflow-x: auto;
  font-family: 'Consolas', 'Monaco', 'Andale Mono', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.thinking-process :deep(pre.hljs code),
:deep(.code-block) pre.hljs code {
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* 自定义滚动条样式 */
.thinking-process :deep(pre.hljs)::-webkit-scrollbar,
:deep(.code-block) pre.hljs::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.thinking-process :deep(pre.hljs)::-webkit-scrollbar-track,
:deep(.code-block) pre.hljs::-webkit-scrollbar-track {
  background: #2d2d2d;
}

.thinking-process :deep(pre.hljs)::-webkit-scrollbar-thumb,
:deep(.code-block) pre.hljs::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 3px;
}

.thinking-process :deep(pre.hljs)::-webkit-scrollbar-thumb:hover,
:deep(.code-block) pre.hljs::-webkit-scrollbar-thumb:hover {
  background: #777;
}

/* 复刻截图中的引用块风格 */
.ai-thinking-block {
  background: #fff;
  border-left: 2px solid #d1d5db;
  padding: 0.5rem 1rem;
  margin-bottom: 0.5rem;
  font-size: 1em;
  color: #6b7280;
  border-radius: 0;
  box-shadow: none;
}

.collapse-btn {
  background: none;
  border: none;
  padding: 0;
  margin-left: 0.5rem;
  cursor: pointer;
  line-height: 1;
  display: flex;
  align-items: center;
}

.collapse-fade-enter-active,
.collapse-fade-leave-active {
  overflow: hidden;
}

/* 打字指示器样式 */
.typing-indicator {
  display: inline-flex;
  align-items: center;
  margin: 0.5rem 0;
}

.typing-indicator span {
  height: 8px;
  width: 8px;
  margin: 0 2px;
  background-color: #3b82f6;
  border-radius: 50%;
  display: inline-block;
  animation: bounce 1.4s infinite ease-in-out both;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {

  0%,
  80%,
  100% {
    transform: scale(0);
  }

  40% {
    transform: scale(1.0);
  }
}

/* 未完成代码块样式 */
.code-block-partial {
  margin: 1rem 0;
  border-radius: 0.75rem;
  overflow: hidden;
  background-color: #1e1e1e;
  border: 1px dashed #3b82f6;
}

.code-block-partial .code-header {
  background-color: #2d2d2d;
  color: #e5e7eb;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-family: monospace;
  border-top-left-radius: 0.75rem;
  border-top-right-radius: 0.75rem;
  display: flex;
  justify-content: space-between;
}

.code-block-partial pre.hljs {
  margin: 0;
  padding: 1rem;
  overflow-x: auto;
  font-family: 'Consolas', 'Monaco', 'Andale Mono', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
  opacity: 0.8;
}

.code-block-partial pre.hljs code {
  white-space: pre-wrap;
  word-wrap: break-word;
}

/* 文件上传相关样式 */
.drag-active {
  position: relative;
}

.drag-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(59, 130, 246, 0.1);
  border: 2px dashed #3b82f6;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  pointer-events: none;
  /* 允许事件穿透到底层元素 */
  animation: none;
  /* 移除任何可能的动画 */
}

.drag-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  color: #3b82f6;
  font-weight: 500;
  background-color: rgba(255, 255, 255, 0.8);
  padding: 1rem;
  border-radius: 0.5rem;
}

.file-attachment {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: rgba(59, 130, 246, 0.1);
  border-radius: 0.5rem;
  padding: 0.5rem;
  max-width: 100%;
}

.file-info {
  display: flex;
  align-items: center;
  overflow: hidden;
  flex: 1;
}

.file-icon {
  font-size: 1.5rem;
  margin-right: 0.5rem;
  flex-shrink: 0;
}

.file-details {
  min-width: 0;
  /* 确保子元素可以正确截断 */
}

.file-name {
  font-weight: 500;
  font-size: 0.875rem;
}

.file-size {
  color: #6b7280;
  font-size: 0.75rem;
}

.file-link {
  color: #3b82f6;
  font-size: 0.875rem;
  text-decoration: none;
  margin-left: 0.5rem;
}

.truncate {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-preview {
  background-color: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 0.5rem;
  width: 100%;
}

@media (max-width: 640px) {
  .file-name {
    max-width: 150px !important;
  }

  .file-link {
    font-size: 0.75rem;
  }

  .file-icon {
    font-size: 1.25rem;
  }
}
</style>