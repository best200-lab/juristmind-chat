import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddLawyerDialogProps {
  onLawyerAdded: () => void;
}

interface LawyerForm {
  name: string;
  email: string;
  phone: string;
  state: string;
  city: string;
  location: string;
  description: string;
  specialization: string[];
  years_experience: number;
  bar_number: string;
  social_media: string;
  website: string;
}

export function AddLawyerDialog({ onLawyerAdded }: AddLawyerDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<LawyerForm>({
    name: "",
    email: "",
    phone: "",
    state: "",
    city: "",
    location: "",
    description: "",
    specialization: [],
    years_experience: 0,
    bar_number: "",
    social_media: "",
    website: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Ensure specialization is properly formatted as array
      const specializationArray = Array.isArray(form.specialization) && form.specialization.length > 0
        ? form.specialization 
        : [];

      const { data, error } = await supabase.functions.invoke('search-lawyers', {
        body: {
          action: 'register',
          lawyerData: {
            ...form,
            specialization: specializationArray,
            years_experience: Number(form.years_experience) || 0
          }
        }
      });

      if (error) throw error;

      toast.success('Our customer support will contact you for verification');
      setOpen(false);
      setForm({
        name: "",
        email: "",
        phone: "",
        state: "",
        city: "",
        location: "",
        description: "",
        specialization: [],
        years_experience: 0,
        bar_number: "",
        social_media: "",
        website: ""
      });
      onLawyerAdded();
    } catch (error: any) {
      console.error('Error adding lawyer:', error);
      toast.error(error.message || 'Failed to add lawyer profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSpecializationChange = (value: string) => {
    const specs = value.split(',').map(s => s.trim()).filter(s => s);
    setForm({ ...form, specialization: specs });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Lawyer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Lawyer Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="bar_number">Bar Number</Label>
              <Input
                id="bar_number"
                value={form.bar_number}
                onChange={(e) => setForm({ ...form, bar_number: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="years_experience">Years of Experience</Label>
              <Input
                id="years_experience"
                type="number"
                min="0"
                value={form.years_experience}
                onChange={(e) => setForm({ ...form, years_experience: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location">Location/Address</Label>
            <Input
              id="location"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="Full address or location description"
            />
          </div>

          <div>
            <Label htmlFor="specialization">Specialization (comma-separated) *</Label>
            <Input
              id="specialization"
              value={Array.isArray(form.specialization) ? form.specialization.join(', ') : ''}
              onChange={(e) => handleSpecializationChange(e.target.value)}
              placeholder="e.g. Corporate Law, Criminal Law, Family Law"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="social_media">Social Media Handle</Label>
              <Input
                id="social_media"
                value={form.social_media}
                onChange={(e) => setForm({ ...form, social_media: e.target.value })}
                placeholder="@username or profile link"
              />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://yourwebsite.com"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description of legal experience and expertise..."
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Submitting...' : 'Submit for Verification'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}