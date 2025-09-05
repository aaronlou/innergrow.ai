'use client';

import { useAuth } from '@/contexts';
import { getAuthToken, getAuthScheme, getApiBaseUrl } from '@/lib/utils';
import { useState, useEffect } from 'react';

export default function DebugPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const token = getAuthToken();
    const scheme = getAuthScheme();
    const baseUrl = getApiBaseUrl();
    
    const info = {
      user: user,
      isAuthenticated,
      isLoading,
      token: token ? `${token.substring(0, 10)}...` : null,
      tokenLength: token?.length || 0,
      scheme,
      baseUrl,
      localStorage: {
        auth_token: typeof window !== 'undefined' ? localStorage.getItem('auth_token')?.substring(0, 10) + '...' : null,
        auth_user: typeof window !== 'undefined' ? localStorage.getItem('auth_user') : null,
      },
      shouldRedirect: !isLoading && !isAuthenticated,
      timestamp: new Date().toISOString()
    };

    setDebugInfo(info);
  }, [user, isAuthenticated, isLoading]);

  const testAPI = async () => {
    const token = getAuthToken();
    const scheme = getAuthScheme();
    const baseUrl = getApiBaseUrl();
    
    try {
      const response = await fetch(`${baseUrl}/api/goals/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `${scheme} ${token}` : '',
        },
      });

      const data = await response.json();
      console.log('API Test Result:', {
        status: response.status,
        statusText: response.statusText,
        data: data
      });
      
      alert(`API Test Result:\nStatus: ${response.status}\nData: ${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      console.error('API Test Error:', error);
      alert(`API Test Error: ${String(error)}`);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">认证调试页面</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-3">当前认证状态</h2>
          <pre className="text-sm overflow-auto bg-white p-3 rounded">
            {debugInfo ? JSON.stringify(debugInfo, null, 2) : '加载中...'}
          </pre>
        </div>

        <div className="space-y-4">
          <button 
            onClick={testAPI}
            className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
          >
            测试 API 调用
          </button>
          
          <button 
            onClick={() => window.location.reload()}
            className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 ml-4"
          >
            刷新页面
          </button>
        </div>

        <div className="bg-yellow-100 p-4 rounded-lg">
          <h3 className="font-semibold mb-2">调试说明：</h3>
          <ul className="text-sm space-y-1">
            <li>• 如果 <code>isAuthenticated</code> 为 false，说明用户未登录</li>
            <li>• 如果 <code>token</code> 为 null，说明没有认证token</li>
            <li>• 如果 <code>user</code> 为 null，说明用户信息未加载</li>
            <li>• 如果 <code>shouldRedirect</code> 为 true，应该会跳转到登录页面</li>
            <li>• 如果 <code>isLoading</code> 为 true，正在验证身份</li>
            <li>• 点击"测试 API 调用"按钮可以测试实际的API请求</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
