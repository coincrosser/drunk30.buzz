Deployment notes

1) Cloud Run & Firebase Hosting flow
   - Build Docker image, push to Container Registry, deploy to Cloud Run
   - Use Firebase Hosting rewrites (firebase.json) to forward requests to Cloud Run

2) Typical commands (local):
   - gcloud auth login
   - gcloud config set project <PROJECT_ID>
   - gcloud builds submit --tag gcr.io/<PROJECT_ID>/drunk30-buzz:latest
   - gcloud run deploy drunk30-buzz-service --image gcr.io/<PROJECT_ID>/drunk30-buzz:latest --region us-central1 --platform managed --allow-unauthenticated --set-env-vars "DATABASE_URL=...,OPENAI_API_KEY=...,NEXT_PUBLIC_APP_URL=https://drunk30.buzz"

3) GitHub Actions: set secrets `GCP_PROJECT` and `GCP_SA_KEY` (base64 JSON of service account key)

4) Firebase Hosting: add `drunk30.buzz` domain and follow verification (add TXT record at Porkbun), then add DNS A/CNAME records as instructed.

5) Prisma migrations: after deploying and setting DATABASE_URL to a production DB, run `npx prisma migrate deploy` against that DB.

6) <!-- Deployment triggered: GCP credentials added -->


<!-- Fresh GCP service account key deployed -->
