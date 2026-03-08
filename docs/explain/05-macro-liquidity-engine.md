# 🌊 宏观流动性引擎：美联储如何影响比特币

> **读完本文你将理解**：为什么比特币和美联储利率政策密切相关，系统是如何实时追踪这些宏观指标的，以及「宏观流动性宽松」对你的定投意味着什么。

---

## 1. 一个反直觉的关系

很多人觉得比特币是独立于传统金融的资产，但实际上：

```mermaid
graph LR
    FED[美联储\n加息/降息决策] -->|影响| DXY[美元指数 DXY\n美元强弱]
    FED -->|影响| US10Y[10年期美债收益率\n无风险收益率]
    FED -->|影响| ZQ[联邦基金利率期货\n市场对降息的预期]

    DXY -->|负相关| BTC["₿ 比特币\n美元弱 = BTC 强"]
    US10Y -->|负相关| BTC["₿ 比特币\n债券收益低 = 资金流向BTC"]
    ZQ -->|正相关| BTC["₿ 比特币\n降息预期强 = BTC 看涨"]
```

简单理解：
- 美联储**降息** → 美元贬值 → 资金寻找更高收益资产 → 流入比特币
- 美联储**加息** → 美元走强 → 美债收益率高 → 资金回流传统金融 → 离开比特币

---

## 2. 系统追踪的五大指标

```mermaid
mindmap
    root[宏观流动性引擎]
        核心货币政策指标
            ZQ联邦基金利率期货
                追踪市场对降息的定价
                最直接的政策信号
            US10Y十年期美债
                无风险基准收益率
                降低=利好BTC
        美元流动性指标
            DXY美元指数
                美元强弱衡量器
                下跌=全球流动性释放
        情绪散户指标
            Google Trends搜索热度
                散户FOMO信号
                飙升=接近顶部警示
            Reddit社区活跃度
                r/Bitcoin论坛发帖量
                过热=情绪顶点
```

---

## 3. 美联储利率期货（ZQ）如何解读

这是最难理解但最重要的指标：

```mermaid
flowchart TD
    ZQ[ZQ=F 联邦基金利率期货\n价格 eg. 95.38]

    ZQ --> CALC["隐含利率 = 100 - 价格\n95.38 → 隐含利率 4.62%"]

    CALC --> CHANGE{今日价格变化}

    CHANGE -->|价格上涨 eg +0.1| LOWER["隐含利率下降\n相当于降息预期增强 📉\n→ 看涨信号 🟢\n评分 -3分（利好BTC）"]

    CHANGE -->|价格下跌 eg -0.1| HIGHER["隐含利率上升\n相当于加息预期增强 📈\n→ 看跌信号 🔴\n评分 +3分（利空BTC）"]

    CHANGE -->|基本不变| FLAT["预期稳定\n中性信号 ⚖️\n评分 0分"]
```

> **通俗：** 把期货价格想象成「市场集体投票」。价格涨说明大家预计利率会降，这对BTC是好事。

---

## 4. 综合评分系统

宏观流动性引擎使用一个加权评分系统，把五个指标汇总成一个结论：

```mermaid
flowchart TD
    SCORE[综合评分\n初始 = 0\n范围约 -7 到 +7]

    ZQ_INPUT[ZQ期货：最高权重 ±3分] --> SCORE
    US10Y_INPUT[10年美债：±2分] --> SCORE
    DXY_INPUT[美元指数：±2分] --> SCORE
    TRENDS_INPUT[Google热度：±2分] --> SCORE
    REDDIT_INPUT[Reddit活跃度：±1分] --> SCORE

    SCORE --> SIGNAL{评分区间}

    SIGNAL -->|总分 ≤ -3| EASING["🌊 宏观流动性宽松\n美联储降息预期强烈\n全球资金涌入风险资产\n比特币处于有利顺风局"]
    SIGNAL -->|总分 -3 到 +3| NEUTRAL["⚖️ 宏观流动性中性\n政策预期博弈僵持\n比特币走势更受内部驱动"]
    SIGNAL -->|总分 ≥ +3| TIGHTENING["⚠️ 宏观流动性紧缩\n利率上升压力大\n传统资产更具吸引力\n比特币面临资金撤出压力"]

    style EASING fill:#10b981,color:#fff
    style NEUTRAL fill:#f59e0b,color:#000
    style TIGHTENING fill:#ef4444,color:#fff
```

