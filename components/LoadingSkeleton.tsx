'use client';

export function PostCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#1a2332] rounded-xl border border-gray-200 dark:border-gray-800 p-5 animate-pulse">
      <div className="flex gap-4">
        <div className="hidden sm:block w-20 h-20 rounded-lg skeleton" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full skeleton" />
            <div className="w-24 h-3 skeleton" />
            <div className="w-16 h-3 skeleton" />
          </div>
          <div className="w-3/4 h-4 skeleton" />
          <div className="w-full h-3 skeleton" />
          <div className="w-2/3 h-3 skeleton" />
          <div className="flex gap-2 pt-1">
            <div className="w-16 h-5 rounded-full skeleton" />
            <div className="w-10 h-5 skeleton" />
            <div className="w-10 h-5 skeleton" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PostListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}
