const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
dotenv.config();
const XLSX = require('xlsx');

const ejs = require("ejs");
const app = express();
// Start the server
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');

// app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('Failed to connect to MongoDB', error);
  });

// connect to emailSchema.js
const Email = require('./models/emailSchema');


// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


// Handle GET request to /notify
app.get('/notify', (req, res) => {
    res.render('index', { message: null, error: null });
});

// Handle form submission
app.post('/notify', async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.render('index', { message: null, error: 'Email is required' });
      }
  
      const existingEmail = await Email.findOne({ email });
      if (existingEmail) {
        return res.render('index', { message: 'Email already submitted', error: null });
      }
  
      const userEmail = await Email.create({ email });
  
      const workbook = XLSX.readFile('emails.xlsx');
  
      const worksheet = workbook.Sheets['Emails'];
  
      const lastRow = XLSX.utils.sheet_add_json(worksheet, [{ email }], { skipHeader: true, origin: -1 });
  
      XLSX.writeFile(workbook, 'emails.xlsx');
  
      return res.render('success', { message: 'Thank you for subscribing. We\'ll notify you when we launch!' });
    } catch (error) {
      console.error(error);
      return res.render('error', { message: null, error: 'Oops! Something went wrong. Please try again later.' });
    }
  });

// Endpoint to download the Excel file
app.get('/download-emails', (req, res) => {
    res.download('emails.xlsx', 'emails.xlsx');
  });

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});