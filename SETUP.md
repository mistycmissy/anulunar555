# AnuLunar Setup Guide 🌙

Complete guide to setting up and deploying AnuLunar.

## Table of Contents
1. [Local Development Setup](#local-development-setup)
2. [Supabase Configuration](#supabase-configuration)
3. [Environment Variables](#environment-variables)
4. [Database Setup](#database-setup)
5. [Deployment to Vercel](#deployment-to-vercel)
6. [Troubleshooting](#troubleshooting)

## Local Development Setup

### Prerequisites
- Node.js 18 or higher
- npm or yarn
- Git
- A Supabase account (free tier works)

### Step 1: Clone and Install

```bash
# Clone the repository
git clone https://github.com/mistycmissy/anulunar555.git
cd anulunar555

# Install dependencies
npm install
```

### Step 2: Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` with your text editor and add your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 3: Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Supabase Configuration

### Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign in with GitHub
4. Click "New Project"
5. Fill in:
   - Project name: `anulunar` (or your choice)
   - Database password: Generate a strong password
   - Region: Choose closest to your users
6. Click "Create new project"
7. Wait for project to be ready (~2 minutes)

### Step 2: Get Your Credentials

1. In your Supabase project dashboard
2. Click "Settings" (gear icon) in the sidebar
3. Click "API" under Project Settings
4. Copy:
   - **Project URL** → This is your `VITE_SUPABASE_URL`
   - **anon public** key → This is your `VITE_SUPABASE_ANON_KEY`

### Step 3: Enable Email Authentication

1. Go to "Authentication" in sidebar
2. Click "Providers"
3. Ensure "Email" is enabled
4. Configure email templates (optional)

## Database Setup

### Run the Schema SQL

1. In Supabase dashboard, click "SQL Editor" in sidebar
2. Click "New query"
3. Copy the entire contents of `supabase-schema.sql`
4. Paste into the SQL editor
5. Click "Run"
6. Verify no errors appear

### What the Schema Creates

- **user_profiles**: Extended user data with points and levels
- **cosmic_reports**: Stores generated cosmic blueprints
- **practitioners**: Marketplace practitioners (for future use)
- **bookings**: User bookings with practitioners (for future use)
- **reviews**: Practitioner reviews (for future use)
- **points_history**: Gamification tracking

### Row Level Security (RLS)

All tables have RLS enabled to protect user data:
- Users can only access their own reports
- Users can only update their own profiles
- Practitioners are publicly viewable
- Reviews are publicly viewable

## Environment Variables

### Required Variables

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Getting Supabase Credentials

**Project URL:**
- Dashboard → Settings → API → Project URL

**Anon Key:**
- Dashboard → Settings → API → Project API keys → anon public

⚠️ **Never commit the `.env` file to git!** It's in `.gitignore` for safety.

## Deployment to Vercel

### Option 1: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Sign in with GitHub
4. Click "Add New Project"
5. Import your GitHub repository
6. Configure:
   - Framework: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
7. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
8. Click "Deploy"

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# For production deployment
vercel --prod
```

### Environment Variables in Vercel

1. In your Vercel project dashboard
2. Go to "Settings" → "Environment Variables"
3. Add each variable:
   - Name: `VITE_SUPABASE_URL`
   - Value: Your Supabase URL
   - Environments: Production, Preview, Development
4. Repeat for `VITE_SUPABASE_ANON_KEY`
5. Redeploy if needed

### Custom Domain (Optional)

1. In Vercel project → "Settings" → "Domains"
2. Add your domain
3. Follow DNS configuration instructions
4. Wait for SSL certificate (~1 hour)

## Troubleshooting

### Build Fails with Tailwind Error

```bash
# Install the correct Tailwind PostCSS plugin
npm install -D @tailwindcss/postcss
```

### "Failed to fetch" Error

Check:
1. Supabase project is active
2. Environment variables are correct
3. No typos in `.env` file
4. Restart dev server after changing `.env`

### Database Connection Fails

Verify:
1. Supabase project URL is correct
2. Anon key is correct and not the service key
3. Database schema has been run
4. Row Level Security policies are active

### Authentication Not Working

Check:
1. Email provider is enabled in Supabase
2. Email templates are configured
3. User confirmation settings in Supabase Auth settings

### Reports Not Saving

Verify:
1. User is authenticated
2. `cosmic_reports` table exists
3. RLS policies allow insert for authenticated users
4. Check browser console for errors

### Dev Server Won't Start

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Try a different port
npm run dev -- --port 3000
```

### Build Size Too Large

Current build is ~450KB gzipped. To optimize:
```bash
# Analyze bundle
npm run build -- --mode production

# Consider lazy loading routes
# Split large components
# Use dynamic imports
```

## Testing

### Manual Testing Checklist

- [ ] Home page loads
- [ ] Form validation works
- [ ] Guest can generate 1 report
- [ ] Guest cannot generate 2nd report
- [ ] Sign up works
- [ ] Email confirmation received
- [ ] Sign in works
- [ ] Dashboard loads with user data
- [ ] Authenticated user can generate unlimited reports
- [ ] Reports save to database
- [ ] Report export works
- [ ] Navigation works
- [ ] Responsive on mobile
- [ ] All spiritual systems calculate correctly

### Development Commands

```bash
# Start dev server
npm run dev

# Run linter
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## Next Steps

After successful setup:

1. **Customize Branding**
   - Update colors in `src/index.css`
   - Change fonts in `index.html`
   - Add your logo

2. **Add Features**
   - Implement PDF export
   - Add more spiritual systems
   - Build marketplace functionality

3. **Improve Security**
   - Add rate limiting
   - Implement CAPTCHA for forms
   - Set up monitoring

4. **Optimize Performance**
   - Add caching
   - Optimize images
   - Lazy load components

5. **Add Analytics** (optional)
   - Privacy-friendly analytics
   - Error tracking
   - User behavior insights

## Support

- 📖 [Full Documentation](README.md)
- 🤝 [Contributing Guide](CONTRIBUTING.md)
- 🐛 [Report Issues](https://github.com/mistycmissy/anulunar555/issues)
- 💬 [Discussions](https://github.com/mistycmissy/anulunar555/discussions)

---

**Happy cosmic blueprint generation! 🌙✨**
