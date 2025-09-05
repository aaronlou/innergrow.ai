import os
import unittest
from unittest.mock import patch, MagicMock
from django.test import TestCase
from goals.models import Goal, AISuggestion
from goals.ai_service import AIService

class AIServiceTest(TestCase):
    def setUp(self):
        # Create a test goal
        self.goal = Goal.objects.create(
            title="Learn Django",
            description="I want to learn Django to build web applications"
        )
    
    @patch('goals.ai_service.OpenAI')
    def test_generate_goal_suggestions(self, mock_openai):
        # Mock the OpenAI client response
        mock_response = MagicMock()
        mock_response.choices[0].message.content = """
        1. 制定学习计划
           每天安排2小时学习Django，分为理论学习和实践练习两部分。
           
        2. 构建实际项目
           通过构建一个博客或电商网站来应用所学的Django知识。
           
        3. 参与社区讨论
           加入Django相关的论坛或社群，与其他开发者交流经验。
        """
        mock_openai.return_value.chat.completions.create.return_value = mock_response
        
        # Test the AI service
        ai_service = AIService()
        suggestions = ai_service.generate_goal_suggestions(self.goal)
        
        # Verify we got 3 suggestions
        self.assertEqual(len(suggestions), 3)
        
        # Verify the structure of suggestions
        for suggestion in suggestions:
            self.assertIn('title', suggestion)
            self.assertIn('description', suggestion)
            self.assertIn('priority', suggestion)
    
    def test_parse_suggestions(self):
        # Test the parsing functionality
        ai_service = AIService()
        
        suggestions_text = """
        1. 制定学习计划
           每天安排2小时学习Django，分为理论学习和实践练习两部分。
           
        2. 构建实际项目
           通过构建一个博客或电商网站来应用所学的Django知识。
           
        3. 参与社区讨论
           加入Django相关的论坛或社群，与其他开发者交流经验。
        """
        
        suggestions = ai_service._parse_suggestions(suggestions_text)
        
        # Verify we got 3 suggestions
        self.assertEqual(len(suggestions), 3)
        
        # Verify the content
        self.assertEqual(suggestions[0]['title'], '制定学习计划')
        self.assertIn('每天安排2小时', suggestions[0]['description'])
        self.assertEqual(suggestions[0]['priority'], 'high')