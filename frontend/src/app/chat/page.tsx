import { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui';
import { Button, Input } from '@/components/ui';

export const metadata: Metadata = {
  title: 'AI 助手',
  description: '与您的个人成长 AI 助手对话',
};

export default function ChatPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">AI 成长助手</h1>
        <p className="text-muted-foreground">
          与智能助手对话，获得个性化的成长建议和支持
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 聊天界面 */}
        <div className="lg:col-span-3">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle>对话</CardTitle>
              <CardDescription>
                开始与 AI 助手的对话，分享您的目标和挑战
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* 消息区域 */}
              <div className="flex-1 border rounded-lg p-4 mb-4 overflow-y-auto bg-muted/30">
                <div className="space-y-4">
                  {/* AI 消息 */}
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white text-sm font-medium">
                      AI
                    </div>
                    <div className="flex-1">
                      <div className="bg-background border rounded-lg p-3">
                        <p className="text-sm">
                          你好！我是您的个人成长 AI 助手。我可以帮助您：
                        </p>
                        <ul className="text-sm mt-2 space-y-1 text-muted-foreground">
                          <li>• 设定和规划个人目标</li>
                          <li>• 提供成长建议和策略</li>
                          <li>• 分析您的进展情况</li>
                          <li>• 解答成长相关问题</li>
                        </ul>
                        <p className="text-sm mt-2">请告诉我您今天想聊什么？</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* 输入区域 */}
              <div className="flex gap-2">
                <Input
                  placeholder="输入您的消息..."
                  className="flex-1"
                />
                <Button>发送</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 侧边栏 */}
        <div className="space-y-6">
          {/* 聊天历史 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">聊天历史</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <button className="w-full text-left p-2 rounded hover:bg-accent text-sm">
                  关于目标设定的建议
                </button>
                <button className="w-full text-left p-2 rounded hover:bg-accent text-sm">
                  时间管理策略
                </button>
                <button className="w-full text-left p-2 rounded hover:bg-accent text-sm">
                  克服拖延症
                </button>
              </div>
              <Button variant="outline" size="sm" className="w-full mt-4">
                查看全部
              </Button>
            </CardContent>
          </Card>

          {/* 快捷问题 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">快捷问题</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <button className="w-full text-left p-2 rounded hover:bg-accent text-xs border">
                  如何设定有效的目标？
                </button>
                <button className="w-full text-left p-2 rounded hover:bg-accent text-xs border">
                  如何保持动力？
                </button>
                <button className="w-full text-left p-2 rounded hover:bg-accent text-xs border">
                  怎样建立好习惯？
                </button>
                <button className="w-full text-left p-2 rounded hover:bg-accent text-xs border">
                  如何管理时间？
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}