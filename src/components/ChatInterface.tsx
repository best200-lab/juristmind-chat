import { useState, useEffect, useRef } from "react";
import { Send, Mic, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { NavLink } from "react-router-dom";
import { SourceDisplay } from "@/components/SourceDisplay";
import ReactMarkdown from "react-markdown"; // Import React Markdown

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  sources?: string[];
  db_id?: string;
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load session logic...
  useEffect(() => {
    if (!user) return;
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');
    
    if (sessionId) {
      loadSession(sessionId);
    } else {
      loadMostRecentSession();
    }
  }, [user]);

  // Listen for new chat event...
  useEffect(() => {
    const handleNewChatEvent = () => {
      setMessages([]);
      setCurrentSessionId(null);
    };
    
    window.addEventListener('newChat', handleNewChatEvent);
    return () => window.removeEventListener('newChat', handleNewChatEvent);
  }, []);

  // Realtime subscription...
  useEffect(() => {
    if (!currentSessionId) return;

    const channel = supabase
      .channel(`chat_updates:${currentSessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${currentSessionId}`
        },
        (payload) => {
          const newMsg = payload.new as any;
          setMessages(prev => {
            if (prev.some(msg => msg.db_id === newMsg.id)) {
              return prev;
            }
            return [...prev, {
              id: newMsg.id,
              db_id: newMsg.id,
              content: newMsg.content,
              sender: newMsg.sender as 'user' | 'ai',
              timestamp: new Date(newMsg.created_at),
            }];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentSessionId]);

  const loadMostRecentSession = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data) await loadSession(data.id);
    } catch (error) {
      console.error('Error loading recent session:', error);
    }
  };

  const createNewSession = async () => {
    if (!user) return null;
    try {
      const { data, error } = await supabase
        .from('chat_sessions')
        .insert({ user_id: user.id, title: 'New Chat' })
        .select()
        .single();
        
      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error creating session:', error);
      return null;
    }
  };

  const saveMessage = async (sessionId: string, content: string, sender: 'user' | 'ai'): Promise<string | null> => {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({ session_id: sessionId, content, sender })
        .select('id, created_at')
        .single();
      
      if (error) throw error;
      
      await supabase
        .from('chat_sessions')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', sessionId);
        
      return data?.id || null;
    } catch (error) {
      console.error('Error saving message:', error);
      toast({
        title: "Warning",
        description: "Message may not have been saved",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateSessionTitle = async (sessionId: string, firstMessage: string) => {
    const title = firstMessage.length > 50 ? firstMessage.substring(0, 50) + '...' : firstMessage;
    try {
      await supabase.from('chat_sessions').update({ title }).eq('id', sessionId);
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

    try {
      const { data: usageCheck, error: usageError } = await supabase.rpc('check_and_increment_usage');
      
      if (usageError) throw usageError;

      if (usageCheck && usageCheck.allowed === false) {
        let title = "Usage Limit Reached";
        let description = "Please upgrade your plan.";
        if (usageCheck.reason === 'expired') {
            title = "Free Trial Expired";
            description = "Your 3-day free trial has ended. Please upgrade to continue accessing Jurist Mind.";
        } else if (usageCheck.reason === 'daily_limit_reached') {
            title = "Daily Limit Reached";
            description = "You have used all your free requests for today. Come back tomorrow or upgrade for more.";
        } else if (usageCheck.reason === 'no_subscription') {
            title = "No Subscription";
            description = "We could not find an active subscription for your account.";
        }

        toast({
          title: title,
          description: description,
          variant: "destructive",
          action: (
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/upgrade'}>
              Upgrade Now
            </Button>
          ),
        });
        return;
      }

      if (usageCheck.limit && (usageCheck.limit - usageCheck.requests_used) <= 2) {
         toast({
          title: "Usage Notice",
          description: `You have ${usageCheck.limit - usageCheck.requests_used} requests remaining today.`,
        });
      }

    } catch (error) {
      console.error('Error checking usage:', error);
      toast({
        title: "Error",
        description: "Failed to check usage limits. Please try again.",
        variant: "destructive",
      });
      return;
    }

    let sessionId = currentSessionId;
    if (!sessionId) {
      sessionId = await createNewSession();
      if (!sessionId) {
        toast({ title: "Error", description: "Failed to create chat session", variant: "destructive" });
        return;
      }
      setCurrentSessionId(sessionId);
    }

    const userMessageContent = inputValue;
    const tempMessageId = Date.now().toString();
    
    const newMessage: Message = {
      id: tempMessageId,
      content: userMessageContent,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue("");
    setIsLoading(true);

    const userDbId = await saveMessage(sessionId, userMessageContent, 'user');
    if (userDbId) {
      setMessages(prev => prev.map(msg => 
        msg.id === tempMessageId ? { ...msg, db_id: userDbId } : msg
      ));
    }
    
    if (messages.length === 0) {
      await updateSessionTitle(sessionId, userMessageContent);
    }

    const aiTempId = (Date.now() + 1).toString();
    const aiPlaceholder: Message = {
      id: aiTempId,
      content: "",
      sender: "ai",
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, aiPlaceholder]);

    try {
      const formData = new FormData();
      formData.append('question', userMessageContent);
      if (sessionId) formData.append('chat_id', sessionId);
      if (user?.id) formData.append('user_id', user.id);
      
      const response = await fetch('https://juristmind.onrender.com/ask', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to get AI response');
      if (!response.body) throw new Error('No response body from server');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n\n");
          
          for (const line of lines) {
            if (!line.startsWith("data:")) continue;
            const dataStr = line.slice(5).trim();
            
            if (dataStr === "[DONE]") {
              done = true;
              break;
            }
            
            try {
              const data = JSON.parse(dataStr);
              if (data.content) {
                fullContent += data.content;
                setMessages(prev => prev.map(msg => 
                  msg.id === aiTempId ? { ...msg, content: fullContent } : msg
                ));
              }
              if (data.type === "done") done = true;
            } catch (parseError) {
              console.log("Chunk parse info:", parseError);
            }
          }
        }
      }

      if (!fullContent) {
        try {
          const text = await response.text();
          const data = JSON.parse(text);
          fullContent = data.answer || data.content || "I'm JURIST MIND, your legal AI assistant.";
          setMessages(prev => prev.map(msg => 
            msg.id === aiTempId ? { ...msg, content: fullContent } : msg
          ));
        } catch {
          fullContent = "Response received but could not be parsed.";
        }
      }
      
      if (fullContent) {
        const aiDbId = await saveMessage(sessionId, fullContent, 'ai');
        if (aiDbId) {
          setMessages(prev => prev.map(msg => 
            msg.id === aiTempId ? { ...msg, db_id: aiDbId } : msg
          ));
        }
      }
      
    } catch (error) {
      console.error('Error calling AI:', error);
      toast({
        title: "Error",
        description: "Failed to connect to AI assistant. Please try again later.",
        variant: "destructive",
      });
      
      const errorContent = "I'm having trouble connecting right now. Please try again later.";
      setMessages(prev => prev.map(msg => 
        msg.id === aiTempId ? { ...msg, content: errorContent } : msg
      ));
      await saveMessage(sessionId, errorContent, 'ai');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSession = async (sessionId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, content, sender, created_at')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      
      if (!data || data.length === 0) {
        setMessages([]);
        setCurrentSessionId(sessionId);
        return;
      }
      
      const loadedMessages: Message[] = data.map((msg) => ({
        id: msg.id,
        db_id: msg.id,
        content: msg.content,
        sender: msg.sender as 'user' | 'ai',
        timestamp: new Date(msg.created_at),
        sources: [],
      }));
      
      setMessages(loadedMessages);
      setCurrentSessionId(sessionId);
    } catch (error) {
      console.error('Error loading session:', error);
      toast({ title: "Error", description: "Failed to load chat session", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-full bg-background">
      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 h-full w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-background/95 backdrop-blur z-10">
          <h1 className="text-xl font-semibold">JURIST MIND</h1>
        </div>
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto w-full">
          <div className="max-w-4xl mx-auto p-4 md:p-6 w-full">
            {messages.length === 0 ? (
              <div className="text-center py-10 md:py-20 px-4">
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 md:mb-8">JURIST MIND</h2>
                <p className="text-base md:text-lg text-muted-foreground mb-8 md:mb-12">
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
              <div className="space-y-6 pb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] md:max-w-2xl p-4 rounded-2xl ${
                        message.sender === "user"
                          ? "bg-foreground text-background"
                          : "bg-transparent border border-border"
                      }`}
                    >
                      {message.content ? (
                        <div className={`text-sm leading-relaxed break-words ${message.sender === "user" ? "prose-invert" : ""}`}>
                          {/* Markdown Rendering */}
                          <ReactMarkdown
                            components={{
                              // Style specific markdown elements
                              p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                              strong: ({node, ...props}) => <span className="font-bold" {...props} />,
                              ul: ({node, ...props}) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                              ol: ({node, ...props}) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                              li: ({node, ...props}) => <li className="pl-1" {...props} />,
                              h1: ({node, ...props}) => <h1 className="text-lg font-bold mt-4 mb-2" {...props} />,
                              h2: ({node, ...props}) => <h2 className="text-base font-bold mt-3 mb-2" {...props} />,
                              h3: ({node, ...props}) => <h3 className="text-sm font-bold mt-2 mb-1" {...props} />,
                              code: ({node, className, ...props}) => (
                                <code className={`bg-muted/50 px-1 py-0.5 rounded font-mono text-xs ${className}`} {...props} />
                              ),
                              pre: ({node, ...props}) => (
                                <div className="overflow-x-auto w-full my-2 bg-muted/50 p-2 rounded-lg">
                                    <pre className="text-xs" {...props} />
                                </div>
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm leading-relaxed text-muted-foreground animate-pulse">Thinking...</p>
                      )}
                      
                      <div className="flex items-center justify-between mt-2 gap-2">
                         <p className="text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {/* Copy Button can go here later if needed */}
                      </div>

                      {message.sender === "ai" && message.sources && message.sources.length > 0 && (
                        <SourceDisplay sources={message.sources} />
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="flex-shrink-0 p-3 md:p-6 bg-background">
          <div className="max-w-4xl mx-auto w-full">
            <div className="flex gap-2 md:gap-3 items-center">
              <Button
                size="sm"
                variant="ghost"
                className="p-2 h-10 w-10 rounded-full hidden md:flex"
              >
                <Paperclip className="w-5 h-5" />
              </Button>
              <div className="flex-1 relative">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="What do you want to know?"
                  className="pr-20 py-3 text-base bg-transparent border border-border focus:ring-primary focus:border-primary rounded-full w-full"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="p-2 h-8 w-8 rounded-full hidden sm:flex"
                  >
                    <Mic className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading || !user}
                    size="sm"
                    className="p-2 h-8 w-8 rounded-full bg-foreground text-background hover:bg-foreground/90 shrink-0"
                  >
                    <Send className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Terms and Conditions */}
            <div className="text-center mt-3 md:mt-4">
              <p className="text-[10px] md:text-xs text-muted-foreground">
                By using Jurist Mind, you consent to the{' '}
                <NavLink to="/terms" className="text-primary hover:underline">
                  terms and conditions
                </NavLink>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
