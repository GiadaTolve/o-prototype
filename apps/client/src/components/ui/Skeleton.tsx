"use client";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular" | "rounded";
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export function Skeleton({ 
  className = "", 
  variant = "rectangular",
  width,
  height,
  lines,
}: SkeletonProps) {
  const baseClasses = "animate-pulse bg-gray-800/50";
  
  const variantClasses = {
    text: "rounded h-4",
    circular: "rounded-full",
    rectangular: "",
    rounded: "rounded-lg",
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height) style.height = typeof height === "number" ? `${height}px` : height;

  if (lines && variant === "text") {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`${baseClasses} ${variantClasses.text} ${className}`}
            style={{
              ...style,
              width: i === lines - 1 && width ? "60%" : width || "100%",
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

// Componenti skeleton predefiniti per casi comuni
export function SkeletonCard() {
  return (
    <div className="p-4 border border-[var(--border-color)] rounded-lg bg-black/20">
      <Skeleton variant="rounded" height={20} width="60%" className="mb-3" />
      <Skeleton variant="text" lines={3} className="mb-2" />
      <Skeleton variant="rounded" height={32} width="40%" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="border border-[var(--border-color)] rounded-lg overflow-hidden">
      <div className="p-4 border-b border-[var(--border-color)]">
        <Skeleton variant="rounded" height={20} width="30%" />
      </div>
      <div className="divide-y divide-[var(--border-color)]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center gap-4">
            <Skeleton variant="circular" width={40} height={40} />
            <div className="flex-1 space-y-2">
              <Skeleton variant="rounded" height={16} width="40%" />
              <Skeleton variant="rounded" height={12} width="60%" />
            </div>
            <Skeleton variant="rounded" height={32} width={80} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonList({ items = 3 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="p-3 border border-[var(--border-color)] rounded bg-black/20">
          <Skeleton variant="rounded" height={18} width="50%" className="mb-2" />
          <Skeleton variant="text" lines={2} />
        </div>
      ))}
    </div>
  );
}
