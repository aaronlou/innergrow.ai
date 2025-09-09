import os
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


def validate_file_extension(value):
    """Validate file extension for exam materials"""
    
    allowed_extensions = ['.pdf', '.doc', '.docx']
    ext = os.path.splitext(value.name)[1].lower()
    
    if ext not in allowed_extensions:
        raise ValidationError(
            _('File type not allowed. Please upload PDF, DOC, or DOCX files only.'),
            code='invalid_extension',
        )


def validate_file_size(value):
    """Validate file size (max 10MB)"""
    
    max_size = 50 * 1024 * 1024  # 10MB in bytes
    
    if value.size > max_size:
        raise ValidationError(
            _('File too large. Size should not exceed 10MB.'),
            code='file_too_large',
        )


def validate_exam_material(value):
    """Combined validation for exam materials"""
    validate_file_extension(value)
    validate_file_size(value)
