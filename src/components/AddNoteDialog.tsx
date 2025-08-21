import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddNoteDialogProps {
  onNoteAdded: () => void;
}

interface NoteForm {
  title: string;
  judge_name: string;
  court: string;
  category: string;
  content: string;
  tags: string[];
}

export function AddNoteDialog({ onNoteAdded }: AddNoteDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<NoteForm>({
    title: "",
    judge_name: "",
    court: "",
    category: "",
    content: "",
    tags: []
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const tagsArray = form.tags.length > 0 
        ? form.tags 
        : form.tags[0]?.split(',').map(s => s.trim()).filter(s => s) || [];

      const { data, error } = await supabase.functions.invoke('manage-judge-notes', {
        body: {
          action: 'create',
          noteData: {
            ...form,
            tags: tagsArray
          }
        }
      });

      if (error) throw error;

      toast.success('Judge note added successfully!');
      setOpen(false);
      setForm({
        title: "",
        judge_name: "",
        court: "",
        category: "",
        content: "",
        tags: []
      });
      onNoteAdded();
    } catch (error: any) {
      console.error('Error adding note:', error);
      toast.error(error.message || 'Failed to add note');
    } finally {
      setLoading(false);
    }
  };

  const handleTagsChange = (value: string) => {
    const tags = value.split(',').map(s => s.trim()).filter(s => s);
    setForm({ ...form, tags });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Note
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Judge Note</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Note Title *</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Brief title for the note"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="judge_name">Judge Name *</Label>
              <Input
                id="judge_name"
                value={form.judge_name}
                onChange={(e) => setForm({ ...form, judge_name: e.target.value })}
                placeholder="Hon. Justice..."
                required
              />
            </div>
            <div>
              <Label htmlFor="court">Court *</Label>
              <Input
                id="court"
                value={form.court}
                onChange={(e) => setForm({ ...form, court: e.target.value })}
                placeholder="High Court, Federal High Court, etc."
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="category">Category *</Label>
            <Input
              id="category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              placeholder="Commercial Law, Criminal Law, Property Law, etc."
              required
            />
          </div>

          <div>
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              rows={8}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Enter the full content of the judge's note (maximum 500 words)..."
              required
              maxLength={3000}
            />
            <div className="text-xs text-muted-foreground mt-1">
              {form.content.length}/3000 characters
            </div>
          </div>

          <div>
            <Label htmlFor="tags">Tags (comma-separated)</Label>
            <Input
              id="tags"
              value={Array.isArray(form.tags) ? form.tags.join(', ') : ''}
              onChange={(e) => handleTagsChange(e.target.value)}
              placeholder="e.g. Contract Law, Evidence, Procedure"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Adding...' : 'Add Note'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}