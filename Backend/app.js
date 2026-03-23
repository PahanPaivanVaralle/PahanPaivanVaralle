const express = require('express');
const app = express();

app.use(express.json());

app.post('/translate', async (req, res) => {
  const text = req.body.q;

  if (!text) {
    return console.log('Missing ?q= parameter');
  }

  try {
    const response = await fetch('http://192.168.130.5:5000/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        q: text,
        source: 'en',
        target: 'fi',
        format: 'text',
        alternatives: 3,
        api_key: process.env.TRANSLATE_API_KEY,
      }),
    });

    const result = await response.json();

    res.json(result);

  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: 'Translation failed' });
  }
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});