import 'dotenv/config';

const token = process.env.WHATSAPP_ACCESS_TOKEN;
const wabaId = '4138808753024948';

if (!token) {
  console.log('No WHATSAPP_ACCESS_TOKEN in env');
  process.exit(1);
}

const res = await fetch(`https://graph.facebook.com/v21.0/${wabaId}/message_templates?name=un_dia`, {
  headers: { Authorization: `Bearer ${token}` }
});

const data = await res.json();

if (data.data && data.data.length > 0) {
  const t = data.data[0];
  console.log('Status:', t.status);
  console.log('Language:', t.language);
  console.log('Category:', t.category);
  console.log('\nComponents:');
  t.components?.forEach(c => {
    console.log(`  Type: ${c.type}`);
    console.log(`  Text: ${c.text || '(none)'}`);
    if (c.example) console.log(`  Example: ${JSON.stringify(c.example)}`);
    if (c.buttons) console.log(`  Buttons: ${JSON.stringify(c.buttons)}`);
  });
} else {
  console.log('Response:', JSON.stringify(data, null, 2));
}
