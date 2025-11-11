<template>
  <p>Backend Test</p>
</template>

<script setup>
import { onMounted } from 'vue';
import { testBackend } from '@/api/test';

onMounted(() => {
  testBackend();
});
</script>
