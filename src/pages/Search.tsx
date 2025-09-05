import { useState } from "react";
import { Search as SearchIcon, Filter, Clock, BookOpen, FileText, Scale, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export default function Search() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      // Search across multiple tables
      const [judgeNotes, jobs, lawyers, cases] = await Promise.all([
        supabase.from('judge_notes')
          .select('*')
          .or(`title.ilike.%${searchTerm}%,content.ilike.%${searchTerm}%,judge_name.ilike.%${searchTerm}%`),
        supabase.from('jobs')
          .select('*')
          .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,company.ilike.%${searchTerm}%`),
        supabase.from('lawyers')
          .select('*')
          .or(`name.ilike.%${searchTerm}%,specialization.cs.{${searchTerm}},description.ilike.%${searchTerm}%`),
        supabase.from('cases')
          .select('*')
          .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,case_number.ilike.%${searchTerm}%`)
      ]);

      const allResults = [
        ...(judgeNotes.data || []).map(item => ({ ...item, type: 'judge_note' })),
        ...(jobs.data || []).map(item => ({ ...item, type: 'job' })),
        ...(lawyers.data || []).map(item => ({ ...item, type: 'lawyer' })),
        ...(cases.data || []).map(item => ({ ...item, type: 'case' }))
      ];

      setResults(allResults);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: "Search Error",
        description: "Failed to perform search",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'judge_note': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'job': return <BookOpen className="w-5 h-5 text-green-500" />;
      case 'lawyer': return <Users className="w-5 h-5 text-purple-500" />;
      case 'case': return <Scale className="w-5 h-5 text-orange-500" />;
      default: return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'judge_note': return 'Case Report';
      case 'job': return 'Job Listing';
      case 'lawyer': return 'Lawyer Profile';
      case 'case': return 'Case';
      default: return 'Unknown';
    }
  };

  return (
    <div className="h-full bg-background overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Legal Search</h1>
          <p className="text-muted-foreground">Search across cases, jobs, lawyers, and legal documents</p>
        </div>

        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search anything - cases, jobs, lawyers, documents..."
              className="pl-10 py-3 text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
            />
          </div>
          <Button onClick={handleSearch} disabled={loading} className="px-6">
            {loading ? 'Searching...' : 'Search'}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Search Results ({results.length})</h2>
            {results.map((result, index) => (
              <Card key={`${result.type}-${result.id}-${index}`} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getTypeIcon(result.type)}
                    <div>
                      <h3 className="text-lg font-semibold">
                        {result.title || result.name || result.case_number || 'Untitled'}
                      </h3>
                      <span className="text-sm text-muted-foreground">
                        {getTypeLabel(result.type)}
                      </span>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground line-clamp-2">
                    {result.description || result.content || result.specialization?.join(', ') || 'No description available'}
                  </p>
                  {result.type === 'lawyer' && result.location && (
                    <p className="text-sm text-muted-foreground mt-2">📍 {result.location}</p>
                  )}
                  {result.type === 'job' && result.company && (
                    <p className="text-sm text-muted-foreground mt-2">🏢 {result.company}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {results.length === 0 && searchTerm && !loading && (
          <div className="text-center py-12">
            <SearchIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No results found</h3>
            <p className="text-muted-foreground">Try different keywords or check your spelling</p>
          </div>
        )}

        {!searchTerm && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Case Reports</h3>
                </div>
                <p className="text-sm text-muted-foreground">Search through judge notes and case reports</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <BookOpen className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Job Listings</h3>
                </div>
                <p className="text-sm text-muted-foreground">Find legal career opportunities</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <Users className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Lawyer Directory</h3>
                </div>
                <p className="text-sm text-muted-foreground">Connect with legal professionals</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}