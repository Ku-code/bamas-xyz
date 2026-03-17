import { useState, useEffect, useRef, useCallback } from "react";
import { Search, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useLanguage } from "@/contexts/LanguageContext";

interface Suggestion {
  id: string;
  text: string;
  type: "skill" | "job" | "company" | "term";
}

interface JobSearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  selectedFilters: string[];
  onFilterAdd: (filter: string) => void;
  onFilterRemove: (filter: string) => void;
  onSearch: () => void;
  placeholder?: string;
}

const COMMON_SKILLS = [
  "3D Printing", "Additive Manufacturing", "CAD", "SolidWorks", "Fusion 360",
  "SLM", "SLS", "SLA", "FDM", "MJF", "PolyJet", "Metal AM", "Material Testing",
  "Quality Control", "Post-Processing", "Design for AM", "Topology Optimization",
  "Python", "MATLAB", "Simulation", "ANSYS", "CNC", "Prototyping"
];

const COMMON_JOBS = [
  "3D Printing Engineer", "Additive Manufacturing Specialist", "CAD Designer",
  "Materials Engineer", "Quality Assurance Manager", "Research Scientist",
  "Application Engineer", "Sales Manager", "Technical Support", "Lab Technician"
];

export const JobSearchAutocomplete: React.FC<JobSearchAutocompleteProps> = ({
  value,
  onChange,
  selectedFilters,
  onFilterAdd,
  onFilterRemove,
  onSearch,
  placeholder
}) => {
  const { language } = useLanguage();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchTerminologySuggestions = useCallback(async (query: string): Promise<Suggestion[]> => {
    if (!query || query.length < 2) return [];
    
    try {
      const { data, error } = await supabase
        .from('terminology_terms')
        .select('id, term_en, term_bg')
        .or(`term_en.ilike.%${query}%,term_bg.ilike.%${query}%`)
        .limit(5) as { data: Array<{ id: string; term_en: string; term_bg: string | null }> | null; error: Error | null };
      
      if (error || !data) return [];
      
      return data.map(term => ({
        id: term.id,
        text: language === 'bg' && term.term_bg ? term.term_bg : term.term_en,
        type: 'term' as const
      }));
    } catch {
      return [];
    }
  }, [language]);

  const fetchSuggestions = useCallback(async (query: string) => {
    if (!query || query.length < 1) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    const q = query.toLowerCase();

    const skillMatches: Suggestion[] = COMMON_SKILLS
      .filter(skill => skill.toLowerCase().includes(q))
      .slice(0, 4)
      .map(skill => ({ id: skill, text: skill, type: 'skill' }));

    const jobMatches: Suggestion[] = COMMON_JOBS
      .filter(job => job.toLowerCase().includes(q))
      .slice(0, 3)
      .map(job => ({ id: job, text: job, type: 'job' }));

    const termMatches = await fetchTerminologySuggestions(query);

    setSuggestions([...skillMatches, ...jobMatches, ...termMatches]);
    setIsLoading(false);
  }, [fetchTerminologySuggestions]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (value.trim()) {
        fetchSuggestions(value);
      } else {
        setSuggestions([]);
      }
    }, 150);

    return () => clearTimeout(debounceTimer);
  }, [value, fetchSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setShowSuggestions(true);
    setHighlightedIndex(-1);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (!selectedFilters.includes(suggestion.text)) {
      onFilterAdd(suggestion.text);
    }
    onChange("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        handleSuggestionClick(suggestions[highlightedIndex]);
      } else {
        onSearch();
        setShowSuggestions(false);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleFilterRemove = (filter: string) => {
    onFilterRemove(filter);
  };

  const getTypeIcon = (type: Suggestion['type']) => {
    switch (type) {
      case 'skill':
        return '🔧';
      case 'job':
        return '💼';
      case 'company':
        return '🏢';
      case 'term':
        return '📖';
      default:
        return '•';
    }
  };

  return (
    <div ref={containerRef} className="relative w-full space-y-2">
      <div className="flex flex-col gap-2">
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              value={value}
              onChange={handleInputChange}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder || (language === 'bg' ? 'Търси обяви, компании, умения...' : 'Search jobs, companies, skills...')}
              className="pl-9 pr-9 h-10"
            />
            {value && (
              <button
                onClick={() => {
                  onChange("");
                  setSuggestions([]);
                  inputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button onClick={onSearch} size="sm" className="h-10">
            {language === 'bg' ? 'Търси' : 'Search'}
          </Button>
        </div>

        {suggestions.length > 0 && showSuggestions && (
          <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg overflow-hidden top-full">
            {isLoading ? (
              <div className="p-3 text-sm text-muted-foreground flex items-center gap-2">
                <Sparkles className="h-4 w-4 animate-pulse" />
                {language === 'bg' ? 'Зареждане...' : 'Loading...'}
              </div>
            ) : (
              <ul className="max-h-64 overflow-y-auto py-1">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={suggestion.id}
                    className={cn(
                      "px-3 py-2 cursor-pointer flex items-center gap-2 text-sm",
                      index === highlightedIndex 
                        ? "bg-primary/10 text-primary" 
                        : "hover:bg-muted"
                    )}
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <span className="text-lg">{getTypeIcon(suggestion.type)}</span>
                    <span>{suggestion.text}</span>
                    <span className="ml-auto text-xs text-muted-foreground capitalize">
                      {suggestion.type}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {selectedFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedFilters.map((filter) => (
            <Badge
              key={filter}
              variant="secondary"
              className="flex items-center gap-1 pl-2 pr-1 py-1 h-auto text-xs"
            >
              {filter}
              <button
                onClick={() => handleFilterRemove(filter)}
                className="ml-1 hover:bg-destructive/20 rounded p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          {selectedFilters.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => selectedFilters.forEach(f => onFilterRemove(f))}
              className="text-xs text-muted-foreground h-auto px-2 py-1"
            >
              {language === 'bg' ? 'Изчисти всички' : 'Clear all'}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default JobSearchAutocomplete;
