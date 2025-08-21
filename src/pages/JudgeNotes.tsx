import { useState, useEffect } from "react";
import { FileText, Plus, Search, Calendar, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AddNoteDialog } from "@/components/AddNoteDialog";
import { ReadFullNote } from "@/components/ReadFullNote";

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

export default function JudgeNotes() {
  const [notes, setNotes] = useState<JudgeNote[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<JudgeNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedNoteId, setSelectedNoteId] = useState<string>("");
  const [readNoteOpen, setReadNoteOpen] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [searchTerm, notes]);

  const fetchNotes = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-judge-notes', {
        body: { action: 'list' }
      });

      if (error) throw error;
      setNotes(data || []);
      setFilteredNotes(data || []);
    } catch (error) {
      console.error('Error fetching notes:', error);
      toast.error('Failed to fetch judge notes');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchTerm) {
      setFilteredNotes(notes);
      return;
    }

    const filtered = notes.filter(note => 
      note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.judge_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.court.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    setFilteredNotes(filtered);
  };

  const handleReadFullNote = (noteId: string) => {
    setSelectedNoteId(noteId);
    setReadNoteOpen(true);
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  if (loading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Judges to Lawyers Notes</h1>
          <p className="text-muted-foreground">Access insights and guidance from judicial officers</p>
        </div>

        {/* Search and Add */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search judge notes..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <AddNoteDialog onNoteAdded={fetchNotes} />
        </div>

        {/* Judge Notes */}
        <div className="space-y-6">
          {filteredNotes.map((note) => (
            <Card key={note.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{note.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{note.judge_name}</span>
                      <span>•</span>
                      <span>{note.court}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(note.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                    {note.category}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{truncateContent(note.content)}</p>
                <div className="flex items-center gap-2 mb-4">
                  <Tag className="w-4 h-4 text-muted-foreground" />
                  <div className="flex gap-2">
                    {note.tags.slice(0, 3).map((tag, index) => (
                      <span 
                        key={index}
                        className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded"
                      >
                        {tag}
                      </span>
                    ))}
                    {note.tags.length > 3 && (
                      <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                        +{note.tags.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleReadFullNote(note.id)}
                  >
                    Read Full Note
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredNotes.length === 0 && !loading && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                {searchTerm ? 'No notes found' : 'No judge notes yet'}
              </h3>
              <p className="text-muted-foreground">
                {searchTerm 
                  ? 'Try adjusting your search criteria' 
                  : 'Add the first judge note to get started'
                }
              </p>
            </div>
          )}
        </div>

        <ReadFullNote 
          noteId={selectedNoteId}
          open={readNoteOpen}
          onOpenChange={setReadNoteOpen}
        />
      </div>
    </div>
  );
}