import { useState, useEffect } from "react";
import { Briefcase, MapPin, Clock, Plus, Filter, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  job_type: string;
  salary_range?: string;
  description: string;
  created_at: string;
  applications_count: number;
  posted_by: string;
}

interface JobForm {
  title: string;
  company: string;
  location: string;
  job_type: string;
  salary_range: string;
  description: string;
}

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [jobForm, setJobForm] = useState<JobForm>({
    title: "",
    company: "",
    location: "",
    job_type: "",
    salary_range: "",
    description: ""
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-jobs', {
        body: { action: 'get-all' }
      });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('manage-jobs', {
        body: { 
          action: 'create',
          jobData: jobForm
        }
      });

      if (error) throw error;

      toast.success('Job posted successfully!');
      setJobForm({
        title: "",
        company: "",
        location: "",
        job_type: "",
        salary_range: "",
        description: ""
      });
      fetchJobs();
    } catch (error: any) {
      console.error('Error posting job:', error);
      toast.error(error.message || 'Failed to post job');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApplyJob = async (jobId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('manage-jobs', {
        body: { 
          action: 'apply',
          job_id: jobId,
          cover_letter: ""
        }
      });

      if (error) throw error;
      toast.success('Application submitted successfully!');
      fetchJobs(); // Refresh to update application count
    } catch (error: any) {
      console.error('Error applying to job:', error);
      toast.error(error.message || 'Failed to apply to job');
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = locationFilter === "" || 
                           job.location.toLowerCase().includes(locationFilter.toLowerCase());
    return matchesSearch && matchesLocation;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return "1 day ago";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };
  return (
    <div className="h-full bg-background overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Legal Jobs Hub</h1>
          <p className="text-muted-foreground">Find and post legal career opportunities</p>
        </div>

        <Tabs defaultValue="find" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="find">Find Jobs</TabsTrigger>
            <TabsTrigger value="post">Post Job</TabsTrigger>
          </TabsList>

          <TabsContent value="find" className="space-y-6">
            {/* Search and Filter */}
            <div className="flex gap-4">
              <div className="flex-1">
                <Input 
                  placeholder="Search job titles, companies..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex-1">
                <Input 
                  placeholder="Location" 
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading jobs...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredJobs.map((job) => (
                  <Card key={job.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-semibold">{job.title}</h3>
                          <p className="text-muted-foreground">{job.company}</p>
                        </div>
                        <Button onClick={() => handleApplyJob(job.id)}>
                          Apply Now
                        </Button>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {job.job_type}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDate(job.created_at)}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {job.applications_count} applications
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-4">{job.description}</p>
                      {job.salary_range && (
                        <p className="text-lg font-semibold text-primary">{job.salary_range}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {filteredJobs.length === 0 && (
                  <div className="text-center py-8">
                    <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No jobs found matching your criteria</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="post" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Post a New Job</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitJob} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Job Title</label>
                    <Input 
                      placeholder="e.g. Senior Corporate Lawyer" 
                      value={jobForm.title}
                      onChange={(e) => setJobForm({...jobForm, title: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Company</label>
                    <Input 
                      placeholder="Your law firm or company name" 
                      value={jobForm.company}
                      onChange={(e) => setJobForm({...jobForm, company: e.target.value})}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Location</label>
                      <Input 
                        placeholder="City, State" 
                        value={jobForm.location}
                        onChange={(e) => setJobForm({...jobForm, location: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Job Type</label>
                      <Input 
                        placeholder="Full-time, Part-time, Contract" 
                        value={jobForm.job_type}
                        onChange={(e) => setJobForm({...jobForm, job_type: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Salary Range (Optional)</label>
                    <Input 
                      placeholder="₦XXX,XXX - ₦XXX,XXX/month" 
                      value={jobForm.salary_range}
                      onChange={(e) => setJobForm({...jobForm, salary_range: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Job Description</label>
                    <Textarea 
                      rows={6}
                      placeholder="Describe the role, requirements, and responsibilities..."
                      value={jobForm.description}
                      onChange={(e) => setJobForm({...jobForm, description: e.target.value})}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    <Plus className="w-4 h-4 mr-2" />
                    {submitting ? 'Posting...' : 'Post Job'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}