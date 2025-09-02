'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui';
import { DashboardLayout, ProtectedRoute } from '@/components/layout';
import { BookCategory, BookCondition } from '@/types';
import { cn } from '@/lib/utils';
import { useI18n } from '@/contexts';
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
  const { t } = useI18n();
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

  const conditions: { value: BookCondition; label: string; description: string }[] = [
    { value: 'new', label: t('books.condition.new'), description: t('books.condition.new.desc') },
    { value: 'like-new', label: t('books.condition.likeNew'), description: t('books.condition.likeNew.desc') },
    { value: 'good', label: t('books.condition.good'), description: t('books.condition.good.desc') },
    { value: 'fair', label: t('books.condition.fair'), description: t('books.condition.fair.desc') },
    { value: 'poor', label: t('books.condition.poor'), description: t('books.condition.poor.desc') }
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

    if (!form.title.trim()) newErrors.title = t('validation.required');
    if (!form.author.trim()) newErrors.author = t('validation.required');
    if (!form.description.trim()) newErrors.description = t('validation.required');
    if (!form.price.trim()) newErrors.price = t('validation.required');
    if (!form.location.trim()) newErrors.location = t('validation.required');

    const price = parseFloat(form.price);
    if (isNaN(price) || price <= 0) newErrors.price = t('validation.invalidPrice');

    const originalPrice = parseFloat(form.originalPrice);
    if (form.originalPrice && (isNaN(originalPrice) || originalPrice <= 0)) {
      newErrors.originalPrice = t('validation.invalidPrice');
    }

    if (form.originalPrice && price >= originalPrice) {
      newErrors.price = t('validation.priceGreaterThanOriginal');
    }

    if (form.images.length === 0) {
      newErrors.images = t('validation.atLeastOneImage');
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
      alert(t('books.sell.success'));
      router.push('/books/my-books');
    } catch {
      alert(t('books.sell.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="p-6 max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Link href="/books" className="hover:text-foreground">
                {t('books.breadcrumb.market')}
              </Link>
              <span>/</span>
              <span className="text-foreground">{t('books.sell.title')}</span>
            </div>
            <h1 className="text-2xl font-bold mb-2">{t('books.sell.title')}</h1>
            <p className="text-muted-foreground">
              {t('books.sell.subtitle')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic information */}
            <Card>
              <CardHeader>
                <CardTitle>{t('books.sell.basicInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Input
                      label={t('books.sell.bookTitle')}
                      placeholder={t('books.sell.bookTitle')}
                      value={form.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      error={errors.title}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      label={t('books.sell.author')}
                      placeholder={t('books.sell.author')}
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
                      label={t('books.sell.isbn')}
                      placeholder="978-7-115-54538-1"
                      value={form.isbn}
                      onChange={(e) => handleInputChange('isbn', e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      label={t('books.sell.publisher')}
                      placeholder={t('books.publisher')}
                      value={form.publisher}
                      onChange={(e) => handleInputChange('publisher', e.target.value)}
                    />
                  </div>
                  <div>
                    <Input
                      label={t('books.sell.publishYear')}
                      placeholder="2020"
                      value={form.publishYear}
                      onChange={(e) => handleInputChange('publishYear', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">{t('books.sell.category')}</label>
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
                      label={t('books.sell.location')}
                      placeholder="Beijing Haidian District"
                      value={form.location}
                      onChange={(e) => handleInputChange('location', e.target.value)}
                      error={errors.location}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Input
                    label={t('books.sell.tags')}
                    placeholder={t('books.sell.tagsPlaceholder')}
                    value={form.tags}
                    onChange={(e) => handleInputChange('tags', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Condition and price */}
            <Card>
              <CardHeader>
                <CardTitle>{t('books.sell.conditionAndPrice')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-3 block">{t('books.sell.bookCondition')}</label>
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
                      label={t('books.sell.price')}
                      placeholder={t('books.price')}
                      value={form.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      error={errors.price}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      label={t('books.sell.originalPrice')}
                      placeholder={t('books.originalPrice')}
                      value={form.originalPrice}
                      onChange={(e) => handleInputChange('originalPrice', e.target.value)}
                      error={errors.originalPrice}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Image upload */}
            <Card>
              <CardHeader>
                <CardTitle>{t('books.sell.images')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Image preview */}
                  {imagePreview.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                      {imagePreview.map((src, index) => (
                        <div key={index} className="relative aspect-[3/4] rounded-lg overflow-hidden">
                          <Image
                            src={src}
                            alt={`Preview ${index + 1}`}
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
                              Cover
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload button */}
                  {form.images.length < 5 && (
                    <div>
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <div className="text-2xl mb-2">📷</div>
                          <p className="text-sm text-muted-foreground">
                            {t('books.sell.uploadImages')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t('books.sell.imageFormat')}
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
                    <p>{t('books.sell.imageHints')}</p>
                    <ul className="ml-4 mt-1 space-y-1">
                      <li>{t('books.sell.imageHint1')}</li>
                      <li>{t('books.sell.imageHint2')}</li>
                      <li>{t('books.sell.imageHint3')}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product description */}
            <Card>
              <CardHeader>
                <CardTitle>{t('books.sell.description')}</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  label={t('books.sell.descriptionLabel')}
                  type="textarea"
                  placeholder={t('books.sell.descriptionPlaceholder')}
                  value={form.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  error={errors.description}
                  className="min-h-32"
                  required
                />
                <div className="mt-2 text-xs text-muted-foreground">
                  <p>{t('books.sell.descriptionHints')}</p>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>{t('books.sell.descriptionHint1')}</li>
                    <li>{t('books.sell.descriptionHint2')}</li>
                    <li>{t('books.sell.descriptionHint3')}</li>
                    <li>{t('books.sell.descriptionHint4')}</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Submit buttons */}
            <div className="flex gap-4 justify-end">
              <Link href="/books">
                <Button variant="outline">{t('common.cancel')}</Button>
              </Link>
              <Button type="submit" loading={loading}>
                {loading ? t('books.sell.publishing') : t('books.sell.publish')}
              </Button>
            </div>
          </form>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}