import os
from openai import OpenAI
from django.conf import settings

class AIClient:
    def __init__(self):
        # Get the API key from Django settings (which loads from .env.production)
        # Fallback to environment variable if not in settings
        api_key = getattr(settings, 'OPENAI_API_KEY', None) or os.environ.get('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY not set in environment or Django settings")
        
        # Handle proxy settings explicitly to avoid conflicts
        # Create the OpenAI client without passing proxy arguments
        self.client = OpenAI(api_key=api_key)
        
        # Default model (can be overridden)
        self.default_model = getattr(settings, 'OPENAI_MODEL', None) or os.environ.get('OPENAI_MODEL', 'gpt-5')
    
    def generate_response(self, prompt, model=None, max_tokens=500, temperature=0.7):
        """Generate a response from OpenAI's model"""
        # Use provided model or default model
        if model is None:
            model = self.default_model
            
        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": "You are a helpful assistant."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=max_tokens,
                temperature=temperature
            )
            
            # Handle case where content might be None
            content = response.choices[0].message.content
            if content is None:
                raise Exception("AI response content is empty")
            
            return content.strip()
            
        except Exception as e:
            raise Exception(f"Failed to generate AI response: {str(e)}")