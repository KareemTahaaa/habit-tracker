# Habit Tracker — User Management Service

A full-stack User Management microservice for the Habit Tracking Web Application, built with:
- **Backend**: Node.js + Express + MongoDB Atlas
- **Frontend**: React 18 + Vite + React Router v6

---

## 📁 Folder Structure

```
habit-tracker-user-service/
├── Backend/
│   ├── controllers/
│   │   ├── authController.js      # register, login, forgotPassword, resetPassword
│   │   └── userController.js      # getProfile, updateProfile
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT verification (protectRoute)
│   │   └── errorHandler.js        # Global Express error handler
│   ├── models/
│   │   └── User.js                # Mongoose schema (name, email, password, resetToken)
│   ├── routes/
│   │   ├── authRoutes.js          # POST /api/auth/*
│   │   └── userRoutes.js          # GET/PUT /api/user/profile (protected)
│   ├── utils/
│   │   └── sendEmail.js           # SendGrid email helper
│   ├── .env                       # Environment variables (fill in your values)
│   ├── .env.example               # Template
│   └── server.js                  # Express app entry point
│
└── Frontend/
    └── src/
        ├── api/
        │   └── axiosInstance.js   # Axios with JWT injection + 401 redirect
        ├── components/
        │   ├── Navbar.jsx
        │   └── ProtectedRoute.jsx
        ├── context/
        │   └── AuthContext.jsx    # Global auth state (token + user)
        ├── pages/
        │   ├── RegisterPage.jsx
        │   ├── LoginPage.jsx
        │   ├── ForgotPasswordPage.jsx
        │   ├── ResetPasswordPage.jsx
        │   └── ProfilePage.jsx
        ├── App.jsx                # Router + all routes
        └── index.css              # Complete dark-theme design system
```

---

## ⚙️ Setup — Step by Step

### Step 1: Configure Backend Environment

Edit `Backend/.env` and fill in your real values:

```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/habit-tracker
JWT_SECRET=pick_a_long_random_secret
JWT_EXPIRE=7d
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxx
FROM_EMAIL=noreply@yourdomain.com
CLIENT_URL=http://localhost:5173
```

> **MongoDB Atlas**: Create a free cluster at [https://cloud.mongodb.com](https://cloud.mongodb.com)
>
> **SendGrid**: Sign up at [https://sendgrid.com](https://sendgrid.com), verify a sender email, and create an API key.

### Step 2: Run Backend

```powershell
cd habit-tracker-user-service/Backend
npm install           # already done
npm run dev           # starts with nodemon on port 5000
```

You should see:
```
✅ MongoDB Connected: cluster0.xxxxx.mongodb.net
🚀 User Management Service running on port 5000
```

### Step 3: Configure Frontend Environment

`Frontend/.env` is already created:
```env
VITE_API_URL=http://localhost:5000
```

### Step 4: Run Frontend

```powershell
cd habit-tracker-user-service/Frontend
npm install           # already done
npm run dev           # starts Vite dev server on port 5173
```

Open: **http://localhost:5173**

---

## 🔌 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | Public | Create new account |
| `POST` | `/api/auth/login` | Public | Login, receive JWT |
| `POST` | `/api/auth/forgot-password` | Public | Send password reset email |
| `POST` | `/api/auth/reset-password` | Public | Reset password with token |
| `GET`  | `/api/user/profile` | **JWT** | Get current user profile |
| `PUT`  | `/api/user/profile` | **JWT** | Update name, email, or password |
| `GET`  | `/api/health` | Public | Health check |

### Example Requests

**Register**
```json
POST /api/auth/register
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123"
}
```

**Login**
```json
POST /api/auth/login
{
  "email": "john@example.com",
  "password": "SecurePass123"
}
// Returns: { token, user }
```

**Update Profile** (requires `Authorization: Bearer <token>`)
```json
PUT /api/user/profile
{
  "name": "John Updated",
  "currentPassword": "OldPass",
  "newPassword": "NewPass123"
}
```

---

## 🔐 Security Notes

- Passwords are hashed with **bcryptjs** (12 salt rounds) before storage
- JWT tokens expire in 7 days by default
- Password reset tokens are hashed with **SHA-256** before storing in DB
- Reset links expire in **15 minutes**
- Email enumeration is prevented (forgot-password always returns the same response)
- Passwords are never returned in API responses (`select: false` in schema)

---

## 🎨 Frontend Pages

| Route | Page | Auth Required |
|-------|------|---------------|
| `/register` | Register | No |
| `/login` | Login | No |
| `/forgot-password` | Forgot Password | No |
| `/reset-password/:token` | Reset Password | No |
| `/profile` | User Profile | **Yes** |

---

## 🧹 Tech Stack

| | Technology |
|--|--|
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose ODM) |
| Auth | JWT (`jsonwebtoken`) |
| Password Hashing | `bcryptjs` (12 rounds) |
| Email | `@sendgrid/mail` |
| Validation | `express-validator` |
| Frontend | React 18 (Vite) |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Styling | Vanilla CSS (dark theme) |
