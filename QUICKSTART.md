# Quick Start Guide

Get your Workflow Management Backend up and running in minutes!

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Environment

1. Make sure your `config.env` file is set up with your MongoDB connection string
2. For local MongoDB: `MONGODB_URI=mongodb://localhost:27017/workflow_management`
3. For MongoDB Atlas: Use your connection string from Atlas dashboard

## Step 3: Setup Database (Optional)

Run the setup script to create sample users and workflows:

```bash
npm run setup
```

This will create:
- Admin user: `admin@example.com` / `admin123`
- Manager user: `manager@example.com` / `manager123`
- Regular user: `user@example.com` / `user123`
- Sample workflows for testing

## Step 4: Start the Server

```bash
# Development mode (with auto-restart)
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:5000`

## Step 5: Test the API

### Health Check
```bash
curl http://localhost:5000/health
```

### Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Create a Workflow (with authentication)
```bash
# First, get the token from login response
TOKEN="your_jwt_token_here"

curl -X POST http://localhost:5000/api/workflows \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "My First Workflow",
    "description": "This is a test workflow",
    "category": "Development",
    "priority": "medium"
  }'
```

## API Testing with Postman

1. Import the following collection into Postman:

```json
{
  "info": {
    "name": "Workflow Management API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "http://localhost:5000/health"
      }
    },
    {
      "name": "Register User",
      "request": {
        "method": "POST",
        "url": "http://localhost:5000/api/auth/register",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"Test User\",\n  \"email\": \"test@example.com\",\n  \"password\": \"password123\"\n}"
        }
      }
    },
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "url": "http://localhost:5000/api/auth/login",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"password123\"\n}"
        }
      }
    }
  ]
}
```

## Common Issues

### MongoDB Connection Error
- Make sure MongoDB is running
- Check your connection string in `config.env`
- For MongoDB Atlas, ensure your IP is whitelisted

### Port Already in Use
- Change the PORT in `config.env`
- Or kill the process using port 5000

### JWT Secret Error
- Make sure `JWT_SECRET` is set in `config.env`
- Use a strong, unique secret in production

## Next Steps

1. Explore the API endpoints in the main README
2. Build a frontend application to consume this API
3. Add more features like file uploads, notifications, etc.
4. Deploy to production (Heroku, AWS, etc.)

## Support

If you encounter any issues:
1. Check the console logs for error messages
2. Verify your MongoDB connection
3. Ensure all environment variables are set correctly
4. Open an issue in the repository
