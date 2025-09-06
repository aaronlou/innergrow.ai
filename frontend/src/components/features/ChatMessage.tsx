import React from 'react';
import { cn } from '@/lib/utils';
import { Avatar } from '@/components/ui';
import type { ChatMessage } from '@/types';

interface ChatMessageComponentProps {
  message: ChatMessage;
  showAvatar?: boolean;
}

export function ChatMessageComponent({ 
  message, 
  showAvatar = true 
}: ChatMessageComponentProps) {
  const isAssistant = message.role === 'assistant';
  
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className={cn(
      'flex gap-3 group',
      isAssistant ? 'flex-row' : 'flex-row-reverse'
    )}>
      {/* 头像 */}
      {showAvatar && (
        <div className="flex-shrink-0">
          {isAssistant ? (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-primary to-brand-secondary flex items-center justify-center text-white text-sm font-medium">
              AI
            </div>
          ) : (
            <Avatar size="sm" fallback="U" />
          )}
        </div>
      )}
      
      {/* 消息内容 */}
      <div className={cn(
        'flex-1 min-w-0 max-w-[80%]',
        !showAvatar && (isAssistant ? 'ml-11' : 'mr-11')
      )}>
        {/* 消息头部信息 */}
        <div className={cn(
          'flex items-center space-x-2 mb-1',
          isAssistant ? 'justify-start' : 'justify-end'
        )}>
          <span className="text-sm font-medium">
            {isAssistant ? 'AI 助手' : '您'}
          </span>
          <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            {formatTime(message.timestamp)}
          </span>
        </div>
        
        {/* 消息气泡 */}
        <div className={cn(
          'rounded-lg px-4 py-2 text-sm whitespace-pre-wrap break-words',
          isAssistant
            ? 'bg-accent text-accent-foreground'
            : 'bg-brand-primary text-white ml-auto'
        )}>
          {message.content}
        </div>
        
        {/* 消息类型标签 */}
        {message.type && message.type !== 'text' && (
          <div className={cn(
            'mt-1 text-xs text-muted-foreground',
            isAssistant ? 'text-left' : 'text-right'
          )}>
            {message.type === 'goal_suggestion' ? '🎯 目标建议' : null}
            {message.type === 'reflection' ? '🤔 反思' : null}
          </div>
        )}
      </div>
    </div>
  );
}