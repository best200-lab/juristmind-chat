import { useState, useEffect } from "react";
import { Send, Mic, Paperclip, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ChatHistory } from "@/components/ChatHistory";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const createNewSession = async () => {
    if (!user) return null;
    
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: user.id,
          title: 'New Chat'
        })
        .select()
        .single();
        
      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  };

  const saveMessage = async (sessionId: string, content: string, sender: 'user' | 'ai') => {
    try {
      await supabase
        .from('chat_messages')
        .insert({
          session_id: sessionId,
          content,
          sender
        });
    } catch (error) {
      console.error('Error saving message:', error);
    }
  };

  const updateSessionTitle = async (sessionId: string, firstMessage: string) => {
    const title = firstMessage.length > 50 ? firstMessage.substring(0, 50) + '...' : firstMessage;
    try {
      await supabase
        .from('chat_sessions')
        .update({ title })
        .eq('id', sessionId);
    } catch (error) {
      console.error('Error updating session title:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to chat with JURIST MIND",
        variant: "destructive",
      });
      return;
    }

    let sessionId = currentSessionId;
    
    // Create new session if none exists
    if (!sessionId) {
      sessionId = await createNewSession();
      if (!sessionId) {
        toast({
          title: "Error",
          description: "Failed to create chat session",
          variant: "destructive",
        });
        return;
      }
      setCurrentSessionId(sessionId);
    }

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    
    // Save user message and update title if it's the first message
    await saveMessage(sessionId, inputValue, 'user');
    if (messages.length === 0) {
      await updateSessionTitle(sessionId, inputValue);
    }
    
    setInputValue("");
    setIsLoading(true);

    try {
      // Call your Python backend with Grok API
      const response = await fetch('http://127.0.0.1:8000/ask', {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: newMessage.content })
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();
      
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: data.answer || "I'm JURIST MIND, your legal AI assistant. How can I help you with legal questions today?",
        sender: "ai",
        timestamp: new Date(),
      };
      
      setMessages(prev => [...prev, aiResponse]);
      
      // Save AI response
      await saveMessage(sessionId, aiResponse.content, 'ai');
      
    } catch (error) {
      console.error('Error calling AI:', error);
      toast({
        title: "Error",
        description: "Failed to connect to AI assistant. Please check if your backend is running.",
        variant: "destructive",
      });
      
      // Fallback response
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: "I'm having trouble connecting right now. Please make sure your backend server is running on http://127.0.0.1:8000",
        sender: "ai",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
      
      // Save error response
      await saveMessage(sessionId, errorResponse.content, 'ai');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSession = async (sessionId: string) => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('content, sender, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      const loadedMessages: Message[] = data.map((msg, index) => ({
        id: `${sessionId}-${index}`,
        content: msg.content,
        sender: msg.sender as 'user' | 'ai',
        timestamp: new Date(msg.created_at),
      }));
      
      setMessages(loadedMessages);
      setCurrentSessionId(sessionId);
    } catch (error) {
      console.error('Error loading session:', error);
      toast({
        title: "Error",
        description: "Failed to load chat session",
        variant: "destructive",
      });
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentSessionId(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-full bg-background">
      {/* Chat History Sidebar */}
      {showHistory && user && (
        <ChatHistory 
          onSelectSession={loadSession}
          onNewChat={startNewChat}
          currentSessionId={currentSessionId}
        />
      )}
      
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 h-full">
        {/* Header */}
        {user && (
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h1 className="text-xl font-semibold">JURIST MIND</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History className="w-4 h-4" />
            </Button>
          </div>
        )}
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6">
            {messages.length === 0 ? (
              <div className="text-center py-20">
                <h2 className="text-4xl font-bold text-foreground mb-8">JURIST MIND</h2>
                <p className="text-lg text-muted-foreground mb-12">
                  {user ? "What do you want to know?" : "Please sign in to start chatting"}
                </p>
                {!user && (
                  <Button 
                    onClick={() => window.location.href = '/auth'}
                    className="mt-4 bg-foreground text-background hover:bg-foreground/90"
                  >
                    Sign In to Continue
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-2xl p-4 rounded-2xl ${
                        message.sender === "user"
                          ? "bg-foreground text-background"
                          : "bg-transparent border border-border"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      <p className="text-xs opacity-70 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 p-6">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-3 items-center">
              <Button
                size="sm"
                variant="ghost"
                className="p-2 h-10 w-10 rounded-full"
              >
                <Paperclip className="w-5 h-5" />
              </Button>
              <div className="flex-1 relative">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="What do you want to know?"
                  className="pr-20 py-3 text-base bg-transparent border border-border focus:ring-primary focus:border-primary rounded-full"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="p-2 h-8 w-8 rounded-full"
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading || !user}
                    size="sm"
                    className="p-2 h-8 w-8 rounded-full bg-foreground text-background hover:bg-foreground/90"
                  >
                    <Send className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}