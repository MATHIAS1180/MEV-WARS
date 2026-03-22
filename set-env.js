const { execSync } = require('child_process');
const val = '[181,10,198,8,109,110,248,1,225,159,136,137,13,169,37,129,190,190,64,3,89,180,193,166,84,125,1,116,4,13,45,151,238,199,231,123,46,48,43,14,90,232,200,223,205,245,152,95,60,214,27,115,71,48,78,29,145,183,22,27,6,46,213,50]';
try {
  // Try adding for all environments
  execSync(`npx vercel env add CRANK_PRIVATE_KEY production ${val}`);
  execSync(`npx vercel env add CRANK_PRIVATE_KEY preview ${val}`);
  execSync(`npx vercel env add CRANK_PRIVATE_KEY development ${val}`);
  console.log('SUCCESS');
} catch (e) {
  console.error('FAILED:', e.message);
}
