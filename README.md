# Hotel Management System - Frontend

This is a [Next.js](https://nextjs.org) hotel management system with optimized performance and modern development practices.

## 🚀 Performance Optimizations

This project has been optimized for:
- **Fast build times** with SWC minifier and optimized webpack configuration
- **Reduced bundle size** with tree-shaking and code splitting
- **Improved loading performance** with lazy loading and dynamic imports
- **Better user experience** with optimized images and caching

## 📋 Prerequisites

- Node.js 18+
- npm, yarn, pnpm, or bun

## 🛠️ Getting Started

1. **Clone the repository**
```bash
git clone <repository-url>
cd n5_fe
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

4. **Run the development server**
```bash
npm run dev
# or with Turbopack (faster)
npm run dev:turbo
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📜 Available Scripts

- `npm run dev` - Start development server
- `npm run dev:turbo` - Start development server with Turbopack (faster)
- `npm run build` - Build for production
- `npm run build:analyze` - Build with bundle analyzer
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run type-check` - Run TypeScript type checking
- `npm run clean` - Clean build artifacts and cache
- `npm run optimize` - Clean and build optimized version

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── admin/          # Admin-specific components
│   ├── staff/          # Staff-specific components
│   └── ...
├── pages/              # Next.js pages and API routes
│   ├── api/           # API routes
│   └── ...
├── services/          # API service functions
├── stores/            # State management (Zustand)
├── styles/            # CSS modules and global styles
└── utils/             # Utility functions
```

## 🔧 Key Features

- **Hotel Room Management** - Browse and manage hotel rooms
- **Booking System** - Create and manage room bookings
- **User Authentication** - Login/register functionality
- **Admin Dashboard** - Administrative interface
- **Staff Management** - Employee management system
- **Revenue Analytics** - Financial reporting and analytics
- **Responsive Design** - Mobile-friendly interface

## 🚀 Performance Features

- **Optimized Images** - WebP/AVIF format support with lazy loading
- **Code Splitting** - Automatic bundle splitting for better performance
- **Tree Shaking** - Unused code elimination
- **SWC Minification** - Fast JavaScript/TypeScript compilation
- **Dynamic Imports** - Lazy loading of components
- **API Optimization** - Centralized API utilities with retry logic

## 🔗 API Integration

The frontend connects to a backend API at `https://ptud-web-1.onrender.com/api`.
API calls are optimized with:
- Automatic retry logic
- Fallback URL support
- Centralized error handling
- Response caching

## 📱 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is private and proprietary.
