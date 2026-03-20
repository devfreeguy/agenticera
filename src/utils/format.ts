import { USDT_SYMBOL } from "@/constants/contracts";

export function formatUsdt(amount: string | number): string {
  const n = Number(amount);
  if (n !== 0 && Math.abs(n) < 0.01) {
    return `${n.toFixed(4)} ${USDT_SYMBOL}`;
  }
  const formatted = n.toFixed(2);
  if (formatted === "0.00" || formatted === "-0.00") {
    return `<0.01 ${USDT_SYMBOL}`;
  }
  return `${formatted} ${USDT_SYMBOL}`;
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTxHash(hash: string): string {
  return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
}

export function getExplorerTxUrl(hash: string): string {
  return `https://basescan.org/tx/${hash}`;
}
 
export function getExplorerAddressUrl(address: string): string {
  return `https://basescan.org/address/${address}`;
}

export function formatRelativeTime(date: Date | string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);

  if (seconds < 60) return `${seconds} sec${seconds !== 1 ? "s" : ""} ago`;
  if (minutes < 60) return `${minutes} min${minutes !== 1 ? "s" : ""} ago`;
  if (hours < 24) return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  if (days < 7) return `${days} day${days !== 1 ? "s" : ""} ago`;
  if (weeks < 5) return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
  if (months < 12) return `${months} month${months !== 1 ? "s" : ""} ago`;
  return `${years} year${years !== 1 ? "s" : ""} ago`;
}
