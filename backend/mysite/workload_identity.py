"""
Workload Identity Federation configuration for secure authentication
without service account keys
"""

import os
from google.auth import identity_pool
from google.oauth2 import service_account
from google.cloud import storage


def get_gcs_client_with_workload_identity():
    """
    Get GCS client using Workload Identity Federation
    More secure than service account keys
    """
    
    # Method 1: Use Workload Identity Federation
    audience = f"//iam.googleapis.com/projects/{os.environ.get('GS_PROJECT_NUMBER')}/locations/global/workloadIdentityPools/{os.environ.get('WORKLOAD_IDENTITY_POOL_ID')}/providers/{os.environ.get('WORKLOAD_IDENTITY_PROVIDER_ID')}"
    
    if os.environ.get('WORKLOAD_IDENTITY_POOL_ID'):
        # Use workload identity federation
        credentials = identity_pool.Credentials.from_info({
            "type": "external_account",
            "audience": audience,
            "subject_token_type": "urn:ietf:params:oauth:token-type:access_token",
            "token_url": "https://sts.googleapis.com/v1/token",
            "service_account_impersonation_url": f"https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/{os.environ.get('SERVICE_ACCOUNT_EMAIL')}:generateAccessToken",
            "credential_source": {
                "url": os.environ.get('METADATA_URL', 'http://169.254.169.254/latest/meta-data/iam/security-credentials/'),
                "headers": {
                    "Metadata-Flavor": "Google"
                }
            }
        })
        return storage.Client(credentials=credentials)
    
    # Fallback: Use default authentication (attached service account or ADC)
    return storage.Client()


def get_secure_storage_client():
    """
    Get storage client using the most secure method available
    """
    try:
        # Try workload identity first
        return get_gcs_client_with_workload_identity()
    except Exception:
        # Fallback to default authentication
        return storage.Client()
