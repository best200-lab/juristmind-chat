import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Tag, Download, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface JudgeNote {
  id: string;
  title: string;
  judge_name: string;
  court: string;
  category: string;
  content: string;
  tags: string[];
  created_at: string;
}

interface ReadFullNoteProps {
  noteId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReadFullNote({ noteId, open, onOpenChange }: ReadFullNoteProps) {
  const [note, setNote] = useState<JudgeNote | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && noteId) {
      fetchNote();
    }
  }, [open, noteId]);

  const fetchNote = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-judge-notes', {
        body: { action: 'get-by-id', noteData: { id: noteId } }
      });

      if (error) throw error;
      setNote(data);
    } catch (error) {
      console.error('Error fetching note:', error);
      toast.error('Failed to fetch note details');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!note) return;
    
    // Create a simple text content for PDF simulation
    const content = `
JUDGE NOTES

Title: ${note.title}
Judge: ${note.judge_name}
Court: ${note.court}
Category: ${note.category}
Date: ${new Date(note.created_at).toLocaleDateString()}

Content:
${note.content}

Tags: ${note.tags.join(', ')}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `judge-note-${note.title.replace(/[^a-zA-Z0-9]/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Note downloaded successfully');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onOpenChange(false)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <DialogTitle className="text-xl">Judge Note Details</DialogTitle>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading note...</p>
          </div>
        ) : note ? (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-4">{note.title}</h1>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                <span className="font-medium">{note.judge_name}</span>
                <span>•</span>
                <span>{note.court}</span>
                <span>•</span>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(note.created_at).toLocaleDateString()}
                </div>
                <span className="px-3 py-1 bg-primary/10 text-primary rounded-full">
                  {note.category}
                </span>
              </div>

              {note.tags.length > 0 && (
                <div className="flex items-center gap-2 mb-6">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <div className="flex gap-2">
                    {note.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="prose max-w-none">
              <div className="bg-muted/50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Full Content</h3>
                <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                  {note.content}
                </div>
                
                <div className="mt-6 pt-4 border-t text-center">
                  <p className="text-sm text-muted-foreground">
                    Gotten from Jurist Mind AI
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={handleDownloadPDF} variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                Download Note
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Note not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
