# 🤖 AI 智能助手：你的比特币专属分析师

> **读完本文你将理解**：右侧（或页面上方）的 AI 聊天窗口不是一个普通的 ChatGPT，而是一个被赋予了14种**专属数据查询工具**的比特币策略助手，它能实时调用所有系统数据来回答你的问题。

---

## 1. AI 助手是如何工作的？

普通 AI 只能回答它训练时学到的"过去知识"。我们的 AI 助手不同——它配备了工具，能**实时查询最新数据**：

```mermaid
flowchart TD
    USER["👤 你的问题\n「现在适合定投吗？」"] --> ASSISTANT

    ASSISTANT[AI助手\n由 DeepSeek 大模型驱动] --> PLAN["📋 AI 规划：\n我需要哪些工具来回答这个问题？"]

    PLAN --> TOOLS["调用工具"]

    TOOLS --> T1["🔧 getBtcPrice\n获取当前BTC价格"]
    TOOLS --> T2["🔧 getFearGreed\n获取今日FGI"]
    TOOLS --> T3["🔧 getMarketAnalysis\n获取策略建议"]
    TOOLS --> T4["🔧 getAhr999\n获取囤币指数"]

    T1 & T2 & T3 & T4 --> DATA["📊 实时数据聚合"]
    DATA --> RESPONSE["💬 AI 生成完整回答\n「当前FGI=32，处于恐惧区间，Ahr999=0.85在定投范围内，建议维持每周定投，可适当加仓20%...」"]
    RESPONSE --> USER
```

---

## 2. AI 助手的完整工具清单（共14种）

```mermaid
mindmap
    root[AI 助手工具箱\n14 种数据工具]
        定投回测工具
            runDCABacktest\n标准DCA回测
            runSmartDCABacktest\n智能DCA回测
            compareStrategies\n三策略对比
        实时市场数据
            getBtcPrice\nBTC当前价格
            getFearGreed\n恐慌贪婪指数
            getMacroAnalysis\n宏观流动性分析
        估值与链上
            getAhr999\nAhr999囤币指数
            getOnchainData\n链上数据
            getNetworkStatus\n比特币网络拥堵
        机构与情绪
            getEtfFlows\nETF资金流向
            getLiquidationData\n全网爆仓数据
        综合分析
            getMarketAnalysis\n综合策略建议
            getFullMarketReport\n完整市场报告
            getStrategyAdvice\n个性化定投建议
```

---

## 3. 每个工具的功能说明

| 工具名 | 你可以问的问题示例 | 返回数据 |
|--------|-------------------|----------|
| `getBtcPrice` | "BTC现在多少钱？" | 当前价格、24h涨跌幅、市值 |
| `getFearGreed` | "今天市场情绪怎么样？" | FGI指数值(0-100) + 文字描述 |
| `getAhr999` | "Ahr999现在多少，能加仓吗？" | 指数值 + 区间标签 + 200日均线 |
| `getMacroAnalysis` | "美联储对BTC影响是什么？" | 宏观三信号 + 分析理由 |
| `getEtfFlows` | "华尔街最近在买入还是卖出？" | 最新一日ETF净流向 + 近5天趋势 |
| `runDCABacktest` | "从2020年开始定投到现在赚了多少？" | 总回报率 + 年化收益率 + 最大回撤 |
| `runSmartDCABacktest` | "智能DCA比普通定投多赚多少？" | 智能DCA回测完整结果 |
| `compareStrategies` | "定投 vs 一次性买入哪个更好？" | 三种策略并排对比 |
| `getMarketAnalysis` | "给我一个综合的市场建议" | 完整策略分析 + 置信度 |
| `getNetworkStatus` | "现在转账链上手续费高吗？" | 网络拥堵状态 + 预计手续费 |
| `getLiquidationData` | "最近爆仓多吗？" | 24h爆仓总额 + 主导爆仓方 |
| `getOnchainData` | "链上数据怎么样？" | 矿工费、活跃地址等 |
| `getStrategyAdvice` | "告诉我今天应该怎么操作" | 个性化操作建议 |
| `getFullMarketReport` | "给我一份完整的市场报告" | 所有指标的综合报告 |

---

## 4. AI 助手如何处理复杂问题

当你问一个复杂问题时，AI 会自动分解并串联多个工具：

