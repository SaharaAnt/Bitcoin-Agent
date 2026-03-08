# 🔄 DCA 回测引擎：历史数据模拟定投

> **读完本文你将理解**：「回测」功能是什么，系统如何比较三种不同的定投策略，以及「智能 DCA」比普通定投强在哪里。

---

## 1. 什么是「回测」？

回测（Backtest）就是：**拿历史数据，模拟你如果在过去按照某种策略买入，现在会赚多少钱**。

它解决一个核心问题：
> "我的定投策略在历史上真的有效吗？还是我只是在运气好的时候才盈利？"

---

## 2. 三种策略的区别

系统支持同时比较三种策略，让你一眼看出哪种最优：

```mermaid
flowchart TD
    subgraph S1["策略一：标准 DCA"]
        S1A["每隔固定时间买入固定金额\n例：每周买 $100，不管市场怎么样"]
        S1B["特点：纪律性强，情绪影响最小\n缺点：恐慌时不多买，贪婪时不少买"]
    end

    subgraph S2["策略二：智能 DCA\n（核心创新功能）"]
        S2A["同样间隔，但根据恐慌贪婪指数动态调整金额"]
        S2B["恐惧时（FGI低）→ 加倍买入\n贪婪时（FGI高）→ 减少买入"]
    end

    subgraph S3["策略三：一次性买入\n（Lump Sum，对比用）"]
        S3A["在起始时间一次性投入全部资金\n等同于你如果完美抄底一次"]
        S3B["用途：与 DCA 对比，看定投是否真的更优"]
    end
```

---

## 3. 标准 DCA 的运行逻辑

```mermaid
flowchart TD
    START[⏱️ 从开始日期出发] --> LOOP{当前日期 ≤ 结束日期？}
    LOOP -->|否| RESULT[📊 计算最终结果]
    LOOP -->|是| CHECK{今天是定投日吗？}

    CHECK -->|每日定投：永远是| BUY
    CHECK -->|每周定投：距开始满7的倍数天| BUY
    CHECK -->|每两周定投：满14倍数天| BUY
    CHECK -->|每月定投：同一日| BUY
    CHECK -->|不是定投日| NEXT[📅 进入下一天]

    BUY["💰 查询当天 BTC 价格\n计算能买多少 BTC\n金额 ÷ 价格 = 获得的BTC数量"] --> RECORD[记录本次购买]
    RECORD --> NEXT
    NEXT --> LOOP
```

---

## 4. 智能 DCA 的核心差异：动态乘数

这是产品最核心的差异化功能。普通定投买固定额，智能DCA会「情绪感知」：

```mermaid
flowchart TD
    START[📅 今天是定投日] --> FGI_CHECK[查询当天的恐慌贪婪指数 FGI]

    FGI_CHECK --> COMPARE{FGI 值对比阈值}

    COMPARE -->|FGI ≤ 恐惧阈值\n默认 25| FEAR["😱 市场极度恐惧\n乘子 = 恐惧倍数\n默认2.0\n实际买入 = 标准金额 × 2"]
    COMPARE -->|FGI ≥ 贪婪阈值\n默认 75| GREED["🤑 市场极度贪婪\n乘子 = 贪婪倍数\n默认0.5\n实际买入 = 标准金额 × 0.5"]
    COMPARE -->|25 < FGI < 75| NORMAL["😐 市场情绪正常\n乘子 = 1.0\n按标准金额买入"]

    FEAR & GREED & NORMAL --> BUY[💰 以当天价格买入]
```

**举例**：你设置每周买 $100，恐惧阈值25，贪婪阈值75，恐惧倍数2x：
- 某周 FGI=15（极度恐惧）→ 实际买入 **$200**（抄底加仓）
- 某周 FGI=50（正常）→ 实际买入 **$100**（标准）
- 某周 FGI=85（极度贪婪）→ 实际买入 **$50**（减少）

---

## 5. 三种策略的完整比较流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant API as 回测 API
    participant BTC as BTC历史K线
    participant FGI as FGI历史数据
    participant Engine as DCA引擎

    User ->> API: 提交参数（起止日期、频率、金额）
    API ->> BTC: 获取日期范围内的每日BTC价格
    API ->> FGI: 获取对应时期的每日FGI数据
    BTC -->> Engine: 价格数据
    FGI -->> Engine: 情绪数据

    par 三种策略并行计算
        Engine ->> Engine: 标准DCA模拟
    and
        Engine ->> Engine: 智能DCA模拟（用FGI调整乘数）
    and
        Engine ->> Engine: 一次性买入模拟
    end

    Engine -->> API: 三组结果
    API -->> User: 返回对比图表与统计数据
```

---

## 6. 结果指标详解

回测完成后，系统会计算以下指标：

```mermaid
mindmap
    root[回测结果指标]
        核心收益
            总投入金额 Total Invested
            最终持仓市值 Final Value
            总回报率 ROI
        长期评估
            年化收益率 Annualized Return
            最大回撤 Max Drawdown
        成本分析
            平均持仓成本 Average Cost
            累计购入 BTC 数量
```

**最大回撤**（Max Drawdown）解释：
> 从你持仓市值的历史最高点，到随后某个最低点，跌了多少百分比。
> 比如持仓最高值 $10,000，后来跌到 $6,000，最大回撤 = 40%。
> 这个数越小，说明策略越稳定，波动越小。

---

## 7. 可调参数说明

```mermaid
flowchart LR
    PARAMS[回测参数面板] --> P1[开始日期 / 结束日期]
    PARAMS --> P2[定投频率\n每日 / 每周 / 每两周 / 每月]
    PARAMS --> P3[每次金额 USD]
    PARAMS --> P4{开启智能DCA？}

    P4 -->|是| ADV[高级参数]
    ADV --> A1[恐惧阈值\nFGI低于此值时加仓\n默认25]
    ADV --> A2[贪婪阈值\nFGI高于此值时减仓\n默认75]
    ADV --> A3[恐惧加仓倍数\n默认2.0x]
    ADV --> A4[贪婪减仓倍数\n默认0.5x]
```

---

## 8. 历史恐慌时刻回测（Stoic Pattern）

这是一个特别功能：查看**历史上极度恐慌时买入，回报有多高**。

```mermaid
flowchart TD
    TRIGGER[打开「历史极度恐慌回测」] --> HARD[系统加载预设的历史绝望事件]

    HARD --> EVENTS["历史事件列表
    - 2018年12月 大熊市底部 FGI=8
    - 2020年3月 新冠崩盘 FGI=12
    - 2022年6月 Luna崩盘 FGI=10
    - 2022年11月 FTX暴雷 FGI=15"]

    EVENTS --> CALC["系统自动计算：
    如果在每个事件当天买入 $1000
    1年后价值是多少？
    2年后价值是多少？
    持有至今价值是多少？"]

    CALC --> TABLE[展示结果表格\n带历史回报率标注]
```

> **使用方法**：点击"DCA回测参数"卡片最下方的「历史极度恐慌回测」按钮，展开查看。它是一个精神锚点——当你下次看到市场极度恐慌时，回看这个表格，你会更有勇气执行定投纪律。
