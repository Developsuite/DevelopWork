# DevelopWork - Premium ERP & Work Management Platform

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg?style=flat-square)](https://github.com/Developsuite/DevelopWork)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](https://opensource.org/licenses/MIT)

## 📌 Project Overview
**DevelopWork** is a premium, all-in-one Enterprise Resource Planning (ERP) and work management platform inspired by industry leaders like Jira and Monday.com. Designed with a modern, glassmorphic aesthetic, DevelopWork unifies critical business domains—Project Management, HR, Finance, CRM, and Support—into a single, highly performant Single Page Application (SPA). By eliminating data silos and software fragmentation, DevelopWork enhances team productivity and administrative oversight.

---

## 💻 Technology Stack
* **Frontend**: React 19, Vite 7, React Router 7.
* **State Management**: Redux Toolkit (for global UI state, Auth, and Board data).
* **Styling**: Custom Vanilla CSS with a Glassmorphism design system (supporting Light, Dark, and Glass themes).
* **Icons**: Lucide React.
* **Backend & Database**: Local Supabase instance running PostgreSQL, GoTrue for Authentication, and Supabase Storage.

---

## ✨ Key Features
* **Centralized Module Hub**: Role-based access control (Admin vs. Employee) routing users to dedicated business units.
* **Advanced Board System**: Versatile project views including drag-and-drop Kanban boards, Timelines, Calendars, and List views with priority badges and item drawers.
* **Human Resources (HR) Portal**: Complete employee directory, attendance tracking, leave request workflows, payroll overviews, and recruitment pipelines.
* **Finance & Accounting**: Real-time revenue vs. expense charts, categorized transaction logging, departmental budget monitoring, and client invoice generation.
* **CRM & Support**: Multi-stage lead conversion pipelines, win-rate analytics, and an SLA-driven Helpdesk ticketing system with live agent messaging threads.
* **Collaborative Documentation**: Rich-text document editor supporting markdown slash (`/`) commands and hierarchical folder structuring.

---

## 📸 Interface Preview
![DevelopWork Module Hub & Kanban Board](./images/preview_dashboard.png)
*(Note: Replace `./images/preview_dashboard.png` with a working screenshot path of your running UI when publishing)*

---

## 🚀 How to Install & Run Locally

### Prerequisites
1. **[Git](https://git-scm.com/)**
2. **[Node.js](https://nodejs.org/)** (v18 or higher recommended)
3. **[Docker Desktop](https://www.docker.com/products/docker-desktop/)** (Required to run the local Supabase backend)

### Step 1: Clone the Repository
Open your terminal and clone the repository to your local machine:
```bash
git clone https://github.com/Developsuite/DevelopWork.git
cd DevelopWork
```

### Step 2: Start the Backend (Supabase Local)
The backend database, authentication, and storage are handled by a local instance of Supabase via Docker.

1. Ensure **Docker Desktop** is running.
2. In the root directory (`DevelopWork`), start Supabase:
   ```bash
   npx supabase start
   ```
   *Note: The first time you run this, Docker will download the necessary images, which may take a few minutes.*

3. Once Supabase starts, it will output several URLs and Keys in your terminal (e.g., `API URL`, `anon key`, `service_role key`). Keep this terminal window open or copy these credentials.
4. **Database Migrations:** Supabase will automatically run the SQL files located in the `supabase/migrations/` folder, which will create all necessary tables and insert default seed data.

### Step 3: Setup the Frontend
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

### Step 4: Run the Application
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

---

## 🛑 Stopping the Environment
To stop the local Supabase backend without losing your data, run:
```bash
npx supabase stop
```
If you ever want to completely wipe the local database and start fresh, run:
```bash
npx supabase stop --no-backup
```

---

## 🤝 Contribution Guidelines
We welcome contributions from academic peers and open-source developers!
1. Fork the repository and create a feature branch (`git checkout -b feature/amazing-feature`).
2. Ensure UI modifications adhere strictly to our Glassmorphic design guidelines.
3. Commit your changes with descriptive messages (`git commit -m 'feat: add workload view to project board'`).
4. Push to the branch and open a Pull Request against the `main` branch.

---

## 📬 Contact & Team Information
* **Project Lead**: DevelopWork Engineering Team / Final Year Project Student
* **Organization**: Department of Information Technology / Punjab University
* **Repository Inquiries**: [https://github.com/Developsuite/DevelopWork/issues](https://github.com/Developsuite/DevelopWork/issues)
