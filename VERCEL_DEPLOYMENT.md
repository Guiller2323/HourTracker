# Vercel Deployment Guide

This guide will help you deploy the HourTracker application to Vercel with Supabase as the database.

## Prerequisites

1. A [Supabase](https://supabase.com) account and project
2. A [Vercel](https://vercel.com) account
3. Your project repository on GitHub

## Step 1: Set up Supabase Database

1. **Create a Supabase Project**:
   - Go to [supabase.com](https://supabase.com) and sign in
   - Click "New Project"
   - Fill in your project details and wait for it to be created

2. **Set up Database Schema**:
   - In your Supabase dashboard, go to "SQL Editor"
   - Copy and paste the contents of `supabase-schema.sql` from your project
   - Click "Run" to execute the SQL script

3. **Get API Keys**:
   - Go to "Settings" > "API" in your Supabase dashboard
   - Copy the following values:
     - Project URL
     - `anon` `public` key (for `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
     - `service_role` `secret` key (for `SUPABASE_SERVICE_ROLE_KEY`)

## Step 2: Deploy to Vercel

1. **Connect Repository**:
   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "Import Project"
   - Connect your GitHub account and select the HourTracker repository

2. **Configure Project**:
   - Vercel should automatically detect it as a Next.js project
   - Click "Deploy" to start the initial deployment

3. **Add Environment Variables**:
   - In your Vercel dashboard, go to your project settings
   - Navigate to "Environment Variables"
   - Add the following variables:
     ```
     NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
     SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
     ```

4. **Redeploy**:
   - After adding environment variables, trigger a new deployment
   - Go to "Deployments" and click "Redeploy" on the latest deployment

## Step 3: Verify Deployment

1. **Check Database Connection**:
   - Visit your deployed application
   - Try adding an employee or recording a punch
   - Check your Supabase dashboard to see if data is being written

2. **Test All Features**:
   - Employee management
   - Punch clock functionality
   - Timecard viewing
   - CSV export

## Troubleshooting

### Database Connection Issues
- Verify all environment variables are set correctly
- Check that your Supabase project is active
- Ensure the database schema was created successfully

### Build Failures
- Make sure all dependencies are installed (`npm install`)
- Check that the build process completes locally with `npm run build`

### Runtime Errors
- Check Vercel function logs in the dashboard
- Verify API routes are working by testing them directly

## Security Notes

- The `NEXT_PUBLIC_SUPABASE_ANON_KEY` is safe to expose publicly
- Never commit the `SUPABASE_SERVICE_ROLE_KEY` to your repository
- Enable Row Level Security (RLS) in Supabase for production use

## Custom Domain (Optional)

1. In Vercel dashboard, go to "Settings" > "Domains"
2. Add your custom domain
3. Follow Vercel's DNS configuration instructions
4. Set up SSL certificate (Vercel does this automatically)

## Updates

To update your deployed application:
1. Push changes to your GitHub repository
2. Vercel will automatically redeploy
3. If you need to update environment variables, trigger a manual redeploy
