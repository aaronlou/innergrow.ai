import React, { useState, useRef, useEffect } from 'react';
import { Button, Input } from '@/components/ui';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ 
  onSend, 
  disabled = false, 
  placeholder = '输入您的消息...' 
}: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 自动调整文本框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border border-border rounded-lg bg-background focus-within:ring-1 focus-within:ring-ring">
      <div className="flex items-end gap-2 p-3">
        {/* 文本输入区域 */}
        <div className="flex-1 min-h-[40px]">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onCompositionStart={() => setIsComposing(true)}
            onCompositionEnd={() => setIsComposing(false)}
            placeholder={placeholder}
            disabled={disabled}
            className={cn(
              'w-full resize-none border-0 bg-transparent text-sm',
              'placeholder:text-muted-foreground focus:outline-none',
              'min-h-[24px] max-h-[96px] leading-6'
            )}
            rows={1}
          />
        </div>

        {/* 发送按钮 */}
        <Button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          size="sm"
          className="shrink-0"
        >
          发送
        </Button>
      </div>

      {/* 提示文本 */}
      <div className="px-3 pb-2">
        <p className="text-xs text-muted-foreground">
          按 Enter 发送，Shift + Enter 换行
        </p>
      </div>
    </div>
  );
}