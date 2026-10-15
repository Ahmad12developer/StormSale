import { describe, it, expect } from "vitest";
import { getStellarExplorerLink } from "../utils/network";
import { type SaleRecord } from "../components/affiliate/SalesList";

describe("Auditable Payout & History Ledger Suite (#51)", () => {
  const mockLedger: SaleRecord[] = [
    {
      id: 101,
      campaignId: 1,
      campaignName: "Tech Gadgets Pro",
      campaignAddress: "CA7QW5KXGPTR4N2K9J2M7V4...",
      affiliate: "GBBD5678WXYZ...",
      saleAmount: "100.0",
      commissionAmount: "10.0",
      timestamp: 1728900000,
      status: "claimed",
      txHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      ledgerSequence: 5184920,
      memo: "StormSale-Commission-#101",
      feeXlm: "0.00001",
    },
    {
      id: 102,
      campaignId: 2,
      campaignName: "Web3 Masterclass 2026",
      campaignAddress: "CB4RN8XJLP8M1K3V6P7N2T8...",
      affiliate: "GBBD5678WXYZ...",
      saleAmount: "250.0",
      commissionAmount: "25.0",
      timestamp: 1728640800,
      status: "claimed",
      txHash: "8a6b12f45c9284d72856a9082cb348d2b295e4d94b08faec2389dc42a8b92d6e",
      ledgerSequence: 5182104,
      memo: "StormSale-Commission-#102",
      feeXlm: "0.00001",
    },
    {
      id: 103,
      campaignId: 3,
      campaignName: "Crypto Security Hardware",
      campaignAddress: "CC9LK4PXMQ1V5R8B6N3T4W1...",
      affiliate: "GBBD5678WXYZ...",
      saleAmount: "450.0",
      commissionAmount: "45.0",
      timestamp: 1728295200,
      status: "claimed",
      txHash: "3f9821a9c372e90b8417c469b4e1837920ab4d9528d84172f8a846102f9e54a1",
      ledgerSequence: 5179044,
      memo: "StormSale-Commission-#103",
      feeXlm: "0.00001",
    },
    {
      id: 104,
      campaignId: 4,
      campaignName: "DeFi Yield Aggregator",
      campaignAddress: "CD2MJ8VYNP9K3T5B7W1L6R4...",
      affiliate: "GBBD5678WXYZ...",
      saleAmount: "800.0",
      commissionAmount: "80.0",
      timestamp: 1728986400,
      status: "pending",
      ledgerSequence: 5187110,
    },
    {
      id: 105,
      campaignId: 1,
      campaignName: "Tech Gadgets Pro",
      campaignAddress: "CA7QW5KXGPTR4N2K9J2M7V4...",
      affiliate: "GBBD5678WXYZ...",
      saleAmount: "150.0",
      commissionAmount: "15.0",
      timestamp: 1729018800,
      status: "processing",
      txHash: "f145c229987a02b489d8134bb8839217cae981274092b34914a821eef01492b4",
      ledgerSequence: 5188402,
      memo: "StormSale-Commission-#105",
      feeXlm: "0.00001",
    },
  ];

  it("filters ledger records by status", () => {
    const claimed = mockLedger.filter((s) => s.status === "claimed");
    expect(claimed.length).toBe(3);

    const pending = mockLedger.filter((s) => s.status === "pending");
    expect(pending.length).toBe(1);

    const processing = mockLedger.filter((s) => s.status === "processing");
    expect(processing.length).toBe(1);
  });

  it("searches ledger by sale ID, campaign name, or transaction hash", () => {
    // Search by ID
    const searchById = mockLedger.filter((s) => s.id.toString().includes("102"));
    expect(searchById.length).toBe(1);
    expect(searchById[0].campaignName).toBe("Web3 Masterclass 2026");

    // Search by Campaign name substring
    const searchByCampaign = mockLedger.filter((s) =>
      s.campaignName.toLowerCase().includes("tech gadgets"),
    );
    expect(searchByCampaign.length).toBe(2);

    // Search by TxHash prefix
    const searchByTx = mockLedger.filter((s) => s.txHash && s.txHash.startsWith("e3b0c442"));
    expect(searchByTx.length).toBe(1);
    expect(searchByTx[0].id).toBe(101);
  });

  it("sorts ledger entries by timestamp or commission amount", () => {
    const sortedByCommissionDesc = [...mockLedger].sort(
      (a, b) => parseFloat(b.commissionAmount) - parseFloat(a.commissionAmount),
    );
    expect(sortedByCommissionDesc[0].id).toBe(104); // 80.0 XLM
    expect(sortedByCommissionDesc[1].id).toBe(103); // 45.0 XLM
    expect(sortedByCommissionDesc[sortedByCommissionDesc.length - 1].id).toBe(101); // 10.0 XLM
  });

  it("generates correct Stellar Expert block explorer transaction links", () => {
    const txHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    const explorerUrl = getStellarExplorerLink("tx", txHash);

    expect(explorerUrl).toBe(`https://stellar.expert/explorer/testnet/tx/${txHash}`);
    expect(explorerUrl.startsWith("https://stellar.expert/explorer/testnet/")).toBe(true);
  });

  it("verifies all claimed sales have valid transaction receipts and ledger sequences", () => {
    const claimedSales = mockLedger.filter((s) => s.status === "claimed");

    claimedSales.forEach((sale) => {
      expect(sale.txHash).toBeDefined();
      expect(sale.txHash?.length).toBe(64); // SHA-256 64-hex char
      expect(sale.ledgerSequence).toBeGreaterThan(5000000);
      expect(sale.feeXlm).toBe("0.00001");
      expect(sale.memo).toContain(`StormSale-Commission-#${sale.id}`);
    });
  });
});
