import { Folder, Plus, Search, Calendar, User, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const cases = [
  {
    id: 1,
    title: "Smith vs Johnson Construction Ltd.",
    caseNumber: "HCL/001/2024",
    client: "Mr. John Smith",
    type: "Contract Dispute",
    status: "Active",
    priority: "High",
    lastUpdate: "2024-01-15",
    nextHearing: "2024-01-20",
    description: "Breach of contract dispute regarding construction delays"
  },
  {
    id: 2,
    title: "Tech Corp Merger Advisory",
    caseNumber: "COM/015/2024",
    client: "Tech Corporation Ltd.",
    type: "Corporate",
    status: "In Progress",
    priority: "Medium",
    lastUpdate: "2024-01-12",
    nextHearing: null,
    description: "Legal advisory for corporate merger and acquisition"
  },
  {
    id: 3,
    title: "Estate of Late Mrs. Williams",
    caseNumber: "PRO/008/2024",
    client: "Williams Family",
    type: "Probate",
    status: "Pending",
    priority: "Low",
    lastUpdate: "2024-01-10",
    nextHearing: "2024-01-25",
    description: "Probate proceedings for estate administration"
  },
  {
    id: 4,
    title: "Criminal Defense - Fraud Case",
    caseNumber: "CR/045/2024",
    client: "Mr. David Okoye",
    type: "Criminal Defense",
    status: "Active",
    priority: "High",
    lastUpdate: "2024-01-14",
    nextHearing: "2024-01-18",
    description: "Criminal defense for alleged financial fraud"
  }
];

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
            />
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            New Case
          </Button>
        </div>

        {/* Cases Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {cases.map((case_) => (
            <Card key={case_.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Folder className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">{case_.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{case_.caseNumber}</p>
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
                    <span className="text-sm">{case_.client}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{case_.type}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{case_.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                    <div>
                      <p className="text-xs text-muted-foreground">Last Update</p>
                      <p className="text-sm font-medium flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(case_.lastUpdate).toLocaleDateString()}
                      </p>
                    </div>
                    {case_.nextHearing && (
                      <div>
                        <p className="text-xs text-muted-foreground">Next Hearing</p>
                        <p className="text-sm font-medium flex items-center gap-1 text-primary">
                          <Calendar className="w-3 h-3" />
                          {new Date(case_.nextHearing).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm">View Details</Button>
                    <Button variant="outline" size="sm">Add Note</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}