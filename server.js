const { google } = require('googleapis');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const port=process.env.PORT || 3001;

const app = express();
app.use(cors());
app.use(express.json());

// Load credentials
const credentials = JSON.parse(fs.readFileSync('credentials.json', 'utf-8'));
const { client_id, client_secret, redirect_uris } = credentials.web;

const OAuth2Client = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

const sheets = google.sheets({ version: 'v4', auth: OAuth2Client });
const spreadsheetId = '1eXsrWoHFGvUg6Prgb5aDnZ8RzOf-Y0FPGO6x03fnA88';
const headers = ['Name', 'Phone', 'Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6', 'Q7', 'Q8', 'Q9', 'Q10', 'Q11', 'Q12', 'Q13', 'Q14', 'Q15', 'Q16', 'Q17', 'Q18', 'Q19', 'Q20'];

// Load saved tokens
if (fs.existsSync('tokens.json')) {
  const tokens = JSON.parse(fs.readFileSync('tokens.json', 'utf-8'));
  OAuth2Client.setCredentials(tokens);
} else {
  console.log('No tokens found. Authenticate via /auth/google.');
}

// Google OAuth2 Routes
app.get('/auth/google', (req, res) => {
  const url = OAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  res.redirect(url);
});

app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;

  try {
    const { tokens } = await OAuth2Client.getToken(code);
    OAuth2Client.setCredentials(tokens);

    fs.writeFileSync('tokens.json', JSON.stringify(tokens));
    res.send('Authentication successful! Tokens are saved.');
  } catch (error) {
    console.error('Error during token exchange:', error);
    res.status(500).send('Error during authentication');
  }
});

// Update Google Sheet
const updateGoogleSheet = async (formData) => {
  const values = [
    [
      formData.name || '',
      formData.phone || '',
      formData.q1 || '',
      formData.q2 || '',
      formData.q3 || '',
      formData.q4 || '',
      formData.q5 || '',
      formData.q6 || '',
      formData.q7 || '',
      formData.q8 || '',
      formData.q9 || '',
      formData.q10 || '',
      formData.q11 || '',
      formData.q12 || '',
      formData.q13 || '',
      formData.q14 || '',
      formData.q15 || '',
      formData.q16 || '',
      formData.q17 || '',
      formData.q18 || '',
      formData.q19 || '',
      formData.q20 || '',
    ],
  ];

  try {
    // Check if headers exist
    const getResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A1:U1',
    });

    const dataExists = getResponse.data.values && getResponse.data.values.length > 0;

    if (!dataExists) {
      console.log('No headers found. Adding headers...');
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: 'Sheet1!A1:V1', // Match the exact range of headers
        valueInputOption: 'RAW',
        requestBody: { values: [headers] },
      });
    }

    // Find the next empty row
    const appendRangeResponse = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'Sheet1!A:V', // Full range of columns with data
    });

    const numRows = appendRangeResponse.data.values
      ? appendRangeResponse.data.values.length
      : 0;

    const nextRow = numRows + 1; // Next available row

    console.log('Appending data...');
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `Sheet1!A${nextRow}:V${nextRow}`, // Dynamic range
      valueInputOption: 'RAW',
      requestBody: { values },
    });

    console.log('Data successfully appended.');
  } catch (error) {
    console.error('Error updating Google Sheet:', error);
    throw error;
  }
};

app.post('/submit', async (req, res) => {
  try {
    const formData = req.body;
    console.log('Received form data:', formData);

    await updateGoogleSheet(formData);

    res.status(200).send('Data uploaded to Google Sheets');
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Failed to upload data');
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
