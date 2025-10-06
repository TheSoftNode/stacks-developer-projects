export function abbreviateAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.substring(0, 5)}...${address.substring(address.length - 4)}`;
}

export function abbreviateTxnId(txnId: string): string {
  if (!txnId || txnId.length < 10) return txnId;
  return `${txnId.substring(0, 5)}...${txnId.substring(txnId.length - 4)}`;
}

export function formatNumber(num: number, decimals: number = 2): string {
  // Convert from smallest units (6 decimals for our tokens) to human-readable
  const humanReadable = num / 1_000_000; // Adjust for 6 decimal places

  if (humanReadable >= 1_000_000_000) {
    return `${(humanReadable / 1_000_000_000).toFixed(decimals)}B`;
  }
  if (humanReadable >= 1_000_000) {
    return `${(humanReadable / 1_000_000).toFixed(decimals)}M`;
  }
  if (humanReadable >= 1_000) {
    return `${(humanReadable / 1_000).toFixed(decimals)}K`;
  }
  return humanReadable.toFixed(decimals);
}

export function formatCurrency(num: number, currency: string = "STX"): string {
  return `${formatNumber(num)} ${currency}`;
}

export function formatPercentage(num: number, decimals: number = 2): string {
  return `${num.toFixed(decimals)}%`;
}

export function copyToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

export function getExplorerUrl(type: "address" | "tx", value: string, network: "testnet" | "mainnet" = "testnet"): string {
  const baseUrl = network === "mainnet" 
    ? "https://explorer.hiro.so" 
    : "https://explorer.hiro.so";
  
  return type === "tx" 
    ? `${baseUrl}/txid/${value}?chain=${network}`
    : `${baseUrl}/address/${value}?chain=${network}`;
}

export function calculatePriceRatio(balance0: number, balance1: number): number {
  if (balance1 === 0) return 0;
  return balance0 / balance1;
}

export function calculateSharePercentage(userLiquidity: number, totalLiquidity: number): number {
  if (totalLiquidity === 0) return 0;
  return (userLiquidity / totalLiquidity) * 100;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
