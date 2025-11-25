// ...existing code...
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
  social_media?: string;
  website?: string;
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
      const { data, error } = await supabase.functions.invoke("search-lawyers", {
        body: { action: "get-all" },
      });

      if (error) throw error;
      setLawyers(data);
      setFilteredLawyers(data);
    } catch (error) {
      console.error("Error fetching lawyers:", error);
      toast.error("Unable to retrieve the lawyer directory. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchStates = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("search-lawyers", {
        body: { action: "get-states" },
      });

      if (error) throw error;
      setStates(data);
    } catch (error) {
      console.error("Error fetching states:", error);
    }
  };

  const fetchSpecializations = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("search-lawyers", {
        body: { action: "get-specializations" },
      });

      if (error) throw error;
      setSpecializations(data);
    } catch (error) {
      console.error("Error fetching specializations:", error);
    }
  };

  const handleSearch = () => {
    let filtered = lawyers;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (lawyer) =>
          lawyer.name.toLowerCase().includes(term) ||
          lawyer.specialization.some((spec) => spec.toLowerCase().includes(term)) ||
          lawyer.city?.toLowerCase().includes(term) ||
          lawyer.state.toLowerCase().includes(term)
      );
    }

    if (selectedState && selectedState !== "all") {
      filtered = filtered.filter((lawyer) => lawyer.state === selectedState);
    }

    if (selectedSpecialization && selectedSpecialization !== "all") {
      filtered = filtered.filter((lawyer) =>
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
        aria-hidden
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
        }`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="mt-2 text-muted-foreground">Retrieving lawyer directory…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Legal Practitioner Directory
          </h1>
          <p className="text-muted-foreground">
            Search and connect with vetted legal professionals across Nigeria.
            Use the filters to refine results by location and area of practice.
          </p>
        </div>

        {/* Filters Section */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-8">
          {/* Search Bar */}
          <div className="w-full sm:flex-1 relative">
            <label htmlFor="lawyer-search" className="sr-only">Search lawyers</label>
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="lawyer-search"
              placeholder="Search by name, city, or specialty"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full rounded-lg py-2"
              aria-label="Search lawyers by name, city, or specialization"
            />
          </div>

          {/* State Selector */}
          <div className="w-full sm:w-48">
            <Select value={selectedState} onValueChange={setSelectedState} aria-label="Filter by state">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All States" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {states.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Specialization Selector */}
          <div className="w-full sm:w-48">
            <Select value={selectedSpecialization} onValueChange={setSelectedSpecialization} aria-label="Filter by specialization">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Specializations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Specializations</SelectItem>
                {specializations.map((spec) => (
                  <SelectItem key={spec} value={spec}>
                    {spec}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Add Lawyer Button */}
          <div className="w-full sm:w-auto">
            <Button
              className="w-full sm:w-auto"
              variant="default"
              onClick={() => {
                const dialogButton = document.querySelector(
                  '[data-add-lawyer-dialog]'
                ) as HTMLElement;
                if (dialogButton) dialogButton.click();
              }}
            >
              + Submit Practitioner
            </Button>
          </div>
        </div>

        {/* Hidden AddLawyerDialog Component */}
        <AddLawyerDialog onLawyerAdded={fetchLawyers} />

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {filteredLawyers.length} result{filteredLawyers.length !== 1 ? "s" : ""}
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
                    <div className="flex items-center gap-1 mb-2" aria-hidden>
                      {renderStars(lawyer.rating)}
                      <span className="text-sm text-muted-foreground ml-1">
                        ({lawyer.total_ratings} review{lawyer.total_ratings !== 1 ? "s" : ""})
                      </span>
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lawyer.description && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">
                      {lawyer.description}
                    </p>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {lawyer.location ||
                        (lawyer.city
                          ? `${lawyer.city}, ${lawyer.state}`
                          : lawyer.state)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">
                      {lawyer.years_experience} year{lawyer.years_experience !== 1 ? "s" : ""} experience
                    </span>
                  </div>

                  {lawyer.social_media && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <a
                        href={
                          lawyer.social_media.startsWith("http")
                            ? lawyer.social_media
                            : `https://${lawyer.social_media}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Social profile
                      </a>
                    </div>
                  )}

                  {lawyer.website && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <a
                        href={
                          lawyer.website.startsWith("http")
                            ? lawyer.website
                            : `https://${lawyer.website}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline"
                      >
                        Official website
                      </a>
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
                        onClick={() => {
                          navigator.clipboard.writeText(lawyer.email);
                          toast.success("Email address copied to clipboard.");
                        }}
                        aria-label={`Copy email for ${lawyer.name}`}
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
                        onClick={() => {
                          navigator.clipboard.writeText(lawyer.phone);
                          toast.success("Phone number copied to clipboard.");
                        }}
                        aria-label={`Copy phone number for ${lawyer.name}`}
                      >
                        <Phone className="w-3 h-3 mr-1" />
                        Phone
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
              No practitioners match your criteria
            </h3>
            <p className="text-muted-foreground">
              Please broaden your search or remove filters to see more results.
                    If you believe a qualified practitioner is missing, you may submit their details.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
// ...existing code...