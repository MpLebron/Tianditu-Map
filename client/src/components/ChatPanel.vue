<template>
  <div class="flex flex-col h-full w-full">
    <!-- Prompt Messages -->
    <div class="flex-1 overflow-y-auto bg-white text-sm leading-6 text-slate-900 shadow-md sm:text-base sm:leading-7"
      ref="messagesContainer">
      <div class="space-y-6 py-8 px-4 sm:px-4">
        <div v-for="(msg, idx) in chatHistory" :key="idx">
          <template v-if="msg.role === 'user'">
            <div class="flex items-start gap-3">
              <img class="h-8 w-8 rounded-full" :src="userAvatar" />
              <div class="bg-slate-100 rounded-xl px-4 py-3 max-w-xl">
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
      <div class="flex items-stretch">
        <textarea v-model="description" @keydown.enter.prevent="handleEnterKey" rows="3"
          class="w-full rounded-lg border border-slate-200 bg-white p-3 text-base text-slate-900 placeholder-slate-300 focus:border-blue-400 focus:ring-1 focus:ring-blue-100 focus:outline-none resize-none transition-all duration-200"
          placeholder="描述您想要的地图，例如：显示北京市中心，并标记故宫" :disabled="isLoading"></textarea>
        <button @click="handleEnterKey"
          class="ml-2 px-6 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center self-stretch"
          :disabled="isLoading || !description.trim()">
          <span v-if="!isLoading">发送</span>
          <span v-else>请稍候</span>
        </button>
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

hljs.registerLanguage('html', html);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('css', css);

const description = ref('');
const mapStore = useMapStore();
const messagesContainer = ref(null);

const userAvatar = "../../public/icon/user.png";
const aiAvatar = '../../public/icon/chatbot.png';

// 聊天历史
const chatHistory = ref([
  {
    role: 'assistant',
    content: '你好，我是一个天地图生成器，能根据用户描述生成天地图JavaScript API代码。'
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

// 处理发送消息
const handleEnterKey = async (event) => {
  if (event && event.shiftKey) return; // 如果按下Shift+Enter，不发送
  if (event && event.preventDefault) event.preventDefault();

  if (!description.value.trim() || isLoading.value) return;

  // 如果有正在进行的流式响应，先关闭它
  if (streamController.value) {
    streamController.value.close();
    streamController.value = null;
  }

  // 添加用户消息到聊天历史
  chatHistory.value.push({
    role: 'user',
    content: description.value
  });

  // 清空输入框
  const userMessage = description.value;
  description.value = '';

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
    // 使用流式响应（只传字符串）
    let accumulatedContent = '';
    streamController.value = chatWithAIStream(
      userMessage,
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
      }
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
</style>