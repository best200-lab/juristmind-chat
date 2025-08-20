
import { useState, useEffect } from "react";
import { Folder, Plus, Search, Calendar, User, AlertCircle, Edit, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Case {
  id: string;
  title: string;
  case_number: string;
  client_name: string;
  case_type: string;
  status: string;
  priority: string;
  description: string;
  next_hearing: string | null;
  created_at: string;
  updated_at: string;
}

const caseTypes = [
  "Contract Dispute", "Corporate", "Probate", "Criminal Defense", 
  "Family Law", "Property Law", "Employment Law", "Tax Law"
];

const statusOptions = ["Active", "In Progress", "Pending", "Closed"];
const priorityOptions = ["High", "Medium", "Low"];

const getStatusColor = (status: string) => {
  switch (status) {
    case "Active": return "bg-green-100 text-green-800 border-green-300";
    case "In Progress": return "bg-blue-100 text-blue-800 border-blue-300";
    case "Pending": return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "Closed": return "bg-gray-100 text-gray-800 border-gray-300";
    default: return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case "High": return "bg-red-100 text-red-800 border-red-300";
    case "Medium": return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "Low": return "bg-green-100 text-green-800 border-green-300";
    default: return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

export default function Cases() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<Case | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    client_name: "",
    case_type: "",
    description: "",
    status: "Active",
    priority: "Medium",
    next_hearing: "",
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchCases();
    }
  }, [user]);

  const fetchCases = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-cases', {
        body: { action: 'list' }
      });

      if (error) {
        console.error('Error fetching cases:', error);
        toast.error('Failed to fetch cases');
        return;
      }
      setCases(data || []);
    } catch (error) {
      console.error('Error fetching cases:', error);
      toast.error('Failed to fetch cases');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to create cases');
      return;
    }

    try {
      const action = editingCase ? 'update' : 'create';
      const caseData = editingCase ? { ...formData, id: editingCase.id } : formData;

      const { data, error } = await supabase.functions.invoke('manage-cases', {
        body: { action, caseData }
      });

      if (error) {
        console.error('Error saving case:', error);
        toast.error('Failed to save case');
        return;
      }
      
      if (editingCase) {
        setCases(cases.map(c => c.id === editingCase.id ? data : c));
        toast.success('Case updated successfully');
      } else {
        setCases([data, ...cases]);
        toast.success('Case created successfully');
      }

      setIsDialogOpen(false);
      setEditingCase(null);
      setFormData({
        title: "",
        client_name: "",
        case_type: "",
        description: "",
        status: "Active",
        priority: "Medium",
        next_hearing: "",
      });
    } catch (error) {
      console.error('Error saving case:', error);
      toast.error('Failed to save case');
    }
  };

  const handleEdit = (case_: Case) => {
    setEditingCase(case_);
    setFormData({
      title: case_.title,
      client_name: case_.client_name,
      case_type: case_.case_type,
      description: case_.description,
      status: case_.status,
      priority: case_.priority,
      next_hearing: case_.next_hearing || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (caseId: string) => {
    if (!confirm('Are you sure you want to delete this case?')) return;

    try {
      const { error } = await supabase.functions.invoke('manage-cases', {
        body: { action: 'delete', caseData: { id: caseId } }
      });

      if (error) {
        console.error('Error deleting case:', error);
        toast.error('Failed to delete case');
        return;
      }

      setCases(cases.filter(c => c.id !== caseId));
      toast.success('Case deleted successfully');
    } catch (error) {
      console.error('Error deleting case:', error);
      toast.error('Failed to delete case');
    }
  };

  const filteredCases = cases.filter(case_ =>
    case_.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    case_.case_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full bg-background overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Cases Management</h1>
          <p className="text-muted-foreground">Manage and track all your legal cases</p>
        </div>

        {/* Search and Add */}
        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search cases..." 
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingCase(null);
              setFormData({
                title: "",
                client_name: "",
                case_type: "",
                description: "",
                status: "Active",
                priority: "Medium",
                next_hearing: "",
              });
            }
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Case
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingCase ? 'Edit Case' : 'Create New Case'}</DialogTitle>
                <DialogDescription>
                  {editingCase ? 'Update the case information.' : 'Add a new legal case to your management system.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Case Title</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="client">Client Name</Label>
                    <Input
                      id="client"
                      value={formData.client_name}
                      onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Case Type</Label>
                    <Select value={formData.case_type} onValueChange={(value) => setFormData({...formData, case_type: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select case type" />
                      </SelectTrigger>
                      <SelectContent>
                        {caseTypes.map(type => (
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
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(status => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

                <div className="space-y-2">
                  <Label htmlFor="hearing">Next Hearing (Optional)</Label>
                  <Input
                    id="hearing"
                    type="datetime-local"
                    value={formData.next_hearing}
                    onChange={(e) => setFormData({...formData, next_hearing: e.target.value})}
                  />
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={!formData.title || !formData.client_name}>
                    {editingCase ? 'Update Case' : 'Create Case'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Cases Grid */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading cases...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCases.map((case_) => (
              <Card key={case_.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Folder className="w-5 h-5 text-primary" />
                        <h3 className="text-lg font-semibold">{case_.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground">{case_.case_number}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge className={getPriorityColor(case_.priority)}>
                        {case_.priority}
                      </Badge>
                      <Badge className={getStatusColor(case_.status)}>
                        {case_.status}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{case_.client_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{case_.case_type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{case_.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                      <div>
                        <p className="text-xs text-muted-foreground">Last Update</p>
                        <p className="text-sm font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(case_.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      {case_.next_hearing && (
                        <div>
                          <p className="text-xs text-muted-foreground">Next Hearing</p>
                          <p className="text-sm font-medium flex items-center gap-1 text-primary">
                            <Calendar className="w-3 h-3" />
                            {new Date(case_.next_hearing).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(case_)}
                        className="gap-1"
                      >
                        <Edit className="w-3 h-3" />
                        Edit
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(case_.id)}
                        className="gap-1 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredCases.length === 0 && !loading && (
          <div className="text-center py-12">
            <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {searchTerm ? 'No cases found' : 'No cases yet'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? 'Try adjusting your search terms.'
                : 'Create your first case to get started with case management.'
              }
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Create First Case
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
