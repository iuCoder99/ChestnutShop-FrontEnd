# Copilot 指南 — demo1 项目

目的：让代码智能体（Copilot/AI 代理）能快速理解本仓库的结构、运行方式、约定和常见模式，减少探索成本。

1) 项目类型与运行
- 这是一个基于 uni-app 的小程序项目（兼容 Vue2/Vue3 片段），脚本在根目录 `package.json` 中定义。
- 开发 / 构建命令：
  - `npm install` — 安装依赖
  - `npm run dev` — 启动本地开发（使用 `uni` CLI）
  - `npm run build` — 生产构建（使用 `uni build`）
  - `npm run dev:mp-weixin` — 针对微信小程序的开发构建（见 scripts）

2) 关键文件与约定（示例路径）
- 入口与兼容：`main.js` — 含 `#ifndef VUE3 / #ifdef VUE3` 分支，Vue2 与 Vue3 都有支持，`createApp()` 会挂载 `pinia`。 参考 [main.js](main.js)
- 构建与 dev 代理：`vite.config.js` — 使用 `@dcloudio/vite-plugin-uni`，server.proxy 将 `/api` 转发到 `http://localhost:8080`。 参考 [vite.config.js](vite.config.js)
- 页面配置：`pages.json` — 列出小程序页面与 tabBar，子包在 `subPackages` 中。 参考 [pages.json](pages.json)
- 状态管理：`store/index.js` — 导出 `pinia` 实例和 `useUserStore/useCartStore/useOrderStore`。 参考 [store/index.js](store/index.js)
- 后端请求封装：`utils/request.js` — 统一请求入口，包含：
  - baseUrl 初始值为 `https://localhost:8080`（请替换为真实后端地址）
  - 从 `userStore` 获取 `token` 并在 `Authorization: Bearer ...` 中传递
  - 响应处理：统一把下划线字段转为驼峰，清理字符串，并且把返回内容规范为 `{ success, data: Array, message }` 的形式
  - 401/403 会触发 `userStore.logout()` 并 `uni.reLaunch('/pages/main/login')` 跳转登录
 参考 [utils/request.js](utils/request.js)

3) 项目特定模式（必须遵守的发现）
- 双源码目录结构：工程中存在多个类似目录（如根目录与 `src/` 的重复结构）。一般以根目录为 uni-app 的主要入口（`pages.json` 在根）。在修改页面/配置时优先检查根目录是否为运行时使用的文件。
- 请求返回处理：所有 API 返回均会被 `utils/request.js` 处理并保证 `data` 字段为数组（即使接口返回单对象）。AI 代理在生成调用代码或解析响应时应使用此约定。
- 命名转换：后端使用下划线命名（snake_case），前端统一转换为驼峰（camelCase）。在生成字段访问代码时请使用驼峰形式。
- 授权流：token 保存在 `userStore`，并总是通过 `Authorization` 头传递；遇到 401/403 时需要调用 `userStore.logout()` 并跳转登录页。

4) 集成点与外部依赖
- 使用 `uni.request`（uni-app 平台 API）而非 `fetch/axios`。
- 依赖库：`@dcloudio/vite-plugin-uni`, `pinia`, `vue`（见 `package.json`）。
- 开发时常用后端地址为 `http://localhost:8080`（见 `vite.config.js` proxy），但 `utils/request.js` 使用 `https://localhost:8080`，请留意两处并与后端团队确认正确协议与端口。

5) AI 代理任务写作建议（如何安全、有效地修改仓库）
- 修改前先查看并引用上述关键文件；涉及接口、认证或页面路由的改动，请同时修改 `utils/request.js` / `userStore` / `pages.json`。
- 对接口的示例调用请遵循 `request` 的入参：`{ url, method, data, params }`，并假定返回为 `{ success, data: Array, message }`。
- 不要改变 `utils/request.js` 的统一响应包装逻辑，除非确切知道后端返回结构已全仓库同步调整。

6) 常见问题与调试提示
- 如果页面无法热重载或找不到页面，先检查根目录下的 `pages.json` 与 `subPackages` 配置。
- API 调试：前端 dev 时 `vite.config.js` 已配置代理 `/api` → `http://localhost:8080`。若后端未启用 HTTPS，可将 `utils/request.js` 的 `baseUrl` 改为 `http://localhost:8080`（临时调试）。

7) 变更提交建议
- 添加或修改页面时：更新 `pages.json` 并运行 `npm run dev:mp-weixin` 本地构建验证页面能在目标小程序平台加载。
- 修改接口或鉴权逻辑时：在 `utils/request.js` 的日志点查看 `完整API响应`（文件中已打印），并在 PR 描述中说明对后端返回结构的假设。

结束语：如果你想要我把这份指南合入仓库（创建/更新文件），我可以现在提交更改并打开 PR 或把文件写入 `.github/`。请告诉我是否需要调整或补充某些文件引用或命令示例。
