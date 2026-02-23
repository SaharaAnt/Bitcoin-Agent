---
description: 启动开发环境
---
// turbo-all

1. 安装依赖（如果 node_modules 不存在）
```bash
npm install
```

2. 推送数据库 schema
```bash
npx prisma db push
```

3. 生成 Prisma Client
```bash
npx prisma generate
```

4. 启动开发服务器
```bash
npm run dev
```

5. 打开浏览器访问 http://localhost:3000

## 注意事项
- 确保 `.env` 文件存在且配置了 `DATABASE_URL`, `DEEPSEEK_API_KEY`, `AUTH_SECRET`
- 如果用 DeepSeek API，需要确保网络能访问 `api.deepseek.com`（可能需要 VPN）
- 数据库文件 `dev.db` 在项目根目录
