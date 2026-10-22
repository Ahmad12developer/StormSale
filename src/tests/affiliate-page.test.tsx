// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { Affiliate } from "../pages/Affiliate";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock("../components/affiliate/TelegramCampaignBrowser", () => ({
  TelegramCampaignBrowser: () => <div data-testid="telegram-browser-content">Telegram Campaigns Content</div>,
}));
vi.mock("../components/affiliate/JoinCampaignButton", () => ({
  JoinCampaignButton: () => <div data-testid="join-campaign-content">Join Campaign Content</div>,
}));
vi.mock("../components/affiliate/SalesList", () => ({
  SalesList: () => <div data-testid="sales-list-content">Sales List Content</div>,
}));
vi.mock("../components/affiliate/ClaimPayouts", () => ({
  ClaimPayouts: () => <div data-testid="claim-payouts-content">Claim Payouts Content</div>,
}));
vi.mock("../components/affiliate/AffiliateSettings", () => ({
  AffiliateSettings: () => <div data-testid="affiliate-settings-content">Affiliate Settings Content</div>,
}));
vi.mock("../components/affiliate/AffiliateOverview", () => ({
  AffiliateOverview: () => <div data-testid="affiliate-overview-content">Affiliate Overview Content</div>,
}));
vi.mock("../components/shared/ThemeToggle", () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">Theme Toggle</button>,
}));
vi.mock("../components/shared/Sidebar", () => ({
  Sidebar: ({ onTabChange, activeTab, onBack }: any) => (
    <nav data-testid="mock-sidebar">
      <span data-testid="active-tab">{activeTab}</span>
      <button onClick={() => onTabChange("overview")}>Nav Overview</button>
      <button onClick={() => onTabChange("telegram-browser")}>Nav Telegram</button>
      <button onClick={() => onTabChange("join-campaign")}>Nav Join</button>
      <button onClick={() => onTabChange("my-sales")}>Nav Sales</button>
      <button onClick={() => onTabChange("claim-payouts")}>Nav Claim</button>
      <button onClick={() => onTabChange("settings")}>Nav Settings</button>
      <button onClick={() => onTabChange("security")}>Nav Security</button>
      <button onClick={() => onTabChange("invalid-tab-xyz")}>Nav Invalid</button>
      <button onClick={onBack}>Nav Back</button>
    </nav>
  ),
}));

describe("Affiliate Page Component Suite (#51, #55, #95)", () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, "", "/affiliate");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders with default overview tab and switches content via sidebar navigation", () => {
    const handleBack = vi.fn();
    render(<Affiliate onBack={handleBack} />);

    // Default overview
    expect(screen.getByTestId("affiliate-overview-content")).toBeTruthy();

    // Navigate to Sales
    fireEvent.click(screen.getByText("Nav Sales"));
    expect(screen.getByTestId("sales-list-content")).toBeTruthy();

    // Navigate to Telegram
    fireEvent.click(screen.getByText("Nav Telegram"));
    expect(screen.getByTestId("telegram-browser-content")).toBeTruthy();

    // Navigate to Join
    fireEvent.click(screen.getByText("Nav Join"));
    expect(screen.getByTestId("join-campaign-content")).toBeTruthy();

    // Navigate to Claim
    fireEvent.click(screen.getByText("Nav Claim"));
    expect(screen.getByTestId("claim-payouts-content")).toBeTruthy();

    // Navigate to Settings
    fireEvent.click(screen.getByText("Nav Settings"));
    expect(screen.getByTestId("affiliate-settings-content")).toBeTruthy();

    // Navigate to invalid tab falls back to overview
    fireEvent.click(screen.getByText("Nav Invalid"));
    expect(screen.getByTestId("affiliate-overview-content")).toBeTruthy();

    // Trigger back button
    fireEvent.click(screen.getByText("Nav Back"));
    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it("navigates to settings via header Preferences button", () => {
    render(<Affiliate onBack={() => {}} />);
    const prefBtn = screen.getByLabelText("Preferences");
    fireEvent.click(prefBtn);
    expect(screen.getByTestId("affiliate-settings-content")).toBeTruthy();
  });

  it("synchronizes tab state with URL query parameters and responds to popstate events", () => {
    window.history.pushState({}, "", "/affiliate?tab=my-sales");
    render(<Affiliate onBack={() => {}} />);

    expect(screen.getByTestId("sales-list-content")).toBeTruthy();

    // Dispatch popstate event with a new query parameter
    act(() => {
      window.history.pushState({}, "", "/affiliate?tab=claim-payouts");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });

    expect(screen.getByTestId("claim-payouts-content")).toBeTruthy();
  });
});
