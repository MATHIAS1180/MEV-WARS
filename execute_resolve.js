const { Connection, PublicKey, Keypair } = require('@solana/web3.js');
const anchor = require('@coral-xyz/anchor');
const fs = require('fs');

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
        { "name": "_room_id", "type": "u8" }
      ]
    }
  ],
  "accounts": [
    {
      "name": "Game",
      "type": {
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
  "types": [
    {
      "name": "GameState",
      "type": {
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
const TREASURY_PUBKEY = "FC2km6B1ub8fBf4FdLFs1hbJjmLx6EJbdAzN9Ajnb8nt";

async function main() {
  const conn = new Connection('https://api.devnet.solana.com', 'confirmed');
  const programId = new PublicKey(PROGRAM_ID);
  const roomId = 1;

  const crankKeyData = [181,10,198,8,109,110,248,1,225,159,136,137,13,169,37,129,190,190,64,3,89,180,193,166,84,125,1,116,4,13,45,151,238,199,231,123,46,48,43,14,90,232,200,223,205,245,152,95,60,214,27,115,71,48,78,29,145,183,22,27,6,46,213,50];
  const crankKeypair = Keypair.fromSecretKey(Uint8Array.from(crankKeyData));

  const [gamePda] = PublicKey.findProgramAddressSync(
    [Buffer.from('room'), Buffer.from([roomId])],
    programId
  );
  console.log('Targeting PDA:', gamePda.toString());

  const info = await conn.getAccountInfo(gamePda);
  if (!info) {
    console.error('Account not found at', gamePda.toString());
    return;
  }
  
  const coder = new anchor.BorshAccountsCoder(IDL);
  const decoded = coder.decode('Game', info.data);
  console.log('On-chain state:', JSON.stringify(decoded.state));
  console.log('On-chain player count:', decoded.playerCount);
  
  const currentPlayers = decoded.players.filter(p => p.toString() !== '11111111111111111111111111111111');
  console.log('Players identified:', currentPlayers.map(p => p.toString()));

  const wallet = new anchor.Wallet(crankKeypair);
  const provider = new anchor.AnchorProvider(conn, wallet, { commitment: 'confirmed' });
  const program = new anchor.Program(IDL, programId, provider);
  
  console.log('Sending resolveGame to unstick room ' + roomId + ' on ' + PROGRAM_ID);
  try {
    const signature = await program.methods.resolveGame(roomId)
      .accounts({
        game: gamePda,
        crank: crankKeypair.publicKey,
      })
      .remainingAccounts([
        ...currentPlayers.map(p => ({ pubkey: p, isWritable: true, isSigner: false })),
        { pubkey: new PublicKey(TREASURY_PUBKEY), isWritable: true, isSigner: false },
      ])
      .signers([crankKeypair])
      .rpc();

    console.log('Transaction SUCCESS! Signature:', signature);
    const txInfo = await conn.getTransaction(signature, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 });
    const logs = txInfo?.meta?.logMessages || [];
    console.log('Logs:', logs.join('\n'));
    fs.writeFileSync('last_error.txt', 'SUCCESS: ' + signature + '\nLogs:\n' + logs.join('\n'));
  } catch (e) {
    let msg = 'Transaction FAILED\n';
    if (e.logs) {
      msg += 'Logs:\n' + e.logs.join('\n') + '\n';
    }
    if (e.error && e.error.errorMessage) {
      msg += 'Error Message: ' + e.error.errorMessage + '\n';
    }
    msg += 'Full Error: ' + e.toString() + '\n';
    console.error(msg);
    fs.writeFileSync('last_error.txt', msg);
  }
}

main().catch(console.error);
