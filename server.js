// ✅ Updated server.js with /clean-address route and GPT correction logic

const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const SCRAPEOWL_API_KEY = process.env.SCRAPEOWL_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// ✅ Address cleanup route using GPT
app.post('/clean-address', async (req, res) => {
  const { address } = req.body;

  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }

  try {
    const gptResponse = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: `Correct and format this as a full U.S. address. Return ONLY the corrected address in one single line. Do not include any explanations or extra text.\n\nAddress: ${address}`

          }
        ],
        max_tokens: 100
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const corrected = gptResponse.data.choices[0].message.content.trim();
    res.json({ correctedAddress: corrected });
  } catch (err) {
    console.error('❌ OpenAI error:', err.message);
    res.status(500).json({ error: 'Failed to clean address' });
  }
});

// ✅ Main sqft route using ScrapeOwl
app.post('/get-sqft', async (req, res) => {
  const { address, manualSquareFootage } = req.body;

  if (!address && !manualSquareFootage) {
    return res.status(400).json({ error: 'Either address or manual square footage is required.' });
  }

  if (manualSquareFootage) {
    const sqft = parseFloat(manualSquareFootage);
    if (isNaN(sqft) || sqft <= 0) {
      return res.status(400).json({ error: 'Invalid manual square footage.' });
    }
    return res.json({ squareFootage: sqft, resolvedAddress: null, confirmationNeeded: false });
  }

  const url = `https://www.zillow.com/homes/${encodeURIComponent(address)}_rb/`;
  console.log("🔍 Scraping URL:", url);

  try {
    const scrapeResponse = await axios.post(
      `https://api.scrapeowl.com/v1/scrape?api_key=${SCRAPEOWL_API_KEY}`,
      { url, render_js: true },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const html = scrapeResponse?.data?.content || scrapeResponse?.data?.html || null;
    const resolvedUrl = scrapeResponse?.data?.resolved_url || null;

    if (!html) {
      return res.status(500).json({ error: 'No HTML content returned from ScrapeOwl' });
    }

    const match = html.match(/<span[^>]*>([0-9,]{3,6})<\/span>\s*<span[^>]*>\s*sqft\s*<\/span>/i);

    if (match && match[1]) {
      const sqft = parseInt(match[1].replace(/,/g, ''));
      return res.json({ squareFootage: sqft, resolvedAddress: resolvedUrl, confirmationNeeded: true });
    } else {
      return res.status(404).json({ error: 'Square footage not found in HTML' });
    }
  } catch (error) {
    console.error('❌ Scrape error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch square footage' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
