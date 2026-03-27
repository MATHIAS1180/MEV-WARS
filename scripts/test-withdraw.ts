#!/usr/bin/env tsx

/**
 * Test script for admin withdrawal endpoint
 * Usage: npm run test:withdraw
 */

import fetch from 'node-fetch';

const ADMIN_SECRET = process.env.ADMIN_SECRET || 'test-admin-secret';
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const NEXT_PUBLIC_RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://api.devnet.solana.com';

async function testWithdraw() {
  if (!ADMIN_PRIVATE_KEY) {
    console.error('❌ ADMIN_PRIVATE_KEY environment variable is required');
    process.exit(1);
  }

  console.log('🧪 Testing admin withdrawal endpoint...');
  console.log('📡 RPC URL:', NEXT_PUBLIC_RPC_URL);

  try {
    // Test withdrawal of 0.01 SOL (10^7 lamports)
    const response = await fetch('http://localhost:3000/api/admin/withdraw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_SECRET}`,
      },
      body: JSON.stringify({
        amount: 10000000, // 0.01 SOL in lamports
        recipientAddress: '11111111111111111111111111111112', // System Program as test recipient
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Withdrawal successful!');
      console.log('📄 Transaction:', result.transaction);
      console.log('💰 Amount:', result.amount / 1e9, 'SOL');
      console.log('🏦 Treasury Balance After:', result.treasuryBalance / 1e9, 'SOL');
    } else {
      console.error('❌ Withdrawal failed:', result.error);
      if (result.details) {
        console.error('📋 Details:', result.details);
      }
    }
  } catch (error) {
    console.error('❌ Network error:', error instanceof Error ? error.message : String(error));
  }
}

// Run the test
testWithdraw().catch(console.error);