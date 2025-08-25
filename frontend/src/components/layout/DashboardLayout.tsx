'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button, Avatar, Dropdown, DropdownItem, DropdownSeparator, LanguageSwitcher } from '@/components/ui';
import { useAuth } from '@/contexts';
import { useI18n } from '@/contexts';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 使用翻译的导航项
  const navigationItems: NavItem[] = [
    { label: t('nav.dashboard'), href: '/dashboard', icon: '🏠' },
    { label: t('nav.chat'), href: '/chat', icon: '🤖' },
    { label: t('nav.goals'), href: '/goals', icon: '🎯' },
    { label: t('nav.profile'), href: '/profile', icon: '👤' },
  ];

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const isActivePath = (href: string) => {
    // 精确匹配主页面
    if (href === '/books' && pathname === '/books') return true;
    if (href === '/books/my-books' && pathname === '/books/my-books') return true;
    if (href === '/books/orders' && pathname === '/books/orders') return true;

    // 其他页面的精确匹配
    if (href !== '/books' && href !== '/books/my-books' && href !== '/books/orders') {
      return pathname === href;
    }

    return false;
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* 侧边栏头部 */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-brand-primary to-brand-secondary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">I</span>
              </div>
              <span className="font-semibold text-lg">InnerGrow.ai</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              ✕
            </Button>
          </div>

          {/* 导航菜单 */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActivePath(item.href)
                    ? 'bg-brand-primary text-white'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* 侧边栏底部 */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center space-x-3 mb-4">
              <Avatar
                src={user?.avatar}
                alt={user?.name}
                size="md"
                fallback={user?.name?.charAt(0)}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={handleLogout}
            >
              {t('common.logout')}
            </Button>
          </div>
        </div>
      </aside>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col lg:ml-0">
        {/* 顶部导航栏 */}
        <header className="bg-card border-b border-border px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* 移动端菜单按钮 */}
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                ☰
              </Button>

              {/* 面包屑导航 */}
              <div className="hidden lg:flex items-center space-x-2 text-sm text-muted-foreground">
                <span>InnerGrow.ai</span>
                <span>/</span>
                <span className="text-foreground font-medium">
                  {navigationItems.find(item => isActivePath(item.href))?.label || t('nav.dashboard')}
                </span>
              </div>
            </div>

            {/* 右侧操作区 */}
            <div className="flex items-center space-x-4">
              {/* 搜索框 */}
              <div className="hidden md:flex">
                <input
                  type="text"
                  placeholder={t('common.search') + '...'}
                  className="w-64 px-3 py-2 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              {/* 语言切换 */}
              <LanguageSwitcher
                currentLanguage={language}
                onLanguageChange={setLanguage}
                variant="dropdown"
              />

              {/* 通知按钮 */}
              <Button variant="ghost" size="sm" className="relative">
                🔔
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </Button>

              {/* 用户菜单 */}
              <Dropdown
                trigger={
                  <button className="flex items-center space-x-2 hover:bg-accent rounded-lg p-2 transition-colors">
                    <Avatar
                      src={user?.avatar}
                      alt={user?.name}
                      size="sm"
                      fallback={user?.name?.charAt(0)}
                    />
                    <span className="hidden sm:block text-sm font-medium">
                      {user?.name}
                    </span>
                    <span className="text-xs">▼</span>
                  </button>
                }
                align="right"
              >
                <DropdownItem onClick={() => router.push('/profile')}>
                  👤 {t('common.profile')}
                </DropdownItem>
                <DropdownItem onClick={() => router.push('/settings')}>
                  ⚙️ {t('common.settings')}
                </DropdownItem>
                <DropdownSeparator />
                <DropdownItem onClick={handleLogout} danger>
                  🚪 {t('common.logout')}
                </DropdownItem>
              </Dropdown>
            </div>
          </div>
        </header>

        {/* 主内容 */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}