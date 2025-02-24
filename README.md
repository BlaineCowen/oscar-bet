# Oscar Betting Pool

A sleek, modern web application for running Oscar betting pools with friends and family. Create games, set categories, and place bets on nominees with real-time updates and beautiful visualizations.

## Features

- User authentication and account management
- Create and manage Oscar betting games
- Invite friends via shareable invite codes
- Place bets on nominees across various categories
- Real-time updates of winners and payouts
- Admin dashboard for managing games
- Dark theme with gold and red Oscar-inspired accents

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Custom auth system
- **Styling**: TailwindCSS with shadcn/ui components

## Deployment to Vercel

### Prerequisites

- [Vercel Account](https://vercel.com/signup)
- [GitHub Account](https://github.com/join)
- PostgreSQL Database (Vercel Postgres, Supabase, Neon, etc.)

### Steps for Deployment

1. **Push to GitHub**

   Create a new repository on GitHub and push your code:

   ```bash
   git remote add origin https://github.com/your-username/oscar-bet.git
   git branch -M main
   git push -u origin main
   ```

2. **Connect to Vercel**

   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "Add New" > "Project"
   - Import your GitHub repository
   - Configure the project:
     - Framework Preset: Next.js
     - Root Directory: ./
     - Build Command: next build
     - Output Directory: .next

3. **Set Environment Variables**

   Add the following environment variables in the Vercel project settings:

   - `DATABASE_URL` - Your PostgreSQL connection string
   - `AUTH_SECRET` - A secure random string for auth
   - `AUTH_TRUSTED_HOSTS` - Your domain (e.g., your-app.vercel.app)
   - `AUTH_URL` - https://your-app.vercel.app/api/auth
   - `SESSION_MAX_AGE` - 2592000 (or your preferred session length in seconds)
   - `NEXTAUTH_URL` - https://your-app.vercel.app
   - `NEXTAUTH_SECRET` - A secure random string for Next Auth

4. **Deploy**

   Click "Deploy" and wait for the build to complete.

5. **Run Database Migrations**

   After deployment, you'll need to run Prisma migrations:

   ```bash
   # Install Vercel CLI if not already installed
   npm i -g vercel

   # Log in to Vercel
   vercel login

   # Link to your project
   vercel link

   # Run migrations on the production environment
   vercel --prod exec -- npx prisma migrate deploy
   ```

## Local Development

1. Clone the repository
2. Copy `.env.example` to `.env` and fill in the variables
3. Install dependencies: `npm install`
4. Run Prisma migrations: `npx prisma migrate dev`
5. Start the development server: `npm run dev`

## License

MIT 