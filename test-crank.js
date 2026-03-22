// Test script pour vérifier que le crank fonctionne
// Usage: node test-crank.js

const VERCEL_URL = 'https://mev-wars-casino.vercel.app';
const ROOM_ID = 101;

async function testCrank() {
  console.log('🔍 Testing crank API...\n');
  
  try {
    const response = await fetch(`${VERCEL_URL}/api/crank`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId: ROOM_ID })
    });
    
    const data = await response.json();
    
    console.log('📊 Response status:', response.status);
    console.log('📦 Response data:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('\n✅ SUCCESS! Crank is working properly.');
      if (data.action === 'refund') {
        console.log('💰 Refund transaction:', data.signature);
      } else if (data.action === 'settle') {
        console.log('🎰 Settlement transaction:', data.signature);
      }
    } else {
      console.log('\n⚠️  Expected error (this is normal if no players in room)');
      if (data.error?.includes('CRANK_PRIVATE_KEY')) {
        console.log('❌ ERROR: CRANK_PRIVATE_KEY not configured on Vercel!');
        console.log('   Go to Vercel Dashboard → Settings → Environment Variables');
      } else if (data.error?.includes('Game is empty')) {
        console.log('✅ Crank is configured correctly (room is just empty)');
      } else if (data.error?.includes('Timer has not expired')) {
        console.log('✅ Crank is configured correctly (timer not expired yet)');
      }
    }
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
  }
}

testCrank();
