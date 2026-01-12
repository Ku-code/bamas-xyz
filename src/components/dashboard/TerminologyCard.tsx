import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Eye, 
  MessageSquare, 
  Link as LinkIcon, 
  Star, 
  StarOff, 
  ChevronDown, 
  ChevronUp,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { TerminologyTerm, LanguageView } from "@/lib/terminology";
import { toggleFavorite } from "@/lib/terminology";
import { useToast } from "@/hooks/use-toast";

interface TerminologyCardProps {
  term: TerminologyTerm;
  languageView: LanguageView;
  onViewDetails?: (term: TerminologyTerm) => void;
  onFavoriteChange?: () => void;
}

export const TerminologyCard = ({ 
  term, 
  languageView, 
  onViewDetails,
  onFavoriteChange 
}: TerminologyCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [isFavorited, setIsFavorited] = useState(term.is_favorited || false);
  const { toast } = useToast();

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const newState = await toggleFavorite(term.id);
      setIsFavorited(newState);
      onFavoriteChange?.();
      toast({
        title: newState ? "Added to favorites" : "Removed from favorites",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorite",
        variant: "destructive",
      });
    }
  };

  const shouldShowBg = languageView === "both" || languageView === "bulgarian";
  const shouldShowEn = languageView === "both" || languageView === "english";

  // Don't show card if Bulgarian-only view and no BG translation
  if (languageView === "bulgarian" && !term.term_bg) {
    return null;
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline" className="text-xs">
                {term.category.replace('_', ' ')}
              </Badge>
              {term.translation_status === "Approved" && (
                <Badge variant="secondary" className="text-xs">Approved</Badge>
              )}
              {term.is_expert_verified && (
                <Badge variant="default" className="text-xs">✓ Verified</Badge>
              )}
            </div>

            {shouldShowEn && (
              <h3 className="font-semibold text-lg mb-1">{term.term_en}</h3>
            )}
            {shouldShowBg && term.term_bg && (
              <h3 className="font-semibold text-lg mb-1">{term.term_bg}</h3>
            )}
            {term.latin_script && shouldShowBg && (
              <p className="text-sm text-muted-foreground italic mb-2">
                [{term.latin_script}]
              </p>
            )}
            {term.acronym && (
              <Badge variant="outline" className="text-xs">
                {term.acronym}
              </Badge>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleFavorite}
            className="h-8 w-8 p-0"
          >
            {isFavorited ? (
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            ) : (
              <StarOff className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-2">
          {shouldShowEn && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {term.description_en}
            </p>
          )}
          {shouldShowBg && term.description_bg && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {term.description_bg}
            </p>
          )}

          {expanded && (
            <div className="space-y-3 mt-3 pt-3 border-t">
              {shouldShowEn && (
                <div>
                  <p className="text-sm">{term.description_en}</p>
                </div>
              )}
              {shouldShowBg && term.description_bg && (
                <div>
                  <p className="text-sm">{term.description_bg}</p>
                </div>
              )}

              {term.synonyms_en && term.synonyms_en.length > 0 && shouldShowEn && (
                <div>
                  <p className="text-xs font-medium mb-1">Synonyms:</p>
                  <div className="flex flex-wrap gap-1">
                    {term.synonyms_en.map((syn, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {syn}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {term.standard_reference && (
                <div>
                  <p className="text-xs font-medium mb-1">Standard:</p>
                  <Badge variant="outline" className="text-xs">
                    {term.standard_reference}
                  </Badge>
                </div>
              )}

              {term.tags && term.tags.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-1">Tags:</p>
                  <div className="flex flex-wrap gap-1">
                    {term.tags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {term.view_count}
              </span>
              {term.favorite_count > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {term.favorite_count}
                </span>
              )}
              {term.related_terms && term.related_terms.length > 0 && (
                <span className="flex items-center gap-1">
                  <LinkIcon className="h-3 w-3" />
                  {term.related_terms.length}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="text-xs"
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    More
                  </>
                )}
              </Button>
              {onViewDetails && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDetails(term)}
                  className="text-xs"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Details
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
