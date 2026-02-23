# Bitcoin Agent 演进方向与 Roadmap

结合当前项目基础（Next.js + AI SDK + Prisma + FGI 定投回测引擎）与“主权 AI Agent”理念，未来高价值开发方向整理如下：

## 1. 从“被动计算”到“全自动执行” (Autonomous Agent)
- **目标**：将依靠手动触发的回测引擎计算，升级为实盘模拟（Paper Trading）或真实的自动化定投引擎。
- **方案**：引入 Vercel Cron 或利用你之前做过的后台调度机制。让 Agent 每天定时检查 FGI 与其他市场指标，自动计算买入份额并记录入库，后续可直接对接交易所 API（Binance/Kraken等）实现全自动无人值守下单。

## 2. 多维度情感分析与 RAG 增强 (Multi-Factor Sentiment RAG)
- **目标**：打破仅依赖单一“恐惧贪婪指数 (FGI)”的局限，让 AI 真正做到“察言观色”。
- **方案**：基于 Vercel AI SDK 赋予 Agent 外部工具（Tools）调用能力。自动抓取链上核心数据（如大户资金流向、MVRV 比例），结合 Twitter 核心 KOL 情绪及宏观新闻，通过大模型萃取“市场综合信心指数”，以此作为独家的 Agent Alpha 信号来控制仓位。

## 3. 可验证的链上身份与决策审计 (Decentralized Identity & Audit)
- **目标**：延续斯多葛 Agent 的去中心化理念，构建决策完全公开透明且防篡改的“主权验证 AI”。
- **方案**：为该 Bitcoin Agent 分配专属的区块链钱包地址（DID）。每次 AI 做出“买入/卖出/观望”决定时，将决策时的所有上下文（当时的 FGI、多因子指标、Prompt 的哈希值）进行加密签名并上链（如 Arweave 或以太坊 EAS 服务），做到 100% 链上可审计。

## 4. 事件驱动型的高频/网格回测框架 (Event-Driven Backtest Engine)
- **目标**：提升现有回测引擎的专业度，支持更复杂、更贴近真实市场的交易策略回测。
- **方案**：重构底层简单遍历的计算引擎，升级为事件驱动（Event-Driven Architecture）模型。引入更细粒度的 K 线（OHLCV）数据，支持动态滑点、真实手续费扣除、以及限价单和追踪止损等高级挂单行为的模拟。

## 5. 多 Agent 协作 / 对抗模式 (Multi-Agent Debate)
- **目标**：引入多视角博弈，克服单一侧重可能带来的“幻觉”或激进风险。
- **方案**：在架构中实例化多个 AI 人格。例如设立“激进型寻找突破口的交易员”与“斯多葛主义极端风险规避官”。每次调仓前，由激进派提出交易提案，保守派用“悲观预设（Premeditatio Malorum）”进行审查否决，通过它们之间的内在 Debate（辩论）最终决定当日的稳定投资比例。
