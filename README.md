# Bulgarian Additive Manufacturing Association Project

## Project Overview

This is the official website and dashboard for the Bulgarian Additive Manufacturing Association (BAMAS). The project provides a comprehensive platform for managing association activities, members, documents, resources, polls, and more.

## Technologies

This project is built with:

- **Vite** - Fast build tool and development server
- **TypeScript** - Type-safe JavaScript
- **React** - UI library
- **shadcn-ui** - Component library
- **Tailwind CSS** - Utility-first CSS framework
- **Supabase** - Backend as a Service (database, authentication, storage)
- **React Router** - Client-side routing

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn package manager
- Supabase account and project

### Installation

1. Clone the repository:
```sh
git clone <YOUR_GIT_URL>
cd bama-digital-forge
```

2. Install dependencies:
```sh
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with:
```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GOOGLE_CLIENT_ID=your-google-client-id (optional)
VITE_CLARITY_PROJECT_ID=your-clarity-project-id (optional)
```

4. Run database migrations:
- Navigate to Supabase Dashboard → SQL Editor
- Run the migration files from `supabase/migrations/` in order

5. Set up Supabase Storage:
- Create storage buckets: `documents`, `resources`, `avatars`
- Configure appropriate RLS policies

6. Start the development server:
```sh
npm run dev
```

The application will be available at `http://localhost:5173`

## Project Structure

```
src/
├── components/        # React components
│   ├── dashboard/    # Dashboard-specific components
│   └── ui/           # Reusable UI components
├── contexts/         # React contexts (Auth, Language)
├── hooks/            # Custom React hooks
├── lib/              # Utility functions and helpers
├── pages/            # Page components
└── translations/     # i18n translation files
```

## Features

- **Authentication**: Email/password and Google OAuth
- **Dashboard**: Comprehensive admin dashboard with multiple sections
- **Member Management**: Approve/reject member requests
- **Documents**: Upload, manage, and organize documents
- **Resources**: Share organization resources (logos, branding, etc.)
- **Polls**: Create and manage voting polls
- **Agenda**: Meeting agendas and comments
- **Network**: Member directory and networking
- **Multi-language**: English and Bulgarian support
- **Dark Mode**: Theme switching support

## Building for Production

```sh
npm run build
```

The built files will be in the `dist/` directory.

## Deployment

The project is configured for deployment on GitHub Pages. The deployment workflow is handled via GitHub Actions (`.github/workflows/deploy.yml`).

### Manual Deployment

1. Build the project: `npm run build`
2. Deploy the `dist/` folder to your hosting provider

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

Copyright © Bulgarian Additive Manufacturing Association (BAMAS)

## Support

For issues or questions, please contact: info@bamas.xyz
