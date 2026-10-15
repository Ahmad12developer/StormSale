import { describe, it, expect } from "vitest";
import {
  calculateCVR,
  calculateTrend,
  fetchAffiliateConversionData,
  recordLinkClick,
  recordLinkConversion,
} from "../utils/api";

describe("Affiliate Real-Time CVR & Conversion Analytics Suite (#52)", () => {
  describe("Mathematical CVR (Click-to-Sale Ratio) Calculations", () => {
    it("calculates exact click-to-sale percentage correctly", () => {
      // 50 sales out of 1000 clicks = 5.0%
      expect(calculateCVR(50, 1000)).toBe(5.0);

      // 126 sales out of 3150 clicks = 4.0%
      expect(calculateCVR(126, 3150)).toBe(4.0);

      // 77 sales out of 2200 clicks = 3.5%
      expect(calculateCVR(77, 2200)).toBe(3.5);

      // 1 sale out of 30 clicks = 3.33%
      expect(calculateCVR(1, 30)).toBe(3.33);
    });

    it("handles zero clicks safely without NaN or divide-by-zero error", () => {
      expect(calculateCVR(0, 0)).toBe(0);
      expect(calculateCVR(5, 0)).toBe(0);
      expect(Number.isNaN(calculateCVR(0, 0))).toBe(false);
    });

    it("handles zero conversions accurately as 0.0%", () => {
      expect(calculateCVR(0, 500)).toBe(0);
    });

    it("handles 100% conversion rate edge case", () => {
      expect(calculateCVR(100, 100)).toBe(100.0);
    });

    it("correctly limits precision to 2 decimal places", () => {
      // 1 / 3 = 33.33333... -> 33.33
      expect(calculateCVR(1, 3)).toBe(33.33);
      // 2 / 7 = 28.5714... -> 28.57
      expect(calculateCVR(2, 7)).toBe(28.57);
    });
  });

  describe("Trend Indicator Calculations", () => {
    it("identifies positive (up) trend with positive delta", () => {
      const trend = calculateTrend(5.2, 4.0);
      expect(trend.trendDirection).toBe("up");
      expect(trend.trendDelta).toBe(1.2);
    });

    it("identifies negative (down) trend with negative delta", () => {
      const trend = calculateTrend(3.5, 4.2);
      expect(trend.trendDirection).toBe("down");
      expect(trend.trendDelta).toBe(-0.7);
    });

    it("identifies neutral (steady) trend when CVR is unchanged", () => {
      const trend = calculateTrend(4.5, 4.5);
      expect(trend.trendDirection).toBe("neutral");
      expect(trend.trendDelta).toBe(0.0);
    });
  });

  describe("Backend Conversion Data Synchronization", () => {
    it("fetches active links analytics and aggregated summary metrics", async () => {
      const data = await fetchAffiliateConversionData();
      expect(data).toBeDefined();
      expect(Array.isArray(data.links)).toBe(true);
      expect(data.links.length).toBeGreaterThan(0);

      const summary = data.summary;
      expect(summary.totalClicks).toBeGreaterThan(0);
      expect(summary.totalConversions).toBeGreaterThan(0);
      expect(summary.overallCVR).toBeGreaterThan(0);
      expect(summary.activeLinksCount).toBe(data.links.length);
      expect(summary.lastSynced).toBeDefined();
    });

    it("ensures each active link has verified click-to-sale ratios", async () => {
      const { links } = await fetchAffiliateConversionData();
      for (const link of links) {
        expect(link.id).toBeDefined();
        expect(link.campaignName).toBeDefined();
        expect(link.clicks).toBeGreaterThanOrEqual(0);
        expect(link.conversions).toBeGreaterThanOrEqual(0);

        // Verify CVR integrity matches calculation
        const expectedCVR = calculateCVR(link.conversions, link.clicks);
        expect(link.conversionRate).toBe(expectedCVR);

        // Verify trend direction matches trendDelta
        if (link.trendDelta > 0) {
          expect(link.trendDirection).toBe("up");
        } else if (link.trendDelta < 0) {
          expect(link.trendDirection).toBe("down");
        } else {
          expect(link.trendDirection).toBe("neutral");
        }
      }
    });

    it("updates CVR in real-time when link click event is recorded", async () => {
      const initial = await fetchAffiliateConversionData();
      const firstLink = initial.links[0];
      const initialClicks = firstLink.clicks;

      const updated = await recordLinkClick(firstLink.id);
      expect(updated.clicks).toBe(initialClicks + 1);
      expect(updated.conversionRate).toBe(calculateCVR(updated.conversions, updated.clicks));
      expect(updated.previousConversionRate).toBe(firstLink.conversionRate);
    });

    it("updates CVR and commission in real-time when link conversion event is recorded", async () => {
      const initial = await fetchAffiliateConversionData();
      const firstLink = initial.links[0];
      const initialConversions = firstLink.conversions;
      const initialRevenue = firstLink.totalRevenueXlm;

      const updated = await recordLinkConversion(firstLink.id, 200);
      expect(updated.conversions).toBe(initialConversions + 1);
      expect(updated.totalRevenueXlm).toBe(initialRevenue + 200);
      expect(updated.conversionRate).toBe(calculateCVR(updated.conversions, updated.clicks));
      expect(updated.trendDirection).toBe("up");
    });
  });
});
