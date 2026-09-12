<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  submit: {
    type: Function,
    required: true,
  },
  placeholder: {
    type: String,
    default: '写下你的旁证、补充或质疑…',
  },
  submitLabel: {
    type: String,
    default: '提交记录',
  },
  compact: {
    type: Boolean,
    default: false,
  },
  cancelable: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['cancel'])
const maxLength = 2000
const content = ref('')
const submitting = ref(false)
const canSubmit = computed(() => Boolean(content.value.trim()) && !submitting.value)

async function send() {
  if (!canSubmit.value) return
  submitting.value = true
  try {
    await props.submit(content.value.trim())
    content.value = ''
  } catch {
    // 提交失败时保留已输入内容，错误提示由调用方负责
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form class="composer" :class="{ compact }" @submit.prevent="send">
    <textarea
      v-model="content"
      :maxlength="maxLength"
      :placeholder="placeholder"
      :rows="compact ? 2 : 4"
    ></textarea>
    <div class="composer-footer">
      <small>
        {{ content.length }} / {{ maxLength }}
        <em v-if="!compact">· 请基于可核验事实发言，避免人身攻击</em>
      </small>
      <div class="composer-actions">
        <button v-if="cancelable" class="cancel" type="button" @click="emit('cancel')">
          取消
        </button>
        <button class="send" type="submit" :disabled="!canSubmit">
          {{ submitting ? '提交中…' : submitLabel }}
        </button>
      </div>
    </div>
  </form>
</template>

<style scoped>
.composer {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border: 1px solid #c9c0b6;
  background: #f6f3ea;
}

.composer.compact {
  padding: 10px;
  background: #f0ece2;
}

.composer textarea {
  width: 100%;
  outline: 0;
  padding: 10px 12px;
  border: 1px solid #d5cabf;
  background: #fdfbf5;
  color: #3d3732;
  font: inherit;
  font-size: 14px;
  line-height: 1.7;
  resize: vertical;
}

.composer textarea:focus {
  border-color: #a21d18;
  box-shadow: 3px 3px 0 rgba(162, 29, 24, 0.14);
}

.composer-footer {
  display: flex;
  align-items: center;
  gap: 12px;
}

.composer-footer small {
  min-width: 0;
  overflow: hidden;
  color: #a0907f;
  font-family: Georgia, serif;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.composer-footer small em {
  font-family: inherit;
  font-style: normal;
}

.composer-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.composer-actions button {
  padding: 9px 16px;
  border: 1px solid #292724;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease,
    box-shadow 0.2s ease;
}

.composer-actions .cancel {
  border-color: rgba(41, 39, 36, 0.4);
  background: transparent;
  color: #6d635a;
}

.composer-actions .cancel:hover {
  border-color: #292724;
  color: #292724;
}

.composer-actions .send {
  background: #292724;
  color: #f7f3ea;
  box-shadow: 3px 3px 0 rgba(162, 29, 24, 0.7);
}

.composer-actions .send:hover:not(:disabled) {
  background: #a21d18;
  box-shadow: 3px 3px 0 #292724;
}

.composer-actions .send:disabled {
  border-color: #bdb5ab;
  background: #cdc6bc;
  color: #f2efe8;
  box-shadow: none;
  cursor: not-allowed;
}
</style>
