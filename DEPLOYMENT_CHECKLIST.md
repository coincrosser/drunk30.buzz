# Deployment Checklist for drunk30.buzz

This PR fixes the deployment configuration and prepares the application for deployment to Google Cloud Run with Firebase Hosting.

## Changes Made

### 1. Fixed GitHub Actions Workflow
- ✅ Removed duplicate authentication steps
- ✅ Fixed YAML indentation issues
- ✅ Corrected if-condition syntax
- ✅ Added comprehensive environment variables to Cloud Run deployment

### 2. Updated Dockerfile
- ✅ Added Prisma client generation step
- ✅ Ensured Prisma schema is available in both build and runtime stages
- ✅ Created public directory structure

### 3. Repository Structure
- ✅ Created public directory for Firebase Hosting

## Required GitHub Secrets

Before merging to main, ensure these secrets are configured in the repository:

### GCP Authentication (Choose ONE method)

**Option A: Workload Identity Federation (Recommended)**
- `GCP_WIF_PROVIDER` - Format: `projects/<PROJECT_NUMBER>/locations/global/workloadIdentityPools/<POOL_ID>/providers/<PROVIDER_ID>`
- `GCP_SERVICE_ACCOUNT_EMAIL` - Example: `drunk30-deployer@bamboo-almanac-483903-i3.iam.gserviceaccount.com`
- `GCP_PROJECT` - Your GCP project ID

**Option B: Service Account Key (Fallback)**
- `GCP_SA_KEY` - Service account JSON key (base64 encoded)
- `GCP_PROJECT` - Your GCP project ID

### Application Environment Variables
- `DATABASE_URL` - Supabase pooled connection string
- `DIRECT_URL` - Supabase direct connection string
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `OPENAI_API_KEY` - OpenAI API key
- `OPENAI_BASE_URL` - OpenAI API base URL (default: https://api.openai.com/v1)
- `OPENAI_MODEL` - OpenAI model to use (e.g., gpt-4o-mini)
- `NEXT_PUBLIC_APP_URL` - Production URL (https://drunk30.buzz)
- `STORAGE_BUCKET` - Supabase storage bucket name
- `CREATOR_USER_ID` - Creator user ID from Supabase

## Post-Deployment Steps

After the workflow successfully deploys to Cloud Run:

### 1. Run Prisma Migrations
```bash
# Set DATABASE_URL to production database
export DATABASE_URL="your-production-database-url"

# Run migrations
npx prisma migrate deploy
```

### 2. Configure Firebase Hosting
```bash
# Login to Firebase
firebase login

# Set project
firebase use --add

# Deploy hosting (connects to Cloud Run)
firebase deploy --only hosting
```

### 3. Configure Custom Domain (drunk30.buzz)
1. Go to Firebase Console → Hosting
2. Add custom domain: `drunk30.buzz`
3. Follow verification steps (add TXT record at Porkbun)
4. Add DNS A/CNAME records as instructed by Firebase

### 4. Verify Deployment
- Visit https://drunk30.buzz
- Test authentication flow
- Verify database connectivity
- Test episode creation workflow
- Check storage uploads

## Deployment Flow

1. **Code Push to Main** → Triggers GitHub Actions workflow
2. **Authentication** → Uses Workload Identity or Service Account Key
3. **Docker Build** → Builds image with Prisma client
4. **Push to GCR** → Stores image in Google Container Registry
5. **Cloud Run Deploy** → Deploys with all environment variables
6. **Firebase Hosting** → Routes traffic to Cloud Run service

## Troubleshooting

### Build Failures
- Check Prisma schema syntax
- Verify all dependencies are in package.json
- Review build logs in Cloud Build

### Runtime Errors
- Verify all environment variables are set
- Check Cloud Run logs: `gcloud run services logs read drunk30-buzz-service`
- Ensure database migrations are applied

### Connection Issues
- Verify Supabase connection strings
- Check Cloud Run service allows unauthenticated access
- Verify Firebase Hosting rewrites configuration

## Security Notes
- Environment variables are stored as GitHub Secrets
- Service account has minimal required permissions
- Database uses connection pooling
- All traffic served over HTTPS

## Next Steps
1. Merge this PR to trigger deployment
2. Monitor GitHub Actions workflow
3. Run post-deployment steps
4. Verify production functionality
