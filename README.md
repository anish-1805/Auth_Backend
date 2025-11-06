# Auth Backend API

A production-ready Node.js authentication backend with Express, JWT, Joi validation, and JSON file storage.

## Features

- ✅ **JWT Authentication** with httpOnly cookies
- ✅ **User Registration & Login** with bcrypt password hashing
- ✅ **Joi Validation** for request body validation
- ✅ **JSON File Storage** for user data (no database required)
- ✅ **Protected Routes** with JWT middleware
- ✅ **Rate Limiting** to prevent abuse
- ✅ **CORS Support** for frontend integration
- ✅ **Error Handling** with detailed error messages
- ✅ **Security Headers** and best practices
- ✅ **Environment Configuration** with dotenv

## Tech Stack

- **Runtime**: Node.js (ES Modules)
- **Framework**: Express.js
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Joi
- **Password Hashing**: bcryptjs
- **Storage**: JSON files
- **Security**: CORS, Rate limiting, Security headers

## Project Structure

```
Backend/
├── controllers/
│   └── authController.js      # Authentication logic
├── middleware/
│   ├── auth.js               # JWT authentication middleware
│   └── errorHandler.js       # Global error handling
├── models/
│   ├── users.json           # User data storage
│   └── userModel.js         # User model operations
├── routes/
│   └── authRoutes.js        # Authentication routes
├── utils/
│   ├── jwt.js               # JWT utilities
│   └── password.js          # Password hashing utilities
├── validations/
│   └── authValidation.js    # Joi validation schemas
├── .env                     # Environment variables
├── .env.example            # Environment template
├── server.js               # Main server file
└── package.json            # Dependencies and scripts
```

## Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and update the values:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Cookie Configuration
COOKIE_EXPIRES_IN=7

# CORS Configuration
FRONTEND_URL=http://localhost:3000
```

### 3. Start the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Public Endpoints

#### POST /api/auth/signup
Register a new user.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

#### POST /api/auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

### Protected Endpoints (Require Authentication)

#### GET /api/auth/me
Get current user information.

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

#### POST /api/auth/logout
Logout user (clears JWT cookie).

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### POST /api/auth/refresh
Refresh JWT token.

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully"
}
```

#### PUT /api/auth/change-password
Change user password.

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

#### PUT /api/auth/profile
Update user profile.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

## Validation Rules

### Signup Validation
- **Name**: Required, 2-50 characters
- **Email**: Required, valid email format, unique
- **Password**: Required, minimum 8 characters with:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (@$!%*?&)

### Login Validation
- **Email**: Required, valid email format
- **Password**: Required, non-empty

## Security Features

### JWT Authentication
- Tokens stored in httpOnly cookies
- Secure and SameSite flags in production
- Configurable expiration time
- Token refresh capability

### Password Security
- bcrypt hashing with salt rounds of 12
- Password strength validation
- Secure password comparison

### Rate Limiting
- 100 requests per 15-minute window per IP
- Automatic cleanup of old request data
- Configurable limits

### CORS Protection
- Configurable allowed origins
- Credentials support for cookies
- Preflight request handling

### Security Headers
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

## Data Storage

User data is stored in `models/users.json` with the following structure:

```json
[
  {
    "id": "uuid-v4",
    "name": "John Doe",
    "email": "john@example.com",
    "password": "bcrypt-hashed-password",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
]
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

## Development

### Available Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

### Environment Variables
All configuration is handled through environment variables. See `.env.example` for all available options.

### Logging
The server logs all requests with timestamps and includes detailed error logging in development mode.

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Configure proper CORS origins
4. Enable HTTPS for secure cookies
5. Set up proper logging and monitoring
6. Consider using a process manager like PM2

## Testing

You can test the API using tools like:
- **Postman** - Import the API collection
- **curl** - Command line testing
- **Thunder Client** - VS Code extension
- **Insomnia** - REST client

Example curl commands:

```bash
# Signup
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","password":"SecurePass123!"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"SecurePass123!"}' \
  -c cookies.txt

# Get current user (using saved cookies)
curl -X GET http://localhost:5000/api/auth/me \
  -b cookies.txt
```

## License

MIT License - see LICENSE file for details.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request
