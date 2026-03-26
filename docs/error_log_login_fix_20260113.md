# 错误记录 - 微信小程序登录功能修复

## 日期
2026年01月13日

## 问题描述
1. **微信授权登录报错**：控制台提示 `TypeError: Invalid attempt to destructure non-iterable instance`，导致登录流程中断。
2. **登录响应挂起**：Network 显示 200，但前端页面一直显示“登录中...”，无任何响应和跳转。
3. **账号登录超时**：由于 `baseUrl` 配置为局域网 IP，导致在本地测试环境下连接超时。
4. **交互体验问题**：`showLoading` 与 `hideLoading` 未配对，且登录失败时无明确提示。

## 错误原因
1. **API 返回格式误判**：在 Vue 3 环境下，`uni.login` 异步返回的是结果对象而非 `[err, res]` 数组，原代码尝试数组解构导致 JS 报错。
2. **网络解析与底层挂起**：
   - 使用 `localhost` 在部分环境下会解析为 IPv6 地址，导致与 IPv4 后端连接异常。
   - 微信底层 `uni.request` 的 Promise 在特定插件干扰下可能无法正常 Resolve/Reject。
3. **非法字符干扰**：后端返回的 `avatarUrl` 等字段包含反引号 (`` ` ``) 和多余空格，直接用于请求或渲染可能导致逻辑异常。
4. **异常链路不完善**：`catch` 块中缺少关闭 Loading 的逻辑，导致 UI 锁定。

## 修复方法
1. **兼容性 API 调用**：
   - 重构 `uni.login` 调用，增加对对象和数组两种返回格式的兼容处理。
2. **网络配置优化**：
   - 将 `baseUrl` 从 `localhost` 修改为 `127.0.0.1`，确保 IPv4 稳定连接。
3. **请求加固机制**：
   - 在 `request.js` 中引入 `Promise.race` 竞争机制，设置 25s 的“Promise 层超时”保护，防止无限期转圈。
   - 手动封装 `new Promise` 包装 `uni.request`，确保回调链路 100% 触发。
4. **深度数据清洗 (Deep Clean)**：
   - 新增 `deepClean` 递归工具函数，自动剔除所有字符串中的反引号、特殊引号及首尾空格。
5. **UI 交互规范化**：
   - 统一封装 `handleLoginSuccess` 处理跳转逻辑（增加 1.5s 延迟确保 Toast 完整展示）。
   - 在所有 `catch` 和 `finally` 块中强制调用 `uni.hideLoading()`。

## 2026年01月13日 - 后续修复：后端 BaseContext 获取 UserInfo 为 null (NPE)

### 问题描述
用户登录成功后，进入个人详情页正常（显示缓存数据），但在进行购物车操作（如获取列表、合并购物车）时，后端报错 `java.lang.NullPointerException`。
错误日志：`Cannot invoke "UserInfo.getId()" because the return value of "BaseContext.getUserInfo()" is null`。

### 错误原因
1. **请求头识别失败**：后端拦截器（Interceptor）无法正确解析前端发送的 `Authorization` 请求头。
2. **格式不匹配**：部分后端模板（如基于苍穹外卖等课程的模板）默认识别名为 `token` 或 `authentication` 的请求头，且可能不带 `Bearer ` 前缀。
3. **Context 丢失**：由于拦截器未能提取到有效 token，导致未能将用户信息注入 `BaseContext` (ThreadLocal)，后续业务逻辑调用 `BaseContext.getUserInfo().getId()` 时触发空指针异常。

### 修复方法
1. **冗余请求头配置**：在 `utils/request.js` 中增加多重保险，同时发送 `Authorization` (带 Bearer)、`token` (不带 Bearer) 和 `authentication` (不带 Bearer) 三个请求头。
2. **调试日志增强**：在 `request.js` 的开发模式下打印完整的请求头（Headers），方便排查 Token 是否真实送达。

### 相关文件
- [request.js](file:///d:/coding/HBuild%20X/projects/project_study/demo1/utils/request.js)：增加冗余 Token 请求头。
- [src/utils/request.js](file:///d:/coding/HBuild%20X/projects/project_study/demo1/src/utils/request.js)：同步更新。
