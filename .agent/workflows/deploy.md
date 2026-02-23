---
description: 部署前检查与部署流程
---

## 部署前检查清单

### 1. 环境变量
- [ ] `DEEPSEEK_API_KEY` 已设置（生产环境密钥）
- [ ] `AUTH_SECRET` 是随机生成的: `openssl rand -base64 32`
- [ ] `DATABASE_URL` 指向生产数据库
- [ ] `NEXTAUTH_URL` 指向生产域名

### 2. 数据库
```bash
npx prisma db push
```

### 3. 构建测试
// turbo
```bash
npm run build
```
- 确认无编译错误
- 确认无类型错误

### 4. 安全检查
- [ ] `.env` 在 `.gitignore` 中
- [ ] 没有硬编码的 API key
- [ ] `dev.db` 不要提交到生产

### 5. Git
```bash
git add -A
git status
git commit -m "deploy: [description]"
git push
```

## Vercel 部署

1. 在 Vercel dashboard 设置环境变量
2. 确保 Build Command: `npm run build`
3. Output Directory: `.next`
4. 注意：Vercel Edge Runtime 的 middleware 不能用 Prisma

## 部署后验证

- [ ] 访问网站，能正常加载
- [ ] 注册/登录功能正常
- [ ] AI 聊天能回复
- [ ] 回测功能正常
- [ ] 市场数据能加载
