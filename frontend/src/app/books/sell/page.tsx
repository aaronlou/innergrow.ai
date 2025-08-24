'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui';
import { DashboardLayout, ProtectedRoute } from '@/components/layout';
import { BookCategory, BookCondition } from '@/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import Link from 'next/link';

interface BookForm {
  title: string;
  author: string;
  isbn: string;
  publisher: string;
  publishYear: string;
  category: BookCategory;
  condition: BookCondition;
  description: string;
  price: string;
  originalPrice: string;
  location: string;
  tags: string;
  images: File[];
}

export default function SellBookPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string[]>([]);
  
  const [form, setForm] = useState<BookForm>({
    title: '',
    author: '',
    isbn: '',
    publisher: '',
    publishYear: '',
    category: 'other',
    condition: 'good',
    description: '',
    price: '',
    originalPrice: '',
    location: '',
    tags: '',
    images: []
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const categories: { value: BookCategory; label: string }[] = [
    { value: 'literature', label: '文学' },
    { value: 'science', label: '科学' },
    { value: 'technology', label: '技术' },
    { value: 'history', label: '历史' },
    { value: 'philosophy', label: '哲学' },
    { value: 'art', label: '艺术' },
    { value: 'education', label: '教育' },
    { value: 'children', label: '儿童' },
    { value: 'other', label: '其他' }
  ];

  const conditions: { value: BookCondition; label: string; description: string }[] = [
    { value: 'new', label: '全新', description: '未拆封或刚拆封' },
    { value: 'like-new', label: '几乎全新', description: '轻微使用痕迹' },
    { value: 'good', label: '良好', description: '正常使用痕迹' },
    { value: 'fair', label: '一般', description: '明显使用痕迹' },
    { value: 'poor', label: '较差', description: '重度使用痕迹' }
  ];

  const handleInputChange = (field: keyof BookForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // 限制最多上传5张图片
    const newFiles = [...form.images, ...files].slice(0, 5);
    setForm(prev => ({ ...prev, images: newFiles }));

    // 生成预览
    const newPreviews: string[] = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          newPreviews.push(e.target.result as string);
          if (newPreviews.length === files.length) {
            setImagePreview(prev => [...prev, ...newPreviews].slice(0, 5));
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!form.title.trim()) newErrors.title = '请输入书名';
    if (!form.author.trim()) newErrors.author = '请输入作者';
    if (!form.description.trim()) newErrors.description = '请输入商品描述';
    if (!form.price.trim()) newErrors.price = '请输入价格';
    if (!form.location.trim()) newErrors.location = '请输入所在地区';

    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) newErrors.price = '请输入有效的价格';

    const originalPrice = parseFloat(form.originalPrice);
    if (form.originalPrice && (isNaN(originalPrice) || originalPrice <= 0)) {
      newErrors.originalPrice = '请输入有效的原价';
    }

    if (form.originalPrice && price >= originalPrice) {
      newErrors.price = '售价应小于原价';
    }

    if (form.images.length === 0) {
      newErrors.images = '请至少上传一张图片';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      // 模拟上传图片和创建书籍
      await new Promise(resolve => setTimeout(resolve, 2000));

      // 这里应该调用实际的API
      const newBook = {
        ...form,
        id: Date.now().toString(),
        price: parseFloat(form.price),
        originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : undefined,
        publishYear: form.publishYear ? parseInt(form.publishYear) : undefined,
        sellerId: user?.id,
        sellerName: user?.name,
        status: 'available',
        images: imagePreview, // 实际中这里应该是上传后的图片URL
        tags: form.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      alert('发布成功！您的书籍已添加到市场中。');
      router.push('/books/my-books');
    } catch (error) {
      alert('发布失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 max-w-4xl mx-auto">
          {/* 头部 */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Link href="/books" className="hover:text-foreground">
                二手书市场
              </Link>
              <span>/</span>
              <span className="text-foreground">发布书籍</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">📖 发布二手书</h1>
            <p className="text-muted-foreground">
              分享您的闲置书籍，让知识传递给更多需要的人
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 基本信息 */}
            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="书名"
                      placeholder="请输入书名"
                      value={form.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      error={errors.title}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      label="作者"
                      placeholder="请输入作者姓名"
                      value={form.author}
                      onChange={(e) => handleInputChange('author', e.target.value)}
                      error={errors.author}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Input
                      label="ISBN（选填）"
                      placeholder="978-7-115-54538-1"
                      value={form.isbn}
                      onChange={(e) => handleInputChange('isbn', e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      label="出版社（选填）"
                      placeholder="请输入出版社"
                      value={form.publisher}
                      onChange={(e) => handleInputChange('publisher', e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      label="出版年份（选填）"
                      placeholder="2020"
                      value={form.publishYear}
                      onChange={(e) => handleInputChange('publishYear', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">分类</label>
                    <select 
                      className="w-full mt-1 p-2 border border-input rounded-md"
                      value={form.category}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                    >
                      {categories.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Input
                      label="所在地区"
                      placeholder="如：北京海淀区"
                      value={form.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      error={errors.location}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Input
                    label="标签（选填）"
                    placeholder="用逗号分隔，如：编程,前端,JavaScript"
                    value={form.tags}
                    onChange={(e) => handleInputChange('tags', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 品相和价格 */}
            <Card>
              <CardHeader>
                <CardTitle>品相和价格</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-3 block">书籍品相</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                    {conditions.map((condition) => (
                      <label
                        key={condition.value}
                        className={cn(
                          "flex flex-col p-3 border rounded-lg cursor-pointer transition-colors hover:bg-muted",
                          form.condition === condition.value
                            ? "border-brand-primary bg-brand-primary/5"
                            : "border-border"
                        )}
                      >
                        <input
                          type="radio"
                          name="condition"
                          value={condition.value}
                          checked={form.condition === condition.value}
                          onChange={(e) => handleInputChange('condition', e.target.value)}
                          className="sr-only"
                        />
                        <span className="font-medium">{condition.label}</span>
                        <span className="text-xs text-muted-foreground mt-1">
                          {condition.description}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label="售价"
                      placeholder="请输入售价"
                      value={form.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      error={errors.price}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      label="原价（选填）"
                      placeholder="请输入原价"
                      value={form.originalPrice}
                      onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                      error={errors.originalPrice}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 图片上传 */}
            <Card>
              <CardHeader>
                <CardTitle>书籍图片</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 图片预览 */}
                  {imagePreview.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {imagePreview.map((src, index) => (
                        <div key={index} className="relative aspect-[3/4] rounded-lg overflow-hidden">
                          <Image
                            src={src}
                            alt={`预览 ${index + 1}`}
                            fill
                            className="object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-sm hover:bg-red-600"
                          >
                            ×
                          </button>
                          {index === 0 && (
                            <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                              封面
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 上传按钮 */}
                  {form.images.length < 5 && (
                    <div>
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <div className="text-2xl mb-2">📷</div>
                          <p className="text-sm text-muted-foreground">
                            点击上传图片（最多5张）
                          </p>
                          <p className="text-xs text-muted-foreground">
                            支持 JPG、PNG 格式，建议尺寸 400x600
                          </p>
                        </div>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  )}

                  {errors.images && (
                    <p className="text-sm text-red-500">{errors.images}</p>
                  )}

                  <div className="text-xs text-muted-foreground">
                    <p>📝 图片上传提示：</p>
                    <ul className="ml-4 mt-1 space-y-1">
                      <li>• 第一张图片将作为封面显示</li>
                      <li>• 建议上传书籍正面、背面、内页等多角度照片</li>
                      <li>• 清晰的图片能提高成交几率</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 商品描述 */}
            <Card>
              <CardHeader>
                <CardTitle>商品描述</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  label="详细描述"
                  type="textarea"
                  placeholder="请详细描述书籍的状态、使用情况、购买原因等，诚信描述能提高买家信任度..."
                  value={form.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  error={errors.description}
                  className="min-h-32"
                  required
                />
                <div className="mt-2 text-xs text-muted-foreground">
                  <p>💡 描述建议包含：</p>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>• 书籍的具体状态（是否有笔记、折页等）</li>
                    <li>• 购买时间和使用频率</li>
                    <li>• 出售原因</li>
                    <li>• 适合的读者群体</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* 提交按钮 */}
            <div className="flex gap-4 justify-end">
              <Link href="/books">
                <Button variant="outline">取消</Button>
              </Link>
              <Button type="submit" loading={loading}>
                {loading ? '发布中...' : '发布书籍'}
              </Button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}