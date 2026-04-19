# newapi 后端集成底座

更新日期：2026-04-19

## 已实现的 BFF 路由

所有路由都对 UI 暴露为本地 `Next.js Route Handler`，统一前缀为 `/api/bff/*`。

### 认证与会话

- `POST /api/bff/auth/login`
- `POST /api/bff/auth/register`
- `POST /api/bff/auth/logout`
- `GET /api/bff/auth/session`

### 用户域

- `GET /api/bff/user/me`
- `PUT /api/bff/user/me`
- `GET /api/bff/user/groups`
- `GET /api/bff/user/models`
- `PUT /api/bff/user/settings`

### Token 域

- `GET /api/bff/tokens`
  - 当 query 中带 `keyword` 或 `token` 时，BFF 自动转发到 `newapi` 的 `/api/token/search`
  - 否则转发到 `/api/token/`
- `POST /api/bff/tokens`
- `PUT /api/bff/tokens`
- `GET /api/bff/tokens/:id`
- `DELETE /api/bff/tokens/:id`
- `POST /api/bff/tokens/batch-delete`

### 日志与统计

- `GET /api/bff/logs`
  - 当 query 中带 `keyword` 时，BFF 自动转发到 `/api/log/self/search`
  - 否则转发到 `/api/log/self`
- `GET /api/bff/logs/stat`
- `GET /api/bff/dashboard/overview`
  - 聚合 `/api/user/self`、`/dashboard/billing/subscription`、`/dashboard/billing/usage`、`/api/log/self/stat`、`/api/data/self`

### 公共内容

- `GET /api/bff/content/notice`
- `GET /api/bff/content/about`
- `GET /api/bff/content/home`

## 会话机制

- 浏览器不直接持有 `newapi` token，也不直接请求 `newapi`
- 登录成功后，BFF 将上游返回的用户 token 写入 `HttpOnly` Cookie
- Cookie 内容为签名后的轻量 session 载荷：
  - `accessToken`
  - `userId`
  - `username`
- Cookie 属性：
  - `HttpOnly`
  - `SameSite=Lax`
  - `Secure` 在生产环境开启
  - 默认有效期 7 天
- 所有需要登录态的 `/api/bff/*` 路由都从 Cookie 取会话后再请求 `newapi`

## 环境变量

需要补充或确认以下变量：

```env
NEXT_PUBLIC_APP_NAME=New API Control Panel
NEWAPI_BASE_URL=https://your-newapi-domain
NEWAPI_TIMEOUT_MS=15000
SESSION_COOKIE_NAME=newapi_cp_session
SESSION_COOKIE_SECRET=replace-with-a-long-random-string
NEWAPI_INCLUDE_USER_HEADER=false
```

说明：

- `NEWAPI_BASE_URL` 仅服务端使用，不暴露到浏览器
- `SESSION_COOKIE_SECRET` 必须使用高熵随机值
- `NEWAPI_INCLUDE_USER_HEADER` 用于控制是否向用户态请求附带 `New-Api-User`

## 已实现的底座能力

- 统一 upstream 请求封装：`lib/api/newapi-server.ts`
- 统一错误模型与 BFF 响应：`lib/api/errors.ts`、`lib/api/route.ts`
- DTO 与 mapper：`types/bff.ts`、`types/newapi.ts`、`lib/api/mappers.ts`
- UI 侧可复用客户端封装：`lib/api/bff-client.ts`
- Cookie Session 读写与签名校验：`lib/auth/session.ts`

## 当前假设与待联调确认项

以下内容仍是按官方文档和计划文档做的保守假设，联调时需要确认：

1. `POST /api/user/login` 成功后返回 `data.token` 或 `data.user.access_token`
2. `POST /api/user/register` 是否直接返回 token 并允许自动登录
3. `/api/user/self`、`/api/token/*`、`/api/log/self*`、`/api/data/self` 在目标实例上是否强制要求 `New-Api-User`
4. `/dashboard/billing/subscription` 与 `/dashboard/billing/usage` 的返回字段名是否与文档示例一致
5. `/api/data/self` 是否稳定返回数组，以及趋势字段到底是 `date/day`、`token_used` 还是其他变体
6. token 状态值是否固定为 `0/1`，还是还会出现字符串枚举
7. 日志分页字段是否固定为 `items/total/page/page_size`
8. register/login 是否存在验证码、2FA、邀请码等实例级开关差异

## UI 层当前可直接调用的接口

建议 UI 统一请求 `/api/bff/*`，不要再直接请求 `newapi`。如需复用调用代码，可直接使用 `lib/api/bff-client.ts` 中的：

- `bffClient.auth.login`
- `bffClient.auth.register`
- `bffClient.auth.logout`
- `bffClient.auth.session`
- `bffClient.user.me`
- `bffClient.user.models`
- `bffClient.dashboard.overview`
- `bffClient.tokens.list`
- `bffClient.logs.list`
- `bffClient.logs.stat`
- `bffClient.content.notice`
- `bffClient.content.about`
- `bffClient.content.home`
