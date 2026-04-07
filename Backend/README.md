## Node.js + Express Auth API (MongoDB, JWT, MVC)

A production-ready authentication backend built with **Node.js**, **Express**, **MongoDB (Mongoose)**, **JWT**, and **Zod** validation using a clean **MVC** architecture.

### Features

- **Signup / Login** with bcrypt password hashing
- **JWT-based authentication** with access tokens
- **Protected route** to fetch the current user (`/api/auth/me`)
- **MVC structure**: routes → controllers → services → models → middlewares → utils
- **Input validation** using Zod
- **Centralized error handling** with consistent JSON responses
- **Environment-based config** and **MongoDB connection helper**
- Basic security middleware: **helmet**, **cors**
- Optional logging with **morgan**

---

### Project Structure

```text
src/
  app.js
  config/
    db.js
    env.js
  models/
    User.model.js
  routes/
    auth.routes.js
  controllers/
    auth.controller.js
  services/
    auth.service.js
    token.service.js
  middlewares/
    auth.middleware.js
    error.middleware.js
    validate.middleware.js
  utils/
    ApiError.js
    asyncHandler.js
```

---

### Installation

```bash
npm init -y

npm install express mongoose jsonwebtoken bcryptjs zod dotenv helmet cors morgan

npm install --save-dev nodemon
```

Alternatively, if you use the provided `package.json`, just run:

```bash
npm install
```

---

### Environment Variables

Create a `.env` file in the project root based on the following template:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/auth_demo
JWT_SECRET=super-secret-jwt-key-change-me
JWT_EXPIRES_IN=15m
```

---

### Scripts

Add these scripts to `package.json` (already included in the generated file):

```json
"scripts": {
  "start": "node src/app.js",
  "dev": "nodemon src/app.js"
}
```

---

### Running the Server

Development (with nodemon):

```bash
npm run dev
```

Production:

```bash
npm start
```

The server will start at `http://localhost:5000` (or the port you configure).

---

### API Endpoints

Base URL: `http://localhost:5000`

#### 1) Signup

- **Endpoint**: `POST /api/auth/signup`
- **Body**:

```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

- **Response** (`201 Created`):

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "664c1b9e8d5c0c0012345678",
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "createdAt": "2024-05-21T10:00:00.000Z",
      "updatedAt": "2024-05-21T10:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
}
```

**cURL example:**

```bash
curl -X POST http://localhost:5000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

---

#### 2) Login

- **Endpoint**: `POST /api/auth/login`
- **Body**:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

- **Response** (`200 OK`):

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "664c1b9e8d5c0c0012345678",
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "createdAt": "2024-05-21T10:00:00.000Z",
      "updatedAt": "2024-05-21T10:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  }
}
```

**cURL example:**

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

---

#### 3) Get Current User (`/me`)

- **Endpoint**: `GET /api/auth/me`
- **Auth**: `Authorization: Bearer <accessToken>`
- **Response** (`200 OK`):

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "664c1b9e8d5c0c0012345678",
      "fullName": "John Doe",
      "email": "john@example.com",
      "role": "user",
      "createdAt": "2024-05-21T10:00:00.000Z",
      "updatedAt": "2024-05-21T10:00:00.000Z"
    }
  }
}
```

**cURL example:**

```bash
ACCESS_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6..."

curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

---

### Error Format

All errors follow a consistent JSON structure:

```json
{
  "success": false,
  "message": "Error message here",
  "errors": [
    {
      "path": ["fieldName"],
      "message": "Validation detail..."
    }
  ]
}
```

`errors` is optional and mainly used for validation-related issues.

---

### Notes

- **Passwords are never stored in plain text**; only bcrypt hashes are saved.
- JWT payload contains `sub` (user id), `email`, and `role`.
- Token expiration is controlled via `JWT_EXPIRES_IN` (e.g., `15m`, `1h`).

