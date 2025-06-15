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
import hljs from 'highlight.js';  // 改为全量导入highlight.js
import { chatWithAIStream } from '../services/aiService';
import { useMapStore } from '../store/mapStore';
import axios from 'axios';
import systemMessage from '../promptTemplate/systemMessage.js';

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

// 保存发送给API的消息历史，确保在会话过程中保持一致
const apiMessageHistory = ref([
  {
    role: 'system',
    content: systemMessage
  },
  {
    role: 'assistant',
    content: '您好，我是天地图网页应用开发智能体，能根据用户描述基于地理底图API生成应用代码。'
  }
]);

// 加载状态
const isLoading = ref(false);

// 重试计数器
const retryCount = ref(0);
const MAX_RETRIES = 2;

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

  // console.log('格式化消息内容:', content.substring(0, 100) + '...');

  // 处理代码块，包括未闭合的代码块
  return content.replace(/```(html|javascript|js|css|python)?([\s\S]*?)(?:```|$)/g, (match, lang, code) => {
    if (!code) return match;
    try {
      // 确定语言，如果未指定则尝试自动检测
      const language = lang || '';
      let highlighted = '';

      // console.log('尝试高亮代码:', language, code.substring(0, 50) + '...');

      // 尝试高亮代码
      try {
        if (language) {
          highlighted = hljs.highlight(code.trim(), { language }).value;
        } else {
          // 自动检测语言
          highlighted = hljs.highlightAuto(code.trim()).value;
        }
        // console.log('高亮成功');
      } catch (e) {
        console.error('高亮失败:', e);
        highlighted = code; // 如果高亮失败，使用原始代码
      }

      // 判断是否是未闭合的代码块（没有结束的```）
      const isUnclosed = !match.endsWith('```');
      // console.log('是否未闭合代码块:', isUnclosed);

      // 根据是否闭合使用不同的样式
      if (isUnclosed) {
        return `<div class="code-block code-block-partial"><div class="code-header">${language || '代码'} (正在输入...)</div><pre class="hljs"><code>${highlighted}</code></pre></div>`;
      } else {
        return `<div class="code-block"><div class="code-header">${language || '代码'}</div><pre class="hljs"><code>${highlighted}</code></pre></div>`;
      }
    } catch (e) {
      console.error('代码块处理错误:', e);
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

    // 检查文件类型
    const fileExt = file.name.split('.').pop().toLowerCase();
    const supportedTypes = ['geojson', 'json']; // 前端硬编码支持的类型，未来可从后端获取
    if (!supportedTypes.includes(fileExt)) {
      alert(`不支持的文件类型: .${fileExt}。支持的类型: ${supportedTypes.map(t => '.' + t).join(', ')}`);
      isLoading.value = false;
      return;
    }

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

      // 保存文件信息和处理结果
      uploadedFile.value = {
        ...fileData,
        fileType: fileData.type,
        processData: response.data.processResult
      };

      // 如果有处理结果，添加到描述中
      if (response.data.processResult && response.data.processResult.success) {
        // 如果有summaryText，直接使用它
        if (response.data.processResult.summaryText) {
          // description.value = `用户上传了一个${fileData.type.toUpperCase()}文件 "${fileData.filename}"，以下是文件分析结果：\n\n${response.data.processResult.summaryText}`;
        } else {
          // 兼容旧版本，构建基本描述
          let fileDescription = `我上传了一个${fileData.type.toUpperCase()}文件 "${fileData.filename}"`;

          // 针对不同文件类型构建不同的描述
          if (fileData.type === 'geojson' || fileData.type === 'json') {
            const summary = response.data.processResult.summary;

            if (summary.type) {
              fileDescription += `，类型为 ${summary.type}`;
            }

            if (summary.featureCount) {
              fileDescription += `，包含 ${summary.featureCount} 个要素`;
            }

            if (summary.propertyFields && summary.propertyFields.length > 0) {
              fileDescription += `，属性字段包括: ${summary.propertyFields.join(', ')}`;
            }
          }
          // 未来可以添加其他文件类型的描述逻辑

          // 将描述添加到输入框
          description.value = fileDescription;
        }
      }

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

  // 重置重试计数器
  retryCount.value = 0;

  // 发送消息
  await sendMessage();
};

// 发送消息并处理响应的函数
const sendMessage = async () => {
  // ===== 第1步：准备发送给API的历史消息 =====
  // 使用保存的API消息历史，确保包含之前的所有对话
  const messageHistory = [...apiMessageHistory.value];

  console.log('messageHistory:', messageHistory);

  console.log('初始API消息历史:', messageHistory);

  // ===== 第2步：添加当前用户消息到UI显示的聊天历史和API历史（如果是第一次尝试）=====
  if (retryCount.value === 0) {
    const userMsg = {
      role: 'user',
      content: description.value.trim()
    };

    // 如果有上传的文件，添加到消息中
    if (uploadedFile.value) {
      userMsg.file = uploadedFile.value;
    }

    // 添加到UI显示的聊天历史
    chatHistory.value.push(userMsg);

    // 添加到API消息历史 - 确保不包含文件对象
    apiMessageHistory.value.push({
      role: 'user',
      content: description.value.trim()
    });
  }

  // 保存用户消息内容并清空输入框
  const userMessage = description.value;
  if (retryCount.value === 0) {
    description.value = '';
  }

  // ===== 第3步：处理文件分析信息（仅在第一次尝试时）=====
  let fileAnalysisText = '';
  if (retryCount.value === 0 && uploadedFile.value && uploadedFile.value.processData) {
    // 创建文件分析文本
    fileAnalysisText = `用户上传了一个${uploadedFile.value.fileType.toUpperCase()}文件 "${uploadedFile.value.filename}"，以下是文件分析结果：\n\n`;

    // 优先使用保存的分析文本
    if (uploadedFile.value.analysisText) {
      fileAnalysisText += uploadedFile.value.analysisText;
    }
    // 如果没有分析文本，使用summaryText或textContent
    else if (uploadedFile.value.processData.summaryText) {
      fileAnalysisText += uploadedFile.value.processData.summaryText;
    } else if (uploadedFile.value.processData.textContent) {
      fileAnalysisText += `文件内容预览：\n${uploadedFile.value.processData.textContent}`;
    }

    // console.log('文件分析文本已生成:', fileAnalysisText.substring(0, 50) + '...');
  }

  // ===== 第3.5步：将文件分析信息添加到系统消息中（仅在第一次尝试时）=====
  if (retryCount.value === 0 && fileAnalysisText) {
    // 查找系统消息
    let systemMsgIndex = messageHistory.findIndex(msg => msg.role === 'system');

    if (systemMsgIndex !== -1) {
      // 如果存在系统消息，将文件分析信息添加到系统消息后面
      messageHistory[systemMsgIndex].content += `\n\n${fileAnalysisText}`;

      // 同时更新apiMessageHistory中的系统消息
      const apiSystemMsgIndex = apiMessageHistory.value.findIndex(msg => msg.role === 'system');
      if (apiSystemMsgIndex !== -1) {
        apiMessageHistory.value[apiSystemMsgIndex].content += `\n\n${fileAnalysisText}`;
      }

      // console.log('文件分析信息已添加到系统消息');
    } else {
      // 如果不存在系统消息，创建一个新的系统消息
      const newSystemMsg = {
        role: 'system',
        content: `您是天地图API专家。${fileAnalysisText}`
      };
      messageHistory.unshift(newSystemMsg);
      apiMessageHistory.value.unshift(newSystemMsg);
      // console.log('创建了新的系统消息，包含文件分析信息');
    }
  }

  if (retryCount.value === 0) {
    uploadedFile.value = null;
  }

  // ===== 第3.6步：添加当前HTML代码作为上下文（仅在第一次尝试时）=====
  if (retryCount.value === 0) {
    // 从mapStore获取当前HTML代码
    const currentHtmlCode = mapStore.generatedMapCode;
    console.log('mapStore中是否有HTML代码:', !!currentHtmlCode);

    if (currentHtmlCode) {
      // console.log('找到当前HTML代码，长度:', currentHtmlCode.length);
      // console.log('HTML代码前50个字符:', currentHtmlCode.substring(0, 50));

      // 将HTML代码添加到系统消息中，而不是作为单独的消息
      let systemMsgIndex = messageHistory.findIndex(msg => msg.role === 'system');

      if (systemMsgIndex !== -1) {
        // 如果存在系统消息，将HTML代码添加到系统消息后面
        messageHistory[systemMsgIndex].content += `\n\n当前页面上渲染的HTML页面的代码：\n\`\`\`html\n${currentHtmlCode}\n\`\`\``;

        // 同时更新apiMessageHistory中的系统消息
        const apiSystemMsgIndex = apiMessageHistory.value.findIndex(msg => msg.role === 'system');
        if (apiSystemMsgIndex !== -1) {
          apiMessageHistory.value[apiSystemMsgIndex].content += `\n\n当前页面上渲染的HTML页面的代码代码：\n\`\`\`html\n${currentHtmlCode}\n\`\`\``;
        }

        console.log('HTML代码已添加到系统消息');
      } else {
        // 如果不存在系统消息，创建一个新的系统消息
        const newSystemMsg = {
          role: 'system',
          content: `您是天地图API专家。\n\n当前HTML代码：\n\`\`\`html\n${currentHtmlCode}\n\`\`\``
        };
        messageHistory.unshift(newSystemMsg);
        apiMessageHistory.value.unshift(newSystemMsg);
        console.log('创建了新的系统消息，包含HTML代码');
      }
    } else {
      console.log('未找到当前HTML代码，不添加HTML上下文');
    }
  }

  // ===== 第4步：在UI中显示AI正在思考的消息 =====
  const aiMessageIndex = chatHistory.value.length;
  chatHistory.value.push({
    role: 'ai',
    content: '',
    thinking: retryCount.value > 0 ? '正在重试...' : '正在分析您的请求...'
  });

  // 设置加载状态
  isLoading.value = true;

  try {
    // console.log(`发送给API的最终消息历史 (尝试 ${retryCount.value + 1}/${MAX_RETRIES + 1}):`, JSON.stringify(messageHistory, null, 2));

    // ===== 第5步：发送请求并处理流式响应 =====
    let accumulatedContent = '';
    let hasReceivedContent = false;

    // console.log('mapStore.generatedMapCode:', mapStore.generatedMapCode);

    streamController.value = chatWithAIStream(
      userMessage, // 传递用户消息内容，确保aiService中能正确处理
      // 思考过程回调 - 更新UI中的思考过程
      (thinking) => {
        chatHistory.value[aiMessageIndex].thinking = thinking;
      },
      // 内容回调 - 更新UI中的回复内容
      (content) => {
        hasReceivedContent = true;
        accumulatedContent += content;
        chatHistory.value[aiMessageIndex].content = accumulatedContent;

        // 检查是否包含代码块（包括未闭合的）
        const codeBlockRegex = /```(html|javascript|js|css|python)?([\s\S]*?)(?:```|$)/;
        const mapCodeMatch = accumulatedContent.match(codeBlockRegex);

        if (mapCodeMatch) {
          // 提取代码内容，无论是否闭合
          const language = mapCodeMatch[1] || 'html';
          const codeContent = mapCodeMatch[2];

          // 只有当是HTML代码时才更新地图
          if (language === 'html' || !language) {
            // console.log('更新地图代码');
            mapStore.setGeneratedMapCode(codeContent);
            mapStore.setMapDescription(userMessage);
          }
        }
      },
      // 完成回调 - 处理响应完成后的操作
      () => {
        isLoading.value = false;
        streamController.value = null;

        // 检查是否收到了内容
        if (!hasReceivedContent && retryCount.value < MAX_RETRIES) {
          // 如果没有收到内容且未超过最大重试次数，则重试
          console.warn(`没有收到AI回复，正在重试 (${retryCount.value + 1}/${MAX_RETRIES})...`);
          retryCount.value++;

          // 移除上一次的空回复
          chatHistory.value.pop();

          // 重新发送消息
          setTimeout(() => sendMessage(), 1000);
          return;
        }

        // ===== 第6步：将AI回复添加到API消息历史中 =====
        const aiResponse = chatHistory.value[aiMessageIndex];
        if (aiResponse && aiResponse.content) {
          // 将AI回复添加到API消息历史
          const assistantMsg = {
            role: 'assistant',
            content: aiResponse.content
          };

          // 确保不重复添加相同内容的消息
          const lastApiMsg = apiMessageHistory.value[apiMessageHistory.value.length - 1];
          if (!lastApiMsg || lastApiMsg.role !== 'assistant' || lastApiMsg.content !== aiResponse.content) {
            apiMessageHistory.value.push(assistantMsg);
            console.log('AI回复已添加到API消息历史:', assistantMsg);
            console.log('当前完整API消息历史:', JSON.stringify(apiMessageHistory.value, null, 2));
          }

          // 重置重试计数器
          retryCount.value = 0;
        } else if (retryCount.value >= MAX_RETRIES) {
          console.error('达到最大重试次数，AI仍未回复');
          chatHistory.value[aiMessageIndex].content = '抱歉，AI未能生成回复，请重试。';
          chatHistory.value[aiMessageIndex].thinking = '回复失败';

          // 重置重试计数器
          retryCount.value = 0;
        }
      },
      // 错误回调
      (error) => {
        console.error('流式对话错误:', error);

        if (retryCount.value < MAX_RETRIES) {
          // 如果未超过最大重试次数，则重试
          console.warn(`对话出错，正在重试 (${retryCount.value + 1}/${MAX_RETRIES})...`);
          retryCount.value++;

          // 移除上一次的错误回复
          chatHistory.value.pop();

          // 重新发送消息
          setTimeout(() => sendMessage(), 1000);
        } else {
          // 如果已达到最大重试次数，显示错误信息
          chatHistory.value[aiMessageIndex] = {
            role: 'ai',
            content: '抱歉，发生了错误，无法获取回复。',
            thinking: `错误详情: ${error.message || '未知错误'}`
          };

          // 重置重试计数器
          retryCount.value = 0;
          isLoading.value = false;
        }
      },
      // 传入消息历史
      messageHistory
    );
  } catch (error) {
    console.error('AI对话错误:', error);

    if (retryCount.value < MAX_RETRIES) {
      // 如果未超过最大重试次数，则重试
      console.warn(`对话出错，正在重试 (${retryCount.value + 1}/${MAX_RETRIES})...`);
      retryCount.value++;

      // 移除上一次的错误回复
      chatHistory.value.pop();

      // 重新发送消息
      setTimeout(() => sendMessage(), 1000);
    } else {
      // 如果已达到最大重试次数，显示错误信息
      chatHistory.value[aiMessageIndex] = {
        role: 'ai',
        content: '抱歉，发生了错误，无法获取回复。',
        thinking: `错误详情: ${error.message || '未知错误'}`
      };

      // 重置重试计数器
      retryCount.value = 0;
      isLoading.value = false;
    }
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