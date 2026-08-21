<div align="center">

# 🚚 SunPath

### Smart Fleet Tracking & Dispatch Management

A modern, real-time platform for managing fleets, drivers, vehicles, and dispatch operations — all from one intuitive dashboard.

<br />

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![SignalR](https://img.shields.io/badge/SignalR-Real--time-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)](https://dotnet.microsoft.com/apps/aspnet/signalr)

<br />

[✨ Features](#-features) ·
[🧩 Tech Stack](#-tech-stack) ·
[🚀 Getting Started](#-getting-started) ·
[🗺️ Roadmap](#️-roadmap)

</div>

---

## 🌟 Overview

**SunPath** is a fleet tracking and dispatch platform designed for operational teams that need a fast, clear, and reliable way to coordinate drivers, vehicles, and deliveries.

From live map visibility to streamlined dispatch scheduling, SunPath brings day-to-day fleet operations into one connected experience.

> Built for clarity, speed, and real-time decision making.

---

## ✨ Features

<table>
  <tr>
    <td width="50%" valign="top">

### 📊 Operations Dashboard

Monitor the most important fleet metrics at a glance.

- Live fleet status overview
- Active dispatch insights
- Driver and vehicle availability
- Clear operational summaries

    </td>
    <td width="50%" valign="top">

### 🗺️ Interactive Fleet Map

Visualize fleet activity directly on an interactive map.

- Dynamic map markers
- Driver and vehicle locations
- Dispatch-related locations
- Leaflet-powered map experience

    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">

### 🚛 Vehicle Management

Keep vehicle records organized and up to date.

- Vehicle profiles and details
- Availability and status tracking
- Vehicle assignment workflows
- Centralized fleet inventory

    </td>
    <td width="50%" valign="top">

### 🧑‍✈️ Driver Management

Manage driver information and operational status.

- Driver profiles
- Availability management
- Dispatch assignment
- Current activity visibility

    </td>
  </tr>
  <tr>
    <td width="50%" valign="top">

### 📦 Dispatch Scheduling

Create, assign, and track dispatches with ease.

- Create dispatch requests
- Assign drivers and vehicles
- Manage dispatch lifecycle
- Dynamic location-based forms

    </td>
    <td width="50%" valign="top">

### ⚡ Real-Time Updates

Stay synchronized without manual refreshes.

- SignalR-powered communication
- Live status changes
- Instant dispatch updates
- Responsive operational UI

    </td>
  </tr>

</table>

---

## 🧩 Tech Stack

<div align="center">

|    Frontend     |  State & Forms  | Maps & Motion |   Backend    |
| :-------------: | :-------------: | :-----------: | :----------: |
|   Next.js 16    |     Zustand     |    Leaflet    | ASP.NET Core |
|    React 19     | React Hook Form | Framer Motion |   SignalR    |
|   TypeScript    |       Zod       | Lucide React  |  SQL Server  |
| Tailwind CSS v4 |     Sonner      |  next-themes  |   REST API   |

</div>

---

## 🎨 Experience Highlights

- 🌓 **Dark & Light Mode** — Comfortable interface in every environment
- 🌍 **RTL / LTR Ready** — Built with multilingual interfaces in mind
- 📱 **Responsive Layout** — Optimized for desktop, tablet, and mobile
- 🔔 **Instant Feedback** — Toast notifications with Sonner
- ✅ **Type-Safe Forms** — Validated with React Hook Form and Zod
- 🧱 **Component-Driven Architecture** — Reusable, scalable, maintainable

---

## 🚀 Getting Started

### 1. Clone the repository

---

git clone https://github.com/frau-azadeh/sunpath-frontend
cd sunpath

---

2. Install dependencies

npm install

---

3. Configure environment variables
   Create a .env.local file in the root directory:

env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
NEXT_PUBLIC_SIGNALR_HUB_URL=http://localhost:5000/hubs/fleet

---

4. Run the development server

npm run dev
Open http://localhost:3000 in your browser. 🎉

---

📁 Project Structure

text
```
    src/
    ├── app/ # App Router pages, layouts, and routes
    ├── components/ # Reusable UI components
    ├── features/ # Domain-based feature modules
    ├── hooks/ # Custom React hooks
    ├── lib/ # Shared utilities and configurations
    ├── services/ # API and SignalR services
    ├── store/ # Zustand stores
    ├── types/ # Shared TypeScript definitions
    └── styles/ # Global styles
```
---

🗺️ Roadmap
[x] Dashboard user interface
[x] Driver management
[x] Vehicle management
[x] Dispatch management interface
[x] Interactive map integration
[ ] Complete SignalR real-time synchronization
[ ] Dispatch notifications
[ ] Route history and playback
[ ] Analytics and operational reports
[ ] Role-based access control
[ ] Mobile experience improvements

---

🛠️ Available Commands

Command Description
npm run dev Starts the local development server
npm run build Creates an optimized production build
npm run start Runs the production build locally
npm run lint Runs ESLint checks

---

👩🏻‍💻 Author
<div align=“center”>

Azadeh Sharifi Soltani

Senior Front-End Developer
</div>
