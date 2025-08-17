import { FileText, Plus, Search, Calendar, Tag } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const judgeNotes = [
  {
    id: 1,
    title: "Justice Adekeye - Commercial Law Insights",
    judge: "Hon. Justice A. Adekeye",
    court: "Federal High Court, Lagos",
    date: "2024-01-15",
    category: "Commercial Law",
    content: "Key observations on contract interpretation and commercial disputes...",
    tags: ["Contract Law", "Commercial", "Lagos"]
  },
  {
    id: 2,
    title: "Justice Okafor - Criminal Procedure Notes",
    judge: "Hon. Justice C. Okafor",
    court: "High Court of FCT",
    date: "2024-01-10",
    category: "Criminal Law",
    content: "Important procedural requirements for criminal cases...",
    tags: ["Criminal Procedure", "Evidence", "FCT"]
  },
  {
    id: 3,
    title: "Justice Bello - Land Law Precedents",
    judge: "Hon. Justice M. Bello",
    court: "Kaduna State High Court",
    date: "2024-01-08",
    category: "Property Law",
    content: "Recent developments in land acquisition and property rights...",
    tags: ["Land Law", "Property Rights", "Kaduna"]
  }
];

export default function JudgeNotes() {
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
            />
          </div>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Add Note
          </Button>
        </div>

        {/* Judge Notes */}
        <div className="space-y-6">
          {judgeNotes.map((note) => (
            <Card key={note.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{note.title}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{note.judge}</span>
                      <span>•</span>
                      <span>{note.court}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(note.date).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-primary/10 text-primary text-sm rounded-full">
                    {note.category}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">{note.content}</p>
                <div className="flex items-center gap-2">
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
                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm">Read Full Note</Button>
                  <Button variant="outline" size="sm">Download PDF</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}