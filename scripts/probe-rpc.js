async function check() {
  const url = "https://mainnet.base.org";
  const address = '0x05a8789c7a96a8d2Ff0e6940F3f1976eFA7fd504';
  const USDT_CONTRACT_ADDRESS = "0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2";

  const addressParam = address.toLowerCase().replace("0x", "").padStart(64, "0");
  const data = "0x70a08231" + addressParam;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_call",
      params: [{ to: USDT_CONTRACT_ADDRESS, data: data }, "latest"]
    })
  });
  const json = await res.json();
  console.log("Raw RPC Result:", json);

  if (json.result && json.result !== '0x') {
    const balanceDecimals = BigInt(json.result);
    console.log("Balance:", (Number(balanceDecimals) / 10**6).toString(), "USDT");
  } else {
    console.log("Balance: 0 USDT");
  }
}
check();
