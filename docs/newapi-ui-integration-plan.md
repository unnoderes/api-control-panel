# New UI 与 newapi 后端系统集成与接口对接工作计划

更新时间：2026-04-19

## 1. 目标与范围

本文面向当前仓库内的新 UI 原型，目标是把现有静态页面接入 `newapi` 后端，形成可登录、可查看余额与用量、可管理 API Key、可查询日志、可查看模型与个人设置的用户控制台。

当前范围以“用户侧控制台”优先，不把管理员后台、渠道管理、模型倍率同步、Root 级配置放入首期交付。

## 2. 当前原型现状

基于本仓库代码，当前 UI 具备以下特点：

- 技术栈：Next.js App Router + React 19 + Tailwind CSS。
- 页面入口较少，主控制台基本集中在 [app/page.tsx](/C:/Users/Administrator/Desktop/中转站服务/new-api-control-panel/app/page.tsx)。
- `Dashboard / API Keys / Usage Logs / Models / Plans / Docs / Settings` 目前均为静态占位或本地 mock 数据。
- 登录页 [app/login/page.tsx](/C:/Users/Administrator/Desktop/中转站服务/new-api-control-panel/app/login/page.tsx) 与注册页 [app/signup/page.tsx](/C:/Users/Administrator/Desktop/中转站服务/new-api-control-panel/app/signup/page.tsx) 只有邮箱输入，不符合 `newapi` 当前用户名/密码登录注册模型。
- 当前仓库已补齐 BFF 请求层、Cookie Session、Route Handler、类型定义与基础错误处理；UI 仍有部分页面需要从 mock 切到真实数据。
- `docs/` 已建立，但计划文档中部分“原型阶段”描述需要以后续实现为准。

结论：现有项目更接近“视觉原型”，后续需要先补齐集成基础设施，再进入逐页联调。

## 3. 以 newapi 官方能力为准的对接边界

2026-04-19 查阅 `newapi` 官方文档后，可直接支撑本项目首期的核心接口大致如下：

- 认证与用户：
  - `POST /api/user/login`
  - `POST /api/user/register`
  - `GET /api/user/self`
  - `PUT /api/user/self`
  - `GET /api/user/self/groups`
  - `GET /api/user/models`
  - `PUT /api/user/setting`
- Token 管理：
  - `GET /api/token/`
  - `GET /api/token/search`
  - `GET /api/token/:id`
  - `POST /api/token/`
  - `PUT /api/token/`
  - `DELETE /api/token/:id`
  - `POST /api/token/batch`
- 日志与统计：
  - `GET /api/log/self`
  - `GET /api/log/self/stat`
  - `GET /api/data/self`
- 计费与充值：
  - `GET /dashboard/billing/subscription`
  - `GET /dashboard/billing/usage`
  - `POST /api/user/amount`
  - `POST /api/user/pay`
- 公共内容：
  - `GET /api/notice`
  - `GET /api/about`
  - `GET /api/home_page_content`

## 4. 核心集成判断

### 4.1 首期应采用“前端调用本站 BFF，再由 BFF 对接 newapi”

不建议浏览器直接请求 `newapi` 主站，原因如下：

- 需要统一处理基础地址、鉴权头、错误码与重试策略。
- 需要避免把后端域名、调试头、未来可能的管理员接口暴露到浏览器。
- 登录态、刷新、登出、跨域、埋点、风控更适合通过本站 BFF 统一收口。
- 后续若需要切换 `newapi` 版本、补字段、降级兼容，BFF 可作为稳定适配层。

建议结构：

- 浏览器 -> `/api/bff/*`
- 本项目 BFF -> `newapi`
- BFF 负责：
  - 注入 `Authorization`
  - 在确认需要时注入 `New-Api-User`
  - 统一把 `newapi` 返回格式适配为前端稳定 DTO
  - 处理超时、401、403、429、5xx
  - 记录请求 ID 和联调日志

### 4.2 登录态建议使用 HttpOnly Session Cookie

不建议把用户 token 长期放在 `localStorage`。

建议：

- 登录成功后，由 Next.js Route Handler 写入 HttpOnly Cookie。
- Cookie 中保存用户 access token，必要时同时保存 `userId`。
- 浏览器只感知“是否登录”，不直接接触真正的后端 token。
- 所有 `/api/bff/*` 路由都从 Cookie 读取会话并转发。

