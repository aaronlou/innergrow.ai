from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Goal, GoalCategory, GoalStatus


class GoalAPITestCase(TestCase):
    """目标API测试用例"""
    
    def setUp(self):
        """测试初始化"""
        self.user = get_user_model().objects.create_user(
            email='test@example.com',
            username='testuser',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        
        self.other_user = get_user_model().objects.create_user(
            email='other@example.com',
            username='otheruser',
            password='otherpass123',
            first_name='Other',
            last_name='User'
        )
        
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        
        # 创建测试分类和状态
        self.category = GoalCategory.objects.create(
            name='Learning',
            name_en='学习'
        )
        
        self.status = GoalStatus.objects.create(
            name='Active',
            name_en='进行中'
        )
        
        # 创建测试目标
        self.private_goal = Goal.objects.create(
            user=self.user,
            title='Private Goal',
            description='Private Goal Description',
            category=self.category,
            status=self.status,
            visibility='private',
            progress=50,
            target_date='2024-12-31'
        )
        
        self.public_goal = Goal.objects.create(
            user=self.user,
            title='Public Goal',
            description='Public Goal Description',
            category=self.category,
            status=self.status,
            visibility='public',
            progress=75,
            target_date='2024-12-31'
        )
    
    def test_create_goal(self):
        """测试创建目标"""
        data = {
            'title': 'New Goal',
            'description': 'New Goal Description',
            'category_id': self.category.id,
            'status_id': self.status.id,
            'visibility': 'private',
            'target_date': '2024-12-31'
        }
        
        response = self.client.post('/api/goals/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Goal.objects.count(), 3)
        self.assertEqual(response.data['title'], 'New Goal')
    
    def test_get_goals_list(self):
        """测试获取目标列表"""
        response = self.client.get('/api/goals/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
    
    def test_get_private_goal_detail(self):
        """测试获取私密目标详情"""
        response = self.client.get(f'/api/goals/{self.private_goal.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Private Goal')
    
    def test_get_public_goal_detail(self):
        """测试获取公开目标详情"""
        response = self.client.get(f'/api/goals/{self.public_goal.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Public Goal')
    
    def test_update_goal(self):
        """测试更新目标"""
        data = {
            'progress': 75
        }
        
        response = self.client.patch(f'/api/goals/{self.private_goal.id}/', data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.private_goal.refresh_from_db()
        self.assertEqual(self.private_goal.progress, 75)
    
    def test_delete_goal(self):
        """测试删除目标"""
        response = self.client.delete(f'/api/goals/{self.private_goal.id}/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(Goal.objects.count(), 1)
    
    def test_goal_statistics(self):
        """测试目标统计"""
        response = self.client.get('/api/goals/statistics/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('total', response.data['data'])
        self.assertIn('active', response.data['data'])
        self.assertIn('completed', response.data['data'])
        self.assertIn('paused', response.data['data'])
        self.assertIn('public', response.data['data'])
        self.assertIn('private', response.data['data'])
    
    def test_get_categories(self):
        """测试获取分类列表"""
        response = self.client.get('/api/goals/categories/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 1)
    
    def test_get_statuses(self):
        """测试获取状态列表"""
        response = self.client.get('/api/goals/statuses/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['data']), 1)
    
    def test_get_public_goals_list_unauthenticated(self):
        """测试未认证用户获取公开目标列表"""
        # 创建未认证客户端
        unauth_client = APIClient()
        
        response = unauth_client.get('/api/goals/public/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 应该只能看到公开的目标
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Public Goal')
    
    def test_get_public_goal_detail_unauthenticated(self):
        """测试未认证用户获取公开目标详情"""
        # 创建未认证客户端
        unauth_client = APIClient()
        
        response = unauth_client.get(f'/api/goals/public/{self.public_goal.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Public Goal')
    
    def test_cannot_access_private_goal_unauthenticated(self):
        """测试未认证用户无法访问私密目标"""
        # 创建未认证客户端
        unauth_client = APIClient()
        
        response = unauth_client.get(f'/api/goals/public/{self.private_goal.id}/')
        # 应该返回404，因为私密目标不在公开列表中
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)