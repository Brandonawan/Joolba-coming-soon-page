const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const compression = require('compression'); // Added for gzip compression
const XLSX = require('xlsx');
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// Enable gzip compression
app.use(compression());

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
app.get('', (req, res) => {
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

    let workbook;
    try {
      workbook = XLSX.readFile('emails.xlsx');
    } catch (error) {
      // File doesn't exist, create a new workbook with a sheet
      workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([]), 'Emails');
    }

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

  app.get('/success', (req, res) => {
    res.render('success', { message: null, error: null });  
  });

  app.get('/error', (req, res) => {
    res.render('error', { message: null, error: null });  
  });

app.use((req, res, next) => {
  // Set the HTTP status code to 404 (Not Found)
  res.status(404);
  
  // Render the custom 404 page using the "404.ejs" template
  res.render('404', {
    pageTitle: '404 - Not Found',
    path: req.url,
  });
});


// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

// Graceful server termination
process.on('SIGINT', () => {
  console.log('Server is shutting down...');
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed');
    server.close(() => {
      console.log('Server terminated');
      process.exit(0);
    });
  });
});