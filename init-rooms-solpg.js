// Script to initialize the 3 game rooms
// Copy-paste this in Solana Playground "Test" tab

// Room 1: 0.01 SOL
const [gamePda101] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("room"), Buffer.from([101])],
  pg.program.programId
);

try {
  await pg.program.methods
    .initializeGame(101, new anchor.BN(0.01 * 1e9))
    .accounts({
      game: gamePda101,
      authority: pg.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();
  console.log("✅ Room 101 (0.01 SOL) initialized");
} catch (e) {
  console.log("⚠️ Room 101:", e.message);
}

// Room 2: 0.1 SOL
const [gamePda102] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("room"), Buffer.from([102])],
  pg.program.programId
);

try {
  await pg.program.methods
    .initializeGame(102, new anchor.BN(0.1 * 1e9))
    .accounts({
      game: gamePda102,
      authority: pg.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();
  console.log("✅ Room 102 (0.1 SOL) initialized");
} catch (e) {
  console.log("⚠️ Room 102:", e.message);
}

// Room 3: 1.0 SOL
const [gamePda103] = anchor.web3.PublicKey.findProgramAddressSync(
  [Buffer.from("room"), Buffer.from([103])],
  pg.program.programId
);

try {
  await pg.program.methods
    .initializeGame(103, new anchor.BN(1.0 * 1e9))
    .accounts({
      game: gamePda103,
      authority: pg.wallet.publicKey,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();
  console.log("✅ Room 103 (1.0 SOL) initialized");
} catch (e) {
  console.log("⚠️ Room 103:", e.message);
}

console.log("\n🎉 All rooms initialized!");
console.log("Program ID:", pg.program.programId.toBase58());
