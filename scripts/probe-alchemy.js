const dotenv = require('dotenv');
dotenv.config({ path: '.env' });

async function check() {
  const url = process.env.BASE_RPC_URL;
  const address = '0x05a8789c7a96a8d2Ff0e6940F3f1976eFA7fd504';
  const USDT_CONTRACT_ADDRESS = "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2";

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "alchemy_getTokenBalances",
      params: [address, [USDT_CONTRACT_ADDRESS]]
    })
  });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
check();
