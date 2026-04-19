# New UI × BFF 联调清单

更新时间：2026-04-19

本文用于收口当前仓库中 UI 与 BFF 的联调范围，优先覆盖已具备基础能力的用户侧主链路。

## 0. 联调前置

- [ ] 已配置 `NEWAPI_BASE_URL`
- [ ] 已配置 `SESSION_COOKIE_SECRET`
- [ ] 目标 `newapi` 实例可用，且用户侧接口已开放
- [ ] 明确目标实例是否要求 `New-Api-User` 请求头
- [ ] 准备一个可登录测试账号，以及至少一组 token / log 样本数据

## 1. 登录闭环

### 检查项
- [ ] 访问 `/login` 可提交用户名、密码
- [ ] 如实例启用 2FA，可额外传 `two_factor_code`
- [ ] `POST /api/bff/auth/login` 成功后写入 HttpOnly Cookie
- [ ] 登录后访问 `/api/bff/auth/session` 返回 `isAuthenticated: true`
- [ ] 登录成功后前端跳转 `/`
- [ ] 未登录直访 `/` 会被重定向到 `/login`
- [ ] `POST /api/bff/auth/logout` 后会话失效

### 联调确认
- [ ] 上游登录成功返回 token 的字段位置已确认：`data.token` 或 `data.user.access_token`
- [ ] 2FA 字段名已与目标实例确认
- [ ] 注册成功后是否自动登录已确认

## 2. 当前用户信息

### 检查项
- [ ] `GET /api/bff/user/me` 可返回当前用户 DTO
- [ ] 侧边栏用户名展示来源统一为 `CurrentUserDto.displayName || username`
- [ ] 侧边栏分组展示来源统一为 `CurrentUserDto.group`
- [ ] Settings 页可展示 `username / displayName / email / group`
- [ ] `quota / usedQuota / remainingQuota / requestCount` 数值映射正确

### 联调确认
- [ ] `display_name`、`group`、`permissions` 在目标实例返回稳定
- [ ] 空邮箱场景 UI 展示为 `-` 而不是报错

## 3. Token 列表 / 创建

### 列表
- [ ] `GET /api/bff/tokens` 可正常返回分页 DTO
- [ ] UI 已统一消费 `TokenDto`
- [ ] `maskedKey / remainingQuotaText / statusText / createdAtText` 展示正常
- [ ] 状态映射已确认：`1/true/enabled -> active`，`0/false/disabled -> disabled`
- [ ] 搜索条件 `keyword` / `token` 与上游 `/api/token/search` 行为一致

### 创建
- [ ] `POST /api/bff/tokens` 已可创建 token
- [ ] 至少确认创建最小必填字段：`name` 以及实例要求的其他字段
- [ ] 创建后 UI 列表可刷新并看到新 token
- [ ] 若上游仅首次返回明文 key，需确认 UI 是否弹窗/复制/一次性展示

### 待确认
- [ ] `remain_quota`、`unlimited_quota`、`expired_time` 的实例级约束
- [ ] `group`、`model_limits`、`allow_ips` 的最小可用创建参数

## 4. 日志列表 / 筛选

### 检查项
- [ ] `GET /api/bff/logs` 可返回用户日志列表
- [ ] UI 行数据统一消费 `PaginatedUsageLogsDto.items`
- [ ] 时间、模型、总 tokens、quota、latency 映射正确
- [ ] `GET /api/bff/logs/stat` 可返回基础统计
- [ ] 当无数据时 UI 正确展示空状态

### 筛选
- [ ] 明确上游支持的筛选字段：时间范围、模型、token 名称、关键词
- [ ] 明确搜索走 `/api/log/self` 还是 `/api/log/self/search`
- [ ] 分页字段 `page / page_size / total` 已确认

### 当前差距
- [ ] UI 过滤控件目前仍是静态壳，下一步需要把控件状态接到 `bffClient.logs.list(query)`

## 5. Dashboard 聚合数据

### 检查项
- [ ] `GET /api/bff/dashboard/overview` 可成功聚合返回
- [ ] Dashboard 卡片已统一消费 `DashboardOverviewDto`
- [ ] 当前卡片来源统一为：
  - Remaining Quota -> `usage.remainingQuota ?? user.remainingQuota`
  - Current Usage -> `usage.currentUsage ?? stat.quota`
  - RPM -> `stat.rpm`
  - Request Count -> `user.requestCount`
- [ ] 趋势图已消费 `trend[].label` 与 `trend[].quota/tokenUsed/requestCount`
- [ ] Plans 页已复用 overview 中的订阅/配额字段

### 联调确认
- [ ] `/dashboard/billing/subscription` 是否对普通用户开放
- [ ] `/dashboard/billing/usage` 的字段名是否稳定
- [ ] `/api/data/self` 数组字段是否稳定为 `date/day + quota/token_used/request_count`

## 6. 建议联调顺序

1. 登录闭环
2. 当前用户信息
3. Dashboard 聚合数据
4. Token 列表
5. Token 创建
6. 日志列表
7. 日志筛选

## 7. 当前结论

- 已打通：登录页、注册页、根页登录态检查、Dashboard/Keys/Logs/Models/Settings/Docs/Plans 的 BFF 消费入口，以及 Token 创建后刷新列表
- 仍待补强：日志筛选 UI、Settings 写回、Token 编辑/删除/批量操作、更多实例差异字段确认
