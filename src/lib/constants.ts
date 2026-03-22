export const APP_NAME = "PaySwift";
export const APP_TAGLINE = "Batch Payment Processing for Nigerian Businesses";
export const TRANSACTION_FEE_PERCENT = 0.3;
export const TRANSACTION_FEE_CAP_NAIRA = 1000;
export const CURRENCY = "NGN";
export const CURRENCY_SYMBOL = "₦";

export const formatNaira = (amount: number): string => {
  return `₦${amount.toLocaleString("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const calculateFee = (amount: number): number => {
  const fee = (TRANSACTION_FEE_PERCENT / 100) * amount;
  return Math.min(fee, TRANSACTION_FEE_CAP_NAIRA);
};
