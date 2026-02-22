require('dotenv').config();
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

// Mock WhatsApp message payloads (simulating real Meta webhook data)
const mockMessages = [
  {
    name: 'Google Pay UPI Payment',
    payload: {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '123456789',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '919876543210',
                  phone_number_id: '1234567890'
                },
                messages: [
                  {
                    from: '919876543210',
                    id: 'wamid.abc123',
                    timestamp: Math.floor(Date.now() / 1000),
                    type: 'text',
                    text: {
                      body: 'Rs. 500 paid to Zomato via GPay on 21-Feb-2026 at 7:45 PM. UPI Ref: 321098765432.'
                    }
                  }
                ]
              }
            }
          ]
        }
      ]
    }
  },
  {
    name: 'PhonePe Payment',
    payload: {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '123456789',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '919876543210',
                  phone_number_id: '1234567890'
                },
                messages: [
                  {
                    from: '919876543211',
                    id: 'wamid.def456',
                    timestamp: Math.floor(Date.now() / 1000),
                    type: 'text',
                    text: {
                      body: 'Payment of Rs.1,250 to Swiggy is successful. Your unique Transaction Reference is: 109876543210.'
                    }
                  }
                ]
              }
            }
          ]
        }
      ]
    }
  },
  {
    name: 'Paytm Payment',
    payload: {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '123456789',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '919876543210',
                  phone_number_id: '1234567890'
                },
                messages: [
                  {
                    from: '919876543212',
                    id: 'wamid.ghi789',
                    timestamp: Math.floor(Date.now() / 1000),
                    type: 'text',
                    text: {
                      body: 'You have paid Rs.1500 to Amazon via UPI. UPI Ref: 210987654321.'
                    }
                  }
                ]
              }
            }
          ]
        }
      ]
    }
  },
  {
    name: 'Status Update (Delivery)',
    payload: {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: '123456789',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '919876543210',
                  phone_number_id: '1234567890'
                },
                statuses: [
                  {
                    id: 'wamid.abc123',
                    status: 'delivered',
                    timestamp: Math.floor(Date.now() / 1000),
                    recipient_id: '919876543210'
                  }
                ]
              }
            }
          ]
        }
      ]
    }
  }
];

async function testWebhook(messageIndex) {
  const mock = mockMessages[messageIndex];
  if (!mock) {
    console.error(`❌ Message ${messageIndex} not found. Available: 0-${mockMessages.length - 1}`);
    return;
  }

  try {
    console.log(`\n🧪 Testing: ${mock.name}`);
    console.log('═'.repeat(60));

    const response = await axios.post(
      `${BASE_URL}/webhook/whatsapp`,
      mock.payload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log(`✅ Response: ${response.status}`);
    console.log(`Response Data:`, response.data);
  } catch (error) {
    console.error(`❌ Error:`, error.response?.data || error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting WhatsApp Webhook Tests\n');

  for (let i = 0; i < mockMessages.length; i++) {
    await testWebhook(i);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n✨ All tests completed!');
}

// Handle CLI arguments
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === 'all') {
  runAllTests();
} else if (args[0] === 'help') {
  console.log(`
Usage: node test-whatsapp-mock.js [command]

Commands:
  all          - Run all test messages (default)
  0            - Test Google Pay
  1            - Test PhonePe
  2            - Test Paytm
  3            - Test Status Update
  help         - Show this help

Examples:
  node test-whatsapp-mock.js        # Run all
  node test-whatsapp-mock.js 0      # Test specific message
  node test-whatsapp-mock.js help   # Show help
  `);
} else {
  const index = parseInt(args[0]);
  testWebhook(index);
}
