# Email Configuration Setup Guide

## Problem
Invitation emails are not being sent when creating new users. This is commonly due to Gmail's security requirements or missing environment variables.

## Solution

### Option 1: Use Gmail with App Password (Recommended)

**Prerequisites:**
- Gmail account with 2-Factor Authentication enabled
- Access to Google Account settings

**Steps:**

1. **Enable 2FA on your Gmail account:**
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate an App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer" (or your device)
   - Google will generate a 16-character password
   - Copy this password

3. **Set Environment Variables on Render:**
   - Go to: https://dashboard.render.com/
   - Select your backend service
   - Go to "Environment" tab
   - Add/Update these variables:
     ```
     NODEMAILER_EMAIL = your-email@gmail.com
     NODEMAILER_EMAIL_PASSWORD = xxxx xxxx xxxx xxxx (the 16-char app password)
     EMAIL_SERVICE = gmail
     ```
   - Click "Save Changes"
   - Render will automatically redeploy

### Option 2: Use SendGrid (Alternative)

1. **Create SendGrid Account:**
   - Sign up at: https://sendgrid.com

2. **Get API Key:**
   - Go to Settings → API Keys
   - Create a new API key

3. **Set Environment Variables:**
   - On Render dashboard, set:
     ```
     EMAIL_SERVICE = sendgrid
     SENDGRID_API_KEY = SG.your-api-key-here
     NODEMAILER_EMAIL = no-reply@yourdomain.com
     ```

### Option 3: Use Outlook/Hotmail

1. **Set Environment Variables:**
   - On Render dashboard, set:
     ```
     NODEMAILER_EMAIL = your-email@outlook.com
     NODEMAILER_EMAIL_PASSWORD = your-outlook-password
     EMAIL_SERVICE = outlook365
     ```

## Testing Email Configuration

Once you've set the environment variables:

1. **Restart the backend service:**
   - On Render: Go to Services → backend → Manual Deploy

2. **Create a new user via the admin panel**

3. **Check the backend logs:**
   - Go to Render → backend service → Logs
   - Look for:
     - ✅ "Email transporter ready" = Configuration is correct
     - 🔴 "Email transporter verification failed" = Check credentials
     - ❌ "Email send failed" = Check logs for specific error

4. **Check the email spam folder** in case it goes there

## Common Issues & Solutions

### "Invalid login: 535-5.7.8 Username and password not accepted"
- **Cause:** Wrong credentials or Gmail account doesn't have 2FA
- **Solution:** Use App Password (Option 1) instead of regular password

### "Cannot find module 'nodemailer'"
- **Cause:** Package not installed
- **Solution:** Run `npm install nodemailer` (already in package.json)

### "Service gmail not recognized"
- **Cause:** Typo in EMAIL_SERVICE variable
- **Solution:** Ensure it's exactly `gmail` (lowercase)

### Email sends but lands in spam
- **Cause:** Email headers or content triggers spam filters
- **Solution:** Add SPF/DKIM records if using custom domain

## Manual Testing

You can test email sending from the backend by creating a test endpoint. Add this to `server.js`:

```javascript
app.get('/test-email', async (req, res) => {
  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.NODEMAILER_EMAIL,
        pass: process.env.NODEMAILER_EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: process.env.NODEMAILER_EMAIL,
      to: 'test@example.com',
      subject: 'Test Email',
      text: 'If you see this, email is working!',
    });

    res.json({ message: 'Test email sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

Then visit: `https://your-backend-url/test-email` to test.

## Debugging Steps

1. **Check environment variables are set:**
   ```javascript
   console.log('NODEMAILER_EMAIL:', process.env.NODEMAILER_EMAIL);
   console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'gmail');
   ```

2. **Enable detailed logging:**
   - Add `console.log()` statements in the email sending code (already done in latest version)

3. **Check backend logs in Render:**
   - Look for green ✅ or red 🔴 indicators

4. **Check Gmail/Outlook account:**
   - Look for "Suspicious activity" or "New device" alerts
   - May need to approve the new application

## Current Status

The backend has been updated with:
- ✅ Better error logging with emoji indicators
- ✅ Transporter verification with `transporter.verify()`
- ✅ Detailed error messages showing error code and full error object
- ✅ HTML email template for better formatting
- ✅ Non-blocking email errors (won't fail user creation if email fails)

Next step: Set the `NODEMAILER_EMAIL` and `NODEMAILER_EMAIL_PASSWORD` environment variables on Render.
