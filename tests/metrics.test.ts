import { describe, it, expect } from 'vitest';
import {
    calcUnderwaterDays,
    calcLongestDrawdownDays,
    calcWinRate,
} from '../lib/engine/metrics';
import type { BuyEvent } from '../lib/engine/types';

// Helper to build a mock BuyEvent
function makeEvent(date: string, portfolioValue: number, totalInvested: number): BuyEvent {
    return {
        date,
        price: 1,
        amountUSD: 0,
        btcBought: 0,
        totalBTC: portfolioValue, // simplified: 1 BTC = 1 USD
        totalInvested,
        portfolioValue,
    };
}

describe('calcUnderwaterDays', () => {
    it('should return 0 when portfolio always beats invested cost', () => {
        const buys: BuyEvent[] = [
            makeEvent('2023-01-01', 1200, 1000),
            makeEvent('2023-01-02', 1500, 1000),
            makeEvent('2023-01-03', 2000, 1000),
        ];
        expect(calcUnderwaterDays(buys)).toBe(0);
    });

    it('should count all days when portfolio is always below cost', () => {
        const buys: BuyEvent[] = [
            makeEvent('2023-01-01', 800, 1000),
            makeEvent('2023-01-02', 700, 1000),
            makeEvent('2023-01-03', 600, 1000),
        ];
        expect(calcUnderwaterDays(buys)).toBe(3);
    });

    it('should count only underwater days in a mixed sequence', () => {
        const buys: BuyEvent[] = [
            makeEvent('2023-01-01', 1200, 1000), // above water
            makeEvent('2023-01-02', 900, 1000),  // underwater
            makeEvent('2023-01-03', 1100, 1000), // above water
            makeEvent('2023-01-04', 800, 1000),  // underwater
        ];
        expect(calcUnderwaterDays(buys)).toBe(2);
    });
});

describe('calcLongestDrawdownDays', () => {
    it('should return 0 if all points hit new highs immediately', () => {
        const buys: BuyEvent[] = [
            makeEvent('2023-01-01', 1000, 1000),
            makeEvent('2023-01-02', 1100, 1000),
            makeEvent('2023-01-03', 1200, 1000),
        ];
        // Always at or above peak, no sustained drawdown
        expect(calcLongestDrawdownDays(buys)).toBe(0);
    });

    it('should measure the longest period below a previous peak', () => {
        const buys: BuyEvent[] = [
            makeEvent('2023-01-01', 1000, 1000), // peak = 1000
            makeEvent('2023-01-02', 800, 1000),  // -1
            makeEvent('2023-01-03', 700, 1000),  // -2
            makeEvent('2023-01-04', 900, 1000),  // -3
            makeEvent('2023-01-05', 1200, 1000), // new high, resets
            makeEvent('2023-01-06', 1100, 1000), // -1
            makeEvent('2023-01-07', 1050, 1000), // -2
            makeEvent('2023-01-08', 1300, 1000), // new high, resets
        ];
        // Longest stretch below peak: 3 days (Jan 2-4), then 2 days (Jan 6-7)
        expect(calcLongestDrawdownDays(buys)).toBe(3);
    });
});

describe('calcWinRate', () => {
    it('should return 100 when all days are profitable', () => {
        const buys: BuyEvent[] = [
            makeEvent('2023-01-01', 1200, 1000),
            makeEvent('2023-01-02', 1500, 1000),
        ];
        expect(calcWinRate(buys)).toBe(100);
    });

    it('should return 0 when all days are loss-making', () => {
        const buys: BuyEvent[] = [
            makeEvent('2023-01-01', 800, 1000),
            makeEvent('2023-01-02', 500, 1000),
        ];
        expect(calcWinRate(buys)).toBe(0);
    });

    it('should return 50 when half the days are profitable', () => {
        const buys: BuyEvent[] = [
            makeEvent('2023-01-01', 1200, 1000), // win
            makeEvent('2023-01-02', 900, 1000),  // lose
            makeEvent('2023-01-03', 1100, 1000), // win
            makeEvent('2023-01-04', 800, 1000),  // lose
        ];
        expect(calcWinRate(buys)).toBe(50);
    });

    it('should return 0 when there are no events', () => {
        expect(calcWinRate([])).toBe(0);
    });
});
