<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  submit: { type: Function, required: true },
  placeholder: { type: String, default: '写下旁证、补充或质疑…' },
  submitLabel: { type: String, default: '发表' },
  compact: { type: Boolean, default: false },
  cancelable: { type: Boolean, default: false },
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
    // 失败时保留已输入内容
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
      :rows="compact ? 2 : 3"
    ></textarea>
    <div class="bar">
      <small>{{ content.length }}/{{ maxLength }}</small>
      <button v-if="cancelable" type="button" @click="emit('cancel')">取消</button>
      <button class="send" type="submit" :disabled="!canSubmit">
        {{ submitting ? '提交中…' : submitLabel }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.composer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border: 1px solid #d4cbbd;
  background: #faf6ee;
}

.composer.compact {
  padding: 10px;
  background: #f1ece2;
}

textarea {
  width: 100%;
  outline: 0;
  padding: 10px 12px;
  border: 1px solid #d8cec2;
  background: #fffdf8;
  color: #3d3732;
  font: inherit;
  font-size: 15px;
  line-height: 1.6;
  resize: none;
}

.bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.bar small {
  margin-right: auto;
  color: #a0907f;
  font-size: 11px;
}

.bar button {
  min-height: 36px;
  padding: 0 12px;
  border: 1px solid #c8bdb2;
  background: transparent;
  color: #6d635a;
  font-weight: 700;
}

.bar .send {
  border-color: #292724;
  background: #292724;
  color: #f7f3ea;
}

.bar .send:disabled {
  border-color: #cdc6bc;
  background: #cdc6bc;
}
</style>
