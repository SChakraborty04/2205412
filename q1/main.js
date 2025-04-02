require('dotenv').config(); 
const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;
const WINDOW_SIZE = 10;
const VALID_IDS = { 'p': 'primes', 'f': 'fibo', 'e': 'even', 'r': 'rand' };
const AUTH_HEADER = {
    headers: {
        Authorization: process.env.AUTH_TOKEN
    }
};

let numberWindow = [];

// Fetch numbers from third-party API with a timeout of 500ms
async function fetchNumbers(type) {
    try {
        const response = await axios.get(`http://20.244.56.144/evaluation-service/${type}`, AUTH_HEADER);
        return response.data.numbers || [];
    } catch (error) {
        console.log(`Error fetching numbers: ${error.message}`);
        return [];
    }
}

// Route to handle number requests
app.get('/numbers/:numberid', async (req, res) => {
    const numberId = req.params.numberid;
    if (!VALID_IDS[numberId]) {
        return res.status(400).json({ error: 'Invalid number ID' });
    }
    
    const prevState = [...numberWindow];
    const newNumbers = await fetchNumbers(VALID_IDS[numberId]);
    
    // Add new numbers while maintaining uniqueness
    newNumbers.forEach(num => {
        if (!numberWindow.includes(num)) {
            numberWindow.push(num);
        }
    });
    
    // Maintain the window size
    if (numberWindow.length > WINDOW_SIZE) {
        numberWindow = numberWindow.slice(numberWindow.length - WINDOW_SIZE);
    }
    
    const sum = numberWindow.reduce((acc, num) => acc + num, 0);
    const avg = numberWindow.length ? (sum / numberWindow.length).toFixed(2) : 0;
    
    res.json({
        windowPrevState: JSON.stringify(prevState),
        windowCurrState: JSON.stringify(numberWindow),
        numbers: JSON.stringify(newNumbers),
        avg: parseFloat(avg)
    });
});

// Initial endpoint
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to the Average Calculator API',
        endpoints: { getAverage: '/numbers/{numberid}' }
    });
});

// My server at given port:3000
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

