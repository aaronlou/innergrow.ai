'use client';

import Link from "next/link";
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, LanguageToggle } from '@/components/ui';
import { useI18n } from '@/contexts';

export default function HomePage() {
  const { t, language, setLanguage } = useI18n();
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
              <a href="#features" className="text-muted-foreground hover:text-foreground">{t('nav.features')}</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground">{t('nav.pricing')}</a>
              <a href="#about" className="text-muted-foreground hover:text-foreground">{t('nav.about')}</a>
            </div>
            <div className="flex items-center space-x-4">
              {/* 语言切换 */}
              <LanguageToggle 
                currentLanguage={language}
                onLanguageChange={setLanguage}
              />
              <Link href="accounts/auth/login">
                <Button variant="ghost">{t('common.login')}</Button>
              </Link>
              <Link href="accounts/auth/register">
                <Button>{t('home.hero.getStarted')}</Button>
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
              {t('home.hero.badge')}
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-brand-primary to-brand-secondary bg-clip-text text-transparent">
              {t('home.hero.title')}
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              {t('home.hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="accounts/auth/register">
                <Button size="lg" className="bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-90">
                  {t('home.hero.startButton')}
                </Button>
              </Link>
              <Link href="/chat">
                <Button variant="outline" size="lg">
                  {t('home.hero.tryButton')}
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('home.features.title')}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t('home.features.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <CardTitle>{t('home.features.aiChat.title')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  {t('home.features.aiChat.description')}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <CardTitle>{t('home.features.goals.title')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  {t('home.features.goals.description')}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📊</span>
                </div>
                <CardTitle>{t('home.features.insights.title')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  {t('home.features.insights.description')}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🏆</span>
                </div>
                <CardTitle>{t('home.features.habits.title')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  {t('home.features.habits.description')}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔐</span>
                </div>
                <CardTitle>{t('home.features.security.title')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  {t('home.features.security.description')}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📱</span>
                </div>
                <CardTitle>{t('home.features.sync.title')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  {t('home.features.sync.description')}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📚</span>
                </div>
                <CardTitle>{t('home.features.books.title')}</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  {t('home.features.books.description')}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 使用统计 */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-12">{t('home.stats.title')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-4xl font-bold text-brand-primary mb-2">10k+</div>
              <div className="text-muted-foreground">{t('home.stats.activeUsers')}</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-brand-primary mb-2">50k+</div>
              <div className="text-muted-foreground">{t('home.stats.completedGoals')}</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-brand-primary mb-2">98%</div>
              <div className="text-muted-foreground">{t('home.stats.satisfaction')}</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-brand-primary mb-2">24/7</div>
              <div className="text-muted-foreground">{t('home.stats.support')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 区域 */}
      <section className="py-20 px-4 bg-gradient-to-r from-brand-primary to-brand-secondary">
        <div className="container mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('home.cta.title')}
          </h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            {t('home.cta.subtitle')}
          </p>
          <Link href="accounts/auth/register">
            <Button 
              size="lg" 
              className="bg-white text-brand-primary hover:bg-gray-100 font-semibold px-8"
            >
              {t('home.cta.button')}
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
              <h3 className="font-semibold mb-4">{t('footer.product')}</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">{t('footer.aiChat')}</a></li>
                <li><a href="#" className="hover:text-white">{t('footer.goalManagement')}</a></li>
                <li><a href="#" className="hover:text-white">{t('footer.habitTracking')}</a></li>
                <li><a href="#" className="hover:text-white">{t('footer.growthReports')}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">{t('footer.support')}</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">{t('footer.helpCenter')}</a></li>
                <li><a href="#" className="hover:text-white">{t('footer.contactUs')}</a></li>
                <li><a href="#" className="hover:text-white">{t('footer.feedback')}</a></li>
                <li><a href="#" className="hover:text-white">{t('footer.community')}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">{t('footer.legal')}</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">{t('footer.privacy')}</a></li>
                <li><a href="#" className="hover:text-white">{t('footer.terms')}</a></li>
                <li><a href="#" className="hover:text-white">{t('footer.cookies')}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>{t('footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
