import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => Promise<boolean>;
  size?: "sm" | "default" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
}

export const FavoriteButton = ({
  isFavorite,
  onToggle,
  size = "icon",
  className,
  showLabel = false,
}: FavoriteButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [optimisticFavorite, setOptimisticFavorite] = useState(isFavorite);

  const handleClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    setIsLoading(true);
    setOptimisticFavorite(!optimisticFavorite);
    
    const success = await onToggle();
    
    if (!success) {
      setOptimisticFavorite(isFavorite);
    }
    setIsLoading(false);
  };

  return (
    <Button
      variant="ghost"
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={cn(
        "transition-colors",
        optimisticFavorite ? "text-destructive hover:text-destructive/80" : "text-muted-foreground hover:text-destructive",
        className
      )}
    >
      <Heart
        className={cn(
          "h-4 w-4 transition-all",
          optimisticFavorite && "fill-current"
        )}
      />
      {showLabel && (
        <span className="ml-2">
          {optimisticFavorite ? "Favorited" : "Favorite"}
        </span>
      )}
    </Button>
  );
};
