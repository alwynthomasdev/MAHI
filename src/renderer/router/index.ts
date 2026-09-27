import { createRouter, createWebHashHistory } from 'vue-router';
import QuickAddWindow from '../views/QuickAddWindow.vue';

const routes = [
  { path: '/', redirect: '/today' },
  // Static import (not lazy) so `route.name` resolves before App.vue branches on it.
  { path: '/quick-add', name: 'quick-add', component: QuickAddWindow },
  { path: '/today', name: 'today', component: () => import('../views/TodayView.vue') },
  { path: '/list', name: 'list', component: () => import('../views/ListView.vue') },
  { path: '/board', name: 'board', component: () => import('../views/SwimlaneView.vue') },
  { path: '/archive', name: 'archive', component: () => import('../views/ArchiveView.vue') },
  { path: '/bin', name: 'bin', component: () => import('../views/RecycleBinView.vue') },
  { path: '/settings', name: 'settings', component: () => import('../views/SettingsView.vue') },
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
});
