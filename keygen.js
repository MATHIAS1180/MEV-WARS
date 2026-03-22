const { Keypair } = require('@solana/web3.js');
const kp = Keypair.generate();
console.log('PUBLIC_KEY:', kp.publicKey.toBase58());
console.log('PRIVATE_KEY_ARRAY:', JSON.stringify(Array.from(kp.secretKey)));
