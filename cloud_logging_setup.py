import google.cloud.logging
import logging
import os

def setup_cloud_logging():
    """Initialize GCP Cloud Logging if running on GCP."""
    if os.getenv("K_SERVICE"):  # K_SERVICE is set by Cloud Run
        client = google.cloud.logging.Client()
        client.setup_logging()
        logging.info("Cloud Logging initialized on GCP Cloud Run")
    else:
        logging.basicConfig(level=logging.INFO)
        logging.info("Local logging initialized")

    return logging.getLogger(__name__)

logger = setup_cloud_logging()
