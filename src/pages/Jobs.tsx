import { Briefcase, MapPin, Clock, Plus, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const jobListings = [
  {
    id: 1,
    title: "Senior Corporate Lawyer",
    company: "Lagos Legal Associates",
    location: "Lagos, Nigeria",
    type: "Full-time",
    salary: "₦500,000 - ₦800,000/month",
    posted: "2 days ago",
    description: "Looking for an experienced corporate lawyer to join our growing team."
  },
  {
    id: 2,
    title: "Legal Research Assistant",
    company: "Abuja Law Chambers",
    location: "Abuja, Nigeria",
    type: "Part-time",
    salary: "₦150,000 - ₦250,000/month",
    posted: "1 week ago",
    description: "Support senior lawyers with research and document preparation."
  },
  {
    id: 3,
    title: "Family Law Attorney",
    company: "Port Harcourt Legal Services",
    location: "Port Harcourt, Nigeria",
    type: "Full-time",
    salary: "₦400,000 - ₦600,000/month",
    posted: "3 days ago",
    description: "Specialize in family law matters including divorce and custody cases."
  }
];

export default function Jobs() {
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
                <Input placeholder="Search job titles, companies..." />
              </div>
              <div className="flex-1">
                <Input placeholder="Location" />
              </div>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                Filters
              </Button>
            </div>

            {/* Job Listings */}
            <div className="space-y-4">
              {jobListings.map((job) => (
                <Card key={job.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-semibold">{job.title}</h3>
                        <p className="text-muted-foreground">{job.company}</p>
                      </div>
                      <Button>Apply Now</Button>
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
                        {job.type}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {job.posted}
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-4">{job.description}</p>
                    <p className="text-lg font-semibold text-primary">{job.salary}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="post" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Post a New Job</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Job Title</label>
                  <Input placeholder="e.g. Senior Corporate Lawyer" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Company</label>
                  <Input placeholder="Your law firm or company name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Location</label>
                    <Input placeholder="City, State" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Job Type</label>
                    <Input placeholder="Full-time, Part-time, Contract" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Salary Range</label>
                  <Input placeholder="₦XXX,XXX - ₦XXX,XXX/month" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Job Description</label>
                  <textarea 
                    className="w-full p-3 border border-border rounded-md bg-background"
                    rows={6}
                    placeholder="Describe the role, requirements, and responsibilities..."
                  />
                </div>
                <Button className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Post Job
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}