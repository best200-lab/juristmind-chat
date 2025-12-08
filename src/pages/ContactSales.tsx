import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Users, Zap, BarChart3, ShieldCheck, ArrowLeft } from "lucide-react";
import { NavLink } from "react-router-dom";

export default function ContactSales() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // YOUR ACCESS KEY IS PRE-FILLED HERE
  const ACCESS_KEY = "9dcc6d50-8341-4f9a-b1f4-fe860dfcdb02"; 
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    formData.append("access_key", ACCESS_KEY);
    formData.append("subject", "New Enterprise Sales Lead"); // Email subject line

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Request Sent Successfully",
          description: "Our sales team will contact you shortly.",
        });
        (e.target as HTMLFormElement).reset();
      } else {
        console.error("Form Error:", result);
        throw new Error(result.message || "Failed to send");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white flex flex-col font-sans">
      
      {/* Minimal Header */}
      <div className="p-6 md:px-12">
        <NavLink to="/" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </NavLink>
      </div>

      <div className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-12 pb-20 lg:flex gap-16 items-start">
        
        {/* LEFT SIDE: Copy & Features */}
        <div className="flex-1 lg:max-w-[45%] pt-4 mb-12 lg:mb-0">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-6 text-foreground">
            Contact our<br />sales team
          </h1>
          <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
             The Jurist Mind you know—built for professional legal work. Empower your firm with secure AI you can trust.
          </p>

          <div className="space-y-8">
            <h3 className="text-lg font-semibold tracking-wide uppercase text-muted-foreground text-xs">Enterprise Features</h3>
            
            <div className="flex gap-4 items-start">
              <Users className="w-6 h-6 text-indigo-600 mt-1" />
              <div>
                <h4 className="font-semibold text-lg">Unlimited Team Access</h4>
                <p className="text-muted-foreground">Onboard your entire organization under a single account.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <ShieldCheck className="w-6 h-6 text-indigo-600 mt-1" />
              <div>
                <h4 className="font-semibold text-lg">No Training on Data</h4>
                <p className="text-muted-foreground">Your case files remain private and are never used to train our models.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <Zap className="w-6 h-6 text-indigo-600 mt-1" />
              <div>
                <h4 className="font-semibold text-lg">High-Volume Rate Limits</h4>
                <p className="text-muted-foreground">1,000 requests/day shared across your team for heavy workloads.</p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <BarChart3 className="w-6 h-6 text-indigo-600 mt-1" />
              <div>
                <h4 className="font-semibold text-lg">Admin Analytics</h4>
                <p className="text-muted-foreground">Centralized dashboard for billing, role management, and usage reports.</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE: The Form Card */}
        <div className="flex-1 w-full lg:max-w-[550px] ml-auto">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50">
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Hidden Honeypot */}
              <input type="checkbox" name="botcheck" className="hidden" style={{ display: 'none' }}></input>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Company size *</label>
                  <select 
                    name="company_size" 
                    required 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="" disabled selected>Please select</option>
                    <option value="1-10">1-10 employees</option>
                    <option value="11-50">11-50 employees</option>
                    <option value="51-200">51-200 employees</option>
                    <option value="201+">201+ employees</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Company name *</label>
                  <Input name="company_name" required placeholder="Ex: Legal Corp" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">First name *</label>
                  <Input name="first_name" required placeholder="Jane" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Last name *</label>
                  <Input name="last_name" required placeholder="Doe" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Work email *</label>
                  <Input name="email" type="email" required placeholder="jane@company.com" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Phone number *</label>
                  <Input name="phone" type="tel" required placeholder="+234..." />
                </div>
              </div>

               <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Which product are you interested in? *</label>
                  <select 
                    name="product_interest" 
                    required 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="" disabled selected>Select one from the dropdown options below</option>
                    <option value="Enterprise Plan">Enterprise Plan (Unlimited Users)</option>
                    <option value="API Access">Jurist Mind API Access</option>
                    <option value="Partnership">Partnership / Integration</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Can you share more about your business needs?</label>
                <Textarea 
                  name="message" 
                  placeholder="Tell us about your team's challenges..." 
                  className="min-h-[120px] resize-none"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 text-base font-semibold mt-4 bg-black hover:bg-slate-800 text-white rounded-lg transition-all" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Submit Request"}
              </Button>

              <p className="text-xs text-center text-slate-500 mt-4">
                By clicking "Submit Request", you agree to Jurist Mind's Terms of Use and Privacy Policy.
              </p>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
