from .ai_client import AIClient
from exams.models import Exam

class ExamSuggestionService:
    def __init__(self):
        self.ai_client = AIClient()
    
    def generate_study_plan(self, exam: Exam, language='zh', model=None):
        """Generate a study plan for an exam using OpenAI's ChatGPT"""
        
        # Determine language for the AI response
        if language.lower() in ['zh', 'zh-cn', 'zh-hans', 'chinese']:
            response_language = "Chinese"
            instruction_language = "Chinese"
        else:
            response_language = "English"
            instruction_language = "English"
        
        # Create a prompt for the AI
        prompt = f"""
        You are an AI assistant helping users prepare for exams.
        Based on the following exam information, create a study plan.
        
        Exam: {exam.title}
        Subject: {exam.subject}
        Description: {exam.description}
        
        Please provide a study plan in the following format:
        1. [Task Title]
           [Detailed description of the task]
           
        2. [Task Title]
           [Detailed description of the task]
           
        3. [Task Title]
           [Detailed description of the task]
           
        Make the tasks specific, actionable, and prioritized (high, medium, low).
        Write the response in {response_language}.
        """
        
        # Generate response from AI
        study_plan_text = self.ai_client.generate_response(prompt, model=model)
        
        # Parse the study plan
        study_plan = self._parse_study_plan(study_plan_text, language=instruction_language)
        
        return study_plan
    
    def _parse_study_plan(self, study_plan_text, language='Chinese'):
        """Parse the AI response into structured study plan items"""
        study_plan = []
        lines = study_plan_text.split('\n')
        
        current_item = None
        priority_order = ['high', 'medium', 'low']
        priority_index = 0
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Check if this line starts a new item
            if line.startswith(('1.', '2.', '3.')):
                if current_item:
                    study_plan.append(current_item)
                
                # Extract title (everything after the number and period)
                title = line.split('.', 1)[1].strip()
                current_item = {
                    'title': title,
                    'description': '',
                    'priority': priority_order[priority_index] if priority_index < len(priority_order) else 'low'
                }
                priority_index += 1
            elif current_item:
                # Add to the description
                if current_item['description']:
                    current_item['description'] += '\n' + line
                else:
                    current_item['description'] = line
        
        # Add the last item
        if current_item:
            study_plan.append(current_item)
            
        return study_plan