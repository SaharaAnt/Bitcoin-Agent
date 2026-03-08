# 📦 整体系统架构与用户旅程

> **写在前面**：这份文档面向非技术读者，带你一眼看清这个应用的「全貌」——数据从哪来、经过了什么处理、最终以什么形式呈现给你。

---

## 1. 这款产品是什么？

**DCA Strategy Agent** 是一款面向比特币长期定投者（HODLer）的智能决策助手。

它的核心价值是：
- 把复杂的全球宏观数据、链上指标和情绪指数，**自动汇总并翻译成你看得懂的操作建议**；
- 提供可回测的历史数据验证，让你相信「这套逻辑是有数据支撑的」；
- 内置一个 AI 助手，让你可以直接用自然语言提问，不再需要每天手动查数。

---

## 2. 用户旅程（你的一天）

```mermaid
journey
    title 一位 Bitcoin 定投者的日常
    section 早上打开应用
      登录账号: 5: 用户
      查看 BTC 当前价格与 24h 涨跌幅: 5: 用户
      阅读 AI 策略顾问建议（今日操作建议）: 5: 用户
    section 理解大盘环境
      查看恐慌贪婪指数（情绪是否极端）: 4: 用户
      查看 Ahr999 囤币指数（现在贵不贵）: 4: 用户
      查看宏观流动性分析（美联储是否友好）: 3: 用户
      查看 ETF 资金流向（华尔街在买还是在卖）: 3: 用户
    section 验证策略思路
      在回测面板选择定投参数历史验证: 5: 用户
      展开「历史极度恐慌」查看过去类似时刻的回报: 4: 用户
      向 AI 助手提问：现在适合加仓吗？: 5: 用户
    section 接收每日邮件
      早上 8 点收到系统发送的每日行情简报: 5: 用户, 系统
```

---

## 3. 全系统数据流向

```mermaid
flowchart TB
    subgraph 外部数据源["🌐 外部数据源（实时接入）"]
        A1[CoinGecko\nBTC价格 + 历史K线]
        A2[Alternative.me\n恐慌贪婪指数FGI]
        A3[Yahoo Finance\n美元指数DXY + 美债US10Y]
        A4[Mempool.space\n比特币链上拥堵]
        A5[Farside.co.uk\n机构ETF资金流向]
        A6[Google Trends\n散户搜索热度]
        A7[DeepSeek AI\n自然语言生成]
    end

    subgraph 核心引擎["⚙️ 核心分析引擎（后端）"]
        B1[策略顾问引擎\n生成买入/减仓信号]
        B2[Ahr999 指数引擎\n价格估值模型]
        B3[宏观流动性引擎\n联储政策 + 情绪]
        B4[DCA 回测引擎\n历史模拟定投]
        B5[AI Agent 工具层\n14个数据查询工具]
    end

    subgraph 用户界面["🖥️ 用户界面（前端看板）"]
        C1[价格卡片]
        C2[恐慌贪婪卡片]
        C3[策略建议卡片]
        C4[Ahr999 囤币指数卡片]
        C5[链上数据卡片]
        C6[宏观流动性雷达]
        C7[ETF资金流向图]
        C8[DCA回测图表]
        C9[AI聊天助手]
        C10[每日邮件简报]
    end

    A1 --> B1 & B2 & B4
    A2 --> B1 & B4 & B5
    A3 --> B3
    A4 --> B5
    A5 --> B3 & B5 & C7
    A6 --> B3
    B1 --> C3 & C10
    B2 --> C4 & C10
    B3 --> C6 & C10
    B4 --> C8
    B5 --> C9
    A7 --> C9 & C10
```

---

## 4. 系统核心信号层级

应用将复杂世界简化为三个维度的信号，综合后形成最终建议：

```mermaid
graph TD
    M[宏观层 Macro] -->|美元指数 + 美债 + 降息预期| TOTAL
    T[技术层 Technical] -->|Ahr999 + BTC均线 + 价格趋势| TOTAL
    E[情绪层 Sentiment] -->|恐慌贪婪指数 + ETF流向 + 散户热度| TOTAL
    TOTAL[综合信号评分] --> S1[强烈买入 🟢🟢]
    TOTAL --> S2[建议加仓 🟢]
    TOTAL --> S3[正常定投 🟡]
    TOTAL --> S4[建议减仓 🟠]
    TOTAL --> S5[建议暂停 🔴]

    style M fill:#3b82f6,color:#fff
    style T fill:#8b5cf6,color:#fff
    style E fill:#f59e0b,color:#fff
    style TOTAL fill:#1e293b,color:#fff
    style S1 fill:#10b981,color:#fff
    style S2 fill:#22c55e,color:#fff
    style S3 fill:#f59e0b,color:#000
    style S4 fill:#f97316,color:#fff
    style S5 fill:#ef4444,color:#fff
```

---

## 5. 自动化与定时任务

系统不需要你每天手动触发。它具备以下自动化机制：

```mermaid
sequenceDiagram
    participant GitHub as GitHub Actions<br/>定时任务
    participant Farside as Farside.co.uk<br/>ETF数据源
    participant DB as 数据文件<br/>farside-data.json
    participant Vercel as Vercel 云服务器<br/>你的应用
    participant Email as 用户邮箱

    Note over GitHub: 每天北京时间 08:00 触发
    GitHub ->> Farside: 🕷️ 启动 Puppeteer 浏览器模拟爬取
    Farside -->> GitHub: 返回最新555天资金流向数据
    GitHub ->> DB: 💾 覆盖写入 farside-data.json
    GitHub ->> Vercel: 📤 Git Push 触发 Vercel 重新部署

    Note over Vercel: 每天北京时间 08:00 触发<br/>Cron Job 定时任务
    Vercel ->> Vercel: 聚合所有实时数据（BTC价格、FGI、宏观等）
    Vercel ->> Vercel: 调用 DeepSeek AI 生成每日简报
    Vercel ->> Email: 📧 发送「斯多葛每日简报」到用户邮箱
```

---

## 6. 各核心模块说明概要

| 模块名 | 功能 | 数据来源 | 参见文档 |
|--------|------|----------|----------|
| 策略顾问引擎 | 生成买入/减仓信号 | FGI + BTC价格 | `02-strategy-signal-engine.md` |
| Ahr999 囤币指数 | 判断当前价格贵不贵 | BTC历史价格 | `03-ahr999-engine.md` |
| DCA 回测引擎 | 历史定投模拟验证 | BTC历史K线 + FGI | `04-dca-backtest-engine.md` |
| 宏观流动性分析 | 美联储政策影响评估 | Yahoo Finance + Google Trends | `05-macro-liquidity-engine.md` |
| AI 智能助手 | 自然语言查询所有数据 | 以上所有工具 | `06-ai-agent-toolkit.md` |
