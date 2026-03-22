const { Connection, PublicKey } = require('@solana/web3.js');
const anchor = require('@coral-xyz/anchor');

const IDL = {
  version: "0.1.0",
  name: "solana_russian_roulette",
  instructions: [],
  accounts: [
    {
      name: "Game",
      type: {
        kind: "struct",
        fields: [
          { name: "roomId", type: "u8" },
          { name: "entryFee", type: "u64" },
          { name: "players", type: { array: ["publicKey", 3] } },
          { name: "eliminated", type: { array: ["bool", 3] } },
          { name: "playerCount", type: "u8" },
          { name: "currentTurn", type: "u8" },
          { name: "bulletsRemaining", type: "u8" },
          { name: "state", type: { defined: "GameState" } },
          { name: "potAmount", type: "u64" },
          { name: "lastActivityTime", type: "i64" },
          { name: "bump", type: "u8" }
        ]
      }
    }
  ],
  types: [
    {
      name: "GameState",
      type: {
        kind: "enum",
        variants: [
          { name: "Waiting" },
          { name: "ResolvingShot" }
        ]
      }
    }
  ]
};

const PROGRAM_ID = "88DPR42LhZwDC3SfJR2xwszbs7rm547JK18WC2Vsc8zd";

async function main() {
  const conn = new Connection('https://api.devnet.solana.com', 'confirmed');
  const roomId = 1;
  const programId = new PublicKey(PROGRAM_ID);
  const [gamePda] = PublicKey.findProgramAddressSync(
    [Buffer.from('room'), Buffer.from([roomId])],
    programId
  );

  console.log('Game PDA:', gamePda.toString());
  const info = await conn.getAccountInfo(gamePda);
  if (!info) {
    console.log('No game state found for room', roomId);
    return;
  }

  const coder = new anchor.BorshAccountsCoder(IDL);
  const decoded = coder.decode('Game', info.data);
  const output = JSON.stringify(decoded, (key, value) =>
    typeof value === 'bigint' ? value.toString() : value, 2);
  console.log('Decoded State:', output);
  require('fs').writeFileSync('state_output.json', output);
}

main().catch(console.error);
