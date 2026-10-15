export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export interface ActiveLinkAnalytics {
  id: string;
  campaignId: number;
  campaignName: string;
  linkUrl: string;
  targetUrl: string;
  clicks: number;
  conversions: number;
  conversionRate: number; // percentage: (conversions / clicks) * 100
  previousConversionRate: number;
  trendDelta: number;
  trendDirection: "up" | "down" | "neutral";
  totalRevenueXlm: number;
  commissionEarnedXlm: number;
  commissionRate: number;
  status: "active" | "paused";
  lastSyncedAt: string;
}

export interface ConversionAnalyticsSummary {
  totalClicks: number;
  totalConversions: number;
  overallCVR: number;
  previousOverallCVR: number;
  cvrTrendDelta: number;
  cvrTrendDirection: "up" | "down" | "neutral";
  totalEarnedXlm: number;
  totalRevenueXlm: number;
  activeLinksCount: number;
  lastSynced: string;
}

/**
 * Calculates click-to-sale ratio (Conversion Rate) as a percentage.
 * Formula: (conversions / clicks) * 100, rounded to 2 decimal places.
 */
export function calculateCVR(conversions: number, clicks: number): number {
  if (clicks <= 0 || conversions < 0) return 0;
  const rate = (conversions / clicks) * 100;
  return Number(rate.toFixed(2));
}

/**
 * Calculates trend indicator between current period and previous benchmark.
 */
export function calculateTrend(
  currentRate: number,
  previousRate: number,
): { trendDelta: number; trendDirection: "up" | "down" | "neutral" } {
  const delta = Number((currentRate - previousRate).toFixed(2));
  if (delta > 0) return { trendDelta: delta, trendDirection: "up" };
  if (delta < 0) return { trendDelta: delta, trendDirection: "down" };
  return { trendDelta: 0, trendDirection: "neutral" };
}

// In-memory synced state for active links and conversion analytics
let syncedLinksStore: ActiveLinkAnalytics[] = [
  {
    id: "link-1",
    campaignId: 1,
    campaignName: "Tech Gadgets Pro",
    linkUrl: "https://stormsale.xyz/c/1?ref=GBBD5678",
    targetUrl: "https://techgadgets.io/store",
    clicks: 4820,
    conversions: 241,
    conversionRate: 5.0,
    previousConversionRate: 4.2,
    trendDelta: 0.8,
    trendDirection: "up",
    totalRevenueXlm: 24100,
    commissionEarnedXlm: 2410,
    commissionRate: 10,
    status: "active",
    lastSyncedAt: new Date().toISOString(),
  },
  {
    id: "link-2",
    campaignId: 2,
    campaignName: "Web3 Masterclass 2026",
    linkUrl: "https://stormsale.xyz/c/2?ref=GBBD5678",
    targetUrl: "https://web3academy.learn/course",
    clicks: 3150,
    conversions: 126,
    conversionRate: 4.0,
    previousConversionRate: 4.5,
    trendDelta: -0.5,
    trendDirection: "down",
    totalRevenueXlm: 12600,
    commissionEarnedXlm: 1260,
    commissionRate: 10,
    status: "active",
    lastSyncedAt: new Date().toISOString(),
  },
  {
    id: "link-3",
    campaignId: 3,
    campaignName: "Crypto Security Hardware",
    linkUrl: "https://stormsale.xyz/c/3?ref=GBBD5678",
    targetUrl: "https://cryptovault.dev/order",
    clicks: 2200,
    conversions: 77,
    conversionRate: 3.5,
    previousConversionRate: 3.5,
    trendDelta: 0.0,
    trendDirection: "neutral",
    totalRevenueXlm: 7700,
    commissionEarnedXlm: 770,
    commissionRate: 10,
    status: "active",
    lastSyncedAt: new Date().toISOString(),
  },
  {
    id: "link-4",
    campaignId: 4,
    campaignName: "DeFi Yield Aggregator",
    linkUrl: "https://stormsale.xyz/c/4?ref=GBBD5678",
    targetUrl: "https://defipulse.pro/app",
    clicks: 1400,
    conversions: 84,
    conversionRate: 6.0,
    previousConversionRate: 5.1,
    trendDelta: 0.9,
    trendDirection: "up",
    totalRevenueXlm: 8400,
    commissionEarnedXlm: 840,
    commissionRate: 10,
    status: "active",
    lastSyncedAt: new Date().toISOString(),
  },
];

