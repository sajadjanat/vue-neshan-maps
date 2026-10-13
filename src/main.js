import { createApp } from 'vue';
import { resolveRoute } from './site/routes';
import '../fonts/vazir.css';

// Keep readable prerendered HTML visible while the interactive page downloads.
async function boot() {
  const route = resolveRoute(new URL(location.href));
  const page = route.view === 'docs' ? await import('./docs/DocsView.vue') : await import('./demo/Playground.vue');
  createApp(page.default).mount('#app');
}
boot().catch(() => {
  const note = document.createElement('p');
  note.setAttribute('role', 'alert');
  note.textContent = document.documentElement.lang === 'fa'
    ? 'بارگیری ابزارهای تعاملی ناموفق بود؛ متن راهنما همچنان در دسترس است. صفحه را دوباره بارگیری کنید.'
    : 'Interactive tools could not load. The guide remains readable; reload to try again.';
  document.body.append(note);
});
