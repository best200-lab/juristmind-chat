import { useState } from "react";
import { Copy, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface SourceDisplayProps {
  sources: string[];
}

export function SourceDisplay({ sources }: SourceDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  if (!sources || sources.length === 0) return null;

  const copyToClipboard = (source: string) => {
    navigator.clipboard.writeText(source);
    toast({
      title: "Copied!",
      description: "Source link copied to clipboard",
    });
  };

  const visibleSources = isExpanded ? sources : sources.slice(0, 1);

  return (
    <div className="mt-3 p-3 bg-muted/50 rounded-lg border border-border">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-foreground">Sources</h4>
        {sources.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-auto p-1"
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            <span className="ml-1 text-xs">
              {isExpanded ? 'Show less' : `+${sources.length - 1} more`}
            </span>
          </Button>
        )}
      </div>
      
      <div className="space-y-2">
        {visibleSources.map((source, index) => (
          <div key={index} className="flex items-center gap-2 p-2 bg-background rounded border">
            <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <a 
                href={source}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline truncate block"
                title={source}
              >
                {source}
              </a>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(source)}
              className="h-auto p-1"
              title="Copy source link"
            >
              <Copy className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}