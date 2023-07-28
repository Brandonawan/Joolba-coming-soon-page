const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const compression = require('compression'); // Added for gzip compression
const XLSX = require('xlsx');
const nodemailer = require('nodemailer')
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

// Set up Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SENDING_EMAIL, // Replace with your Gmail email address
    pass: process.env.EMAIL_PASSWORD // Replace with your Gmail password or an app-specific password if you have two-factor authentication enabled
  }
});

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

    // Send the email to the user after successful subscription
    const mailOptions = {
      from: process.env.SENDING_EMAIL, // Replace with your Gmail email address or the email address you want to send the email from
      to: email, // The email address of the user who subscribed
      subject: 'Subscription Successful',
      // text: 'Thank you for subscribing to our newsletter. We\'ll notify you when we launch!',
      html: `
          <div style="text-align: center; background-color: #f2f2f2; padding: 20px;">
          <img src="https://res.cloudinary.com/dq8v7o672/image/upload/v1690545177/Joolba/Joolba_rriaxh.png" alt="Joolba Logo" style="max-width: 200px;">
          <h2>Welcome to Joolba News Media!</h2>
        </div>
        <div style="padding: 20px;">
          <p>Dear Subscriber,</p>
          <p>Thank you for subscribing to our newsletter. We're thrilled to have you join us!</p>
          <p>Get ready to stay informed with the latest news, updates, and exclusive content straight to your inbox.</p>
          <p>As we prepare for our official launch, you'll be among the first to receive our exciting updates and offerings.</p>
          <p>If you have any questions or need assistance, feel free to contact us anytime. We'd love to hear from you!</p>
          <p>Best regards,</p>
          <p>The Joolba News Media Team</p>
          <p>CEO -  Joseph Bashorun</p>
          <p>Lagos, Nigeria, 100001</p>
          <p style="font-size: 12px;">To unsubscribe, <a href="#">click here</a>.</p>
        </div>    
        `,
      };
    // };

    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.error(error);
        return res.render('error', { message: null, error: 'Oops! Something went wrong while sending the email.' });
      } else {
        console.log('Email sent: ' + info.response);
        return res.render('success', { message: 'Thank you for subscribing. We\'ve send an email to your inbox!' }); 
      }
    });

  } catch (error) {
    console.error(error);
    return res.render('error', { message: null, error: 'Oops! Something went wrong. Please try again later.' });
  }
});

// Endpoint to download the Excel file
app.get('/download-emails', (req, res) => {
    res.download('emails.xlsx', 'emails.xlsx');
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