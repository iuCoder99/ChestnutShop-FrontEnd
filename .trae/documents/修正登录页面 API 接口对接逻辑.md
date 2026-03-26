## 修正说明
根据您提供的 `api-docs.json` 接口文档和后端报错日志，我发现不同接口对参数传递方式（Query Params vs Request Body）以及请求方法（POST vs PUT）有严格要求。我已经完成了以下修正：

### 1. 严格对齐接口文档
- **账号登录 (`/api/user/login/account`)**: 修正为 `POST` + **Request Body** (JSON)，匹配后端的 `@RequestBody UserDTO`。
- **微信登录 (`/api/user/login/wechat`)**: 修正为 `POST` + **Request Body** (JSON)。
- **创建账号 (`/api/user/create/account`)**: 修正为 `POST` + **Query Parameters** (URL 拼接) + **空 Request Body**，匹配后端的 `@RequestParam` 要求。
- **忘记密码 (`/api/user/forget/password`)**: 修正为 **`PUT`** + **Query Parameters**，严格执行文档中的方法定义。
- **手机号解密 (`/api/user/decrypt-phone`)**: 保持 `POST` + **Request Body**。

### 2. 优化请求工具类 [request.js](file:///d:/coding/HBuild%20X/projects/project_study/demo1/utils/request.js)
- **参数解耦**: 重新设计了 `request` 函数，支持同时或独立发送 `params` (URL参数) 和 `data` (Body参数)。
- **健壮性增强**: 确保在任何 `method !== 'GET'` 的情况下，即使不传 `data` 也会默认发送 `{}`，以满足后端 `@RequestBody` 的最低读取要求。
- **错误处理**: 优化了 `uni.hideLoading()` 的触发时机，彻底解决“Loading 与 Toast 冲突”导致的 UI 警告。

## 修改详情
**Code Reference**:
- **修正后的登录调用**: [login.vue](file:///d:/coding/HBuild%20X/projects/project_study/demo1/pages/main/login/login.vue)
- **底层请求逻辑**: [request.js](file:///d:/coding/HBuild%20X/projects/project_study/demo1/utils/request.js)

请在微信开发者工具中清除缓存后重新测试，现在接口调用已完全符合文档规范。