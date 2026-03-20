const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

const chains = [
  'base-mainnet', 'base_mainnet', 'base', 'Base', 'base-sepolia', 'ethereum', 'eth', 'mainnet', 'polygon', 'arbitrum', 'optimism', 'tron', 'liquid', 'solana', 'avax'
];

async function check() {
  const apiKey = process.env.WDK_INDEXER_API_KEY;
  for (const chain of chains) {
    const url = `https://wdk-api.tether.io/api/v1/${chain}/usdt/0x0693C21936f293817593C8a2D794B2e730e41C7a/token-balances`;
    try {
      const res = await fetch(url, { headers: { 'x-api-key': apiKey } });
      const text = await res.text();
      console.log(`[${chain}] -> ${res.status} | ${text.substring(0, 100)}`);
    } catch(err) {
      console.log(`[${chain}] error -> ${err.message}`);
    }
  }
}
check();
