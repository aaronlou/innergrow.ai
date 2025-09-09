from django.conf import settings
from storages.backends.gcloud import GoogleCloudStorage
from storages.utils import setting
from urllib.parse import urljoin


class GoogleCloudMediaFileStorage(GoogleCloudStorage):
    """
    Custom Google Cloud Storage class for media files
    Uses secure authentication methods (attached service account preferred)
    """
    
    bucket_name = setting('GS_BUCKET_NAME')
    file_overwrite = False
    
    def __init__(self, **settings_dict):
        super().__init__(**settings_dict)
        # The google-cloud-storage library will automatically use:
        # 1. Attached service account (if on Google Cloud)
        # 2. Application Default Credentials
        # 3. GOOGLE_APPLICATION_CREDENTIALS environment variable (fallback)


class GoogleCloudStaticFileStorage(GoogleCloudStorage):
    """Custom Google Cloud Storage class for static files"""
    
    bucket_name = setting('GS_BUCKET_NAME')
    location = 'static'
