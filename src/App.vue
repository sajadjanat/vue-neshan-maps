<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
const docs = new URLSearchParams(location.search).get('view') === 'docs'
const fa = new URLSearchParams(location.search).get('lang') !== 'en'
const Page = defineAsyncComponent(() => docs ? import('./docs/DocsView.vue') : import('./demo/Playground.vue'))
</script>
<template><Suspense><Page/><template #fallback><p role="status" :dir="fa?'rtl':'ltr'" style="padding:40px;font:14px/1.9 Vazir,Arial,sans-serif">{{ fa?'در حال آماده‌سازی صفحه…':'Preparing the page…' }}</p></template></Suspense></template>
