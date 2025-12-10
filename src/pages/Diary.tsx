import { useState, useEffect, useRef } from "react";
import { Calendar as CalendarIcon, Clock, Plus, Edit, Trash2, Search, BellRing } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar"; 
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { differenceInMinutes, parseISO, isSameDay, format } from "date-fns";

interface DiaryEntry {
  id: string;
  title: string;
  entry_date: string;
  entry_time: string;
  entry_type: string;
  description: string;
  priority: string;
  status: string;
  suit_number?: string;
  next_adjourn_date?: string;
  created_at: string;
}

const entryTypes = ["Meeting", "Court", "Task", "Research", "Deadline", "Other"];
const priorityOptions = ["High", "Medium", "Low"];

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
    case "Upcoming": return "text-blue-600 bg-blue-50 border-blue-200";
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
  
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const notifiedEventIds = useRef<Set<string>>(new Set());

  const [formData, setFormData] = useState({
    title: "",
    entry_date: "",
    entry_time: "",
    entry_type: "",
    description: "",
    priority: "Medium",
    status: "Upcoming",
    suit_number: "",
    next_adjourn_date: "",
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user]);

  // --- INTELLIGENT REMINDER SYSTEM (Visual Only + Dismissable) ---
  useEffect(() => {
    if (entries.length === 0) return;

    const checkReminders = () => {
      const now = new Date();
      
      entries.forEach(entry => {
        if (!entry.entry_time || !entry.entry_date || notifiedEventIds.current.has(entry.id)) return;

        const eventDateTime = new Date(`${entry.entry_date}T${entry.entry_time}`);
        const diff = differenceInMinutes(eventDateTime, now);

        if (diff >= -5 && diff <= 15) {
          
          // 👇 UPDATED: Use a function to get the 'id' for dismissal
          toast(
            (id) => (
              <div 
                className="flex flex-col gap-1 w-full cursor-pointer"
                onClick={() => toast.dismiss(id)}
              >
                <div className="flex items-center gap-2 font-bold text-foreground">
                  <BellRing className="w-4 h-4 text-orange-500 animate-pulse" /> 
                  {diff <= 0 ? "Starting Now!" : `Starting in ${diff} mins`}
                </div>
                <p className="text-sm text-muted-foreground font-medium">{entry.title}</p>
                <p className="text-xs text-muted-foreground opacity-70 mt-1">Click to dismiss</p>
              </div>
            ),
            { 
              duration: Infinity, 
              position: "top-right",
              className: "border-l-4 border-orange-500 bg-white shadow-xl p-0", // p-0 ensures click area covers whole toast
            }
          );

          notifiedEventIds.current.add(entry.id);
        }
      });
    };

    checkReminders();
    const interval = setInterval(checkReminders, 60000); 
    return () => clearInterval(interval);
  }, [entries]);

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-diary', {
        body: { action: 'list' }
      });

      if (error) throw error;
      
      const sorted = (data || []).sort((a: DiaryEntry, b: DiaryEntry) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setEntries(sorted);
    } catch (error) {
      console.error('Error fetching diary entries:', error);
      toast.error('Failed to fetch diary entries');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('manage-diary', {
        body: { action: 'create', entryData: formData }
      });

      if (error) throw error;
      
      setEntries([data, ...entries]);
      setIsDialogOpen(false);
      resetForm();
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
      if (error) throw error;
      setEntries(entries.filter(entry => entry.id !== entryId));
      toast.success('Entry deleted successfully');
    } catch (error) {
      toast.error('Failed to delete entry');
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      entry_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : "",
      entry_time: "",
      entry_type: "",
      description: "",
      priority: "Medium",
      status: "Upcoming",
      suit_number: "",
      next_adjourn_date: "",
    });
  };

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = 
      entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.entry_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = selectedDate 
      ? isSameDay(parseISO(entry.entry_date), selectedDate)
      : true;

    return matchesSearch && matchesDate;
  });

  return (
    <div className="h-full bg-background overflow-y-auto">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-2">
              Legal Diary <span className="text-sm font-normal text-muted-foreground bg-muted px-2 py-1 rounded-full">{entries.length} Entries</span>
            </h1>
            <p className="text-muted-foreground">Manage your court dates, meetings, and deadlines.</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 shadow-lg hover:shadow-xl transition-all" onClick={resetForm}>
                <Plus className="w-4 h-4" /> Add Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Diary Entry</DialogTitle>
                <DialogDescription>Add a new schedule to your legal diary.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="col-span-2 md:col-span-1 space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input id="title" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="suit_number">Suit No.</Label>
                    <Input id="suit_number" value={formData.suit_number} onChange={(e) => setFormData({...formData, suit_number: e.target.value})} placeholder="SUIT/123/2024" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="next_adjourn_date">Adjourn Date</Label>
                    <Input id="next_adjourn_date" type="date" value={formData.next_adjourn_date} onChange={(e) => setFormData({...formData, next_adjourn_date: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input id="date" type="date" value={formData.entry_date} onChange={(e) => setFormData({...formData, entry_date: e.target.value})} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input id="time" type="time" value={formData.entry_time} onChange={(e) => setFormData({...formData, entry_time: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select value={formData.entry_type} onValueChange={(value) => setFormData({...formData, entry_type: value})}>
                      <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        {entryTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {priorityOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} rows={3} />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={!formData.title || !formData.entry_date}>Save Schedule</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT: VISUAL CALENDAR */}
          <div className="w-full lg:w-auto flex-shrink-0">
            <div className="bg-card border border-border rounded-xl p-4 shadow-sm sticky top-6">
               <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border bg-background"
                modifiers={{
                    hasEvent: (date) => entries.some(e => isSameDay(parseISO(e.entry_date), date))
                }}
                modifiersStyles={{
                    hasEvent: { fontWeight: 'bold', textDecoration: 'underline', color: 'var(--primary)' }
                }}
              />
              <div className="mt-4 pt-4 border-t text-center">
                 {selectedDate ? (
                    <Button variant="ghost" size="sm" onClick={() => setSelectedDate(undefined)} className="text-xs text-muted-foreground">
                        Clear Date Filter
                    </Button>
                 ) : (
                    <p className="text-xs text-muted-foreground">Select a date to filter events</p>
                 )}
              </div>
            </div>
          </div>

          {/* RIGHT: ENTRIES LIST */}
          <div className="flex-1">
            <div className="relative mb-6">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Search by title, suit number, or description..." 
                className="pl-10 h-12 bg-card"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/30">
                <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground mb-1">No events found</h3>
                <p className="text-muted-foreground mb-4">
                  {selectedDate 
                    ? `Nothing scheduled for ${format(selectedDate, 'MMM do, yyyy')}.` 
                    : "Your diary is empty."}
                </p>
                <Button variant="outline" onClick={() => setIsDialogOpen(true)}>Add Entry</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {selectedDate && (
                    <h3 className="font-semibold text-lg mb-4 text-foreground">
                        Schedule for {format(selectedDate, 'MMMM do, yyyy')}
                    </h3>
                )}

                {filteredEntries.map((entry) => (
                  <Card key={entry.id} className="hover:shadow-md transition-all group border-l-4" style={{ borderLeftColor: entry.priority === 'High' ? '#ef4444' : entry.priority === 'Medium' ? '#ca8a04' : '#16a34a' }}>
                    <CardHeader className="py-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                             <h3 className="text-lg font-semibold">{entry.title}</h3>
                             {entry.suit_number && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-medium">{entry.suit_number}</span>}
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <CalendarIcon className="w-3.5 h-3.5" />
                              {format(parseISO(entry.entry_date), 'MMM d, yyyy')}
                            </div>
                            {entry.entry_time && (
                              <div className="flex items-center gap-1.5 font-medium text-foreground">
                                <Clock className="w-3.5 h-3.5" />
                                {entry.entry_time}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                                <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDelete(entry.id)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="py-0 pb-4">
                        {entry.description && <p className="text-muted-foreground text-sm mt-2">{entry.description}</p>}
                        
                        <div className="flex gap-2 mt-4">
                             <span className={`px-2 py-1 text-xs rounded border ${getPriorityColor(entry.priority)}`}>{entry.priority}</span>
                             <span className={`px-2 py-1 text-xs rounded border ${getStatusColor(entry.status)}`}>{entry.status}</span>
                             <span className="px-2 py-1 text-xs rounded border bg-muted text-muted-foreground">{entry.entry_type}</span>
                        </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
