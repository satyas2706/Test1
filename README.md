# JiffEX Shipping & Logistics App

A full-stack logistics application built with React, Express, and Supabase.

## 🚀 Getting Started

### 1. Database Setup (Supabase)
1. Create a new project on [Supabase.com](https://supabase.com).
2. Go to the **SQL Editor** in the left sidebar.
3. Open the `setup.sql` file in this repository, copy its content, and run it in the SQL Editor.

### 2. Environment Variables
Create a `.env` file in the root directory (or set these in your deployment platform):

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Local Development
```bash
npm install
npm run dev
```
Open `http://localhost:3000` to view the app.

### 4. Deployment
This app is ready for deployment on platforms like **Render**, **Railway**, or **Heroku**.

**Build Settings:**
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment Variables**: Add the Supabase keys listed above.

## 🛠️ Tech Stack
- **Frontend**: React, Tailwind CSS, Lucide Icons, Framer Motion
- **Backend**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Node.js
