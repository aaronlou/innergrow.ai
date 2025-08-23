'use client';

import { Button } from '@/components/ui';
import { DashboardLayout, ProtectedRoute } from '@/components/layout';
import { ChatMessageComponent, ChatInput } from '@/components/features';
import { useChat } from '@/contexts';
import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export default function ChatPage() {
  const { 
    currentSession, 
    sessions, 
    isLoading, 
    sendMessage, 
    createNewSession, 
    switchSession 
  } = useChat();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession?.messages]);

  // 如果没有当前会话，创建一个新的
  useEffect(() => {
    if (!currentSession && sessions.length === 0) {
      createNewSession();
    }
  }, [currentSession, sessions.length, createNewSession]);

  const quickQuestions = [
    '如何设定有效的目标？',
    '怎样建立好习惯？', 
    '如何保持学习动力？',
    '时间管理有什么技巧？',
    '如何克服拖延症？'
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="h-[calc(100vh-4rem)] flex">
          {/* 主聊天区域 */}
          <div className="flex-1 flex flex-col">
            {/* 聊天头部 */}
            <div className="p-6 border-b border-border bg-card">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold mb-1">AI 成长助手</h1>
                  <p className="text-sm text-muted-foreground">
                    {currentSession ? currentSession.title : '开始新的对话'}
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => createNewSession()}
                  size="sm"
                >
                  + 新对话
                </Button>
              </div>
            </div>

            {/* 消息列表 */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-4xl mx-auto p-6">
                {currentSession?.messages.map((message, index) => {
                  const prevMessage = currentSession.messages[index - 1];
                  const showAvatar = !prevMessage || prevMessage.role !== message.role;
                  
                  return (
                    <div key={message.id} className="mb-6">
                      <ChatMessageComponent 
                        message={message} 
                        showAvatar={showAvatar}
                      />
                    </div>
                  );
                })}
                
                {/* 加载指示器 */}
                {isLoading && (
                  <div className="flex gap-3 mb-6">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white text-sm font-medium">
                      AI
                    </div>
                    <div className="flex-1">
                      <div className="bg-accent rounded-lg p-4 max-w-xs">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>
            
            {/* 输入区域 */}
            <div className="p-6 border-t border-border bg-card">
              <div className="max-w-4xl mx-auto">
                <ChatInput 
                  onSend={sendMessage}
                  disabled={isLoading}
                  placeholder="与AI助手分享您的想法和问题..."
                />
              </div>
            </div>
          </div>

          {/* 右侧边栏 */}
          <div className="w-80 border-l border-border bg-muted/30 flex flex-col">
            {/* 会话历史 */}
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold mb-3">对话历史</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => switchSession(session.id)}
                    className={cn(
                      'w-full text-left p-2 rounded text-sm transition-colors',
                      currentSession?.id === session.id
                        ? 'bg-brand-primary text-white'
                        : 'hover:bg-accent'
                    )}
                  >
                    <div className="truncate">{session.title}</div>
                    <div className="text-xs opacity-70 mt-1">
                      {session.updatedAt.toLocaleString('zh-CN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 快捷问题 */}
            <div className="flex-1 p-4">
              <h3 className="font-semibold mb-3">常见问题</h3>
              <div className="space-y-2">
                {quickQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(question)}
                    className="w-full text-left p-3 text-sm border border-border rounded-lg hover:bg-accent transition-colors"
                    disabled={isLoading}
                  >
                    {question}
                  </button>
                ))}
              </div>
              
              {/* 使用提示 */}
              <div className="mt-6 p-3 bg-accent/50 rounded-lg">
                <h4 className="text-sm font-medium mb-2">💡 使用提示</h4>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• 详细描述您的情况</li>
                  <li>• 提出具体的问题</li> 
                  <li>• 分享您的目标和挑战</li>
                  <li>• 随时询问更多建议</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}