import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge } from '@/components/ui';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* 导航栏 */}
      <nav className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">I</span>
              </div>
              <span className="text-xl font-bold text-brand-primary">InnerGrow.ai</span>
            </div>
            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-muted-foreground hover:text-foreground">功能特色</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground">价格</a>
              <a href="#about" className="text-muted-foreground hover:text-foreground">关于我们</a>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost">登录</Button>
              </Link>
              <Link href="/auth/register">
                <Button>开始使用</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 英雄区域 */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-6 bg-brand-primary/10 text-brand-primary border-brand-primary/20">
              🚀 AI 驱动的个人成长助手
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
              用 AI 加速您的
              <br />
              个人成长之旅
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              通过智能对话、目标追踪和个性化建议，让 InnerGrow.ai 成为您最贴心的成长伙伴。
              科学的方法论结合 AI 技术，助您实现人生目标。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90">
                  免费开始成长
                </Button>
              </Link>
              <Link href="/chat">
                <Button variant="outline" size="lg">
                  体验 AI 对话
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 功能特色 */}
      <section id="features" className="py-20 px-4 bg-white/50 dark:bg-slate-900/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">为什么选择 InnerGrow.ai？</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              我们将先进的 AI 技术与成长心理学相结合，为您提供科学、个性化的成长方案。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <CardTitle>AI 智能对话</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  24/7 可用的 AI 成长教练，基于心理学理论提供个性化建议，陪伴您的每一步成长。
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <CardTitle>目标管理</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  SMART 目标设定法则，可视化进度追踪，让您的每个目标都有清晰的路线图。
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <CardTitle>成长洞察</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  基于您的数据生成个性化成长报告，发现潜在机会，优化成长策略。
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏆</span>
                </div>
                <CardTitle>习惯养成</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  科学的习惯追踪系统，帮您建立持续的良好习惯，让改变成为自然而然的事。
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔐</span>
                </div>
                <CardTitle>隐私安全</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  端到端加密保护您的隐私数据，符合国际安全标准，让您安心分享成长历程。
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📱</span>
                </div>
                <CardTitle>多平台同步</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  随时随地访问您的成长数据，电脑、手机无缝同步，成长不受时间地点限制。
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📚</span>
                </div>
                <CardTitle>二手书交易</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  分享闲置书籍，发现好书资源。安全便捷的个人二手书交易平台，让知识传递更有价值。
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 使用统计 */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">数千用户的共同选择</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-4xl font-bold text-brand-primary mb-2">10k+</div>
              <div className="text-muted-foreground">活跃用户</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-brand-primary mb-2">50k+</div>
              <div className="text-muted-foreground">完成目标</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-brand-primary mb-2">98%</div>
              <div className="text-muted-foreground">用户满意度</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-brand-primary mb-2">24/7</div>
              <div className="text-muted-foreground">AI 支持</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 区域 */}
      <section className="py-20 px-4 bg-gradient-to-r from-brand-primary to-brand-secondary">
        <div className="container mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            开始您的成长之旅
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            加入数千名用户的行列，让 AI 助手陪伴您实现人生目标。
            今天开始，遇见更好的自己。
          </p>
          <Link href="/auth/register">
            <Button 
              size="lg" 
              className="bg-white text-brand-primary hover:bg-gray-100 font-semibold px-8"
            >
              立即免费开始
            </Button>
          </Link>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="bg-slate-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">I</span>
                </div>
                <span className="text-xl font-bold">InnerGrow.ai</span>
              </div>
              <p className="text-gray-400">
                AI 驱动的个人成长助手，让每个人都能实现自己的潜能。
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">产品</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">AI 对话</a></li>
                <li><a href="#" className="hover:text-white">目标管理</a></li>
                <li><a href="#" className="hover:text-white">习惯追踪</a></li>
                <li><a href="#" className="hover:text-white">成长报告</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">支持</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">帮助中心</a></li>
                <li><a href="#" className="hover:text-white">联系我们</a></li>
                <li><a href="#" className="hover:text-white">用户反馈</a></li>
                <li><a href="#" className="hover:text-white">社区</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">法律</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">隐私政策</a></li>
                <li><a href="#" className="hover:text-white">服务条款</a></li>
                <li><a href="#" className="hover:text-white">Cookie 政策</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 InnerGrow.ai. 保留所有权利。</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
