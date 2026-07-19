const https = require('https');

https.get('https://openrouter.ai/api/v1/models', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const models = JSON.parse(data).data;
    const nemotrons = models.filter(m => m.id.toLowerCase().includes('nemotron'));
    console.log(nemotrons.map(m => m.id + ' | ' + m.name));
  });
});
