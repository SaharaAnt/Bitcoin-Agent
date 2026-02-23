---
description: AI 对话功能调试清单
---

当用户报告 AI 聊天不工作时，按以下顺序排查：

## Step 1: 确认 Route 能访问
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/chat" -Method POST -ContentType "application/json" -Body '{}' -ErrorAction SilentlyContinue
```
- 401 = route 正常，需要登录
- 404 = route 编译失败，查看终端编译错误
- 500 = 内部错误，查看终端日志

## Step 2: 检查 `app/api/chat/route.ts`

关键检查点：
- [ ] 必须用 `deepseek.chat("deepseek-chat")`，**不是** `deepseek("deepseek-chat")`
    - `deepseek()` 直接调用走 OpenAI Responses API（/responses），DeepSeek 不支持 → 404
- [ ] messages 必须转换: UIMessage (parts) → ModelMessage (content)
- [ ] `stopWhen: stepCountIs(N)` 而不是 `maxSteps`
- [ ] try-catch 包裹，有 console.error 日志

## Step 3: 检查前端 `components/chat/chat-panel.tsx`

- [ ] `useChat` 是否有 `onError` 回调
- [ ] 是否显示 `error` 状态
- [ ] `sendMessage({ text: input })` 格式正确

## Step 4: 检查网络连通性

DeepSeek API (`api.deepseek.com`) 在国内可能需要 VPN：
```powershell
try {
    $r = Invoke-WebRequest -Uri "https://api.deepseek.com/chat/completions" -Method POST -ContentType "application/json" -Headers @{"Authorization"="Bearer $env:DEEPSEEK_API_KEY"} -Body '{"model":"deepseek-chat","messages":[{"role":"user","content":"hi"}],"max_tokens":5}' -TimeoutSec 10
    $r.Content
} catch { $_.Exception.Message }
```

## Step 5: 检查 .env

- `DEEPSEEK_API_KEY` 不需要引号
- `AUTH_SECRET` 必须是真实的随机值（不能是占位符）
- `DATABASE_URL="file:./dev.db"`

## 常见错误对照表

| 错误信息 | 原因 | 修复 |
|---------|------|------|
| Not Found | `deepseek()` 走了 Responses API | 换成 `deepseek.chat()` |
| messages do not match ModelMessage[] | UIMessage 没转换 | 加 convertMessages() |
| maxSteps does not exist | AI SDK v6 API 变了 | 用 `stopWhen: stepCountIs(N)` |
| Unauthorized | 未登录或 session 失效 | 检查 auth 配置和登录状态 |
| Network timeout | API 不可达 | 检查 VPN / 代理 |
