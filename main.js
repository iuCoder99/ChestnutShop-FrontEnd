import App from './App'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
// 引入 Pinia 实例（关键：之前缺失的核心步骤）
import { pinia } from './store/index'
import request from '@/utils/request'

export function createApp() {
  const app = createSSRApp(App)
  // 挂载 Pinia 到 Vue 应用（关键：让所有页面可访问 store）
  app.use(pinia)
  // 挂载请求库到全局属性
  app.config.globalProperties.$http = request
  return {
    app
  }
}
// #endif