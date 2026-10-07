# Sage & Bloom Botanical E-Commerce - Frontend

Modern, high-performance Botanical & Handcrafted Soap E-Commerce storefront and Admin Dashboard built with React 18, Vite, and Lucide Icons.

## Features
- **Storefront**: Botanical soap catalog, interactive shopping cart, checkout workflow, filtering by category, search, product reviews.
- **Admin Management Panel**: Product CRUD, order tracking, user status & role management, real-time analytics dashboards, audit logs.
- **Authentication**: JWT token management with Auto Refresh Token Rotation (RTR), Google OAuth 2.0 integration, and offline mock fallback.
- **Deployment Ready**: Pre-configured for seamless 1-click deployment on **Vercel** (`vercel.json` SPA rewrites included).

## Tech Stack
- **Framework**: React 18 + Vite
- **Styling**: Vanilla CSS3 + Modern Responsive Design System
- **Icons**: Lucide React
- **Build Tool**: Vite

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation
```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

### Environment Configuration
Create a `.env` file based on `.env.example`:
```env
VITE_API_URL=http://localhost:8080/api
VITE_API_BASE_URL=http://localhost:8080
```

### Production Build & Deployment
```bash
# Build for production
npm run build

# Preview build locally
npm run preview
```

Deploy directly to **Vercel** by importing this repository.
