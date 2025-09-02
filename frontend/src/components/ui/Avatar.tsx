import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import type { ComponentProps } from '@/types';

interface AvatarProps extends ComponentProps {
  src?: string;
  alt?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallback?: string;
}

const avatarSizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
};

export function Avatar({
  src,
  alt,
  size = 'md',
  fallback,
  className,
  ...props
}: AvatarProps) {
  const [imageError, setImageError] = React.useState(false);
  
  const handleImageError = () => {
    setImageError(true);
  };

  // 生成fallback文字（取名字的首字母）
  const getFallbackText = () => {
    if (fallback) return fallback;
    if (alt) return alt.charAt(0).toUpperCase();
    return '?';
  };

  return (
    <div
      className={cn(
        'relative flex shrink-0 overflow-hidden rounded-full',
        avatarSizes[size],
        className
      )}
      {...props}
    >
      {src && !imageError ? (
        src.startsWith('https://') ? (
          // External image - use img tag instead of Next.js Image for external URLs
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="aspect-square h-full w-full object-cover"
            src={src}
            alt={alt || 'Avatar'}
            onError={handleImageError}
          />
        ) : (
          // Internal image - use Next.js Image
          <Image
            className="aspect-square h-full w-full object-cover"
            src={src}
            alt={alt || 'Avatar'}
            width={64}
            height={64}
            onError={handleImageError}
          />
        )
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-full bg-muted font-medium text-muted-foreground">
          {getFallbackText()}
        </div>
      )}
    </div>
  );
}