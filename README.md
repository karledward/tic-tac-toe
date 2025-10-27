# Tic Tac Toe Game

A full-stack tic-tac-toe game with user authentication, game statistics tracking, and database storage.

## Features

- ✅ Custom email/password authentication
- ✅ Single-player local gameplay (two players on same device)
- ✅ Game statistics tracking (wins, losses, draws)
- ✅ Database storage for game history
- ✅ Responsive design with modern UI
- ✅ Vercel-compatible (serverless deployment ready)

## Tech Stack

- **Frontend**: React 19, Tailwind CSS 4, shadcn/ui
- **Backend**: Express.js, tRPC
- **Database**: MySQL/TiDB with Drizzle ORM
- **Authentication**: Custom JWT-based auth with bcrypt
- **Deployment**: Vercel-ready

## Quick Start

### Development

```bash
# Install dependencies
pnpm install

# Set up environment variables
# Configure DATABASE_URL and other secrets in Manus Settings → Secrets

# Run database migrations
pnpm db:push

# Start development server
pnpm dev
```

### Production Build

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## Deployment to Vercel

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on deploying to Vercel with staging, development, and production environments.

### Quick Deploy

1. Click the **Publish** button in Manus UI
2. Connect your Vercel account
3. Configure environment variables in Vercel Dashboard
4. Deploy!

### Required Environment Variables

- `DATABASE_URL` - MySQL database connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `COOKIE_SECRET` - Secret key for cookie signing
- `NODE_ENV` - Environment (development/staging/production)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete list and setup instructions.

## Project Structure

```
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utilities and helpers
│   └── public/          # Static assets
├── server/              # Express backend
│   ├── _core/           # Core server functionality
│   ├── routers.ts       # tRPC API routes
│   ├── db.ts            # Database operations
│   └── auth.ts          # Authentication helpers
├── drizzle/             # Database schema and migrations
│   └── schema.ts        # Database schema definition
└── shared/              # Shared types and constants
```

## Database Schema

### Users Table
- User authentication and profile data
- Email/password credentials
- Role-based access (user/admin)

### Games Table
- Game history and results
- Player references
- Winner tracking
- Timestamps

## API Routes

### Authentication
- `POST /api/trpc/customAuth.register` - Register new user
- `POST /api/trpc/customAuth.login` - Login user
- `POST /api/trpc/auth.logout` - Logout user
- `GET /api/trpc/auth.me` - Get current user

### Game
- `POST /api/trpc/game.saveResult` - Save game result
- `GET /api/trpc/game.getMyStats` - Get user statistics

## Development Workflow

### Branch Strategy (for Vercel deployment)

- `production` - Production environment
- `staging` - Staging environment
- `dev` - Development environment

### Making Changes

1. Create feature branch from `dev`
2. Make changes and test locally
3. Push to `dev` branch → auto-deploys to dev environment
4. Merge to `staging` → test in staging environment
5. Merge to `production` → deploy to production

## License

MIT

## Support

For issues or questions, please open an issue in the repository.

