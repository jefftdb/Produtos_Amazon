const express = require('express');
const axios = require('axios');
const { JSDOM } = require('jsdom');

const app = express();
const PORT = process.env.PORT || 3000;

const path = require('path');

app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});


app.get('/api/scrape', async (req, res) => {
  const keyword = req.query.keyword;
  if (!keyword) {
    return res.status(400).json({ error: 'Keyword is required' });
  }

  try {
    const response = await axios.get(`https://www.amazon.com/s?k=${encodeURIComponent(keyword)}`);
    const dom = new JSDOM(response.data);
    const document = dom.window.document;

    const products = [];
    const items = document.querySelectorAll('.s-main-slot .s-result-item');

    items.forEach(item => {
      const titleElement = item.querySelector('h2 a span');
      const ratingElement = item.querySelector('.a-icon-alt');
      const reviewCountElement = item.querySelector('.s-underline-text');
      const imageElement = item.querySelector('.s-image');

      if (titleElement && ratingElement && reviewCountElement && imageElement) {
        products.push({
          title: titleElement.textContent.trim(),
          rating: ratingElement.textContent.trim().split(' ')[0],
          reviewCount: reviewCountElement.textContent.trim(),
          imageUrl: imageElement.src
        });
      }
    });

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while scraping Amazon' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
