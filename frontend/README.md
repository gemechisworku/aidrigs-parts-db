# AidRigs Frontend

React + TypeScript frontend for the AidRigs Parts Database System.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start dev server:**
   ```bash
   npm run dev
   ```

4. **Access the app:**
   - Frontend: http://localhost:5173

## 📁 Project Structure

```
frontend/
├── src/
│   ├── main.tsx             # Application entry point
│   ├── App.tsx              # Main component with routing
│   ├── index.css            # Global styles with Tailwind
│   ├── pages/               # Page components
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   └── Dashboard.tsx
│   └── vite-env.d.ts        # TypeScript declarations
├── index.html               # HTML entry point
├── package.json             # Dependencies
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind configuration
├── tsconfig.json            # TypeScript configuration
└── Dockerfile
```

## 🎨 Styling

This project uses **Tailwind CSS** for styling with custom utility classes defined in `src/index.css`:

- `.btn-primary` - Primary button styling
- `.btn-secondary` - Secondary button styling
- `.card` - Card container
- `.input` - Form input styling

### Custom Colors

Primary color palette is defined in `tailwind.config.js`:
- `primary-50` to `primary-900` - Blue color scale

## 🛠️ Available Scripts

### Development
```bash
npm run dev          # Start dev server with hot-reload
```

### Production
```bash
npm run build        # Build for production
npm run preview      # Preview production build
```

### Code Quality
```bash
npm run lint         # Run ESLint
```

## 🧭 Routing

The app uses React Router v6 with the following routes:

- `/` - Home page
- `/login` - Login page
- `/dashboard` - Dashboard (main app interface)

## 🔌 API Integration

The frontend connects to the backend API at `http://localhost:8000` (configurable via `VITE_API_URL`).

API proxy is configured in `vite.config.ts` to forward `/api` requests to the backend.

## 🐳 Docker

### Development
```bash
docker build --target development -t aidrigs-frontend-dev .
docker run -p 5173:5173 -v $(pwd):/app aidrigs-frontend-dev
```

### Production
```bash
docker build --target production -t aidrigs-frontend .
docker run -p 80:80 aidrigs-frontend
```

## 📦 Adding New Pages

1. Create component in `src/pages/`
2. Add route in `src/App.tsx`
3. Update navigation links

Example:
```tsx
// src/pages/NewPage.tsx
function NewPage() {
  return <div>New Page</div>
}

export default NewPage

// src/App.tsx
import NewPage from './pages/NewPage'

<Route path="/new" element={<NewPage />} />
```

## 🎯 Features

### Implemented
- ✅ React Router setup
- ✅ Tailwind CSS styling
- ✅ TypeScript configuration
- ✅ Responsive layout
- ✅ Basic pages (Home, Login, Dashboard)

### Coming Soon
- 🔄 Authentication system
- 🔄 API integration
- 🔄 State management
- 🔄 Form validation
- 🔄 Error handling

## 🔧 Configuration

### Environment Variables
See `.env.example` for available variables.

### Vite Config
API proxy and dev server settings in `vite.config.ts`

### Tailwind Config
Custom theme and colors in `tailwind.config.js`

## 📝 License

[Add your license here]
