<script setup lang="ts">
import { defineAsyncComponent } from 'vue'
import { resolveRoute } from './site/routes'
const route = resolveRoute(new URL(location.href))
const docs = route.view === 'docs'
const fa = route.language === 'fa'
const Page = defineAsyncComponent(() => docs ? import('./docs/DocsView.vue') : import('./demo/Playground.vue'))
</script>
<template><Suspense><Page/><template #fallback><p role="status" :dir="fa?'rtl':'ltr'" style="padding:40px;font:14px/1.9 Vazir,Arial,sans-serif">{{ fa?'در حال آماده‌سازی صفحه…':'Preparing the page…' }}</p></template></Suspense></template>
