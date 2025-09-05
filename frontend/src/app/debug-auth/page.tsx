'use client';

import { useAuth } from '@/contexts';
import { getAuthToken, getAuthScheme, getApiBaseUrl } from '@/lib/utils';
import { useState } from 'react';

export default function DebugAuthPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [testResult, setTestResult] = useState<string>('');

  const testAuth = async () => {
    const token = getAuthToken();
    const scheme = getAuthScheme();
    const baseUrl = getApiBaseUrl();
    
    const debugInfo = {
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
      }
    };

    setTestResult(JSON.stringify(debugInfo, null, 2));

    // 测试API调用
    try {
      const response = await fetch(`${baseUrl}/api/goals/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `${scheme} ${token}` : '',
        },
      });

      const data = await response.json();
      setTestResult(prev => prev + '\n\nAPI Test Result:\n' + JSON.stringify({
        status: response.status,
        statusText: response.statusText,
        data: data
      }, null, 2));
    } catch (error) {
      setTestResult(prev => prev + '\n\nAPI Test Error:\n' + String(error));
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">认证调试页面</h1>
      
      <div className="mb-4">
        <button 
          onClick={testAuth}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          测试认证状态
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <pre className="text-sm overflow-auto">
          {testResult || '点击按钮测试认证状态'}
        </pre>
      </div>
    </div>
  );
}