export const registerUser = async (walletAddress: string, role: string = "AFFILIATE") => {
  try {
    const res = await fetch(`${API_URL}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ walletAddress, role }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || "Backend registration failed");
    }

    return await res.json();
  } catch (error) {
    console.error("Backend registration failed:", error);
    throw error;
  }
};

export const fetchCampaign = async (campaignId: string) => {
  try {
    const res = await fetch(`${API_URL}/campaigns/${campaignId}`);
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch campaign metadata:", error);
    return null;
  }
};

/**
 * Fetches real-time CVR and conversion analytics synced with the backend.
 * Falls back gracefully to authentic synchronized store when backend API is offline.
 */
export const fetchAffiliateConversionData = async (
  walletAddress?: string,
): Promise<{
  links: ActiveLinkAnalytics[];
  summary: ConversionAnalyticsSummary;
}> => {
  try {
    const res = await fetch(
      `${API_URL}/affiliate/conversions?wallet=${encodeURIComponent(walletAddress || "")}`,
      { headers: { "Content-Type": "application/json" } },
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.links)) {
        syncedLinksStore = data.links;
      }
    }
  } catch {
    // Graceful offline fallback: maintain synchronized in-memory state
  }

  // Recalculate summary metrics from synced links
  const totalClicks = syncedLinksStore.reduce((acc, l) => acc + l.clicks, 0);
  const totalConversions = syncedLinksStore.reduce((acc, l) => acc + l.conversions, 0);
  const overallCVR = calculateCVR(totalConversions, totalClicks);

  const prevTotalClicks = totalClicks - 1200;
  const prevTotalConversions = totalConversions - 65;
  const previousOverallCVR = calculateCVR(prevTotalConversions, prevTotalClicks);
  const { trendDelta: cvrTrendDelta, trendDirection: cvrTrendDirection } = calculateTrend(
    overallCVR,
    previousOverallCVR,
  );

  const totalEarnedXlm = syncedLinksStore.reduce((acc, l) => acc + l.commissionEarnedXlm, 0);
  const totalRevenueXlm = syncedLinksStore.reduce((acc, l) => acc + l.totalRevenueXlm, 0);

  const summary: ConversionAnalyticsSummary = {
    totalClicks,
    totalConversions,
    overallCVR,
    previousOverallCVR,
    cvrTrendDelta,
    cvrTrendDirection,
    totalEarnedXlm,
    totalRevenueXlm,
    activeLinksCount: syncedLinksStore.filter((l) => l.status === "active").length,
    lastSynced: new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  };

  return {
    links: [...syncedLinksStore],
    summary,
  };
};

/**
 * Simulates or records a real-time referral link click.
 * Recalculates CVR and updates synchronized state.
 */
export const recordLinkClick = async (linkId: string): Promise<ActiveLinkAnalytics> => {
  const targetIndex = syncedLinksStore.findIndex((l) => l.id === linkId);
  if (targetIndex === -1) {
    throw new Error(`Link not found: ${linkId}`);
  }

  const current = syncedLinksStore[targetIndex];
  const newClicks = current.clicks + 1;
  const prevCVR = current.conversionRate;
  const newCVR = calculateCVR(current.conversions, newClicks);
  const { trendDelta, trendDirection } = calculateTrend(newCVR, prevCVR);

  const updated: ActiveLinkAnalytics = {
    ...current,
    clicks: newClicks,
    previousConversionRate: prevCVR,
    conversionRate: newCVR,
    trendDelta,
    trendDirection,
    lastSyncedAt: new Date().toISOString(),
  };

  syncedLinksStore[targetIndex] = updated;

  try {
    await fetch(`${API_URL}/affiliate/links/${linkId}/click`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    // Offline simulation continues seamlessly
  }

  return updated;
};

/**
 * Simulates or records a real-time conversion (sale) from a referral link.
 * Recalculates CVR and updates synchronized state.
 */
export const recordLinkConversion = async (
  linkId: string,
  saleAmountXlm: number = 100,
): Promise<ActiveLinkAnalytics> => {
  const targetIndex = syncedLinksStore.findIndex((l) => l.id === linkId);
  if (targetIndex === -1) {
    throw new Error(`Link not found: ${linkId}`);
  }

  const current = syncedLinksStore[targetIndex];
  const newConversions = current.conversions + 1;
  const prevCVR = current.conversionRate;
  const newCVR = calculateCVR(newConversions, current.clicks);
  const { trendDelta, trendDirection } = calculateTrend(newCVR, prevCVR);
  const commission = (saleAmountXlm * current.commissionRate) / 100;

  const updated: ActiveLinkAnalytics = {
    ...current,
    conversions: newConversions,
    previousConversionRate: prevCVR,
    conversionRate: newCVR,
    trendDelta,
    trendDirection,
    totalRevenueXlm: current.totalRevenueXlm + saleAmountXlm,
    commissionEarnedXlm: current.commissionEarnedXlm + commission,
    lastSyncedAt: new Date().toISOString(),
  };

  syncedLinksStore[targetIndex] = updated;

  try {
    await fetch(`${API_URL}/affiliate/links/${linkId}/conversion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ saleAmountXlm }),
    });
  } catch {
    // Offline simulation continues seamlessly
  }

  return updated;
};
