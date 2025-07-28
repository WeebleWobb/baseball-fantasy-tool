import { cn } from "@/lib/utils"

interface LoadingIndicatorProps {
  hasMore: boolean
  isNearBottom: boolean
  currentCount: number
  totalCount: number
  className?: string
}

export default function LoadingIndicator({
  hasMore,
  isNearBottom,
  currentCount,
  totalCount,
  className
}: LoadingIndicatorProps) {
  const isActivelyLoading = isNearBottom && hasMore
  
  const statusMessage = `Showing ${currentCount} of ${totalCount} players - `
  
  const loadingMessage = hasMore 
      ? "Scroll down to load more"
      : "All players loaded"

  return (
    <div
      className={cn(
        "flex items-center justify-between space-x-2 py-4",
        className
      )}
    >
      <div className="text-sm text-muted-foreground">
        {statusMessage}
        {loadingMessage}
        {isActivelyLoading && (
          <div className="animate-spin inline-block h-4 w-4 ml-2 border-2 border-current border-t-transparent rounded-full" />
        )}
      </div>
    </div>
  )
} 