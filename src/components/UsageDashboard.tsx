import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Zap, Clock, Calendar } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function UsageDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    const { data, error } = await supabase.rpc('get_usage_stats');
    if (!error && data) {
      setStats(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
    // Refresh when user comes back to the tab
    window.addEventListener('focus', fetchStats);
    return () => window.removeEventListener('focus', fetchStats);
  }, []);

  if (loading) return <div className="p-4"><Loader2 className="animate-spin w-5 h-5 text-primary" /></div>;

  if (!stats || !stats.has_plan) {
    return (
      <Card className="bg-slate-50 border-dashed shadow-none">
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground mb-3">No active plan</p>
          <Button size="sm" onClick={() => window.location.href='/upgrade'}>Get Access</Button>
        </CardContent>
      </Card>
    );
  }

  // --- Logic for Display ---
  const today = new Date();
  const expiryDate = new Date(stats.expires_at);
  const daysLeft = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = daysLeft <= 3; // Warning for Free Plan users

  // Daily Limit Calculation
  const hasDailyLimit = stats.daily_limit !== null;
  const usagePercentage = hasDailyLimit 
    ? Math.min((stats.used_today / stats.daily_limit) * 100, 100) 
    : 0;

  return (
    <Card className="shadow-sm border-slate-200">
      <CardHeader className="pb-2 pt-4">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex justify-between items-center">
          <span>{stats.plan_name}</span>
          
          {/* Expiry Badge */}
          {daysLeft < 365 && (
            <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 ${
              isExpiringSoon ? "bg-red-100 text-red-600 font-bold" : "bg-slate-100 text-slate-600"
            }`}>
              <Clock className="w-3 h-3" />
              {daysLeft > 0 ? `${daysLeft} days left` : "Expired"}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="pb-4 space-y-4">
        
        {/* SCENARIO 1: Daily Limit (Free & Monthly) */}
        {hasDailyLimit && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium text-slate-700">Daily Requests</span>
              <span className="text-muted-foreground">{stats.used_today} / {stats.daily_limit}</span>
            </div>
            <Progress 
              value={usagePercentage} 
              className={`h-2 ${usagePercentage >= 100 ? "bg-red-100" : ""}`}
              // Custom color for the progress indicator
              style={{ 
                '--progress-background': usagePercentage >= 90 ? '#ef4444' : '#0f172a' 
              } as React.CSSProperties} 
            />
            <p className="text-xs text-muted-foreground text-right">Resets at midnight</p>
          </div>
        )}

        {/* SCENARIO 2: Unlimited (Yearly) */}
        {!hasDailyLimit && !stats.monthly_points && (
          <div className="flex items-center gap-2 p-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
            <Zap className="w-4 h-4 fill-current" />
            <span>Unlimited Access Active</span>
          </div>
        )}

        {/* SCENARIO 3: Points (Student) */}
        {stats.monthly_points && (
          <div className="space-y-1">
             <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Calendar className="w-4 h-4" />
                <span>Monthly Quota: {stats.monthly_points} Points</span>
             </div>
             <p className="text-xs text-muted-foreground">Check full history in profile settings.</p>
          </div>
        )}

        {/* Upgrade Call to Action */}
        {(stats.plan_key === 'free' || usagePercentage >= 80) && (
           <Button 
             variant="default" 
             size="sm" 
             className="w-full mt-2"
             onClick={() => window.location.href='/upgrade'}
           >
             {stats.plan_key === 'free' ? "Upgrade to Keep Access" : "Get More Requests"}
           </Button>
        )}

      </CardContent>
    </Card>
  );
}
