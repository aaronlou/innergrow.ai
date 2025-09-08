import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@/components/ui';
import { useI18n } from '@/contexts';
import { CreatePostData, PostType } from '@/types';

interface CreatePostFormProps {
  onSubmit: (data: CreatePostData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const CreatePostForm: React.FC<CreatePostFormProps> = ({
  onSubmit,
  onCancel,
  isSubmitting
}) => {
  const { t } = useI18n();
  const [formData, setFormData] = useState<CreatePostData>({
    title: '',
    content: '',
    post_type: 'discussion',
    tags: [],
    attachments: []
  });
  const [tagInput, setTagInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;
    
    await onSubmit(formData);
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags?.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tag]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      attachments: files
    }));
  };

  const postTypes: { value: PostType; label: string; icon: string }[] = [
    { value: 'question', label: t('discussions.postTypeQuestion'), icon: '❓' },
    { value: 'resource', label: t('discussions.postTypeResource'), icon: '📚' },
    { value: 'experience', label: t('discussions.postTypeExperience'), icon: '💡' },
    { value: 'note', label: t('discussions.postTypeNote'), icon: '📝' },
    { value: 'discussion', label: t('discussions.postTypeDiscussion'), icon: '💬' },
  ];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{t('discussions.createPost')}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Post Type Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('discussions.postType')}
            </label>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {postTypes.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, post_type: type.value }))}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    formData.post_type === type.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  <div className="text-lg mb-1">{type.icon}</div>
                  <div>{type.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('discussions.postTitle')}
            </label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder={t('discussions.postTitlePlaceholder')}
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('discussions.postContent')}
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder={t('discussions.postContentPlaceholder')}
              className="w-full p-3 border border-input rounded-md bg-background resize-none"
              rows={6}
              required
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('discussions.addTags')}
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder={t('discussions.tagPlaceholder')}
                className="flex-1 flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              <Button type="button" onClick={addTag} variant="outline">
                {t('common.add')}
              </Button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-sm rounded-full"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-primary/70"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* File Attachments */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('discussions.attachFiles')}
            </label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            {formData.attachments && formData.attachments.length > 0 && (
              <div className="mt-2 space-y-1">
                {Array.from(formData.attachments).map((file, index) => (
                  <div key={index} className="text-sm text-muted-foreground">
                    📎 {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={isSubmitting}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={!formData.title.trim() || !formData.content.trim() || isSubmitting}
            >
              {isSubmitting ? t('common.loading') : t('discussions.publish')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
