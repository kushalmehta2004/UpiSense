const { parseTransaction } = require('./regexTemplates.js');

const testMessages = [
  {
    name: 'Google Pay - Simple',
    text: `Rs. 500 paid to Zomato via GPay on 21-Feb-2026 at 7:45 PM. UPI Ref: 321098765432.`
  },
  {
    name: 'PhonePe - Amount with Comma',
    text: `Payment of Rs.1,250 to Swiggy is successful. Your unique Transaction Reference is: 109876543210.`
  },
  {
    name: 'Paytm - P2P',
    text: `You have paid Rs.1500 to Rajesh Kumar via UPI. UPI Ref: 210987654321.`
  },
  {
    name: 'HDFC Bank',
    text: `HDFC Bank: Rs 2000 debited from your Account ending X5678. Beneficiary: Google@OKHDFCBANK. Reference: 123456789.`
  },
  {
    name: 'SBI Bank',
    text: `A/C X4567 debited by Rs 300 on 21-FEB for trf to upi.sender@sbi by Phone Banking. Ref No 987654321.`
  },
  {
    name: 'Amazon Pay',
    text: `Rs.5,999 paid to Amazon via UPI on 21 Feb. Ref: 456789012345.`
  },
  {
    name: 'Ola Cabs',
    text: `Payment of Rs.125 to Ola Cabs is successful. Ref: 678901234567.`
  },
  {
    name: 'Electricity Bill',
    text: `Rs. 2,450 paid to BESCOM via UPI. Ref: 234567890123.`
  },
  {
    name: 'Invalid - No Amount',
    text: `Payment successful to Merchant ABC. Ref: 111222333.`
  },
  {
    name: 'Decimal Amount',
    text: `Rs. 99.99 paid to Netflix via UPI. Ref: 555666777.`
  }
];

console.log('🧪 Testing Regex Parser\n');
console.log('═'.repeat(80));

let passed = 0;
let failed = 0;

testMessages.forEach((test, idx) => {
  console.log(`\n[${idx + 1}/${testMessages.length}] ${test.name}`);
  console.log('-'.repeat(80));
  console.log(`Input: "${test.text.substring(0, 60)}..."`);

  const result = parseTransaction(test.text);

  if (result) {
    console.log(`✅ PARSED:`);
    console.log(`   Amount: ₹${result.amount}`);
    console.log(`   Merchant/UPI: ${result.merchant || result.upi_id}`);
    console.log(`   Ref: ${result.ref}`);
    console.log(`   App: ${result.source_app}`);
    console.log(`   Confidence: ${(result.confidence * 100).toFixed(0)}%`);
    passed++;
  } else {
    console.log(`❌ NOT PARSED`);
    failed++;
  }
});

console.log('\n' + '═'.repeat(80));
console.log(`\n📊 Results:`);
console.log(`   ✅ Passed: ${passed}/${testMessages.length}`);
console.log(`   ❌ Failed: ${failed}/${testMessages.length}`);
console.log(`   📈 Success Rate: ${((passed / testMessages.length) * 100).toFixed(1)}%\n`);

if (passed / testMessages.length >= 0.8) {
  console.log('✨ Parser ready for production!');
} else {
  console.log('⚠️  Parser needs more regex patterns');
}
