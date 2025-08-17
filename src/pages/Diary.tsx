import { Calendar, Clock, Plus, Edit, Trash2, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const diaryEntries = [
  {
    id: 1,
    title: "Client Meeting - Smith vs Johnson",
    date: "2024-01-15",
    time: "10:00 AM",
    type: "Meeting",
    description: "Initial consultation for contract dispute case",
    priority: "High",
    status: "Upcoming"
  },
  {
    id: 2,
    title: "Court Hearing - Criminal Case 001/2024",
    date: "2024-01-16",
    time: "2:00 PM",
    type: "Court",
    description: "Bail application hearing at Federal High Court",
    priority: "High",
    status: "Upcoming"
  },
  {
    id: 3,
    title: "Document Review - Corporate Merger",
    date: "2024-01-14",
    time: "9:00 AM",
    type: "Task",
    description: "Review merger documents for TechCorp acquisition",
    priority: "Medium",
    status: "Completed"
  },
  {
    id: 4,
    title: "Legal Research - Property Law",
    date: "2024-01-13",
    time: "3:00 PM",
    type: "Research",
    description: "Research recent property law amendments",
    priority: "Low",
    status: "Completed"
  }
];

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
    default: return "text-muted-foreground bg-muted border-border";
  }
};

export default function Diary() {
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
            />
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Entry
          </Button>
        </div>

        {/* Diary Entries */}
        <div className="space-y-4">
          {diaryEntries.map((entry) => (
            <Card key={entry.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{entry.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(entry.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {entry.time}
                      </div>
                      <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                        {entry.type}
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
                  <Button variant="outline" size="sm" className="gap-1 text-red-600 hover:text-red-700">
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}