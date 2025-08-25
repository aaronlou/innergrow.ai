'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button } from '@/components/ui';
import { DashboardLayout, ProtectedRoute } from '@/components/layout';
import { BookOrder, OrderStatus } from '@/types';
import { cn, formatDate } from '@/lib/utils';
import { useAuth, useI18n } from '@/contexts';
import Image from 'next/image';
import Link from 'next/link';

export default function OrdersPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [orders, setOrders] = useState<BookOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');

  // 模拟获取订单数据
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockOrders: BookOrder[] = [
        {
          id: '1',
          bookId: '1',
          book: {
            id: '1',
            title: 'JavaScript 高级程序设计',
            author: 'Matt Frisbie',
            publisher: '人民邮电出版社',
            publishYear: 2020,
            category: 'technology',
            condition: 'like-new',
            description: '前端开发必读经典',
            price: 65,
            originalPrice: 99,
            images: ['/api/placeholder/400/600'],
            sellerId: '2',
            sellerName: '技术爱好者小张',
            status: 'available',
            createdAt: new Date('2024-01-15'),
            updatedAt: new Date('2024-01-15'),
            location: '北京'
          },
          buyerId: user?.id || '1',
          buyerName: user?.name || '购买者',
          buyerContact: '13800138000',
          sellerId: '2',
          amount: 65,
          status: 'paid',
          message: '希望能当面交易，我在海淀区上班',
          paymentMethod: 'wechat',
          createdAt: new Date('2024-01-20'),
          updatedAt: new Date('2024-01-21')
        },
        {
          id: '2',
          bookId: '2',
          book: {
            id: '2',
            title: '百年孤独',
            author: '加西亚·马尔克斯',
            publisher: '南海出版公司',
            publishYear: 2017,
            category: 'literature',
            condition: 'good',
            description: '魔幻现实主义文学经典',
            price: 25,
            originalPrice: 39.5,
            images: ['/api/placeholder/400/600'],
            sellerId: user?.id || '1',
            sellerName: user?.name || '文学青年',
            status: 'sold',
            createdAt: new Date('2024-01-10'),
            updatedAt: new Date('2024-01-10'),
            location: '上海'
          },
          buyerId: '3',
          buyerName: '读书爱好者',
          buyerContact: '微信：bookloveer',
          sellerId: user?.id || '1',
          amount: 25,
          status: 'completed',
          message: '很喜欢这本书，希望尽快收到',
          paymentMethod: 'alipay',
          createdAt: new Date('2024-01-18'),
          updatedAt: new Date('2024-01-25'),
          completedAt: new Date('2024-01-25')
        },
        {
          id: '3',
          bookId: '3',
          book: {
            id: '3',
            title: 'React 实战指南',
            author: '某技术作者',
            publisher: '某出版社',
            publishYear: 2021,
            category: 'technology',
            condition: 'good',
            description: 'React开发实战教程',
            price: 45,
            originalPrice: 79,
            images: ['/api/placeholder/400/600'],
            sellerId: '4',
            sellerName: '前端工程师',
            status: 'available',
            createdAt: new Date('2024-01-12'),
            updatedAt: new Date('2024-01-12'),
            location: '深圳'
          },
          buyerId: user?.id || '1',
          buyerName: user?.name || '购买者',
          buyerContact: '13900139000',
          sellerId: '4',
          amount: 45,
          status: 'pending',
          message: '可以包邮吗？',
          paymentMethod: 'wechat',
          createdAt: new Date('2024-01-22'),
          updatedAt: new Date('2024-01-22')
        }
      ];

      setOrders(mockOrders);
      setLoading(false);
    };

    if (user) {
      fetchOrders();
    }
  }, [user]);

  const statusLabels: Record<OrderStatus, { label: string; color: string; description: string }> = {
    pending: { label: t('orders.pending'), color: 'warning', description: t('orders.status.pending.desc') },
    confirmed: { label: t('orders.confirmed'), color: 'info', description: t('orders.status.confirmed.desc') },
    paid: { label: t('orders.paid'), color: 'success', description: t('orders.status.paid.desc') },
    shipped: { label: t('orders.shipped'), color: 'info', description: t('orders.status.shipped.desc') },
    completed: { label: t('orders.completed'), color: 'success', description: t('orders.status.completed.desc') },
    cancelled: { label: t('orders.cancelled'), color: 'destructive', description: t('orders.status.cancelled.desc') }
  };

  const paymentLabels = {
    wechat: t('orders.paymentMethod.wechat'),
    alipay: t('orders.paymentMethod.alipay'),
    cash: t('orders.paymentMethod.cash'),
    'bank-transfer': t('orders.paymentMethod.bankTransfer')
  };

  // 根据当前标签页和用户ID筛选订单
  const filteredOrders = orders.filter(order => {
    const isBuyOrder = order.buyerId === user?.id;
    const isSellOrder = order.sellerId === user?.id;
    
    if (activeTab === 'buy' && !isBuyOrder) return false;
    if (activeTab === 'sell' && !isSellOrder) return false;
    
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    
    return true;
  });

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { 
            ...order, 
            status: newStatus, 
            updatedAt: new Date(),
            ...(newStatus === 'completed' && { completedAt: new Date() })
          }
        : order
    ));
    setLoading(false);
  };

  const getAvailableActions = (order: BookOrder) => {
    const isBuyer = order.buyerId === user?.id;
    const isSeller = order.sellerId === user?.id;
    
    const actions = [];
    
    if (isSeller) {
      switch (order.status) {
        case 'pending':
          actions.push(
            { label: t('orders.confirmOrder'), action: () => handleStatusChange(order.id, 'confirmed'), variant: 'default' },
            { label: t('orders.rejectOrder'), action: () => handleStatusChange(order.id, 'cancelled'), variant: 'outline' }
          );
          break;
        case 'paid':
          actions.push(
            { label: t('orders.confirmShipping'), action: () => handleStatusChange(order.id, 'shipped'), variant: 'default' }
          );
          break;
        case 'shipped':
          actions.push(
            { label: t('orders.confirmComplete'), action: () => handleStatusChange(order.id, 'completed'), variant: 'default' }
          );
          break;
      }
    }
    
    if (isBuyer) {
      switch (order.status) {
        case 'confirmed':
          actions.push(
            { label: t('orders.payNow'), action: () => handleStatusChange(order.id, 'paid'), variant: 'default' },
            { label: t('orders.cancelOrder'), action: () => handleStatusChange(order.id, 'cancelled'), variant: 'outline' }
          );
          break;
        case 'shipped':
          actions.push(
            { label: t('orders.confirmReceipt'), action: () => handleStatusChange(order.id, 'completed'), variant: 'default' }
          );
          break;
      }
    }
    
    return actions;
  };

  const getStats = () => {
    const buyOrders = orders.filter(o => o.buyerId === user?.id);
    const sellOrders = orders.filter(o => o.sellerId === user?.id);
    
    return {
      buy: {
        total: buyOrders.length,
        pending: buyOrders.filter(o => ['pending', 'confirmed'].includes(o.status)).length,
        completed: buyOrders.filter(o => o.status === 'completed').length,
        amount: buyOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.amount, 0)
      },
      sell: {
        total: sellOrders.length,
        pending: sellOrders.filter(o => ['pending', 'confirmed', 'paid', 'shipped'].includes(o.status)).length,
        completed: sellOrders.filter(o => o.status === 'completed').length,
        amount: sellOrders.filter(o => o.status === 'completed').reduce((sum, o) => sum + o.amount, 0)
      }
    };
  };

  const stats = getStats();

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          {/* 头部 */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-2">{t('orders.title')}</h1>
            <p className="text-muted-foreground">
              {t('orders.subtitle')}
            </p>
          </div>

          {/* 标签页和统计 */}
          <div className="flex flex-col lg:flex-row gap-6 mb-8">
            {/* 标签页 */}
            <div className="flex border rounded-lg p-1 bg-muted">
              <button
                onClick={() => setActiveTab('buy')}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  activeTab === 'buy'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t('orders.myPurchases')}
              </button>
              <button
                onClick={() => setActiveTab('sell')}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  activeTab === 'sell'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t('orders.mySales')}
              </button>
            </div>

            {/* 统计信息 */}
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-brand-primary">
                        {activeTab === 'buy' ? stats.buy.total : stats.sell.total}
                      </div>
                      <div className="text-sm text-muted-foreground">{t('orders.totalOrders')}</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-orange-600">
                        {activeTab === 'buy' ? stats.buy.pending : stats.sell.pending}
                      </div>
                      <div className="text-sm text-muted-foreground">{t('orders.ongoing')}</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        {activeTab === 'buy' ? stats.buy.completed : stats.sell.completed}
                      </div>
                      <div className="text-sm text-muted-foreground">{t('orders.completed')}</div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        ¥{activeTab === 'buy' ? stats.buy.amount : stats.sell.amount}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {activeTab === 'buy' ? t('orders.totalSpent') : t('orders.totalEarned')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* 状态筛选 */}
          <div className="flex gap-2 mb-6">
            <Button 
              variant={statusFilter === 'all' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setStatusFilter('all')}
            >
              {t('orders.all')}
            </Button>
            {Object.entries(statusLabels).map(([status, { label }]) => (
              <Button 
                key={status}
                variant={statusFilter === status ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setStatusFilter(status as OrderStatus)}
              >
                {label}
              </Button>
            ))}
          </div>

          {/* 订单列表 */}
          {loading && filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📋</div>
              <div>{t('orders.loading')}</div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-semibold mb-2">{t('orders.empty')}</h3>
              <p className="text-muted-foreground mb-4">
                {activeTab === 'buy' ? t('orders.emptyBuy') : t('orders.emptySell')}
              </p>
              <Link href="/books">
                <Button>{t('orders.goShopping')}</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => {
                const statusInfo = statusLabels[order.status];
                const actions = getAvailableActions(order);
                
                return (
                  <Card key={order.id}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {t('orders.orderNumber')}：{order.id}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge 
                              variant={statusInfo.color as 'warning' | 'info' | 'success' | 'destructive'}
                            >
                              {statusInfo.label}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {statusInfo.description}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-brand-primary">
                            ¥{order.amount}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {paymentLabels[order.paymentMethod || 'wechat']}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="flex gap-4 mb-4">
                        {/* 书籍图片 */}
                        <div className="w-16 h-20 relative overflow-hidden rounded flex-shrink-0">
                          <Image
                            src={order.book.images[0]}
                            alt={order.book.title}
                            fill
                            className="object-cover"
                          />
                        </div>
                        
                        {/* 书籍信息 */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium mb-1 truncate">
                            {order.book.title}
                          </h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            {t('books.detail.author')}：{order.book.author}
                          </p>
                          <div className="text-xs text-muted-foreground">
                            <p>📍 {order.book.location}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* 交易信息 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            {activeTab === 'buy' ? t('orders.seller') : t('orders.buyer')}：
                          </span>
                          <span>
                            {activeTab === 'buy' ? order.book.sellerName : order.buyerName}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('orders.contactInfo')}：</span>
                          <span>{order.buyerContact}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('orders.orderTime')}：</span>
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">{t('orders.updateTime')}：</span>
                          <span>{formatDate(order.updatedAt)}</span>
                        </div>
                      </div>
                      
                      {/* 买家留言 */}
                      {order.message && (
                        <div className="mb-4 p-3 bg-muted rounded-lg">
                          <div className="text-sm font-medium mb-1">{t('orders.buyerMessage')}：</div>
                          <div className="text-sm text-muted-foreground">{order.message}</div>
                        </div>
                      )}
                      
                      {/* 操作按钮 */}
                      {actions.length > 0 && (
                        <div className="flex gap-2 pt-4 border-t">
                          {actions.map((action, index) => (
                            <Button
                              key={index}
                              variant={action.variant as 'default' | 'outline'}
                              size="sm"
                              onClick={action.action}
                              loading={loading}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}