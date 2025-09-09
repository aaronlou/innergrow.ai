"""
Google Cloud Storage utility functions
Based on Google's official documentation
"""

from google.cloud import storage
from django.conf import settings
import os
import logging
from typing import Optional, List

logger = logging.getLogger(__name__)


class GCSManager:
    """Google Cloud Storage Manager with enhanced functionality"""
    
    def __init__(self):
        """Initialize GCS client with secure authentication"""
        try:
            # Use default authentication (attached service account preferred)
            self.client = storage.Client()
            self.bucket_name = getattr(settings, 'GS_BUCKET_NAME', 'innergrow-media')
            self.bucket = self.client.bucket(self.bucket_name)
        except Exception as e:
            logger.error(f"Failed to initialize GCS client: {e}")
            self.client = None
            self.bucket = None
    
    def upload_blob(self, source_file_path: str, destination_blob_name: str) -> bool:
        """
        Upload a file to the bucket
        Args:
            source_file_path: Path to local file
            destination_blob_name: Name of the blob in GCS
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.bucket:
            logger.error("GCS client not initialized")
            return False
            
        try:
            blob = self.bucket.blob(destination_blob_name)
            blob.upload_from_filename(source_file_path)
            logger.info(f"File {source_file_path} uploaded to {destination_blob_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to upload {source_file_path}: {e}")
            return False
    
    def upload_from_memory(self, file_content: bytes, destination_blob_name: str, 
                          content_type: Optional[str] = None) -> bool:
        """
        Upload file content directly from memory
        Args:
            file_content: File content as bytes
            destination_blob_name: Name of the blob in GCS
            content_type: MIME type of the file
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.bucket:
            logger.error("GCS client not initialized")
            return False
            
        try:
            blob = self.bucket.blob(destination_blob_name)
            if content_type:
                blob.content_type = content_type
            blob.upload_from_string(file_content)
            logger.info(f"File content uploaded to {destination_blob_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to upload content to {destination_blob_name}: {e}")
            return False
    
    def download_blob(self, source_blob_name: str, destination_file_path: str) -> bool:
        """
        Download a blob to a local file
        Args:
            source_blob_name: Name of the blob in GCS
            destination_file_path: Path where to save the file locally
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.bucket:
            logger.error("GCS client not initialized")
            return False
            
        try:
            blob = self.bucket.blob(source_blob_name)
            blob.download_to_filename(destination_file_path)
            logger.info(f"Blob {source_blob_name} downloaded to {destination_file_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to download {source_blob_name}: {e}")
            return False
    
    def get_blob_content(self, blob_name: str) -> Optional[bytes]:
        """
        Get blob content as bytes
        Args:
            blob_name: Name of the blob in GCS
        Returns:
            bytes: File content or None if failed
        """
        if not self.bucket:
            logger.error("GCS client not initialized")
            return None
            
        try:
            blob = self.bucket.blob(blob_name)
            return blob.download_as_bytes()
        except Exception as e:
            logger.error(f"Failed to get content of {blob_name}: {e}")
            return None
    
    def list_blobs(self, prefix: Optional[str] = None) -> List[str]:
        """
        List all blobs in the bucket
        Args:
            prefix: Filter blobs by prefix (e.g., 'exam_materials/')
        Returns:
            List[str]: List of blob names
        """
        if not self.bucket:
            logger.error("GCS client not initialized")
            return []
            
        try:
            blobs = self.client.list_blobs(self.bucket_name, prefix=prefix)
            blob_names = [blob.name for blob in blobs]
            logger.info(f"Found {len(blob_names)} blobs with prefix '{prefix}'")
            return blob_names
        except Exception as e:
            logger.error(f"Failed to list blobs: {e}")
            return []
    
    def delete_blob(self, blob_name: str) -> bool:
        """
        Delete a blob from the bucket
        Args:
            blob_name: Name of the blob to delete
        Returns:
            bool: True if successful, False otherwise
        """
        if not self.bucket:
            logger.error("GCS client not initialized")
            return False
            
        try:
            blob = self.bucket.blob(blob_name)
            blob.delete()
            logger.info(f"Blob {blob_name} deleted from bucket {self.bucket_name}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete {blob_name}: {e}")
            return False
    
    def blob_exists(self, blob_name: str) -> bool:
        """
        Check if a blob exists in the bucket
        Args:
            blob_name: Name of the blob to check
        Returns:
            bool: True if exists, False otherwise
        """
        if not self.bucket:
            return False
            
        try:
            blob = self.bucket.blob(blob_name)
            return blob.exists()
        except Exception as e:
            logger.error(f"Failed to check existence of {blob_name}: {e}")
            return False
    
    def get_blob_info(self, blob_name: str) -> Optional[dict]:
        """
        Get blob metadata information
        Args:
            blob_name: Name of the blob
        Returns:
            dict: Blob information or None if failed
        """
        if not self.bucket:
            return None
            
        try:
            blob = self.bucket.blob(blob_name)
            blob.reload()  # Fetch latest metadata
            
            return {
                'name': blob.name,
                'size': blob.size,
                'content_type': blob.content_type,
                'created': blob.time_created,
                'updated': blob.updated,
                'public_url': blob.public_url,
                'media_link': blob.media_link
            }
        except Exception as e:
            logger.error(f"Failed to get info for {blob_name}: {e}")
            return None
    
    def generate_signed_url(self, blob_name: str, expiration_minutes: int = 60) -> Optional[str]:
        """
        Generate a signed URL for temporary access to a blob
        Args:
            blob_name: Name of the blob
            expiration_minutes: URL expiration time in minutes
        Returns:
            str: Signed URL or None if failed
        """
        if not self.bucket:
            return None
            
        try:
            blob = self.bucket.blob(blob_name)
            from datetime import datetime, timedelta
            
            url = blob.generate_signed_url(
                expiration=datetime.utcnow() + timedelta(minutes=expiration_minutes),
                method='GET'
            )
            logger.info(f"Generated signed URL for {blob_name}")
            return url
        except Exception as e:
            logger.error(f"Failed to generate signed URL for {blob_name}: {e}")
            return None


# Global instance
gcs_manager = GCSManager()
