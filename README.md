# DevelopWork ERP Platform

This repository contains the frontend React application and the local Supabase backend configuration for DevelopWork.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:
1. **[Git](https://git-scm.com/)**
2. **[Node.js](https://nodejs.org/)** (v18 or higher recommended)
3. **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (Required to run the local Supabase backend)

---

## 🚀 Getting Started

Follow these steps to set up the project locally for development.

### 1. Clone the Repository
Open your terminal and clone the repository to your local machine:
```bash
git clone https://github.com/Developsuite/DevelopWork.git
cd DevelopWork
```

### 2. Start the Backend (Supabase Local)
The backend database, authentication, and storage are handled by a local instance of Supabase via Docker.

1. Ensure **Docker Desktop** is running.
2. In the root directory (`DevelopWork`), start Supabase:
   ```bash
   npx supabase start
   ```
   *Note: The first time you run this, Docker will download the necessary images, which may take a few minutes.*

3. Once Supabase starts, it will output several URLs and Keys in your terminal (e.g., `API URL`, `anon key`, `service_role key`). Keep this terminal window open or copy these credentials.
4. **Database Migrations:** Supabase will automatically run the SQL files located in the `supabase/migrations/` folder, which will create all necessary tables and insert default seed data.

### 3. Setup the Frontend
Now, set up the React frontend.

1. Open a **new terminal window** and navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install the required Node dependencies:
   ```bash
   npm install
   ```
3. Set up your environment variables:
   - Create a file named `.env` inside the `client` folder.
   - Add the Supabase credentials you got from step 2:
     ```env
     VITE_SUPABASE_URL=your_api_url_here
     VITE_SUPABASE_ANON_KEY=your_anon_key_here
     ```
     *(Usually, the local URL is `http://127.0.0.1:54321`)*

### 4. Run the Application
Start the frontend development server:
```bash
npm run dev
```
The application should now be accessible in your browser at `http://localhost:5173`.

---

## 🛠️ Testing & Using the App

- **Creating an Account:** Go to the register page and create an account using an email and password. By default, new users are assigned the `employee` role.
- **Admin Access:** To view the Manager Dashboard (`/modules`), you will need `admin` privileges. 
  1. Register a user in the UI.
  2. Open the Supabase Studio dashboard by navigating to the "Studio URL" provided when you ran `npx supabase start` (typically `http://127.0.0.1:54323`).
  3. Go to the **Table Editor**, open the `profiles` table, and change your user's role from `employee` to `admin`.
  4. Refresh the React app to access the Admin/Manager Module Hub.

## 🛑 Stopping the Environment
To stop the local Supabase backend without losing your data, run:
```bash
npx supabase stop
```
If you ever want to completely wipe the local database and start fresh, run:
```bash
npx supabase stop --no-backup
```
