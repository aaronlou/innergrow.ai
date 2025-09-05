import os
from openai import OpenAI
from django.conf import settings
from .models import Goal

class AIService:
    def __init__(self):
        # Get the API key from environment variables
        api_key = os.environ.get('OPENAI_API_KEY')
        if not api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")
        
        self.client = OpenAI(api_key=api_key)
    
    def generate_goal_suggestions(self, goal: Goal):
        """Generate AI suggestions for a given goal using OpenAI's ChatGPT-5"""
        
        # Create a prompt for the AI
        prompt = f"""
        You are an AI assistant helping users achieve their goals. 
        Based on the following goal, provide 3 actionable suggestions to help the user achieve it.
        
        Goal: {goal.title}
        Description: {goal.description}
        
        Please provide suggestions in the following format:
        1. [Suggestion Title]
           [Detailed description of the suggestion]
           
        2. [Suggestion Title]
           [Detailed description of the suggestion]
           
        3. [Suggestion Title]
           [Detailed description of the suggestion]
           
        Make the suggestions specific, actionable, and prioritized (high, medium, low).
        Write in Chinese.
        """
        
        try:
            # Call the OpenAI API
            response = self.client.chat.completions.create(
                model="gpt-5-turbo",  # Using ChatGPT-5
                messages=[
                    {"role": "system", "content": "You are a helpful assistant for goal achievement."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.7
            )
            
            # Extract the response content
            suggestions_text = response.choices[0].message.content.strip()
            
            # Parse the suggestions
            suggestions = self._parse_suggestions(suggestions_text)
            
            return suggestions
            
        except Exception as e:
            # Handle API errors gracefully
            raise Exception(f"Failed to generate AI suggestions: {str(e)}")
    
    def _parse_suggestions(self, suggestions_text):
        """Parse the AI response into structured suggestions"""
        suggestions = []
        lines = suggestions_text.split('\n')
        
        current_suggestion = None
        priority_order = ['high', 'medium', 'low']
        priority_index = 0
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Check if this line starts a new suggestion
            if line.startswith(('1.', '2.', '3.')):
                if current_suggestion:
                    suggestions.append(current_suggestion)
                
                # Extract title (everything after the number and period)
                title = line.split('.', 1)[1].strip()
                current_suggestion = {
                    'title': title,
                    'description': '',
                    'priority': priority_order[priority_index] if priority_index < len(priority_order) else 'low'
                }
                priority_index += 1
            elif current_suggestion:
                # Add to the description
                if current_suggestion['description']:
                    current_suggestion['description'] += '\n' + line
                else:
                    current_suggestion['description'] = line
        
        # Add the last suggestion
        if current_suggestion:
            suggestions.append(current_suggestion)
            
        return suggestions