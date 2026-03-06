const { Connection, PublicKey } = require('@solana/web3.js');
async function run() {
  const c = new Connection("https://api.devnet.solana.com", "confirmed");
  console.log("Checking devnet...");
  try {
     const b = await c.getBalance(new PublicKey("SKRtoken111111111111111111111111111111111111"));
     console.log("Lamports:", b);
  } catch(e) {
     console.error(e);
  }
}
run();
