'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, Button, Input, Badge } from '@/components/ui';
import { DashboardLayout, ProtectedRoute } from '@/components/layout';
import { Book, BookCategory, BookCondition, BookSearchFilter } from '@/types';
import { formatDate, truncateText } from '@/lib/utils';
import { useI18n } from '@/contexts';
import Link from 'next/link';
import Image from 'next/image';

export default function BooksPage() {
  const { t } = useI18n();
  const [books, setBooks] = useState<Book[]>([]);
  const [filter, setFilter] = useState<BookSearchFilter>({
    sortBy: 'newest'
  });

  // 模拟书籍数据
  useEffect(() => {
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
        sellerId: '1',
        sellerName: '技术爱好者',
        status: 'available',
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        location: '北京',
        tags: ['前端', 'JavaScript', '编程']
      },
      {
        id: '2',
        title: '百年孤独',
        author: '加西亚·马尔克斯',
        publisher: '南海出版公司',
        publishYear: 2017,
        category: 'literature',
        condition: 'good',
        description: '魔幻现实主义文学经典，中文版，有少量笔记',
        price: 25,
        originalPrice: 39.5,
        images: ['/api/placeholder/400/600'],
        sellerId: '2',
        sellerName: '文学青年',
        status: 'available',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-10'),
        location: '上海',
        tags: ['文学', '小说', '经典']
      },
      {
        id: '3',
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
        sellerId: '3',
        sellerName: 'AI研究生',
        status: 'available',
        createdAt: new Date('2024-01-05'),
        updatedAt: new Date('2024-01-05'),
        location: '深圳',
        tags: ['人工智能', '机器学习', '深度学习']
      }
    ];
    setBooks(mockBooks);
  }, []);

  const categories: { value: BookCategory; label: string }[] = [
    { value: 'literature', label: t('books.category.literature') },
    { value: 'science', label: t('books.category.science') },
    { value: 'technology', label: t('books.category.technology') },
    { value: 'history', label: t('books.category.history') },
    { value: 'philosophy', label: t('books.category.philosophy') },
    { value: 'art', label: t('books.category.art') },
    { value: 'education', label: t('books.category.education') },
    { value: 'children', label: t('books.category.children') },
    { value: 'other', label: t('books.category.other') }
  ];

  const conditions: { value: BookCondition; label: string; color: string }[] = [
    { value: 'new', label: t('books.condition.new'), color: 'success' },
    { value: 'like-new', label: t('books.condition.likeNew'), color: 'success' },
    { value: 'good', label: t('books.condition.good'), color: 'info' },
    { value: 'fair', label: t('books.condition.fair'), color: 'warning' },
    { value: 'poor', label: t('books.condition.poor'), color: 'destructive' }
  ];

  const getConditionInfo = (condition: BookCondition) => {
    return conditions.find(c => c.value === condition) || conditions[2];
  };

  const getCategoryLabel = (category: BookCategory) => {
    return categories.find(c => c.value === category)?.label || category;
  };

  const filteredBooks = books.filter(book => {
    if (filter.keyword) {
      const keyword = filter.keyword.toLowerCase();
      return book.title.toLowerCase().includes(keyword) || 
             book.author.toLowerCase().includes(keyword) ||
             book.description.toLowerCase().includes(keyword);
    }
    if (filter.category && book.category !== filter.category) return false;
    if (filter.condition && book.condition !== filter.condition) return false;
    return true;
  });

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold mb-2">{t('books.title')}</h1>
              <p className="text-muted-foreground">
                {t('books.subtitle')}
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/books/sell">
                <Button>{t('books.publishBook')}</Button>
              </Link>
              <Link href="/books/my-books">
                <Button variant="outline">{t('books.myBooks')}</Button>
              </Link>
            </div>
          </div>

          {/* Search and filter */}
          <div className="bg-white rounded-lg border p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder={t('books.searchPlaceholder')}
                  value={filter.keyword || ''}
                  onChange={(e) => setFilter(prev => ({ ...prev, keyword: e.target.value }))}
                />
              </div>
              <div>
                <select 
                  className="w-full p-2 border border-input rounded-md"
                  value={filter.category || ''}
                  onChange={(e) => setFilter(prev => ({ ...prev, category: e.target.value as BookCategory || undefined }))}
                >
                  <option value="">{t('books.allCategories')}</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  className="w-full p-2 border border-input rounded-md"
                  value={filter.condition || ''}
                  onChange={(e) => setFilter(prev => ({ ...prev, condition: e.target.value as BookCondition || undefined }))}
                >
                  <option value="">{t('books.allConditions')}</option>
                  {conditions.map(cond => (
                    <option key={cond.value} value={cond.value}>{cond.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Books grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map((book) => {
              const conditionInfo = getConditionInfo(book.condition);
              
              return (
                <Link key={book.id} href={`/books/${book.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <div className="aspect-[3/4] relative overflow-hidden rounded-t-lg">
                      <Image
                        src={book.images[0]}
                        alt={book.title}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <Badge 
                          variant={conditionInfo.color as 'success' | 'info' | 'warning' | 'destructive'}
                          size="sm"
                        >
                          {conditionInfo.label}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-lg mb-1 line-clamp-2">
                        {book.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {book.author}
                      </p>
                      
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-brand-primary">
                            ¥{book.price}
                          </span>
                          {book.originalPrice && (
                            <span className="text-sm text-muted-foreground line-through">
                              ¥{book.originalPrice}
                            </span>
                          )}
                        </div>
                        <Badge variant="outline" size="sm">
                          {getCategoryLabel(book.category)}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {truncateText(book.description, 60)}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>📍 {book.location}</span>
                        <span>{formatDate(book.createdAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {filteredBooks.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-lg font-semibold mb-2">{t('books.empty')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('books.emptyDescription')}
              </p>
              <Link href="/books/sell">
                <Button>{t('books.publishFirst')}</Button>
              </Link>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}