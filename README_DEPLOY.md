Deployment notes

## STATUS: ✅ DEPLOYMENT READY

The GitHub Actions workflow and Dockerfile have been fixed and are ready for deployment.

## Deployment Flow

1) **Cloud Run & Firebase Hosting**
   - Build Docker image with Prisma client generation
   - Push to Google Container Registry
   - Deploy to Cloud Run with environment variables
   - Firebase Hosting forwards all requests to Cloud Run service

2) **Automatic Deployment via GitHub Actions**
   - Push to `main` branch triggers deployment
   - Workflow file: `.github/workflows/deploy.yml`
   - See `DEPLOYMENT_CHECKLIST.md` for required secrets

3) **Required GitHub Secrets**
   Choose ONE authentication method:
   
   **Option A: Workload Identity Federation (Recommended)**
   - `GCP_WIF_PROVIDER`
   - `GCP_SERVICE_ACCOUNT_EMAIL`
   - `GCP_PROJECT`
   
   **Option B: Service Account Key (Fallback)**
   - `GCP_SA_KEY` (base64 JSON of service account key)
   - `GCP_PROJECT`
   
   **Application Environment Variables**
   - `DATABASE_URL`, `DIRECT_URL`
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`, `OPENAI_BASE_URL`, `OPENAI_MODEL`
   - `NEXT_PUBLIC_APP_URL`, `STORAGE_BUCKET`
   - `CREATOR_USER_ID`

4) **Firebase Hosting Domain Setup**
   - Add `drunk30.buzz` custom domain in Firebase Console
   - Add TXT record at Porkbun for verification
   - Add DNS A/CNAME records as instructed by Firebase

5) **Post-Deployment: Prisma Migrations**
   After first successful deployment:
   ```bash
   export DATABASE_URL="your-production-database-url"
   npx prisma migrate deploy
   ```

6) **Manual Deployment Commands** (if needed)
   ```bash
   gcloud auth login
   gcloud config set project <PROJECT_ID>
   gcloud builds submit --tag gcr.io/<PROJECT_ID>/drunk30-buzz
   gcloud run deploy drunk30-buzz-service \
     --image gcr.io/<PROJECT_ID>/drunk30-buzz \
     --region us-central1 \
     --platform managed \
     --allow-unauthenticated \
     --set-env-vars "DATABASE_URL=...,OPENAI_API_KEY=...,NEXT_PUBLIC_APP_URL=https://drunk30.buzz"
   ```

## What Was Fixed

- ✅ GitHub Actions workflow YAML syntax errors
- ✅ Duplicate authentication steps removed
- ✅ Proper if-condition syntax
- ✅ Prisma client generation in Dockerfile
- ✅ Environment variables configuration
- ✅ Public directory structure

See `DEPLOYMENT_CHECKLIST.md` for detailed deployment steps and troubleshooting.

