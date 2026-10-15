export type DisputeStatus =
  "submitted" | "under_review" | "investigating" | "approved" | "rejected";

export type DisputeCategory =
  "missing_attribution" | "incorrect_commission" | "uncredited_sale" | "delayed_clearing" | "other";

export interface DisputeReport {
  id: string;
  campaignId: number;
  campaignName: string;
  orderReference: string;
  referralLinkUsed: string;
  estimatedSaleAmountXlm: number;
  expectedCommissionXlm: number;
  category: DisputeCategory;
  description: string;
  attachmentName?: string;
  attachmentSize?: string;
  attachmentPreview?: string; // data URL
  status: DisputeStatus;
  submittedAt: string;
  updatedAt: string;
  advertiserResponse?: string;
}

// Initial in-memory mock store for submitted dispute reports
let disputesStore: DisputeReport[] = [
  {
    id: "DSP-1042",
    campaignId: 1,
    campaignName: "Tech Gadgets Pro",
    orderReference: "ORD-98432-TG",
    referralLinkUsed: "https://stormsale.xyz/c/1?ref=GBBD5678",
    estimatedSaleAmountXlm: 350.0,
    expectedCommissionXlm: 35.0,
    category: "missing_attribution",
    description:
      "Customer completed purchase via my referral link on 10/12/2026. The order confirmation shows my affiliate tag but the commission did not log on-chain.",
    attachmentName: "customer_checkout_confirmation.png",
    attachmentSize: "245 KB",
    status: "under_review",
    submittedAt: "10/13/2026, 02:40 PM",
    updatedAt: "10/14/2026, 09:15 AM",
    advertiserResponse: "Reviewing order logs in Shopify integration webhook.",
  },
  {
    id: "DSP-1038",
    campaignId: 2,
    campaignName: "Web3 Masterclass 2026",
    orderReference: "TX-77821-W3",
    referralLinkUsed: "https://stormsale.xyz/c/2?ref=GBBD5678",
    estimatedSaleAmountXlm: 200.0,
    expectedCommissionXlm: 20.0,
    category: "uncredited_sale",
    description:
      "Course enrollment confirmed by customer via Telegram. Attribution missing from sale ledger.",
    attachmentName: "telegram_payment_receipt.jpg",
    attachmentSize: "180 KB",
    status: "approved",
    submittedAt: "10/10/2026, 11:20 AM",
    updatedAt: "10/11/2026, 04:30 PM",
    advertiserResponse:
      "Attribution verified via customer cookie match. 20 XLM credited to claimable escrow.",
  },
];

export const fetchDisputes = async (): Promise<DisputeReport[]> => {
  return [...disputesStore];
};

export const submitDisputeReport = async (
  report: Omit<DisputeReport, "id" | "status" | "submittedAt" | "updatedAt">,
): Promise<DisputeReport> => {
  const id = `DSP-${Math.floor(1000 + Math.random() * 9000)}`;
  const now = new Date().toLocaleString();

  const newReport: DisputeReport = {
    ...report,
    id,
    status: "submitted",
    submittedAt: now,
    updatedAt: now,
  };

  disputesStore = [newReport, ...disputesStore];
  return newReport;
};

export const getDisputeStatusLabel = (status: DisputeStatus): string => {
  switch (status) {
    case "submitted":
      return "Submitted";
    case "under_review":
      return "Under Review";
    case "investigating":
      return "Investigating";
    case "approved":
      return "Approved & Credited";
    case "rejected":
      return "Rejected";
  }
};
