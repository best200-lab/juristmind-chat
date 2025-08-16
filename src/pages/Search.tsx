import { Search as SearchIcon, Filter, Clock, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Search() {
  return (
    <div className="h-full bg-gradient-surface">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Legal Search</h1>
          <p className="text-muted-foreground">Search through legal documents, cases, and regulations</p>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search legal documents, cases, statutes..."
              className="pl-10 py-3 text-base"
            />
          </div>
          <Button variant="outline" className="px-4">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <BookOpen className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Case Law Database</h3>
              </div>
              <p className="text-sm text-muted-foreground">Search through millions of court decisions</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">Recent Searches</h3>
              </div>
              <p className="text-sm text-muted-foreground">Access your previous search history</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}