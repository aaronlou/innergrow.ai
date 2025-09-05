from .ai_client import AIClient
from goals.models import Goal

class GoalSuggestionService:
    def __init__(self):
        self.ai_client = AIClient()
    
    def generate_suggestions(self, goal: Goal, language='zh', model=None):
        """Generate AI suggestions for a given goal using OpenAI's ChatGPT"""
        
        # Determine language for the AI response
        if language.lower() in ['zh', 'zh-cn', 'zh-hans', 'chinese']:
            response_language = "Chinese"
            instruction_language = "Chinese"
        else:
            response_language = "English"
            instruction_language = "English"
        
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
        Write the response in {response_language}.
        """
        
        # Generate response from AI
        suggestions_text = self.ai_client.generate_response(prompt, model=model)
        
        # Parse the suggestions
        suggestions = self._parse_suggestions(suggestions_text, language=instruction_language)
        
        return suggestions
    
    def _parse_suggestions(self, suggestions_text, language='Chinese'):
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