import { useState, useEffect } from "react";
import { Bell, X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: number;
  title: string;
  body: string;
  created_at: string;
  expires_at: string | null;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newNotification, setNewNotification] = useState({ title: "", body: "", expires_at: "" });
  const { user, session } = useAuth();
  const { toast } = useToast();

  const isAdmin = user?.email === "ogunseun7@gmail.com";

  // Load notifications
  useEffect(() => {
    if (user) {
      loadNotifications();

      // Set up realtime subscription
      const channel = supabase
        .channel('notifications-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'notifications'
          },
          () => {
            loadNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Filter out expired notifications
      const activeNotifications = data.filter(notif => 
        !notif.expires_at || new Date(notif.expires_at) > new Date()
      );

      setNotifications(activeNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const createNotification = async () => {
    if (!newNotification.title || !newNotification.body) {
      toast({
        title: "Error",
        description: "Title and body are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = session?.access_token;
      const response = await fetch('https://asmostaidymrcesixebq.supabase.co/functions/v1/create-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: newNotification.title,
          body: newNotification.body,
          expires_at: newNotification.expires_at || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create notification');
      }

      toast({
        title: "Success",
        description: "Notification created successfully",
      });

      setNewNotification({ title: "", body: "", expires_at: "" });
      setShowCreateDialog(false);
    } catch (error) {
      console.error('Error creating notification:', error);
      toast({
        title: "Error",
        description: "Failed to create notification",
        variant: "destructive",
      });
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      const token = session?.access_token;
      const response = await fetch(`https://asmostaidymrcesixebq.supabase.co/functions/v1/delete-notification?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      toast({
        title: "Success",
        description: "Notification deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast({
        title: "Error",
        description: "Failed to delete notification",
        variant: "destructive",
      });
    }
  };

  if (!user) return null;

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 h-10 w-10 rounded-full"
      >
        <Bell className="w-5 h-5" />
        {notifications.length > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
            {notifications.length}
          </Badge>
        )}
      </Button>

      {showNotifications && (
        <div className="absolute right-0 top-12 w-80 bg-background border border-border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              <div className="flex gap-2">
                {isAdmin && (
                  <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-1 h-8 w-8">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create System Notification</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <Input
                          placeholder="Notification title"
                          value={newNotification.title}
                          onChange={(e) => setNewNotification({ ...newNotification, title: e.target.value })}
                        />
                        <Textarea
                          placeholder="Notification message"
                          value={newNotification.body}
                          onChange={(e) => setNewNotification({ ...newNotification, body: e.target.value })}
                        />
                        <Input
                          type="datetime-local"
                          placeholder="Expiry date (optional)"
                          value={newNotification.expires_at}
                          onChange={(e) => setNewNotification({ ...newNotification, expires_at: e.target.value })}
                        />
                        <Button onClick={createNotification} className="w-full">
                          Create Notification
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowNotifications(false)}
                  className="p-1 h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No notifications
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((notification) => (
                  <div key={notification.id} className="p-4 hover:bg-muted/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{notification.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{notification.body}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1 h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}