### 4.3 当前登录/注册页必须先改版

这是首个阻塞项。

`newapi` 用户体系当前是用户名/密码为主，注册时可能还需要：

- 邮箱
- 邮箱验证码
- 推荐码
- 2FA 验证码

所以现有“只填邮箱继续”的 UI 不能直接联调，必须先明确以下策略：

- 是否保留用户名输入
- 是否启用邮箱验证码注册
- 是否启用 2FA
- 是否允许第三方 OAuth 登录

## 5. 前端集成架构建议

建议先补以下目录结构，再做具体页面联调：

```text
app/
  api/
    bff/
      auth/
      user/
      tokens/
      logs/
      dashboard/
      content/
lib/
  api/
    bff-client.ts
    newapi-server.ts
    errors.ts
    dto.ts
    mappers.ts
  auth/
    session.ts
  constants/
    endpoints.ts
types/
  newapi.ts
```

说明：

- `app/api/bff/*`：本项目对浏览器暴露的稳定接口。
- `lib/api/newapi-server.ts`：服务端请求封装，统一 header、baseURL、timeout、错误转换。
- `lib/api/dto`：前端稳定数据结构，隔离 `newapi` 原始字段。
- `lib/api/mappers`：把配额、时间戳、状态值等转换成 UI 可直接消费的数据。
- `lib/auth/session.ts`：会话写入、读取、清理。

## 6. 环境变量设计

建议新增：

```env
NEXT_PUBLIC_APP_NAME=New API Control Panel
NEWAPI_BASE_URL=https://your-newapi-domain
NEWAPI_TIMEOUT_MS=15000
SESSION_COOKIE_NAME=newapi_cp_session
SESSION_COOKIE_SECRET=replace_me
```

说明：

- `NEWAPI_BASE_URL` 只在服务端使用，不暴露到浏览器。
- 若后续存在管理端代理，再补 `NEWAPI_ADMIN_TOKEN`，但不应进入首期用户侧方案。

## 7. 页面与接口对接矩阵

| 页面/模块 | 当前状态 | 目标接口 | 对接说明 | 优先级 |
| --- | --- | --- | --- | --- |
| Login | 仅邮箱输入 | `POST /api/user/login` | 改为用户名/密码登录，预留 2FA 验证码流程 | P0 |
| Signup | 仅邮箱输入 | `POST /api/user/register` | 补齐用户名、密码、邮箱、验证码、推荐码策略 | P0 |
| 会话恢复 | 无 | `GET /api/user/self` | 首屏拉取当前用户资料，未登录则跳转 `/login` | P0 |
| Dashboard 统计卡片 | 静态金额/用量 | `GET /api/user/self`、`GET /dashboard/billing/subscription`、`GET /dashboard/billing/usage`、`GET /api/data/self` | 余额、额度、近 7 日趋势统一从 BFF 聚合 | P0 |
| API Keys 列表 | 静态表格 | `GET /api/token/`、`GET /api/token/search` | 列表、搜索、分页、状态映射 | P0 |
| 创建 API Key | 只有按钮 | `POST /api/token/` | 需新增表单弹窗，支持配额、分组、模型限制、IP 限制 | P0 |
| 编辑/启停/删除 API Key | 无 | `PUT /api/token/`、`DELETE /api/token/:id`、`POST /api/token/batch` | 需补全行操作与批量操作 | P1 |
| Usage Logs | 静态表格 | `GET /api/log/self`、`GET /api/log/self/stat` | 支持时间范围、模型、Token 名称、分组过滤 | P0 |
| Dashboard 趋势图 | 本地 mock | `GET /api/data/self` | 需要把 `quota/token_used/count` 聚合成图表数据 | P1 |
| Models | 静态说明 | `GET /api/user/models` | 展示当前用户可见模型列表；若需要价格，再结合公共配置或管理配置 | P1 |
| Plans/Billing | 静态说明 | `GET /dashboard/billing/subscription`、`GET /dashboard/billing/usage`、`POST /api/user/amount`、`POST /api/user/pay` | 首期先做余额/额度查看；充值下单可放 P1 | P1 |
| Settings | 静态说明 | `GET /api/user/self`、`PUT /api/user/self`、`PUT /api/user/setting`、`GET /api/user/self/groups` | 个人资料、密码、安全设置、通知偏好分步接入 | P1 |
| Docs/公告 | 静态说明 | `GET /api/notice`、`GET /api/about`、`GET /api/home_page_content` | 可先展示平台公告与帮助入口，不必绑定官方文档页面结构 | P2 |

