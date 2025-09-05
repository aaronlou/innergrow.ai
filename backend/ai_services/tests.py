import os
import unittest
from unittest.mock import patch, MagicMock
from django.test import TestCase
from ai_services.ai_client import AIClient
from ai_services.goal_suggestions import GoalSuggestionService

class AIClientTest(TestCase):
    @patch('ai_services.ai_client.OpenAI')
    def test_generate_response(self, mock_openai):
        # Mock the OpenAI client response
        mock_response = MagicMock()
        mock_response.choices[0].message.content = "This is a test response"
        mock_openai.return_value.chat.completions.create.return_value = mock_response
        
        # Set the environment variable for the API key
        os.environ['OPENAI_API_KEY'] = 'test-api-key'
        
        # Test the AI client
        ai_client = AIClient()
        response = ai_client.generate_response("Test prompt")
        
        # Verify we got the expected response
        self.assertEqual(response, "This is a test response")

class GoalSuggestionServiceTest(TestCase):
    @patch('ai_services.goal_suggestions.AIClient')
    def test_generate_suggestions(self, mock_ai_client):
        # Mock the AI client response
        mock_ai_client.return_value.generate_response.return_value = """
        1. 制定学习计划
           每天安排2小时学习Django，分为理论学习和实践练习两部分。
           
        2. 构建实际项目
           通过构建一个博客或电商网站来应用所学的Django知识。
           
        3. 参与社区讨论
           加入Django相关的论坛或社群，与其他开发者交流经验。
        """
        
        # Test the goal suggestion service
        goal_suggestion_service = GoalSuggestionService()
        
        # Create a mock goal
        mock_goal = MagicMock()
        mock_goal.title = "Learn Django"
        mock_goal.description = "I want to learn Django to build web applications"
        
        suggestions = goal_suggestion_service.generate_suggestions(mock_goal)
        
        # Verify we got 3 suggestions
        self.assertEqual(len(suggestions), 3)
        
        # Verify the structure of suggestions
        for suggestion in suggestions:
            self.assertIn('title', suggestion)
            self.assertIn('description', suggestion)
            self.assertIn('priority', suggestion)