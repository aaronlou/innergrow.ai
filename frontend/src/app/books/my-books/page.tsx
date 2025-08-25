'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, Badge, Button, Modal, ModalHeader, ModalContent, ModalFooter } from '@/components/ui';
import { DashboardLayout, ProtectedRoute } from '@/components/layout';
import { Book, BookStatus } from '@/types';
import { cn, formatDate, truncateText } from '@/lib/utils';
import { useAuth, useI18n } from '@/contexts';
import Image from 'next/image';
import Link from 'next/link';

export default function MyBooksPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<BookStatus | 'all'>('all');

  // 模拟获取用户发布的书籍
  useEffect(() => {
    const fetchMyBooks = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockBooks: Book[] = [
        {
          id: '1',
          title: 'JavaScript 高级程序设计',
          author: 'Matt Frisbie',
          publisher: '人民邮电出版社',
          publishYear: 2020,
          category: 'technology',
          condition: 'like-new',
          description: '前端开发必读经典，第4版，几乎全新，只翻看过几页',
          price: 65,
          originalPrice: 99,
          images: ['/api/placeholder/400/600'],
          sellerId: user?.id || '1',
          sellerName: user?.name || '技术爱好者',
          status: 'available',
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15'),
          location: '北京',
          tags: ['前端', 'JavaScript', '编程']
        },
        {
          id: '2',
          title: '深度学习',
          author: 'Ian Goodfellow',
          publisher: '人民邮电出版社',
          publishYear: 2017,
          category: 'science',
          condition: 'fair',
          description: 'AI领域的圣经级教材，有使用痕迹但内容完整',
          price: 85,
          originalPrice: 168,
          images: ['/api/placeholder/400/600'],
          sellerId: user?.id || '1',
          sellerName: user?.name || '技术爱好者',
          status: 'sold',
          createdAt: new Date('2024-01-05'),
          updatedAt: new Date('2024-01-20'),
          location: '北京',
          tags: ['人工智能', '机器学习', '深度学习']
        },
        {
          id: '3',
          title: 'React 实战',
          author: '某作者',
          publisher: '某出版社',
          publishYear: 2021,
          category: 'technology',
          condition: 'good',
          description: 'React开发实战教程，有一些笔记',
          price: 45,
          originalPrice: 79,
          images: ['/api/placeholder/400/600'],
          sellerId: user?.id || '1',
          sellerName: user?.name || '技术爱好者',
          status: 'reserved',
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-18'),
          location: '北京',
          tags: ['React', '前端框架']
        }
      ];

      setBooks(mockBooks);
      setLoading(false);
    };

    if (user) {
      fetchMyBooks();
    }
  }, [user]);

  const statusLabels: Record<BookStatus, { label: string; color: string }> = {
    available: { label: t('books.myBooks.available'), color: 'success' },
    sold: { label: t('books.myBooks.sold'), color: 'info' },
    reserved: { label: t('books.myBooks.reserved'), color: 'warning' },
    removed: { label: t('books.myBooks.removed'), color: 'destructive' }
  };

  const filteredBooks = activeFilter === 'all' 
    ? books 
    : books.filter(book => book.status === activeFilter);

  const stats = {
    total: books.length,
    available: books.filter(b => b.status === 'available').length,
    sold: books.filter(b => b.status === 'sold').length,
    reserved: books.filter(b => b.status === 'reserved').length,
    removed: books.filter(b => b.status === 'removed').length
  };

  const handleStatusChange = async (bookId: string, newStatus: BookStatus) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setBooks(prev => prev.map(book => 
      book.id === bookId 
        ? { ...book, status: newStatus, updatedAt: new Date() }
        : book
    ));
    setLoading(false);
  };

  const handleDeleteBook = async () => {
    if (!selectedBook) return;
    
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setBooks(prev => prev.filter(book => book.id !== selectedBook.id));
    setShowDeleteModal(false);
    setSelectedBook(null);
    setLoading(false);
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          {/* 头部 */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold mb-2">{t('books.myBooks.title')}</h1>
              <p className="text-muted-foreground">
                {t('books.myBooks.subtitle')}
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/books/sell">
                <Button>{t('books.myBooks.publishNew')}</Button>
              </Link>
              <Link href="/books">
                <Button variant="outline">{t('books.myBooks.browse')}</Button>
              </Link>
            </div>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card className={cn("cursor-pointer transition-colors", activeFilter === 'all' && "border-brand-primary")} onClick={() => setActiveFilter('all')}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-brand-primary">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">{t('common.all')}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className={cn("cursor-pointer transition-colors", activeFilter === 'available' && "border-brand-primary")} onClick={() => setActiveFilter('available')}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.available}</div>
                  <div className="text-sm text-muted-foreground">{t('books.myBooks.available')}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className={cn("cursor-pointer transition-colors", activeFilter === 'reserved' && "border-brand-primary")} onClick={() => setActiveFilter('reserved')}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.reserved}</div>
                  <div className="text-sm text-muted-foreground">{t('books.myBooks.reserved')}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className={cn("cursor-pointer transition-colors", activeFilter === 'sold' && "border-brand-primary")} onClick={() => setActiveFilter('sold')}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.sold}</div>
                  <div className="text-sm text-muted-foreground">{t('books.myBooks.sold')}</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className={cn("cursor-pointer transition-colors", activeFilter === 'removed' && "border-brand-primary")} onClick={() => setActiveFilter('removed')}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-600">{stats.removed}</div>
                  <div className="text-sm text-muted-foreground">{t('books.myBooks.removed')}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 书籍列表 */}
          {loading ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">📚</div>
              <div>{t('common.loading')}</div>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-lg font-semibold mb-2">
                {activeFilter === 'all' ? t('books.myBooks.empty') : `${t('common.none')}${statusLabels[activeFilter as BookStatus]?.label}${t('books.empty')}`}
              </h3>
              <p className="text-muted-foreground mb-4">
                {t('books.myBooks.emptyDescription')}
              </p>
              <Link href="/books/sell">
                <Button>{t('books.publishFirst')}</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredBooks.map((book) => (
                <Card key={book.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {/* 书籍图片 */}
                      <div className="w-24 h-32 relative overflow-hidden rounded-lg flex-shrink-0">
                        <Image
                          src={book.images[0]}
                          alt={book.title}
                          fill
                          className="object-cover"
                        />
                      </div>

                      {/* 书籍信息 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1 min-w-0 mr-4">
                            <h3 className="font-semibold text-lg mb-1 truncate">
                              {book.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-2">
                              {t('books.detail.author')}：{book.author}
                            </p>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge 
                                variant={statusLabels[book.status].color as 'success' | 'info' | 'warning' | 'destructive'}
                                size="sm"
                              >
                                {statusLabels[book.status].label}
                              </Badge>
                              <span className="text-lg font-bold text-brand-primary">
                                ¥{book.price}
                              </span>
                              {book.originalPrice && (
                                <span className="text-sm text-muted-foreground line-through">
                                  ¥{book.originalPrice}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* 操作按钮 */}
                          <div className="flex gap-2 flex-shrink-0">
                            <Link href={`/books/${book.id}`}>
                              <Button variant="outline" size="sm">
                                {t('common.view')}
                              </Button>
                            </Link>
                            
                            {book.status === 'available' && (
                              <>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => handleStatusChange(book.id, 'removed')}
                                >
                                  {t('books.myBooks.remove')}
                                </Button>
                              </>
                            )}
                            
                            {book.status === 'removed' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleStatusChange(book.id, 'available')}
                              >
                                {t('books.myBooks.relist')}
                              </Button>
                            )}
                            
                            {book.status === 'reserved' && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => handleStatusChange(book.id, 'sold')}
                              >
                                {t('books.myBooks.markSold')}
                              </Button>
                            )}
                            
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setSelectedBook(book);
                                setShowDeleteModal(true);
                              }}
                              className="text-red-500 hover:text-red-600"
                            >
                              {t('common.delete')}
                            </Button>
                          </div>
                        </div>

                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {truncateText(book.description, 120)}
                        </p>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <span>📍 {book.location}</span>
                            <span>{t('books.myBooks.publishTime')}：{formatDate(book.createdAt)}</span>
                            <span>{t('books.myBooks.updateTime')}：{formatDate(book.updatedAt)}</span>
                          </div>
                          
                          {book.tags && book.tags.length > 0 && (
                            <div className="flex gap-1">
                              {book.tags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="outline" size="sm">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* 删除确认弹窗 */}
          <Modal open={showDeleteModal} onClose={() => setShowDeleteModal(false)}>
            <ModalHeader 
              title={t('books.myBooks.deleteConfirm')} 
              description={t('common.confirmDelete')}
              onClose={() => setShowDeleteModal(false)}
            />
            <ModalContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  {t('books.myBooks.deleteDescription', { title: selectedBook?.title || '' })}
                </p>
                {selectedBook?.status === 'reserved' && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <p className="text-sm text-orange-800">
                      {t('books.myBooks.deleteWarning')}
                    </p>
                  </div>
                )}
              </div>
            </ModalContent>
            <ModalFooter>
              <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
                {t('common.cancel')}
              </Button>
              <Button 
                onClick={handleDeleteBook} 
                loading={loading}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                {t('books.myBooks.confirmDelete')}
              </Button>
            </ModalFooter>
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}