## 8. 数据适配规则

为减少 UI 抖动，前端不要直接依赖 `newapi` 原始字段，应先做统一映射。

### 8.1 用户信息

原始重点字段：

- `username`
- `display_name`
- `email`
- `group`
- `quota`
- `used_quota`
- `request_count`
- `permissions`
- `setting`
- `sidebar_modules`

前端建议统一映射为：

```ts
type CurrentUser = {
  id: number;
  username: string;
  displayName: string;
  email: string | null;
  group: string;
  quota: number;
  usedQuota: number;
  remainingQuota: number;
  requestCount: number;
  permissions: Record<string, boolean>;
};
```

### 8.2 Token 列表

原始重点字段：

- `id`
- `name`
- `key`
- `status`
- `remain_quota`
- `unlimited_quota`
- `expired_time`
- `created_time`
- `accessed_time`
- `group`
- `model_limits`

前端建议派生：

- `maskedKey`
- `statusText`
- `remainingQuotaText`
- `expiresAtText`
- `createdAtText`
- `lastUsedAtText`

### 8.3 日志与统计

重点风险在“额度单位”。

`newapi` 文档明确内部计费以配额点数为核心，不同页面里可能同时出现：

- 配额点数
- token 数
- 美元显示值

首期必须统一以下规则：

- 业务存储与接口传递保留原始数值。
- 展示层明确区分 `quota`、`tokenUsed`、`usdDisplay`。
- Dashboard 上所有金额卡片先标清单位，避免把配额误标成美元。

## 9. 联调前的关键确认项

这些问题不确认，后续会反复返工：

1. 当前新 UI 的目标到底是“普通用户控制台”还是“管理员后台”。
2. 登录方案是否沿用 `newapi` 的用户名密码模式，还是需要追加邮箱登录包装。
3. 部署实例是否开启邮箱验证、2FA、注册开关、邀请码。
4. 用户侧调用 `api/token`、`api/log/self` 等接口时，是否必须携带 `New-Api-User` 头。
5. 余额展示口径是显示“美元余额”还是“内部配额点数”。
6. `Plans` 页面首期是否只做查看，不做在线充值。
7. `Docs` 页面是展示站内公告/帮助，还是直接跳转外部文档。

建议把这 7 项在联调开始前定稿。

## 10. 分阶段实施计划

### 阶段 A：集成基础设施

目标：先让项目具备真正可接后端的能力。

任务：

- 新增 `docs`、`types`、`lib/api`、`app/api/bff` 结构。
- 建立服务端请求封装。
- 建立统一错误对象与 toast/页面态规范。
- 建立会话 Cookie 机制。
- 拆分 `app/page.tsx` 中的 tab 级视图为独立容器组件。
- 补齐基础 loading、empty、error 三态。

产出：

- 可复用的 BFF 层
- 可复用的会话层
- 可复用的 DTO/Mapper 层

### 阶段 B：认证与首屏接管

目标：从“能看页面”变成“能登录使用”。

任务：

- 重写 Login/Signup 表单结构。
- 接入登录、注册、退出登录。
- 首屏获取当前用户资料。
- 增加未登录守卫与跳转逻辑。
- 接入顶栏用户信息与侧栏用户名。

验收：

- 成功登录后进入控制台
- 刷新页面不丢登录态
- token 失效后自动回到登录页

### 阶段 C：P0 业务联调

目标：把核心业务页跑通。

任务：

- Dashboard 卡片接 `self + billing + usage + data/self`
- API Keys 列表/搜索/创建
- Usage Logs 列表/筛选/分页
- 首批错误提示与空数据状态

验收：

- 用户可创建并查看自己的 API Key
- 用户可查看自己近 7 日或指定区间的用量
- Dashboard 关键数据不再依赖 mock

### 阶段 D：P1 完善页

任务：

- API Key 编辑、启停、删除、批量删除
- Models 列表与可见性说明
- Settings 资料更新与偏好设置
- Plans 页额度说明、充值金额试算、支付下单

