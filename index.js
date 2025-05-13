// Morning SMS Service using TextBelt API and Node.js
require('dotenv').config();
const axios = require('axios');
const cron = require('node-cron');
const express = require('express');
const app = express();

// Configuration
const PORT = process.env.PORT || 3000;
const TEXTBELT_API_KEY = process.env.TEXTBELT_API_KEY; // Your TextBelt API key
const MORNING_TIME = process.env.MORNING_TIME || '08:00'; // Default 8:00 AM

const GREENAPI_ID_INSTANCE = process.env.GREENAPI_ID_INSTANCE;
const GREENAPI_API_TOKEN = process.env.GREENAPI_API_TOKEN;

// Handle multiple phone numbers
// Phone numbers can be specified in the .env file as comma-separated values

const phoneNumbersString = process.env.PHONE_NUMBERS || process.env.PHONE_NUMBER || '';
const PHONE_NUMBERS = phoneNumbersString.split(',').map(num => num.trim()).filter(num => num);

// Message templates - you can customize these or add more
const messageTemplates = [
  "Good morning! Rise and shine! Today is going to be amazing. Love Ace.",
  "Morning! Remember to drink water and take deep breaths today. Love Ace.",
  "Hello! A new day brings new opportunities. Make the most of it! Love Ace.",
  "Good morning! Don't forget to take a moment for yourself today. Love Ace.",
  "Rise and shine! Today is a blank canvas - paint it beautifully. Love Ace."
];

// Function to get a random message from templates
function getRandomMessage() {
  const randomIndex = Math.floor(Math.random() * messageTemplates.length);
  return messageTemplates[randomIndex];
}

// Function to send SMS using TextBelt API

//SMS

// async function sendMorningSMS() {
//   try {
//     const message = getRandomMessage();
//     const date = new Date().toLocaleDateString();
//     const fullMessage = `${message} [${date}]`;
    
//     if (PHONE_NUMBERS.length === 0) {
//       console.error('No phone numbers configured. Please check your .env file.');
//       return false;
//     }
    
//     console.log(`Attempting to send SMS: "${fullMessage}" to ${PHONE_NUMBERS.length} recipients`);
    
//     // Send to all phone numbers
//     const results = await Promise.all(
//       PHONE_NUMBERS.map(async (phoneNumber) => {
//         try {
//           console.log(`Sending to ${phoneNumber}...`);
//           const response = await axios.post('https://textbelt.com/text', {
//             phone: phoneNumber,
//             message: fullMessage,
//             key: TEXTBELT_API_KEY
//           });
          
//           console.log(`Response for ${phoneNumber}:`, response.data);
//           return {
//             phoneNumber,
//             success: response.data.success,
//             error: response.data.error || null
//           };
//         } catch (error) {
//           console.error(`Error sending to ${phoneNumber}:`, error.message);
//           return {
//             phoneNumber,
//             success: false,
//             error: error.message
//           };
//         }
//       })
//     );
    
//     // Log the overall results
//     const successfulSends = results.filter(r => r.success).length;
//     console.log(`Successfully sent ${successfulSends} out of ${PHONE_NUMBERS.length} messages`);
    
