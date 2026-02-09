import 'dotenv/config';

const token = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneId = '979702145222794';

if (!token) {
  console.log('No WHATSAPP_ACCESS_TOKEN in env');
  process.exit(1);
}

// Check phone number quality and messaging limits
const res = await fetch(
  `https://graph.facebook.com/v21.0/${phoneId}?fields=quality_rating,messaging_limit_tier,display_phone_number,verified_name,status,name_status,code_verification_status`,
  { headers: { Authorization: `Bearer ${token}` } }
);

const data = await res.json();
console.log('Phone number details:');
console.log(JSON.stringify(data, null, 2));

// Check WABA messaging limits
const wabaId = '4138808753024948';
const wabaRes = await fetch(
  `https://graph.facebook.com/v21.0/${wabaId}?fields=messaging_limit_tier,account_review_status,business_verification_status`,
  { headers: { Authorization: `Bearer ${token}` } }
);
const wabaData = await wabaRes.json();
console.log('\nWABA details:');
console.log(JSON.stringify(wabaData, null, 2));
