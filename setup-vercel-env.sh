#!/bin/bash
echo "Setting up Vercel environment variables for Hour Tracker..."

# Read values from .env.local
SUPABASE_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL=" .env.local | cut -d'=' -f2)
SUPABASE_ANON_KEY=$(grep "NEXT_PUBLIC_SUPABASE_ANON_KEY=" .env.local | cut -d'=' -f2)
SUPABASE_SERVICE_KEY=$(grep "SUPABASE_SERVICE_ROLE_KEY=" .env.local | cut -d'=' -f2)

echo "Environment variables to set in Vercel:"
echo ""
echo "1. NEXT_PUBLIC_SUPABASE_URL = $SUPABASE_URL"
echo ""
echo "2. NEXT_PUBLIC_SUPABASE_ANON_KEY = $SUPABASE_ANON_KEY"
echo ""
echo "3. SUPABASE_SERVICE_ROLE_KEY = $SUPABASE_SERVICE_KEY"
echo ""
echo "Go to Vercel Dashboard → Your Project → Settings → Environment Variables"
echo "Add these three variables for Production environment"
echo "Then redeploy your project"