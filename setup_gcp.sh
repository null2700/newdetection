#!/bin/bash
PROJECT_ID="news-bias-detection"
REGION="asia-south1"

# 1. Create GCP project and enable APIs
gcloud projects create $PROJECT_ID
gcloud config set project $PROJECT_ID
gcloud services enable run.googleapis.com \
                        sqladmin.googleapis.com \
                        storage.googleapis.com \
                        cloudbuild.googleapis.com \
                        logging.googleapis.com \
                        monitoring.googleapis.com

# 2. Create Cloud SQL PostgreSQL instance (free tier)
gcloud sql instances create news-bias-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=$REGION \
  --storage-size=10GB \
  --storage-type=HDD

# 3. Create database and user
gcloud sql databases create news_bias_db --instance=news-bias-db
gcloud sql users create soham \
  --instance=news-bias-db \
  --password=your-secure-password

# 4. Create Cloud Storage bucket
gsutil mb -p $PROJECT_ID -l $REGION \
  gs://news-bias-pdfs-$PROJECT_ID

# 5. Set CORS on bucket for React frontend
gsutil cors set cors.json gs://news-bias-pdfs-$PROJECT_ID

# 6. Initialize Firebase hosting
npm install -g firebase-tools
firebase login
firebase init hosting

# 7. Build and deploy everything via Cloud Build
gcloud builds submit --config cloudbuild.yaml

echo "Deployment complete!"
echo "Backend: https://news-bias-backend-xxx-el.a.run.app"
echo "RAG:     https://news-bias-rag-xxx-el.a.run.app"
echo "Frontend: https://your-project-id.web.app"