---

## 5. 各指标详细评分规则

### 美元指数（DXY）

```mermaid
table
    DXY当日涨跌幅 | 对BTC意义 | 评分
    跌幅 > 0.5% | 美元大跌，全球流动性充裕 | -2分（看涨）
    跌幅 0.2-0.5% | 美元微跌，温和利好 | -1分
    涨跌 < 0.2% | 横盘，中性 | 0分
    涨幅 0.2-0.5% | 美元偏强，轻度压制 | +1分
    涨幅 > 0.5% | 美元强势，资金避险回流 | +2分（看跌）
```

### 谷歌搜索热度（散户 FOMO 指标）

```mermaid
flowchart LR
    TRENDS[Google Trends\n近30天Bitcoin搜索量] --> SPLIT

    SPLIT --> RECENT["近3天均值\n代表当前热度"]
    SPLIT --> BASELINE["过去27天均值\n代表背景热度"]

    RECENT & BASELINE --> COMPARE{对比}

    COMPARE -->|近3天 > 基准 × 1.3| SPIKE["🚨 搜索量激增\n散户 FOMO 情绪高涨\n经典「接盘侠」信号\n评分 +2（看跌警告）"]
    COMPARE -->|近3天 < 基准 × 0.7| COLD["❄️ 搜索量骤冷\n市场无人问津\n洗盘充分，逆向买入信号\n评分 -2（看涨信号）"]
    COMPARE -->|其他| FLAT2["😑 热度正常\n中性，不做调整\n评分 0"]
```

---

## 6. 完整宏观分析运行时序

```mermaid
sequenceDiagram
    participant User as 用户打开应用
    participant Dashboard as 仪表盘
    participant MacroEngine as 宏观流动性引擎
    participant Yahoo as Yahoo Finance API
    participant GT as Google Trends API
    participant CG as CoinGecko Reddit数据

    User ->> Dashboard: 加载页面
    Dashboard ->> MacroEngine: 请求宏观分析
    
    par 并行获取所有数据
        MacroEngine ->> Yahoo: 获取 DXY 美元指数
        MacroEngine ->> Yahoo: 获取 US10Y 10年美债
        MacroEngine ->> Yahoo: 获取 ZQ=F 利率期货
        MacroEngine ->> GT: 获取近30天Bitcoin搜索热度
        MacroEngine ->> CG: 获取 Reddit 社区活跃数据
    end
    
    Yahoo -->> MacroEngine: 实时报价数据
    GT -->> MacroEngine: 搜索热度时间序列
    CG -->> MacroEngine: Reddit订阅数 + 发帖量

    MacroEngine ->> MacroEngine: 逐项评分（5个指标）
    MacroEngine ->> MacroEngine: 汇总总分 → 判断宽松/中性/紧缩
    MacroEngine ->> MacroEngine: 生成中文分析理由
    MacroEngine -->> Dashboard: 返回完整宏观分析
    Dashboard -->> User: 展示宏观流动性雷达卡片
```

---

## 7. ETF 资金流向：华尔街的实际行动

除了宏观政策预期，系统还追踪了华尔街机构的**实际买卖行动**：

```mermaid
flowchart TD
    FARSIDE[Farside.co.uk\n每日比特币现货ETF资金流向数据] --> SCRAPER

    SCRAPER["GitHub Actions 每天08:00\nPuppeteer 浏览器自动抓取"] --> JSON["farside-data.json\n本地存档 555天历史"]

    JSON --> API["/api/market/etf\n数据处理API"]

    API --> METRICS["计算关键指标：
    - 历史累计净流入总额（约550亿美元）
    - 近14天每日流向柱状图
    - 日均净流入金额
    - 正流入/流出天数统计"]

    METRICS --> CARD["ETF 资金流向卡片\n卡片展示在 Dashboard 中部"]
    METRICS --> CRON["每日简报\n「华尔街机构动向」段落"]
    METRICS --> AGENT["AI 助手工具 getEtfFlows\n可被聊天查询调用"]
```

> **解读指南**：
> - **净流入为正**（绿柱）→ 机构在买，有资金支撑，对价格正面
> - **净流出为负**（红柱）→ 机构在卖或赎回，短期有抛压
> - **连续多日净流出** → 需要警惕，可能是机构减仓信号
