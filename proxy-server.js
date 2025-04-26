const express = require('express');
const axios = require('axios');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();

// === CORS CHANGES === //
app.use(cors({
  origin: 'http://localhost:3000', // Your React app's URL
  credentials: true,
  allowedHeaders: ['Content-Type', 'Accept', 'X-Requested-With'], // Removed X-Client
  methods: ['GET', 'OPTIONS']
}));

app.use(cookieParser());

// === SIMPLIFIED PROXY ENDPOINTS === //
app.get('/api/heroes', async (req, res) => {
  try {
    const response = await axios.get('https://marvelsapi.com/api/heroes', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MarvelsApp/1.0'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Proxy error:', error.message);
    res.status(500).json({ error: 'Failed to fetch heroes' });
  }
});

// Change the details endpoint to use ID
app.get('/api/heroes/information/id/:heroId', async (req, res) => {
    try {
      const response = await axios.get(
        `https://marvelsapi.com/api/heroes/information/id/${req.params.heroId}`,
        {
          headers: {
            'Accept': 'application/json'
          }
        }
      );
      res.json(response.data);
    } catch (error) {
      console.error('Proxy error:', error.message);
      res.status(500).json({ error: 'Failed to fetch hero details' });
    }
  });

app.get('/images/:imageName', async (req, res) => {
    try {
      const response = await axios.get(
        `https://marvelsapi.com/images/characters/${req.params.imageName}`,
        { responseType: 'arraybuffer' }
      );
      res.set('Content-Type', response.headers['content-type']);
      res.send(response.data);
    } catch (error) {
      console.error('Image proxy error:', error.message);
      res.status(404).send('Image not found');
    }
  });


// === NEW ERROR HANDLING MIDDLEWARE === //
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Proxy running on http://localhost:${PORT}`));