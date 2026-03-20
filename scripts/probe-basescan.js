async function check() {
  const address = '0x0693C21936f293817593C8a2D794B2e730e41C7a';
  const url = `https://api.basescan.org/api?module=account&action=tokentx&address=${address}&sort=desc`;
  const res = await fetch(url);
  const json = await res.json();
  console.log(json.status, json.message);
  if (json.result && json.result.length > 0) {
    console.log(json.result[0].hash, json.result[0].value);
  } else {
    console.log("No txs found or error");
  }
}
check();
