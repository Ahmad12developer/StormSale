import { describe, it, expect } from "vitest";
import {
  fetchDisputes,
  submitDisputeReport,
  getDisputeStatusLabel,
  validateDisputeAttachment,
  validateDisputeSaleAmount,
  MAX_ATTACHMENT_SIZE_BYTES,
  type DisputeReport,
  type DisputeCategory,
  type DisputeStatus,
} from "../utils/disputes";

describe("Issue Reporting & Dispute Protocol Suite (#55)", () => {
  it("fetches the list of initial mock dispute reports", async () => {
    const disputes = await fetchDisputes();
    expect(Array.isArray(disputes)).toBe(true);
    expect(disputes.length).toBeGreaterThanOrEqual(2);

    const first = disputes[0];
    expect(first).toHaveProperty("id");
    expect(first).toHaveProperty("campaignId");
    expect(first).toHaveProperty("campaignName");
    expect(first).toHaveProperty("orderReference");
    expect(first).toHaveProperty("status");
    expect(first).toHaveProperty("category");
  });

  it("submits a new standardized dispute report with calculated expected commission", async () => {
    const initialDisputes = await fetchDisputes();
    const initialCount = initialDisputes.length;

    const payload: Omit<DisputeReport, "id" | "status" | "submittedAt" | "updatedAt"> = {
      campaignId: 3,
      campaignName: "Crypto Security Hardware",
      orderReference: "ORD-TEST-9921",
      referralLinkUsed: "https://stormsale.xyz/c/3?ref=GBBD5678",
      estimatedSaleAmountXlm: 450.0,
      expectedCommissionXlm: 45.0,
      category: "missing_attribution" as DisputeCategory,
      description: "Customer ordered Ledger Nano X with referral coupon but sale was not recorded.",
      attachmentName: "receipt_screenshot.png",
      attachmentSize: "320 KB",
      attachmentPreview:
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    };

    const created = await submitDisputeReport(payload);

    expect(created.id.startsWith("DSP-")).toBe(true);
    expect(created.status).toBe("submitted");
    expect(created.orderReference).toBe("ORD-TEST-9921");
    expect(created.estimatedSaleAmountXlm).toBe(450.0);
    expect(created.expectedCommissionXlm).toBe(45.0);
    expect(created.submittedAt).toBeDefined();
    expect(created.attachmentName).toBe("receipt_screenshot.png");

    const updatedDisputes = await fetchDisputes();
    expect(updatedDisputes.length).toBe(initialCount + 1);
    expect(updatedDisputes[0].id).toBe(created.id);
  });

  it("maps dispute statuses to human-readable progress labels", () => {
    const statuses: DisputeStatus[] = [
      "submitted",
      "under_review",
      "investigating",
      "approved",
      "rejected",
    ];

    const expectedLabels = [
      "Submitted",
      "Under Review",
      "Investigating",
      "Approved & Credited",
      "Rejected",
    ];

    statuses.forEach((status, idx) => {
      expect(getDisputeStatusLabel(status)).toBe(expectedLabels[idx]);
    });
  });

  it("validates file attachment size constraint using exported validateDisputeAttachment", () => {
    const validFileSize = 2.4 * 1024 * 1024;
    const oversizedFileSize = 6.2 * 1024 * 1024;

    const validResult = validateDisputeAttachment(validFileSize);
    expect(validResult.valid).toBe(true);
    expect(validResult.error).toBeUndefined();

    const oversizedResult = validateDisputeAttachment(oversizedFileSize);
    expect(oversizedResult.valid).toBe(false);
    expect(oversizedResult.error).toContain("5MB");

    expect(MAX_ATTACHMENT_SIZE_BYTES).toBe(5 * 1024 * 1024);
  });

  it("validates sale amount correctly and rejects invalid/negative values", () => {
    expect(validateDisputeSaleAmount("150.5").valid).toBe(true);
    expect(validateDisputeSaleAmount("150.5").value).toBe(150.5);

    expect(validateDisputeSaleAmount("0").valid).toBe(false);
    expect(validateDisputeSaleAmount("-50").valid).toBe(false);
    expect(validateDisputeSaleAmount("invalid").valid).toBe(false);
    expect(validateDisputeSaleAmount("").valid).toBe(false);
  });
});
