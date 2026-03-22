const { Connection, PublicKey } = require('@solana/web3.js');

async function main() {
  const conn = new Connection('https://api.devnet.solana.com');
  const programId = new PublicKey('88DPR42LhZwDC3SfJR2xwszbs7rm547JK18WC2Vsc8zd');
  const info = await conn.getAccountInfo(programId);
  if (info) {
    console.log('Program 4Qoom... EXISTS. Executable:', info.executable);
  } else {
    console.log('Program 4Qoom... DOES NOT EXIST.');
  }
}
main().catch(console.error);
