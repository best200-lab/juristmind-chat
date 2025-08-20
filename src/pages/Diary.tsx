
import { useState, useEffect } from "react";
import { Calendar, Clock, Plus, Edit, Trash2, Search, Crown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface DiaryEntry {
  id: string;
  title: string;
  entry_date: string;
  entry_time: string;
  entry_type: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
}

const entryTypes = ["Meeting", "Court", "Task", "Research", "Deadline", "Other"];
const priorityOptions = ["High", "Medium", "Low"];
const statusOptions = ["Upcoming", "Completed", "In Progress", "Cancelled"];

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "High": return "text-red-500 bg-red-50 border-red-200";
    case "Medium": return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "Low": return "text-green-600 bg-green-50 border-green-200";
    default: return "text-muted-foreground bg-muted border-border";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Upcoming": return "text-primary bg-primary/10 border-primary/20";
    case "Completed": return "text-green-600 bg-green-50 border-green-200";
    case "In Progress": return "text-yellow-600 bg-yellow-50 border-yellow-200";
    case "Cancelled": return "text-red-600 bg-red-50 border-red-200";
    default: return "text-muted-foreground bg-muted border-border";
  }
};

export default function Diary() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    entry_date: "",
    entry_time: "",
    entry_type: "",
    description: "",
    priority: "Medium",
    status: "Upcoming",
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      checkPremiumStatus();
      fetchEntries();
    }
  }, [user]);

  const checkPremiumStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-credits', {
        body: { action: 'check' }
      });

      if (error) {
        console.error('Error checking premium status:', error);
        return;
      }
      setIsPremium(data.is_premium_active || false);
    } catch (error) {
      console.error('Error checking premium status:', error);
    }
  };

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-diary', {
        body: { action: 'list' }
      });

      if (error && error.requiresUpgrade) {
        setEntries([]);
        return;
      }
      
      if (error) {
        console.error('Error fetching entries:', error);
        toast.error('Failed to fetch diary entries');
        return;
      }
      
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching diary entries:', error);
      toast.error('Failed to fetch diary entries');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to create diary entries');
      return;
    }

    if (!isPremium) {
      toast.error('Premium subscription required for diary features');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('manage-diary', {
        body: { action: 'create', entryData: formData }
      });

      if (error) {
        console.error('Error creating diary entry:', error);
        toast.error('Failed to create diary entry');
        return;
      }
      
      setEntries([data, ...entries]);
      setIsDialogOpen(false);
      setFormData({
        title: "",
        entry_date: "",
        entry_time: "",
        entry_type: "",
        description: "",
        priority: "Medium",
        status: "Upcoming",
      });
      toast.success('Diary entry created successfully');
    } catch (error) {
      console.error('Error creating diary entry:', error);
      toast.error('Failed to create diary entry');
    }
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const { error } = await supabase.functions.invoke('manage-diary', {
        body: { action: 'delete', entryData: { id: entryId } }
      });

      if (error) {
        console.error('Error deleting entry:', error);
        toast.error('Failed to delete entry');
        return;
      }

      setEntries(entries.filter(entry => entry.id !== entryId));
      toast.success('Entry deleted successfully');
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast.error('Failed to delete entry');
    }
  };

  const filteredEntries = entries.filter(entry =>
    entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.entry_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isPremium && !loading) {
    return (
      <div className="h-full bg-background overflow-y-auto">
        <div className="max-w-4xl mx-auto p-6">
          <div className="text-center py-16">
            <Crown className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Premium Feature
            </h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              The Legal Diary is a premium feature. Upgrade your account to organize your 
              legal practice with advanced scheduling and task management.
            </p>
            <Button 
              size="lg" 
              className="gap-2"
              onClick={() => window.location.href = '/upgrade'}
            >
              <Crown className="w-5 h-5" />
              Upgrade to Premium
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Legal Diary</h1>
          <p className="text-muted-foreground">Manage your legal practice schedule and tasks</p>
        </div>

        {/* Search and Add */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search diary entries..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Diary Entry</DialogTitle>
                <DialogDescription>
                  Add a new entry to your legal diary.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.entry_date}
                      onChange={(e) => setFormData({...formData, entry_date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.entry_time}
                      onChange={(e) => setFormData({...formData, entry_time: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select value={formData.entry_type} onValueChange={(value) => setFormData({...formData, entry_type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select entry type" />
                      </SelectTrigger>
                      <SelectContent>
                        {entryTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map(priority => (
                          <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                  />
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={!formData.title || !formData.entry_date}>
                    Create Entry
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Diary Entries */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading entries...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map((entry) => (
              <Card key={entry.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{entry.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(entry.entry_date).toLocaleDateString()}
                        </div>
                        {entry.entry_time && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {entry.entry_time}
                          </div>
                        )}
                        <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                          {entry.entry_type}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs rounded border ${getPriorityColor(entry.priority)}`}>
                        {entry.priority}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(entry.status)}`}>
                        {entry.status}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{entry.description}</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-1">
                      <Edit className="w-3 h-3" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="gap-1 text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(entry.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredEntries.length === 0 && !loading && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchTerm ? 'No entries found' : 'No entries yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms.'
                : 'Create your first diary entry to get started.'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create First Entry
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
