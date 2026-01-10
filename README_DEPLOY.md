Deployment guide

1) Flow overview
   - Build Docker image, push to Container Registry, deploy to Cloud Run (us-central1)
   - Firebase Hosting rewrites (firebase.json) forward requests to Cloud Run

2) GitHub Actions (preferred CI/CD)
   - Workflow: .github/workflows/deploy.yml
   - Required repo secrets (Actions → Secrets):
     - GCP_PROJECT_ID: bamboo-almanac-483903-i3
     - EITHER Workload Identity Federation (recommended):
       - GCP_WIF_PROVIDER: projects/<PROJECT_NUMBER>/locations/global/workloadIdentityPools/<POOL_ID>/providers/<PROVIDER_ID>
       - GCP_SERVICE_ACCOUNT_EMAIL: <YOUR_SERVICE_ACCOUNT>@<PROJECT_ID>.iam.gserviceaccount.com
     - OR fallback key (if WIF unavailable):
       - GCP_SA_KEY_BASE64: base64 of service account JSON key

3) Local deploy commands (manual):
   - gcloud auth login
   - gcloud config set project <PROJECT_ID>
   - gcloud services enable cloudbuild.googleapis.com run.googleapis.com containerregistry.googleapis.com
   - gcloud builds submit --tag gcr.io/<PROJECT_ID>/drunk30-buzz:latest
   - gcloud run deploy drunk30-buzz-service --image gcr.io/<PROJECT_ID>/drunk30-buzz:latest --region us-central1 --platform managed --allow-unauthenticated --set-env-vars "DATABASE_URL=...,OPENAI_API_KEY=...,NEXT_PUBLIC_APP_URL=https://drunk30.buzz"

4) Region & service alignment
   - Use region: us-central1
   - Service name: drunk30-buzz-service
   - Remove any Cloud Build triggers deploying to other regions (e.g., europe-west1) to avoid conflicts

5) Firebase Hosting
   - Add domain drunk30.buzz and verify via TXT record
   - Follow Firebase DNS setup to point A/CNAME records
   - Ensure rewrites in firebase.json target the Cloud Run URL
 
6) Database & Prisma
   - Set DATABASE_URL to the production Supabase Postgres
   - Apply migrations: npx prisma migrate deploy
   - Regenerate client: npx prisma generate
