import { useState, useEffect } from "react";
import { Check, Crown, Zap, Shield, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePaystackPayment } from "react-paystack";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner"; 

// --- 1. SETUP SUPABASE ---
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

let supabase: any = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
} else {
  console.error("⚠️ Supabase Keys missing! Check your .env file and RESTART the server.");
}

export default function Upgrade() {
  const [user, setUser] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  // 2. Get User
  useEffect(() => {
    if (supabase) {
      supabase.auth.getUser().then(({ data }: any) => {
        if (data?.user) {
            console.log("User loaded:", data.user.id); // Debug log
            setUser(data.user);
        }
      });
    }
  }, []);

  // 3. Student Plan Configuration (CORRECTED)
  const studentConfig = {
    reference: (new Date()).getTime().toString(),
    email: user?.email || "",
    amount: 15000 * 100, // ₦15,000 in Kobo
    publicKey: "pk_test_9ae5352493ce583348ed61f75aff6077ed40e965", 
    metadata: {
      // 👇 FIX 1: These must be at the top level of metadata
      user_id: user?.id,
      plan_key: "student_monthly",
      
      // Optional: Keep custom_fields for Paystack Dashboard display
      custom_fields: [
        { display_name: "User ID", variable_name: "user_id", value: user?.id },
        { display_name: "Plan Key", variable_name: "plan_key", value: "student_monthly" } 
      ]
    }
  };

  const initializePayment = usePaystackPayment(studentConfig);

  const handleStudentPayment = () => {
    if (!supabase) {
        toast.error("System Error: Database connection missing");
        return;
    }
    if (!user) {
      toast.error("Please log in first");
      return;
    }
    
    // Safety check before launching payment
    console.log("Launching payment with User ID:", user.id);
    
    setProcessing(true);
    initializePayment({
      onSuccess: () => {
        setProcessing(false);
        toast.success("Payment Successful! Student plan activated.");
      },
      onClose: () => {
        setProcessing(false);
        toast.info("Transaction cancelled");
      }
    });
  };

  return (
    <div className="h-full bg-background overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Upgrade Your Plan</h1>
          <p className="text-xl text-muted-foreground">Choose the perfect plan for your legal practice</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* --- STUDENT PLAN (ACTIVE) --- */}
          <Card className="relative hover:shadow-lg transition-shadow">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto mb-4 w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl font-bold">Student</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold text-primary">₦15,000</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-muted-foreground mt-2">Perfect for solo practitioners</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /><span className="text-sm">5 AI consultations per day</span></li>
                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /><span className="text-sm">Basic legal templates</span></li>
                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /><span className="text-sm">Email support</span></li>
                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /><span className="text-sm">Case management (up to 10 cases)</span></li>
                <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /><span className="text-sm">Document storage (1GB)</span></li>
              </ul>
              
              <Button 
                className="w-full" 
                variant="outline"
                // 👇 FIX 2: Disable button if User is not loaded yet
                disabled={processing || !user}
                onClick={handleStudentPayment}
              >
                {processing ? <Loader2 className="animate-spin" /> : (!user ? "Loading User..." : "Choose Plan")}
              </Button>
            </CardContent>
          </Card>

          {/* --- PROFESSIONAL PLAN (Visual Only) --- */}
          <Card className="relative border-primary shadow-lg">
             <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">Most Popular</span>
              </div>
            <CardHeader className="text-center pb-8">
              <div className="mx-auto mb-4 w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Crown className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl font-bold">Professional</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold text-primary">₦35,000</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-muted-foreground mt-2">Ideal for growing law firms</p>
            </CardHeader>
            <CardContent>
               <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /><span className="text-sm">Unlimited AI consultations</span></li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /><span className="text-sm">Premium legal templates</span></li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /><span className="text-sm">Priority support</span></li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /><span className="text-sm">Case management (up to 50 cases)</span></li>
              </ul>
              <Button className="w-full bg-gradient-primary">Coming Soon</Button>
            </CardContent>
          </Card>

          {/* --- ENTERPRISE PLAN (Visual Only) --- */}
          <Card className="relative hover:shadow-lg">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto mb-4 w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-primary-foreground" />
              </div>
              <CardTitle className="text-2xl font-bold">Enterprise</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-bold text-primary">₦75,000</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-muted-foreground mt-2">For large law firms and organizations</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /><span className="text-sm">Unlimited everything</span></li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /><span className="text-sm">24/7 phone support</span></li>
                  <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /><span className="text-sm">Custom legal templates</span></li>
              </ul>
              <Button className="w-full" variant="outline">Coming Soon</Button>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}
