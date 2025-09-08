from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from .models import WaitlistFeature, WaitlistEntry


class WaitlistFeatureSerializer(serializers.ModelSerializer):
    """Serializer for waitlist features"""
    
    waitlist_count = serializers.ReadOnlyField()
    is_user_joined = serializers.SerializerMethodField()
    
    class Meta:
        model = WaitlistFeature
        fields = [
            'id', 'name', 'display_name', 'description', 
            'is_active', 'waitlist_count', 'is_user_joined',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_is_user_joined(self, obj):
        """Check if current user has joined this feature's waitlist"""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return WaitlistEntry.objects.filter(
                user=request.user,
                feature=obj,
                is_active=True
            ).exists()
        return False


class WaitlistEntrySerializer(serializers.ModelSerializer):
    """Serializer for waitlist entries"""
    
    user_id = serializers.CharField(source='user.id', read_only=True)
    user_name = serializers.CharField(source='user.username', read_only=True)
    feature_name = serializers.CharField(source='feature.name', read_only=True)
    feature_display_name = serializers.CharField(source='feature.display_name', read_only=True)
    
    class Meta:
        model = WaitlistEntry
        fields = [
            'id', 'user_id', 'user_name', 'feature_name', 
            'feature_display_name', 'is_active', 'priority',
            'notes', 'joined_at', 'updated_at'
        ]
        read_only_fields = ['joined_at', 'updated_at', 'user_id', 'user_name']


class JoinWaitlistSerializer(serializers.Serializer):
    """Serializer for joining a waitlist"""
    
    feature_name = serializers.CharField(max_length=50)
    notes = serializers.CharField(max_length=500, required=False, allow_blank=True)
    
    def validate_feature_name(self, value):
        """Validate that the feature exists and is active"""
        try:
            feature = WaitlistFeature.objects.get(name=value, is_active=True)
            return value
        except WaitlistFeature.DoesNotExist:
            raise serializers.ValidationError(_('Feature not found or not active'))
    
    def create(self, validated_data):
        """Create or update waitlist entry"""
        user = self.context['request'].user
        feature_name = validated_data['feature_name']
        notes = validated_data.get('notes', '')
        
        feature = WaitlistFeature.objects.get(name=feature_name)
        
        entry, created = WaitlistEntry.objects.get_or_create(
            user=user,
            feature=feature,
            defaults={
                'notes': notes,
                'is_active': True
            }
        )
        
        if not created and not entry.is_active:
            # Reactivate if previously left
            entry.is_active = True
            entry.notes = notes
            entry.save()
        
        return entry
