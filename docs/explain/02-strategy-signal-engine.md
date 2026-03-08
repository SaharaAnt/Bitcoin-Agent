# 🎯 策略顾问引擎：如何生成买入信号

> **读完本文你将理解**：当你打开应用看到"建议加仓 🟢"或"建议暂停 🔴"时，系统是怎么算出来的。

---

## 1. 核心问题：今天应该买比特币吗？

这个看似简单的问题，需要同时参考三个维度：
1. **当前市场情绪有多极端？**（靠恐慌贪婪指数 FGI）
2. **情绪正在往哪个方向走？**（7天趋势是上升还是下降）
3. **价格本身最近波动有多剧烈？**（24小时涨跌幅）

---

## 2. 数据输入阶段

```mermaid
flowchart LR
    API1[CoinGecko API\nBTC 当前价格 + 24h 涨跌幅] --> ENGINE
    API2[Alternative.me API\n今日恐慌贪婪指数 0-100] --> ENGINE
    API3[Alternative.me API\n过去7天的 FGI 历史记录] --> ENGINE
    ENGINE[策略顾问引擎\nstrategy-advisor.ts]
```

**关键概念：恐慌贪婪指数（FGI）**

> 0 = 极度恐慌（大家都在抛售，通常是好的买入机会）
> 100 = 极度贪婪（大家都在追涨，通常是风险区间）
>
> 贪婪时人群涌入，是你该离场的时候。恐惧时人群出逃，是你该入场的时候。——沃伦·巴菲特

---

## 3. 计算步骤一：判断情绪趋势（7天方向）

系统不只看今天的FGI，还分析**过去7天的走势方向**：

```mermaid
flowchart TD
    FGI_HISTORY[过去7天 FGI 数据] --> SPLIT

    SPLIT[将7天数据分为两半] --> FH[前半段 3-4天均值]
    SPLIT --> SH[后半段 3-4天均值]

    FH & SH --> COMPARE{比较两个均值}

    COMPARE -->|前半段比后半段低超5点| RISING[📈 趋势上升 Rising\n情绪在变得更贪婪]
    COMPARE -->|前半段比后半段高超5点| FALLING[📉 趋势下降 Falling\n情绪在变得更恐惧]
    COMPARE -->|差值在 ±5 内| STABLE[➡️ 趋势平稳 Stable]
```

---

## 4. 计算步骤二：打分系统

系统使用一个**评分系统**，把多个信号合并成一个数字：

```mermaid
flowchart TD
    SCORE[评分 Score\n初始 = 0] 

    SCORE --> FGI_SCORE[📊 FGI 基础分\n范围 -40 到 +40]
    SCORE --> TREND_SCORE[📈 趋势修正分\n范围 -10 到 +10]
    SCORE --> CRASH_SCORE[💥 价格崩盘修正分\n范围 -15 到 +10]

    FGI_SCORE --> FGI_TABLE["FGI ≤ 20 → -40分（极度恐惧，强烈看涨）
    FGI 21-35 → -25分
    FGI 36-45 → -10分
    FGI 46-55 → 0分（中性）
    FGI 56-70 → +10分
    FGI 71-80 → +25分
    FGI >80 → +40分（极度贪婪，强烈看跌）"]

    TREND_SCORE --> TREND_TABLE["趋势下降（情绪变恐惧）→ -10分
    趋势上升（情绪变贪婪）→ +10分
    趋势平稳 → 0分"]

    CRASH_SCORE --> CRASH_TABLE["BTC 24h 下跌 >10% → -15分（买入机会）
    BTC 24h 下跌 5-10% → -8分
    BTC 24h 上涨 >10% → +10分"]
```

**注意**：`负分`代表看涨信号（价格便宜/恐惧时买），`正分`代表看跌信号（价格贵/贪婪时减）。

---

## 5. 计算步骤三：将评分映射为操作信号

```mermaid
flowchart LR
    TOTAL[最终评分 Total Score] --> SIG

    SIG{评分区间判断}
    SIG -->|≤ -30| S1["🟢🟢 强烈买入\n strong_buy"]
    SIG -->|-30 到 -10| S2["🟢 建议加仓\n buy"]
    SIG -->|-10 到 +10| S3["🟡 正常定投\n neutral"]
    SIG -->|+10 到 +30| S4["🟠 建议减仓\n reduce"]
    SIG -->|≥ +30| S5["🔴 建议暂停\n strong_reduce"]

    style S1 fill:#10b981,color:#fff
    style S2 fill:#22c55e,color:#fff
    style S3 fill:#f59e0b,color:#000
    style S4 fill:#f97316,color:#fff
    style S5 fill:#ef4444,color:#fff
```

---

## 6. 各信号对应的具体行动建议

当系统生成信号后，还会自动推荐具体的定投参数：

```mermaid
flowchart TD
    S1["🟢🟢 强烈买入"] --> A1["定投频率：每日\n恐惧时加仓倍数：3x\nFGI阈值：30以下加仓"]
    S2["🟢 建议加仓"] --> A2["定投频率：每周\n恐惧时加仓倍数：2x\nFGI阈值：25以下加仓"]
    S3["🟡 正常定投"] --> A3["定投频率：每周\n恐惧时加仓倍数：2x\n不做额外调整"]
    S4["🟠 建议减仓"] --> A4["定投频率：每两周\n贪婪时减仓倍数：0.3x\nFGI阈值：70以上减仓"]
    S5["🔴 建议暂停"] --> A5["定投频率：每月\n贪婪时减仓倍数：0.2x\n保留现金等待回调"]
```

---

## 7. 置信度（Confidence）是什么意思？

信号还会附带一个"置信度"（0-95%），代表系统对这个判断有多确定：

```mermaid
xychart-beta
    title "置信度 = 50% + |评分|，最高不超过95%"
    x-axis ["评分=0 (中性)", "评分=±10", "评分=±20", "评分=±30", "评分=±40", "评分=±50"]
    y-axis "置信度 (%)" 0 --> 100
    bar [50, 60, 70, 80, 90, 95]
```

> **通俗理解**：评分越极端（比如FGI=8，大崩盘），置信度就越高，系统更确信该买。评分在中间（FGI=50左右，市场平静），置信度在50%左右，信号较弱。

---

## 8. 完整系统流程总结

```mermaid
sequenceDiagram
    participant User as 你（用户）
    participant Dashboard as 仪表盘
    participant Advisor as 策略顾问引擎
    participant APIs as 外部API

    User ->> Dashboard: 打开应用
    Dashboard ->> Advisor: 请求策略分析
    Advisor ->> APIs: 并行获取 BTC价格 + 今日FGI + 7天FGI历史
    APIs -->> Advisor: 返回数据
    Advisor ->> Advisor: 1. 计算7天趋势方向
    Advisor ->> Advisor: 2. 综合打分（FGI+趋势+价格）
    Advisor ->> Advisor: 3. 映射为信号（买/卖/中性）
    Advisor ->> Advisor: 4. 生成具体行动建议和置信度
    Advisor -->> Dashboard: 返回完整策略分析
    Dashboard -->> User: 展示「建议加仓 🟢」及分析理由
```
