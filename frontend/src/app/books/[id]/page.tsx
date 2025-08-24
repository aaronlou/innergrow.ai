'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Modal, ModalHeader, ModalContent, ModalFooter, Input } from '@/components/ui';
import { DashboardLayout, ProtectedRoute } from '@/components/layout';
import { Book, BookCondition, ShippingAddress, PaymentMethod } from '@/types';
import { cn, formatDate } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';

export default function BookDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // 购买表单状态
  const [buyerInfo, setBuyerInfo] = useState({
    contact: '',
    message: '',
    paymentMethod: 'wechat' as PaymentMethod,
    shippingAddress: {
      name: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      address: '',
      zipCode: ''
    } as ShippingAddress
  });

  // 模拟获取书籍详情
  useEffect(() => {
    const fetchBook = async () => {
      setLoading(true);
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockBook: Book = {
        id: params.id as string,
        title: 'JavaScript 高级程序设计（第4版）',
        author: 'Matt Frisbie',
        isbn: '9787115545381',
        publisher: '人民邮电出版社',
        publishYear: 2020,
        category: 'technology',
        condition: 'like-new',
        description: `这是前端开发的必读经典书籍，第4版全面更新了ES6+的新特性。
        
书籍几乎全新，只翻看过前几页，没有任何笔记或划线。

包含以下内容：
• JavaScript 语言基础
• 变量、作用域与内存
• 基本引用类型
• 集合引用类型  
• 迭代器与生成器
• 对象、类与面向对象编程
• 函数、Promise与异步编程
• 网络请求与远程资源
• 客户端检测、DOM、事件
• 动画与Canvas图形
• 表单脚本、模块等

适合：
✅ 前端工程师进阶
✅ JavaScript 深入学习
✅ 面试准备
✅ 技术栈提升

现在工作中主要用 TypeScript，这本书对我来说已经用不上了，希望能帮助到需要的同学。`,
        price: 65,
        originalPrice: 99,
        images: [
          '/api/placeholder/400/600',
          '/api/placeholder/400/600', 
          '/api/placeholder/400/600'
        ],
        sellerId: '1',
        sellerName: '技术爱好者小张',
        sellerAvatar: '/api/placeholder/100/100',
        status: 'available',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        location: '北京海淀区',
        tags: ['前端', 'JavaScript', '编程', '进阶']
      };
      
      setBook(mockBook);
      setLoading(false);
    };

    if (params.id) {
      fetchBook();
    }
  }, [params.id]);

  const conditions: { value: BookCondition; label: string; color: string; description: string }[] = [
    { value: 'new', label: '全新', color: 'success', description: '未拆封或刚拆封' },
    { value: 'like-new', label: '几乎全新', color: 'success', description: '轻微使用痕迹' },
    { value: 'good', label: '良好', color: 'info', description: '正常使用痕迹' },
    { value: 'fair', label: '一般', color: 'warning', description: '明显使用痕迹' },
    { value: 'poor', label: '较差', color: 'destructive', description: '重度使用痕迹' }
  ];

  const getConditionInfo = (condition: BookCondition) => {
    return conditions.find(c => c.value === condition) || conditions[2];
  };

  const handlePurchase = async () => {
    if (!book || !user) return;
    
    // 模拟下单
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 这里应该调用实际的API创建订单
    alert('下单成功！卖家会尽快联系您确认订单详情。');
    setShowPurchaseModal(false);
    setLoading(false);
  };

  const isOwnBook = book?.sellerId === user?.id;

  if (loading && !book) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6 flex justify-center items-center min-h-96">
            <div className="text-center">
              <div className="text-4xl mb-4">📚</div>
              <div>正在加载书籍信息...</div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  if (!book) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="p-6 flex justify-center items-center min-h-96">
            <div className="text-center">
              <div className="text-4xl mb-4">❌</div>
              <h3 className="text-lg font-semibold mb-2">书籍不存在</h3>
              <p className="text-muted-foreground mb-4">您访问的书籍可能已被删除或不存在</p>
              <Link href="/books">
                <Button>返回书市</Button>
              </Link>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  const conditionInfo = getConditionInfo(book.condition);

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          {/* 面包屑 */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link href="/books" className="hover:text-foreground">
              二手书市场
            </Link>
            <span>/</span>
            <span className="text-foreground">{book.title}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 左侧图片 */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                {/* 主图 */}
                <div className="aspect-[3/4] relative overflow-hidden rounded-lg mb-4">
                  <Image
                    src={book.images[currentImageIndex]}
                    alt={book.title}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge 
                      variant={conditionInfo.color as 'success' | 'info' | 'warning' | 'destructive'}
                    >
                      {conditionInfo.label}
                    </Badge>
                  </div>
                </div>
                
                {/* 缩略图 */}
                {book.images.length > 1 && (
                  <div className="flex gap-2">
                    {book.images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={cn(
                          "w-16 h-20 relative overflow-hidden rounded border-2 transition-colors",
                          index === currentImageIndex ? "border-brand-primary" : "border-border"
                        )}
                      >
                        <Image
                          src={image}
                          alt={`${book.title} ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* 中间详情 */}
            <div className="lg:col-span-1">
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold mb-2">{book.title}</h1>
                  <p className="text-muted-foreground mb-4">作者：{book.author}</p>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-bold text-brand-primary">¥{book.price}</span>
                      {book.originalPrice && (
                        <span className="text-lg text-muted-foreground line-through">¥{book.originalPrice}</span>
                      )}
                    </div>
                    <Badge variant="outline">{Math.round((1 - book.price / (book.originalPrice || book.price)) * 100)}折</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">ISBN：</span>
                    <span>{book.isbn || '暂无'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">出版社：</span>
                    <span>{book.publisher || '暂无'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">出版年份：</span>
                    <span>{book.publishYear || '暂无'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">品相：</span>
                    <span>{conditionInfo.label}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">位置：</span>
                    <span>{book.location}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">发布时间：</span>
                    <span>{formatDate(book.createdAt)}</span>
                  </div>
                </div>

                {book.tags && book.tags.length > 0 && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-2">标签：</div>
                    <div className="flex flex-wrap gap-2">
                      {book.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" size="sm">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-3">商品描述</h3>
                  <div className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
                    {book.description}
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧购买 */}
            <div className="lg:col-span-1">
              <div className="sticky top-6">
                <Card>
                  <CardHeader>
                    <CardTitle>购买信息</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 卖家信息 */}
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className="w-10 h-10 relative overflow-hidden rounded-full">
                        <Image
                          src={book.sellerAvatar || '/api/placeholder/100/100'}
                          alt={book.sellerName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{book.sellerName}</div>
                        <div className="text-sm text-muted-foreground">卖家</div>
                      </div>
                    </div>

                    {/* 品相说明 */}
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={conditionInfo.color as 'success' | 'info' | 'warning' | 'destructive'} size="sm">
                          {conditionInfo.label}
                        </Badge>
                        <span className="text-sm font-medium">品相说明</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {conditionInfo.description}
                      </p>
                    </div>

                    {/* 购买按钮 */}
                    <div className="space-y-3">
                      {isOwnBook ? (
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">这是您发布的书籍</p>
                          <Link href="/books/my-books">
                            <Button variant="outline" className="mt-2">
                              管理我的书籍
                            </Button>
                          </Link>
                        </div>
                      ) : book.status === 'available' ? (
                        <>
                          <Button 
                            className="w-full" 
                            size="lg"
                            onClick={() => setShowPurchaseModal(true)}
                          >
                            立即购买
                          </Button>
                          <Button variant="outline" className="w-full">
                            联系卖家
                          </Button>
                        </>
                      ) : (
                        <div className="text-center p-4 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground">此书籍已售出</p>
                        </div>
                      )}
                    </div>

                    {/* 温馨提示 */}
                    <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
                      <div className="font-medium mb-1">💡 购买提示</div>
                      <ul className="space-y-1">
                        <li>• 建议先联系卖家确认书籍状态</li>
                        <li>• 支持当面交易和邮寄</li>
                        <li>• 交易前请仔细查看商品描述</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>

          {/* 购买弹窗 */}
          <Modal open={showPurchaseModal} onClose={() => setShowPurchaseModal(false)}>
            <ModalHeader 
              title="确认购买" 
              description={`购买《${book.title}》`}
              onClose={() => setShowPurchaseModal(false)}
            />
            <ModalContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex justify-between items-center">
                    <span>商品价格：</span>
                    <span className="text-lg font-bold text-brand-primary">¥{book.price}</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">联系方式</label>
                  <Input
                    placeholder="请输入您的手机号或微信号"
                    value={buyerInfo.contact}
                    onChange={(e) => setBuyerInfo(prev => ({ ...prev, contact: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">留言（选填）</label>
                  <Input
                    type="textarea"
                    placeholder="向卖家说明您的需求..."
                    value={buyerInfo.message}
                    onChange={(e) => setBuyerInfo(prev => ({ ...prev, message: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">支付方式</label>
                  <select 
                    className="w-full mt-1 p-2 border border-input rounded-md"
                    value={buyerInfo.paymentMethod}
                    onChange={(e) => setBuyerInfo(prev => ({ ...prev, paymentMethod: e.target.value as PaymentMethod }))}
                  >
                    <option value="wechat">微信支付</option>
                    <option value="alipay">支付宝</option>
                    <option value="cash">现金交易</option>
                    <option value="bank-transfer">银行转账</option>
                  </select>
                </div>
              </div>
            </ModalContent>
            <ModalFooter>
              <Button variant="outline" onClick={() => setShowPurchaseModal(false)}>
                取消
              </Button>
              <Button onClick={handlePurchase} loading={loading}>
                确认下单
              </Button>
            </ModalFooter>
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}