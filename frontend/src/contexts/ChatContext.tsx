'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ChatMessage, ChatSession } from '@/types';
import { generateId } from '@/lib/utils';

interface ChatContextType {
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  isLoading: boolean;
  sendMessage: (content: string) => Promise<void>;
  createNewSession: (title?: string) => ChatSession;
  switchSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: React.ReactNode;
}

// 模拟AI回复生成
const generateAIResponse = async (userMessage: string): Promise<string> => {
  // 模拟网络延迟
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  // 简单的关键词匹配回复
  const responses: Record<string, string> = {
    '目标': `关于目标设定，我建议您：

🎯 使用SMART原则：
• 具体(Specific) - 明确要达成什么
• 可衡量(Measurable) - 设定可量化的指标
• 可实现(Achievable) - 确保目标切合实际
• 相关性(Relevant) - 与您的价值观一致
• 有时限(Time-bound) - 设定明确的截止日期

💡 建议从小目标开始，逐步建立成功的习惯和信心。您现在最想实现什么目标呢？`,
    
    '习惯': `培养好习惯是个人成长的关键！以下是一些实用建议：

🔄 习惯养成循环：
• 提示(Cue) - 设定清晰的触发条件
• 行为(Routine) - 执行具体的行动
• 奖励(Reward) - 给自己积极的反馈

⏰ 21天法则：
• 前7天最困难，需要强制执行
• 7-21天开始形成习惯
• 21天后逐渐变成自然行为

您想培养什么习惯呢？我可以帮您制定具体的计划。`,
    
    '时间': `时间管理是成功的重要技能！推荐这些方法：

⚡ 番茄工作法：
• 25分钟专注工作 + 5分钟休息
• 4个番茄后休息15-30分钟
• 提高专注力和效率

📊 四象限法：
• 重要且紧急 - 立即处理
• 重要不紧急 - 计划安排
• 不重要但紧急 - 委托他人
• 不重要不紧急 - 尽量避免

您在时间管理上遇到什么具体挑战？`,
    
    '动力': `保持动力确实是个挑战，这些方法可以帮到您：

🔥 内在动力：
• 明确您的"为什么" - 深层动机
• 与个人价值观保持一致
• 想象实现目标后的成就感

🎉 外在激励：
• 设定阶段性奖励
• 寻找问责伙伴
• 记录每天的小进步

💪 应对低潮期：
• 接受起伏是正常的
• 回顾已取得的成就
• 调整目标而不是放弃

什么时候您最容易失去动力？让我们找出具体的解决方案。`
  };

  // 检查关键词
  for (const [keyword, response] of Object.entries(responses)) {
    if (userMessage.includes(keyword)) {
      return response;
    }
  }

  // 默认回复
  return `感谢您的问题："${userMessage}"

我理解您的关注点。基于个人成长的经验，我建议：

1. **明确现状** - 先了解当前的情况
2. **设定目标** - 确定想要达到的状态  
3. **制定计划** - 分解成可执行的步骤
4. **开始行动** - 从小的改变开始
5. **持续调整** - 根据进展优化方法

您希望从哪个方面开始呢？我可以提供更具体的指导。`;
};

export function ChatProvider({ children }: ChatProviderProps) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 创建新会话
  const createNewSession = useCallback((title?: string): ChatSession => {
    const newSession: ChatSession = {
      id: generateId(),
      title: title || `新对话 ${sessions.length + 1}`,
      messages: [{
        id: generateId(),
        content: `您好！👋 我是您的个人成长AI助手。

我可以帮助您：
• 🎯 设定和规划个人目标
• ✅ 建立良好的习惯
• ⏰ 改善时间管理
• 💪 保持成长动力
• 📈 制定学习计划

有什么想聊的吗？`,
        role: 'assistant',
        timestamp: new Date(),
        type: 'text'
      }],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setSessions(prev => [newSession, ...prev]);
    setCurrentSession(newSession);
    return newSession;
  }, [sessions.length]);

  // 发送消息
  const sendMessage = useCallback(async (content: string) => {
    if (!currentSession) {
      const session = createNewSession();
      setCurrentSession(session);
    }

    const userMessage: ChatMessage = {
      id: generateId(),
      content,
      role: 'user',
      timestamp: new Date(),
      type: 'text'
    };

    // 添加用户消息
    const updatedSession = {
      ...currentSession!,
      messages: [...currentSession!.messages, userMessage],
      updatedAt: new Date(),
    };

    setCurrentSession(updatedSession);
    setSessions(prev => 
      prev.map(s => s.id === updatedSession.id ? updatedSession : s)
    );

    // 生成AI回复
    setIsLoading(true);
    try {
      const aiResponse = await generateAIResponse(content);
      
      const aiMessage: ChatMessage = {
        id: generateId(),
        content: aiResponse,
        role: 'assistant',
        timestamp: new Date(),
        type: 'text'
      };

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, aiMessage],
        updatedAt: new Date(),
      };

      setCurrentSession(finalSession);
      setSessions(prev => 
        prev.map(s => s.id === finalSession.id ? finalSession : s)
      );
    } catch (error) {
      console.error('AI response generation failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentSession, createNewSession]);

  // 切换会话
  const switchSession = useCallback((sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSession(session);
    }
  }, [sessions]);

  // 删除会话
  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    if (currentSession?.id === sessionId) {
      setCurrentSession(sessions.length > 1 ? sessions[0] : null);
    }
  }, [currentSession?.id, sessions]);

  const value: ChatContextType = {
    currentSession,
    sessions,
    isLoading,
    sendMessage,
    createNewSession,
    switchSession,
    deleteSession,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat(): ChatContextType {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}