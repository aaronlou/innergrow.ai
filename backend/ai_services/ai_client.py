import os
from openai import OpenAI
from django.conf import settings

class AIClient:
    def __init__(self):
        # Get the API key from environment variables
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")
        
        self.client = OpenAI(api_key=api_key)
        # Default model (can be overridden)
        self.default_model = os.environ.get('OPENAI_MODEL', 'gpt-4-turbo')
    
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
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            raise Exception(f"Failed to generate AI response: {str(e)}")