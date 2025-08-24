#!/usr/bin/env python3
"""
InnerGrow.ai 后端API测试脚本
用于验证API端点的基本功能
"""

import requests
import json
import sys
from typing import Dict, Any

# API基础URL
BASE_URL = "http://localhost:8000/api"

class APITester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        
    def test_api_root(self) -> bool:
        """测试API根端点"""
        try:
            response = self.session.get(f"{BASE_URL}/")
            if response.status_code == 200:
                data = response.json()
                print("✅ API根端点正常")
                print(f"   消息: {data.get('message', 'N/A')}")
                return True
            else:
                print(f"❌ API根端点失败: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ API根端点错误: {e}")
            return False
    
    def test_user_registration(self) -> bool:
        """测试用户注册"""
        try:
            user_data = {
                "name": "测试用户",
                "email": "test@innergrow.ai",
                "password": "password123",
                "confirm_password": "password123"
            }
            
            response = self.session.post(
                f"{BASE_URL}/accounts/auth/register/",
                json=user_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 201:
                data = response.json()
                if data.get('success'):
                    self.token = data['data']['token']
                    print("✅ 用户注册成功")
                    print(f"   Token: {self.token[:20]}...")
                    return True
                else:
                    print(f"❌ 用户注册失败: {data.get('error', 'Unknown error')}")
                    return False
            else:
                print(f"❌ 用户注册失败: {response.status_code}")
                if response.text:
                    print(f"   响应: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ 用户注册错误: {e}")
            return False
    
    def test_user_login(self) -> bool:
        """测试用户登录"""
        try:
            login_data = {
                "email": "test@innergrow.ai",
                "password": "password123"
            }
            
            response = self.session.post(
                f"{BASE_URL}/accounts/auth/login/",
                json=login_data,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    self.token = data['data']['token']
                    print("✅ 用户登录成功")
                    return True
                else:
                    print(f"❌ 用户登录失败: {data.get('error', 'Unknown error')}")
                    return False
            else:
                print(f"❌ 用户登录失败: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ 用户登录错误: {e}")
            return False
    
    def test_get_profile(self) -> bool:
        """测试获取用户信息"""
        if not self.token:
            print("❌ 没有认证Token，跳过获取用户信息测试")
            return False
            
        try:
            headers = {"Authorization": f"Token {self.token}"}
            response = self.session.get(
                f"{BASE_URL}/accounts/profile/",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    print("✅ 获取用户信息成功")
                    user_data = data['data']
                    print(f"   用户: {user_data.get('name', 'N/A')} ({user_data.get('email', 'N/A')})")
                    return True
                else:
                    print(f"❌ 获取用户信息失败: {data.get('error', 'Unknown error')}")
                    return False
            else:
                print(f"❌ 获取用户信息失败: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ 获取用户信息错误: {e}")
            return False
    
    def test_get_books(self) -> bool:
        """测试获取书籍列表"""
        try:
            response = self.session.get(f"{BASE_URL}/books/")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    books = data['data']
                    print(f"✅ 获取书籍列表成功 (共{len(books)}本)")
                    return True
                else:
                    print(f"❌ 获取书籍列表失败: {data.get('error', 'Unknown error')}")
                    return False
            else:
                print(f"❌ 获取书籍列表失败: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ 获取书籍列表错误: {e}")
            return False
    
    def test_create_book(self) -> bool:
        """测试创建书籍"""
        if not self.token:
            print("❌ 没有认证Token，跳过创建书籍测试")
            return False
            
        try:
            book_data = {
                "title": "Python编程从入门到实践",
                "author": "Eric Matthes",
                "category": "technology",
                "condition": "like-new",
                "description": "这是一本很好的Python入门书籍",
                "price": "45.00",
                "location": "北京",
                "tags": ["编程", "Python", "入门"]
            }
            
            headers = {
                "Authorization": f"Token {self.token}",
                "Content-Type": "application/json"
            }
            
            response = self.session.post(
                f"{BASE_URL}/books/",
                json=book_data,
                headers=headers
            )
            
            if response.status_code == 201:
                data = response.json()
                if data.get('success'):
                    print("✅ 创建书籍成功")
                    book = data['data']
                    print(f"   书籍: {book.get('title', 'N/A')} - ¥{book.get('price', 'N/A')}")
                    return True
                else:
                    print(f"❌ 创建书籍失败: {data.get('error', 'Unknown error')}")
                    return False
            else:
                print(f"❌ 创建书籍失败: {response.status_code}")
                if response.text:
                    print(f"   响应: {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ 创建书籍错误: {e}")
            return False
    
    def test_book_categories(self) -> bool:
        """测试获取书籍分类"""
        try:
            response = self.session.get(f"{BASE_URL}/books/categories/")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success'):
                    categories = data['data']
                    print(f"✅ 获取书籍分类成功 (共{len(categories)}个)")
                    return True
                else:
                    print(f"❌ 获取书籍分类失败: {data.get('error', 'Unknown error')}")
                    return False
            else:
                print(f"❌ 获取书籍分类失败: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"❌ 获取书籍分类错误: {e}")
            return False
    
    def run_tests(self):
        """运行所有测试"""
        print("🧪 开始API测试...")
        print(f"🎯 目标URL: {BASE_URL}")
        print("-" * 50)
        
        tests = [
            ("API根端点", self.test_api_root),
            ("用户注册", self.test_user_registration),
            ("用户登录", self.test_user_login),
            ("获取用户信息", self.test_get_profile),
            ("获取书籍列表", self.test_get_books),
            ("创建书籍", self.test_create_book),
            ("获取书籍分类", self.test_book_categories),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n🔍 测试: {test_name}")
            if test_func():
                passed += 1
        
        print("-" * 50)
        print(f"📊 测试结果: {passed}/{total} 通过")
        
        if passed == total:
            print("🎉 所有测试通过！")
            return True
        else:
            print("⚠️  部分测试失败，请检查服务器状态")
            return False


def main():
    """主函数"""
    print("InnerGrow.ai 后端API测试工具")
    print("=" * 50)
    
    # 检查服务器是否运行
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        print("✅ 服务器连接正常")
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到服务器")
        print("请确保Django服务器正在运行:")
        print("   python manage.py runserver 8000")
        sys.exit(1)
    except Exception as e:
        print(f"❌ 连接错误: {e}")
        sys.exit(1)
    
    # 运行测试
    tester = APITester()
    success = tester.run_tests()
    
    if success:
        print("\n🚀 API已准备就绪，可以开始前后端集成！")
        sys.exit(0)
    else:
        print("\n🔧 请修复失败的测试后再试")
        sys.exit(1)


if __name__ == "__main__":
    main()