//     return successfulSends > 0;
//   } catch (error) {
//     console.error('Error in sendMorningSMS function:', error.message);
//     return false;
//   }
// }
async function sendMorningSMS() {
    try {
      const message = getRandomMessage();
      const date = new Date().toLocaleDateString();
      const fullMessage = `${message} [${date}]`;
  
      if (PHONE_NUMBERS.length === 0) {
        console.error('No phone numbers configured. Please check your .env file.');
        return false;
      }
  
      console.log(`Sending WhatsApp message to ${PHONE_NUMBERS.length} recipient(s): "${fullMessage}"`);
  
      const results = await Promise.all(
        PHONE_NUMBERS.map(async (phoneNumber) => {
          try {
            const response = await axios.post(
              `https://api.green-api.com/waInstance${GREENAPI_ID_INSTANCE}/sendMessage/${GREENAPI_API_TOKEN}`,
              {
                chatId: `${phoneNumber}@c.us`,
                message: fullMessage
              }
            );
  
            console.log(`Sent to ${phoneNumber}:`, response.data);
            return {
              phoneNumber,
              success: response.data.idMessage != null,
              error: null
            };
          } catch (error) {
            console.error(`Error sending to ${phoneNumber}:`, error.response?.data || error.message);
            return {
              phoneNumber,
              success: false,
              error: error.message
            };
          }
        })
      );
  
      const successfulSends = results.filter(r => r.success).length;
      console.log(`Successfully sent ${successfulSends} out of ${PHONE_NUMBERS.length} messages`);
  
      return successfulSends > 0;
    } catch (error) {
      console.error('Error in sendMorningSMS:', error.message);
      return false;
    }
  }
// Parse the MORNING_TIME into hours and minutes for the cron job
const [hours, minutes] = MORNING_TIME.split(':');

// Schedule the SMS to be sent every morning at the specified time
// Cron format: minute hour * * * (runs every day at the specified hour:minute)
cron.schedule(`${minutes} ${hours} * * *`, async () => {
  console.log(`It's ${MORNING_TIME}! Sending morning SMS...`);
  await sendMorningSMS();
});

// Simple web interface
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Morning SMS Service</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .container { background-color: #f8f9fa; padding: 20px; border-radius: 8px; }
          h1 { color: #343a40; }
          .status { margin-top: 20px; padding: 15px; border-radius: 5px; }
          .success { background-color: #d4edda; color: #155724; }
          .button { background-color: #007bff; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; }
          .button:hover { background-color: #0069d9; }
          .phone-list { margin-top: 15px; }
          .phone-number { background-color: #e9ecef; padding: 5px 10px; margin: 3px; display: inline-block; border-radius: 3px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Morning SMS Service</h1>
          <p>This service sends a daily morning SMS at ${MORNING_TIME}.</p>
          
          <div class="phone-list">
            <p>Configured phone numbers (${PHONE_NUMBERS.length}):</p>
            ${PHONE_NUMBERS.length > 0 
              ? PHONE_NUMBERS.map(num => `<span class="phone-number">${num}</span>`).join(' ')
              : '<span style="color: red;">No phone numbers configured!</span>'}
          </div>
          
          <p>API Key status: ${TEXTBELT_API_KEY ? 'Configured' : 'Not configured'}</p>
          
          <form action="/send-test" method="get">
            <button class="button" type="submit">Send Test SMS Now</button>
          </form>
        </div>
      </body>
    </html>
  `);
});

// Endpoint to manually trigger an SMS
app.get('/send-test', async (req, res) => {
  const result = await sendMorningSMS();
  
  res.send(`
    <html>
      <head>
        <title>Test SMS Result</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .container { background-color: #f8f9fa; padding: 20px; border-radius: 8px; }
          h1 { color: #343a40; }
          .status { margin-top: 20px; padding: 15px; border-radius: 5px; }
          .success { background-color: #d4edda; color: #155724; }
          .error { background-color: #f8d7da; color: #721c24; }
          .button { background-color: #6c757d; color: white; border: none; padding: 10px 15px; border-radius: 5px; cursor: pointer; text-decoration: none; display: inline-block; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Test SMS Result</h1>
          <div class="status ${result ? 'success' : 'error'}">
            ${result ? 
              `SMS sent successfully to ${PHONE_NUMBERS.length} recipient(s)!` : 
              'Failed to send SMS. Check console logs for details.'}
          </div>
          <p>Check your phone(s) to see if you received the message.</p>
          <p><small>Note: With the free TextBelt API key, you can only send 1 SMS per day in total.</small></p>
          <a href="/" class="button">Back to Home</a>
        </div>
      </body>
    </html>
  `);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Morning SMS service running on port ${PORT}`);
  console.log(`Scheduled to send SMS daily at ${MORNING_TIME}`);
});