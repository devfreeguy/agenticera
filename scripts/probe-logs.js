async function check() {
  const url = "https://mainnet.base.org";
  const address = '0x0693C21936f293817593C8a2D794B2e730e41C7a';
  const USDT_CONTRACT_ADDRESS = "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2";
  const topic2 = "0x" + address.toLowerCase().replace("0x", "").padStart(64, "0");
  const topic0 = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";

  // Get latest block
  let res = await fetch(url, {
    method: "POST",
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] })
  });
  let json = await res.json();
  const latestBlock = parseInt(json.result, 16);
  const fromBlockHex = "0x" + (latestBlock - 1000).toString(16);

  res = await fetch(url, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0", id: 2, method: "eth_getLogs",
      params: [{
        fromBlock: fromBlockHex, toBlock: "latest",
        address: USDT_CONTRACT_ADDRESS,
        topics: [topic0, null, topic2]
      }]
    })
  });
  json = await res.json();
  console.log("Logs:", json.result ? json.result.length : json);
}
check();
