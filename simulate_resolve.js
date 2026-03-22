const { Connection, PublicKey, Keypair, Transaction } = require('@solana/web3.js');
const anchor = require('@coral-xyz/anchor');

const IDL = {
  "version": "0.1.0",
  "name": "solana_russian_roulette",
  "instructions": [
    {
      "name": "resolveGame",
      "accounts": [
        { "name": "game", "isMut": true, "isSigner": false },
        { "name": "crank", "isMut": true, "isSigner": true }
      ],
      "args": [
        { "name": "roomId", "type": "u8" }
      ]
    }
  ]
};

const PROGRAM_ID = "88DPR42LhZwDC3SfJR2xwszbs7rm547JK18WC2Vsc8zd";
const TREASURY_PUBKEY = "FC2km6B1ub8fBf4FdLFs1hbJjmLx6EJbdAzN9Ajnb8nt";

async function main() {
  const conn = new Connection('https://api.devnet.solana.com', 'confirmed');
  const roomId = 1;
  const programId = new PublicKey(PROGRAM_ID);
  const [gamePda] = PublicKey.findProgramAddressSync(
    [Buffer.from('room'), Buffer.from([roomId])],
    programId
  );

  // Get current state to get players
  const info = await conn.getAccountInfo(gamePda);
  if (!info) {
    console.log('No game found');
    return;
  }

  // Use a dummy keypair for simulation (we just need a signer if we want to simulate properly, 
  // but for simulation we can use any key if we set feePayer)
  // Actually, let's use the real crank key from kp.json to be sure
  const kpJson = require('./kp.json');
  const crankKeypair = Keypair.fromSecretKey(Uint8Array.from(kpJson.priv));

  // We need to decode the state to get players
  const GameIDL = {
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
    types: [{ name: "GameState", type: { kind: "enum", variants: [{ name: "Waiting" }, { name: "ResolvingShot" }] } }]
  };
  const coder = new anchor.BorshAccountsCoder(GameIDL);
  const decoded = coder.decode('Game', info.data);

  const currentPlayers = decoded.players.filter(p => p.toString() !== '11111111111111111111111111111111');
  console.log('Players found:', currentPlayers.map(p => p.toString()));

  const program = new anchor.Program(IDL, programId, { connection: conn });
  
  const tx = await program.methods.resolveGame(roomId)
    .accounts({
      game: gamePda,
      crank: crankKeypair.publicKey,
    })
    .remainingAccounts([
      ...currentPlayers.map(p => ({ pubkey: p, isWritable: true, isSigner: false })),
      { pubkey: new PublicKey(TREASURY_PUBKEY), isWritable: true, isSigner: false },
    ])
    .transaction();

  tx.feePayer = crankKeypair.publicKey;
  tx.recentBlockhash = (await conn.getLatestBlockhash()).blockhash;

  console.log('Simulating transaction...');
  const sim = await conn.simulateTransaction(tx, [crankKeypair]);
  
  if (sim.value.err) {
    console.error('Simulation FAILED:', JSON.stringify(sim.value.err, null, 2));
    console.error('Logs:', sim.value.logs);
    require('fs').writeFileSync('sim_logs.json', JSON.stringify({ err: sim.value.err, logs: sim.value.logs }, null, 2));
  } else {
    console.log('Simulation SUCCESS');
    console.log('Logs:', sim.value.logs);
    require('fs').writeFileSync('sim_logs.json', JSON.stringify({ success: true, logs: sim.value.logs }, null, 2));
  }
}

main().catch(console.error);
