import { useState, useEffect } from "react";
import { Search, MapPin, Star, Phone, Mail, Award, Scale, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AddLawyerDialog } from "@/components/AddLawyerDialog";

interface Lawyer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  state: string;
  city?: string;
  location?: string;
  description?: string;
  specialization: string[];
  years_experience: number;
  bar_number?: string;
  rating: number;
  total_ratings: number;
  verified: boolean;
}

export default function LawyersDirectory() {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [filteredLawyers, setFilteredLawyers] = useState<Lawyer[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedState, setSelectedState] = useState("all");
  const [selectedSpecialization, setSelectedSpecialization] = useState("all");

  useEffect(() => {
    fetchLawyers();
    fetchStates();
    fetchSpecializations();
  }, []);

  const fetchLawyers = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('search-lawyers', {
        body: { action: 'get-all' }
      });

      if (error) throw error;
      setLawyers(data);
      setFilteredLawyers(data);
    } catch (error) {
      console.error('Error fetching lawyers:', error);
      toast.error('Failed to fetch lawyers');
    } finally {
      setLoading(false);
    }
  };

  const fetchStates = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('search-lawyers', {
        body: { action: 'get-states' }
      });

      if (error) throw error;
      setStates(data);
    } catch (error) {
      console.error('Error fetching states:', error);
    }
  };

  const fetchSpecializations = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('search-lawyers', {
        body: { action: 'get-specializations' }
      });

      if (error) throw error;
      setSpecializations(data);
    } catch (error) {
      console.error('Error fetching specializations:', error);
    }
  };

  const handleSearch = () => {
    let filtered = lawyers;

    if (searchTerm) {
      filtered = filtered.filter(lawyer => 
        lawyer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lawyer.specialization.some(spec => 
          spec.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    if (selectedState && selectedState !== "all") {
      filtered = filtered.filter(lawyer => lawyer.state === selectedState);
    }

    if (selectedSpecialization && selectedSpecialization !== "all") {
      filtered = filtered.filter(lawyer => 
        lawyer.specialization.includes(selectedSpecialization)
      );
    }

    setFilteredLawyers(filtered);
  };

  useEffect(() => {
    handleSearch();
  }, [searchTerm, selectedState, selectedSpecialization, lawyers]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating)
            ? 'fill-yellow-400 text-yellow-400'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading lawyers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Connect with a Lawyer
          </h1>
          <p className="text-muted-foreground">
            Find verified legal professionals in Nigeria
          </p>
        </div>

        <div className="flex gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              placeholder="Search lawyers..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedState} onValueChange={setSelectedState}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              {states.map(state => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <AddLawyerDialog onLawyerAdded={fetchLawyers} />
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            {filteredLawyers.length} lawyer(s) found
          </p>
        </div>

        {/* Lawyers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredLawyers.map((lawyer) => (
            <Card key={lawyer.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Scale className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-semibold">{lawyer.name}</h3>
                      {lawyer.verified && (
                        <Badge className="bg-green-100 text-green-800 border-green-300">
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mb-2">
                      {renderStars(lawyer.rating)}
                      <span className="text-sm text-muted-foreground ml-1">
                        ({lawyer.total_ratings} reviews)
                      </span>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lawyer.description && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">{lawyer.description}</p>
                  </div>
                )}
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {lawyer.location || (lawyer.city ? `${lawyer.city}, ${lawyer.state}` : lawyer.state)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {lawyer.years_experience} years experience
                    </span>
                  </div>

                  {lawyer.bar_number && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Bar No: {lawyer.bar_number}</span>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1 mt-2">
                    {lawyer.specialization.slice(0, 3).map((spec, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                    {lawyer.specialization.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{lawyer.specialization.length - 3} more
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-border">
                    {lawyer.email && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => window.open(`mailto:${lawyer.email}`)}
                      >
                        <Mail className="w-3 h-3 mr-1" />
                        Email
                      </Button>
                    )}
                    {lawyer.phone && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => window.open(`tel:${lawyer.phone}`)}
                      >
                        <Phone className="w-3 h-3 mr-1" />
                        Call
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredLawyers.length === 0 && !loading && (
          <div className="text-center py-12">
            <Scale className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              No lawyers found
            </h3>
            <p className="text-muted-foreground">
              Try adjusting your search criteria or browse all available lawyers.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}