### 阶段 E：P2 内容与体验

任务：

- Docs/公告页接入
- 操作审计埋点
- 细粒度缓存策略
- 搜索与筛选体验优化
- 主题、国际化、响应式细节修正

## 11. 推荐的接口实现顺序

建议严格按下面顺序推进：

1. `/api/user/login`
2. `/api/user/self`
3. `/api/token/`
4. `/api/token/` `POST`
5. `/api/log/self`
6. `/api/log/self/stat`
7. `/api/data/self`
8. `/dashboard/billing/subscription`
9. `/dashboard/billing/usage`
10. `/api/user/self` `PUT`
11. `/api/user/setting`
12. `/api/user/models`
13. `/api/notice` / `/api/about` / `/api/home_page_content`

原因：

- 先打通身份与会话。
- 再接用户最常用的 token 与日志能力。
- 最后再做内容页和充值等次要模块。

## 12. 测试与验收清单

### 12.1 接口级

- 401 未登录处理统一。
- 403 权限不足处理统一。
- 429 限流提示明确。
- 5xx 或上游超时展示可理解错误文案。
- 所有列表页校验分页参数兼容性。

### 12.2 页面级

- Dashboard 在无数据、部分数据失败、全量成功时表现正确。
- API Key 创建后列表自动刷新。
- API Key 删除/禁用有二次确认。
- 日志筛选条件变更时请求参数正确。
- 退出登录后，所有受保护页面不可直接访问。

### 12.3 安全级

- Cookie 使用 HttpOnly、Secure、SameSite。
- 浏览器端不暴露 `NEWAPI_BASE_URL`。
- 不在前端打印明文 token。
- 不在列表页直接展示完整 API Key，默认脱敏。

## 13. 当前项目的主要风险

### 风险 1：UI 原型与后端认证模型不一致

登录/注册页现状与 `newapi` 的实际字段不匹配，这是最明确的阻塞点。

### 风险 2：控制台目前是单文件大组件

[app/page.tsx](/C:/Users/Administrator/Desktop/中转站服务/new-api-control-panel/app/page.tsx) 当前把多个模块揉在一个页面状态机里，后续联调时会放大状态耦合与测试成本。

### 风险 3：额度单位容易被误读

`quota`、`token_used`、`billing usage`、美元值不是同一概念，若不先定义展示口径，Dashboard 会很快失真。

### 风险 4：请求头要求存在实现差异

官方文档中的不同模块示例，对 `New-Api-User` 的使用并不完全一致。首轮联调时必须抓包验证目标实例的真实要求，再固化到 BFF。

## 14. 建议的短周期排期

如果由 1 名前端主开发推进，可按以下节奏估算：

- 第 1 天：集成架构、环境变量、BFF、会话层
- 第 2 天：登录/注册/鉴权守卫/当前用户信息
- 第 3 天：API Key 列表、创建、搜索
- 第 4 天：日志列表、统计、Dashboard 首版
- 第 5 天：Settings / Models / 收尾联调 / 验收修复

如果后端实例配置尚未确定，应先预留 0.5 到 1 天做接口口径确认。

## 15. 建议立即执行的下一步

建议按下面顺序开始实施：

1. 先确认“用户控制台”而不是“管理员后台”。
2. 确认 `newapi` 实例的注册、邮箱验证、2FA、充值开关。
3. 先改登录/注册页 UI 字段。
4. 建立 BFF 和 Cookie 会话层。
5. 先联通 `login -> self -> token list -> log list` 这条最短闭环。

## 16. 参考资料

以下资料于 2026-04-19 查阅，用于本计划设计：

- New API API Reference: https://docs.newapi.ai/en/docs/api
- 鉴权体系说明（Auth）: https://docs.newapi.ai/api/auth-system-description/
- 用户模块: https://docs.newapi.ai/api/fei-user/
- Token 管理模块: https://docs.newapi.ai/api/fei-token-management/
- 日志模块: https://docs.newapi.ai/api/fei-log/
- 数据统计模块: https://docs.newapi.ai/api/fei-data-statistics/
- 账户计费面板模块: https://docs.newapi.ai/api/fei-account-billing-panel/
- 公共信息模块: https://docs.newapi.ai/api/fei-public-info/