```mermaid
sequenceDiagram
    participant You as 你
    participant AI as AI 助手
    participant T1 as getBtcPrice 工具
    participant T2 as getFearGreed 工具
    participant T3 as getAhr999 工具
    participant T4 as getEtfFlows 工具
    participant T5 as getMacroAnalysis 工具

    You ->> AI: "我应该现在加仓吗？帮我综合分析一下"

    AI ->> AI: 思考：这个问题需要多个维度的数据

    par 并行调用工具
        AI ->> T1: 获取BTC当前价格
        AI ->> T2: 获取恐慌贪婪指数
        AI ->> T3: 获取Ahr999指数
        AI ->> T4: 获取ETF机构资金流向
        AI ->> T5: 获取宏观流动性判断
    end

    T1 -->> AI: BTC = $85,000, -2.3%
    T2 -->> AI: FGI = 32, 恐惧
    T3 -->> AI: Ahr999 = 0.91, 定投区间
    T4 -->> AI: 昨日ETF净流入 +$462M
    T5 -->> AI: 宏观中性，联储预期持稳

    AI ->> AI: 整合所有数据，生成分析建议
    AI -->> You: "综合来看，FGI=32处于恐惧区间，Ahr999=0.91在合理定投区内，华尔街昨日净流入4.6亿美元显示机构在接筹，宏观面中性偏稳。建议维持正常定投节奏，可在现价基础上小幅加仓10-20%，但无需激进操作。"
```

---

## 5. AI 助手的核心人格设定（Persona）

AI 助手不是一个普通的数据播报机器人，它被设定为：

```mermaid
mindmap
    root[斯多葛主义 AI 顾问]
        哲学根基
            马可·奥勒留的克制与理性
            区分「可控」与「不可控」
            将市场波动视为正常试炼
        专业背景
            长期 BTC HODLer
            量化对冲基金思维
            宏观经济学视角
        语言风格
            沉稳克制
            不情绪化
            数据驱动
            给出明确操作建议
```

**示例对话风格差异**：

```
❌ 普通 AI 回答："比特币最近跌了很多，市场情绪不好，你需要谨慎。"

✅ 斯多葛 AI 助手回答："FGI=25，Ahr999=0.71，技术面已进入定投区间。
   价格短期波动属于不可控，你能控制的只有面对恐惧时的执行纪律。
   建议维持每周$100定投，恐惧加仓2倍。历史数据显示此类区间3年后平均回报超过300%。"
```

---

## 6. 每日简报：自动生成的深度报告

除了实时聊天，系统每天北京时间 08:00 还会自动生成并发送一封**每日行情简报**邮件：

```mermaid
flowchart TD
    CRON["⏰ Cron 定时器\n北京时间 08:00 触发"] --> COLLECT

    COLLECT["📊 收集当日所有数据"] --> DATA

    DATA["当日数据集合：
    - BTC 价格与涨跌幅
    - 恐慌贪婪指数 FGI
    - Ahr999 囤币指数
    - 宏观流动性信号（DXY + US10Y）
    - ETF 资金流向（华尔街动向）
    - MA200 + MA60 链上均线
    - 全网爆仓数据
    - 网络拥堵状态"] --> PROMPT

    PROMPT["📝 组装 AI 提示词\n包含所有数据 + 斯多葛角色设定"] --> DEEPSEEK

    DEEPSEEK["🧠 DeepSeek AI 生成\n约300字的中文分析报告\n包含：宏观背景 + 技术面 + 操作建议 + 斯多葛哲学结语"] --> EMAIL

    EMAIL["📧 发送邮件到用户邮箱\n标题格式：\n[Stoic Agent] 每日行情简报: 恐慌 (BTC $85,000)"] --> DB

    DB["💾 同时存入数据库\n可在应用内历史查看"]
```

**邮件结构示意**：

```mermaid
flowchart TD
    MAIL["📩 每日简报邮件结构"]
    MAIL --> S1["📌 市场核心现状\n宏观流动性判断 + 技术均线大背景"]
    MAIL --> S2["📊 硬核数据解读\nAhr999 + FGI + ETF流向 + 策略建议"]
    MAIL --> S3["⚡ 明确操作建议\n定投/加仓/减仓 + 具体理由"]
    MAIL --> S4["🏛️ 斯多葛哲学结语\n区分可控与不可控，给予精神支撑"]
```

---

## 7. 你可以直接复制的提问示例

```mermaid
mindmap
    root[AI 助手高效提问方式]
        了解当下市场
            "现在BTC贵不贵？"
            "今天应该定投还是观望？"
            "华尔街最近在买还是在卖？"
        回测验证
            "如果2020年开始每月定投$500，现在多少钱？"
            "智能DCA和普通定投相比哪个更赚钱？"
            "历史上FGI最低的时候买入，后来涨了多少？"
        宏观分析
            "美联储现在的货币政策对BTC是利好还是利空？"
            "美元最近升值了，对BTC有什么影响？"
        综合决策
            "给我一份完整的市场分析"
            "我有$1000想定投BTC，你建议怎么操作？"
```
