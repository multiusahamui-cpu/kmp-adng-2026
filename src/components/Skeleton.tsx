
import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className = '', 
  variant = 'rectangular', 
  width, 
  height 
}) => {
  const baseClasses = "animate-pulse bg-gray-200 dark:bg-gray-700";
  
  const variantClasses = {
    text: "rounded-md",
    circular: "rounded-full",
    rectangular: "rounded-xl",
  };

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`} 
      style={{ width, height }}
    />
  );
};

// Pre-built patterns for common use cases
export const ProductSkeleton = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full">
    <Skeleton className="h-48 w-full" />
    <div className="p-4 space-y-3">
      <Skeleton variant="text" className="h-4 w-3/4" />
      <Skeleton variant="text" className="h-3 w-1/2" />
      <div className="flex justify-between items-end pt-2">
        <Skeleton variant="text" className="h-6 w-1/3" />
        <Skeleton variant="rectangular" className="h-8 w-8 rounded-lg" />
      </div>
    </div>
  </div>
);

export const ListItemSkeleton = () => (
  <div className="flex items-center space-x-4 p-4 border-b border-gray-50">
    <Skeleton variant="circular" className="w-12 h-12 shrink-0" />
    <div className="flex-1 space-y-2">
      <Skeleton variant="text" className="h-4 w-1/3" />
      <Skeleton variant="text" className="h-3 w-1/4" />
    </div>
    <Skeleton variant="text" className="h-4 w-16" />
  </div>
);

export const NewsSkeleton = () => (
  <div className="flex space-x-4 p-4">
    <Skeleton variant="rectangular" className="w-24 h-16 shrink-0" />
    <div className="flex-1 space-y-2 py-1">
      <Skeleton variant="text" className="w-20 h-3 mb-1" />
      <Skeleton variant="text" className="w-full h-4" />
      <Skeleton variant="text" className="w-2/3 h-3" />
    </div>
  </div>
);
