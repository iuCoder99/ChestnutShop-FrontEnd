import { createPinia } from 'pinia';
import { useUserStore } from './modules/userStore';
import { useCartStore } from './modules/cartStore';
import { useOrderStore } from './modules/orderStore';
import { useChatStore } from './modules/chatStore';

// 创建Pinia实例
const pinia = createPinia();

// 导出Pinia实例和所有子模块
export { pinia, useUserStore, useCartStore, useOrderStore, useChatStore };