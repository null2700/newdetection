from google.cloud import storage
import os

BUCKET_NAME = os.getenv("GCS_BUCKET", "news-bias-pdfs")

def upload_pdf_to_gcs(file_bytes: bytes, filename: str) -> str:
    """Upload a PDF to GCS and return its public URL."""
    client = storage.Client()
    bucket = client.bucket(BUCKET_NAME)
    blob = bucket.blob(f"uploads/{filename}")
    blob.upload_from_string(file_bytes, content_type="application/pdf")
    blob.make_public()
    return blob.public_url

def download_pdf_from_gcs(filename: str) -> bytes:
    """Download PDF bytes from GCS for RAG processing."""
    client = storage.Client()
    bucket = client.bucket(BUCKET_NAME)
    blob = bucket.blob(f"uploads/{filename}")
    return blob.download_as_bytes()
