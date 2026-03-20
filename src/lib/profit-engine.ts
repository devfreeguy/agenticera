export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export function getRiskLevel(margin: number): RiskLevel {
  if (margin > 40) return "LOW";
  if (margin > 20) return "MEDIUM";
  return "HIGH";
}

type ProfitInput = {
  jobPrice: number;
  estimatedCost: number;
  minMargin?: number; // %
  platformFee?: number; // %
};

type ProfitResult = {
  profit: number;
  margin: number;
  riskLevel: RiskLevel;
  isProfitable: boolean;
  reason?: string;
};

export function evaluateProfit({
  jobPrice,
  estimatedCost,
  minMargin = 20,
  platformFee = 5,
}: ProfitInput): ProfitResult {
  const feeAmount = (platformFee / 100) * jobPrice;
  const totalCost = estimatedCost + feeAmount;
  const profit = jobPrice - totalCost;
  const margin = (profit / jobPrice) * 100;
  const riskLevel = getRiskLevel(margin);

  if (jobPrice <= 0) {
    return {
      profit: 0,
      margin: 0,
      riskLevel: "HIGH",
      isProfitable: false,
      reason: "Invalid job price",
    };
  }

  if (estimatedCost < 0) {
    return {
      profit: 0,
      margin: 0,
      riskLevel: "HIGH",
      isProfitable: false,
      reason: "Invalid estimated cost",
    };
  }

  if (profit <= 0) {
    return {
      profit,
      margin,
      riskLevel: "HIGH",
      isProfitable: false,
      reason: "No profit",
    };
  }

  if (margin < minMargin) {
    return {
      profit,
      margin,
      riskLevel: "HIGH",
      isProfitable: false,
      reason: `Margin too low (${margin.toFixed(2)}%)`,
    };
  }

  return {
    profit,
    margin,
    riskLevel,
    isProfitable: true,
  };
}