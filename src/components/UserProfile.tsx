// ...existing code...
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Settings } from 'lucide-react';

interface Profile {
  id: string;
  display_name: string;
  email: string;
  bio: string;
  avatar_url: string;
}

interface UserSettings {
  theme: string;
  notifications_enabled: boolean;
  email_notifications: boolean;
  language: string;
  timezone: string;
}

export function UserProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');

  useEffect(() => {
    if (user) {
      loadProfile();
      loadSettings();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setSettings(data);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveProfile = async () => {
    if (!profile || !user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profile.display_name,
          bio: profile.bio,
        })
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({
        title: "Update Successful",
        description: "Your profile has been updated.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Unable to update your profile. Please try again or contact support if the issue persists.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const saveSettings = async () => {
    if (!settings || !user) return;
    
    setSaving(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .update(settings)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({
        title: "Update Successful",
        description: "Your settings have been saved.",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Unable to save settings. Please try again or contact support if the problem continues.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading profile and settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex gap-4 border-b">
        <Button
          variant={activeTab === 'profile' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('profile')}
          className="gap-2"
        >
          <User className="w-4 h-4" />
          Profile
        </Button>
        <Button
          variant={activeTab === 'settings' ? 'default' : 'ghost'}
          onClick={() => setActiveTab('settings')}
          className="gap-2"
        >
          <Settings className="w-4 h-4" />
          Settings
        </Button>
      </div>

      {activeTab === 'profile' && profile && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20">
                <AvatarFallback className="text-lg">
                  {profile.display_name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold">{profile.display_name || 'Name not provided'}</h3>
                <p className="text-muted-foreground">{profile.email}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={profile.display_name || ''}
                  onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="bio">Professional Summary</Label>
                <Textarea
                  id="bio"
                  value={profile.bio || ''}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  placeholder="Provide a concise professional summary suitable for colleagues and collaborators."
                />
              </div>
            </div>
            
            <Button onClick={saveProfile} disabled={saving}>
              {saving ? 'Updating...' : 'Update Profile'}
            </Button>
          </CardContent>
        </Card>
      )}

      {activeTab === 'settings' && settings && (
        <Card>
          <CardHeader>
            <CardTitle>User Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="theme">Theme</Label>
                <select
                  id="theme"
                  value={settings.theme}
                  onChange={(e) => setSettings({ ...settings, theme: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="notifications">Enable Notifications</Label>
                <input
                  id="notifications"
                  type="checkbox"
                  checked={settings.notifications_enabled}
                  onChange={(e) => setSettings({ ...settings, notifications_enabled: e.target.checked })}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="emailNotifications">Enable Email Notifications</Label>
                <input
                  id="emailNotifications"
                  type="checkbox"
                  checked={settings.email_notifications}
                  onChange={(e) => setSettings({ ...settings, email_notifications: e.target.checked })}
                />
              </div>
              
              <div>
                <Label htmlFor="language">Language</Label>
                <select
                  id="language"
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>
              
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  value={settings.timezone}
                  onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>
            </div>
            
            <Button onClick={saveSettings} disabled={saving}>
              {saving ? 'Updating...' : 'Save Settings'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
// ...existing code...