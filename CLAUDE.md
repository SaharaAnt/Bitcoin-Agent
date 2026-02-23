# Bitcoin DCA Agent — 项目规则

> AI 助手首次阅读此文件即可快速了解项目。每次踩坑后必须更新本文件。

## 技术栈

- **Framework**: Next.js 16 (Turbopack, App Router)
- **Runtime**: Node.js, Edge (middleware only)
- **AI**: `ai@6` + `@ai-sdk/openai@3` + DeepSeek API
- **DB**: Prisma 7 + SQLite (better-sqlite3 adapter)
- **Auth**: NextAuth v5 beta (credentials provider, JWT strategy)
- **UI**: React 19, Vanilla CSS, Framer Motion, Recharts, Lucide Icons
- **Validation**: Zod 4
- **Test**: Vitest (已配置，暂无测试文件)

## 目录结构

```
app/
  api/chat/         → AI 聊天 API (streamText + DeepSeek)
  api/backtest/     → 回测 API
  api/market/       → 市场数据 API
  api/auth/         → NextAuth routes
  api/register/     → 用户注册
  login/            → 登录页
  page.tsx          → 主页 (DashboardClient)

components/
  chat/             → ChatPanel (useChat)
  backtest/         → BacktestChart, BacktestStats, BacktestForm
  dashboard/        → DashboardClient, MarketOverview, StrategyPanel
  providers.tsx     → SessionProvider wrapper

lib/
  agent/            → system-prompt.ts, tools.ts
  api/              → coingecko.ts, fear-greed.ts
  engine/           → dca-engine.ts, types.ts
  auth.ts           → NextAuth full config (with Prisma + bcryptjs)
  auth.config.ts    → Edge-safe auth config (no Prisma)
  prisma.ts         → Prisma client singleton
```

## ⚠️ 踩坑记录（每次修 bug 后追加）

### 1. `@ai-sdk/openai@3` 默认走 Responses API
- `deepseek("model-name")` 会调用 OpenAI Responses API (`/responses` 端点)
- DeepSeek 不支持 Responses API → 返回 404
- **正确用法**: `deepseek.chat("deepseek-chat")` 明确使用 Chat Completions

### 2. UIMessage vs ModelMessage 格式不兼容
- `useChat` 前端发的是 UIMessage 格式: `{ role, parts: [{ type: "text", text }] }`
- `streamText` 要的是 ModelMessage 格式: `{ role, content: "..." }`
- **解决**: 在 API route 中手动转换 parts → content

### 3. AI SDK v6 没有 `maxSteps`
- `streamText` 的多步 tool 调用用 `stopWhen: stepCountIs(N)`，不是 `maxSteps`
- 默认 `stepCountIs(1)` 只执行一步

### 4. Prisma 7 必须用 driver adapter
- `PrismaClient` 构造函数必须传 `adapter`
- SQLite 用 `@prisma/adapter-better-sqlite3`
- 从 `.prisma/client` 导入（不是 `@prisma/client`）

### 5. Middleware 不能导入 Prisma/bcryptjs
- Edge runtime 不支持 Node.js 原生模块
- middleware 用精简的 `auth.config.ts`（无 providers）
- 完整 auth 逻辑在 `auth.ts`

### 6. Zod 4 的 import 路径
- `import { z } from "zod"` → Zod 4 Mini API
- `import { z } from "zod/v4"` → 经典 Zod 3 兼容 API
- AI SDK tools 用 `zod/v4` 的经典 API

## 编码约定

### API Routes
```typescript
// 标准模式：try-catch + auth + logging
export async function POST(req: Request) {
    try {
        const session = await auth();
        if (!session?.user) {
            return new Response("Unauthorized", { status: 401 });
        }
        // ... 业务逻辑
    } catch (error) {
        console.error("[route-name] Error:", error);
        return new Response(JSON.stringify({ error: "..." }), { status: 500 });
    }
}
```

### Components
- 使用 `"use client"` 指令
- Inline styles（不用 CSS modules）
- 使用 CSS 变量做主题：`var(--btc-orange)`, `var(--bg-secondary)` etc.

### AI Chat Pattern
```typescript
// Route: 用 deepseek.chat() 不是 deepseek()
const result = streamText({
    model: deepseek.chat("deepseek-chat"),
    messages: convertMessages(uiMessages),  // UIMessage → ModelMessage
    tools: agentTools,
    stopWhen: stepCountIs(5),  // 不是 maxSteps
});
return result.toUIMessageStreamResponse();
```

## 常用命令

```bash
npm run dev        # 启动开发服务器 (Turbopack)
npm run build      # 生产构建
npx prisma db push # 推送 schema 到数据库
npx prisma studio  # 打开数据库 GUI
npx vitest         # 运行测试
```

## 自我进化规则

> 摘自 Claude Code 团队指南：「Claude 写给自己的规则出奇地好」

1. **每次纠正后更新本文件** — 修了 bug？把原因和解决方案加到「踩坑记录」
2. **重复做两次的事变成 workflow** — 放到 `.agent/workflows/` 下
3. **复杂任务先 plan** — 出问题立即切回 plan mode
4. **得到一般性修复后** — "Knowing everything you know now, scrap this and implement the elegant solution"
