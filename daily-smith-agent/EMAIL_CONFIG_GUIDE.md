# Email Configuration Guide

This guide explains how to configure email sending in the Daily Smith Agent Dataset Explorer.

## Overview

The application supports **two methods** for sending emails:

1. **SMTP Server** - Send via [serversmtp.com](https://serversmtp.com/turbo-api/#/mail/sendEmail)
2. **Access Token** - Send via OAuth tokens (Microsoft Graph API)

## Configuration

Click the **⚙️ Settings** button (floating button in bottom-right corner) to open the configuration modal.

---

## Option 1: Turbo-SMTP Server

### Setup Steps

1. Open the configuration modal (⚙️ button)
2. Select **"Turbo-SMTP Server"** as the sending method
3. Enter your credentials:
   - **API Endpoint**: `https://api.turbo-smtp.com/api/v2/mail/send` (pre-filled, read-only)
   - **Auth User (Email)**: Your Turbo-SMTP account email
   - **Auth Password**: Your Turbo-SMTP account password
   - **From Email Address**: The sender email address for outgoing emails
4. Click **Save Configuration**

### Get Turbo-SMTP Credentials

Visit [turbo-smtp.com](https://www.turbo-smtp.com) to:
- Sign up for an account
- Get your API credentials
- Review API documentation

### API Endpoint

The application uses the Turbo-SMTP API v2:
```
POST https://api.turbo-smtp.com/api/v2/mail/send
```

**Headers:**
- `Accept: application/json`
- `Content-Type: application/json`

**Body:**
```json
{
  "authuser": "your-email@example.com",
  "authpass": "your-password",
  "from": "sender@example.com",
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "content": "Plain text body"
}
```

### Example cURL Command

```bash
curl --location 'https://api.turbo-smtp.com/api/v2/mail/send' \
--header 'Accept: application/json' \
--header 'Content-Type: application/json' \
--data-raw '{
  "authuser": "your-email@example.com",
  "authpass": "your-password",
  "from": "sender@example.com",
  "to": "recipient@example.com",
  "subject": "This is a test message",
  "content": "This is plain text version of the message."
}'
```

---

## Option 2: Access Token (OAuth)

### Setup Steps

1. Open the configuration modal (⚙️ button)
2. Select **"Access Token"** as the sending method
3. Click **"+ Add Token"** to add a sender account
4. Fill in the details for each sender:
   - **Display Name**: Friendly name for this account (e.g., "Work Email")
   - **Email Address**: The sender's email address
   - **Access Token**: OAuth access token for this account
5. Click **Save Configuration**

### Multiple Senders

- You can add **multiple sender accounts** with different tokens
- The first account is marked as **DEFAULT**
- When sending an email, select which account to use from the dropdown

### Generate OAuth Tokens

#### Microsoft Graph API (Office 365 / Outlook)

1. Register an application in [Azure Portal](https://portal.azure.com)
2. Grant permissions: `Mail.Send`
3. Generate an access token using OAuth 2.0 flow
4. Copy the access token to the configuration

**API Endpoint Used:**
```
POST https://graph.microsoft.com/v1.0/me/sendMail
```

**Headers:**
- `Content-Type: application/json`
- `Authorization: Bearer {access_token}`

**Body:**
```json
{
  "message": {
    "subject": "Email Subject",
    "body": {
      "contentType": "Text",
      "content": "Email body"
    },
    "toRecipients": [
      {
        "emailAddress": {
          "address": "recipient@example.com"
        }
      }
    ]
  }
}
```

#### Gmail API

For Gmail, you can also use OAuth tokens:
1. Set up OAuth 2.0 in [Google Cloud Console](https://console.cloud.google.com)
2. Enable Gmail API
3. Generate access token with scope: `https://www.googleapis.com/auth/gmail.send`
4. **Note**: You'll need to modify the code to support Gmail API endpoint

---

## Using the Send Feature

### With SMTP Method

1. Configure SMTP credentials once
2. Click **"📧 Send Email"** on any email
3. Email will be sent automatically via SMTP

### With Token Method

1. Configure one or more sender tokens
2. Select the sender account from the dropdown (if multiple accounts)
3. Click **"📧 Send Email"**
4. Email will be sent via the selected account

---

## Data Storage

All configuration is stored in **browser localStorage**:
- Configurations persist across sessions
- Data is stored locally in your browser
- Clearing browser data will remove the configuration

---

## Security Notes

⚠️ **Important Security Considerations:**

1. **Access Tokens**: Tokens are stored in localStorage (not encrypted)
2. **SMTP Credentials**: Password is stored in localStorage (not encrypted)
3. **Use with Caution**: Only use this on trusted devices
4. **Token Expiration**: OAuth tokens may expire and need to be refreshed
5. **HTTPS Required**: Always use HTTPS to prevent token interception

### Best Practices

- Use short-lived access tokens
- Refresh tokens regularly
- Don't share your configuration file
- Use application-specific passwords when possible
- Consider using environment variables for production

---

## Troubleshooting

### SMTP Errors

- **401 Unauthorized**: Check your username and password
- **Network Error**: Verify SMTP host URL and internet connection
- **CORS Error**: The SMTP API must support CORS

### Token Errors

- **401 Unauthorized**: Token may be expired or invalid
- **403 Forbidden**: Check API permissions (Mail.Send)
- **Network Error**: Verify internet connection
- **CORS Error**: Microsoft Graph API should support CORS

### Common Issues

1. **No sender accounts available**: Add at least one token in configuration
2. **Recipients not specified**: Ensure email has valid recipient addresses
3. **Configuration not saved**: Click "Save Configuration" after changes

---

## Example Workflow

1. **Initial Setup**:
   - Click ⚙️ button
   - Choose your preferred method (SMTP or Token)
   - Enter credentials/tokens
   - Save configuration

2. **Sending Emails**:
   - Browse to any email in the dataset
   - Edit email content if needed (optional)
   - Select sender (if using tokens with multiple accounts)
   - Click "📧 Send Email"
   - Confirm success message

3. **Managing Multiple Senders** (Token method only):
   - Add multiple sender accounts
   - Each email can be sent from different accounts
   - Useful for testing or managing multiple identities

---

## API References

- [Turbo-SMTP Official Website](https://www.turbo-smtp.com)
- [Turbo-SMTP API Documentation](https://www.serversmtp.com/turbo-api/)
- [Microsoft Graph Send Mail API](https://learn.microsoft.com/en-us/graph/api/user-sendmail)
- [Gmail API Send](https://developers.google.com/gmail/api/guides/sending)

---

## Support

For issues or questions:
- Check the browser console for error messages
- Verify API credentials and permissions
- Ensure tokens haven't expired
- Test API endpoints independently using tools like Postman

