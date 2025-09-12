import { useState, useEffect, useRef, memo } from "react";
import { Send, Mic, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
}

const Markdown = memo(({ content }: { content: string }) => (
  <div className="prose prose-sm max-w-none text-foreground">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={{
        a: ({ node, ...props }) => (
          <a
            {...props}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          />
        ),
        table: ({ node, ...props }) => (
          <table className="border border-border rounded-md my-2" {...props} />
        ),
        th: ({ node, ...props }) => (
          <th className="border border-border px-2 py-1 bg-muted" {...props} />
        ),
        td: ({ node, ...props }) => (
          <td className="border border-border px-2 py-1" {...props} />
        ),
        ul: ({ node, ...props }) => <ul className="list-disc ml-6" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal ml-6" {...props} />,
        h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-4 mb-2" {...props} />,
        h2: ({ node, ...props }) => <h2 className="text-xl font-semibold mt-3 mb-2" {...props} />,
        h3: ({ node, ...props }) => <h3 className="text-lg font-medium mt-2 mb-1" {...props} />,
        strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
        p: ({ node, ...props }) => <p className="mb-2" {...props} />,
        code: ({ node, inline, ...props }) =>
          inline ? (
            <code className="bg-muted text-foreground px-1 py-0.5 rounded" {...props} />
          ) : (
            <code className="block bg-muted text-foreground p-2 rounded" {...props} />
          ),
        pre: ({ node, ...props }) => <pre className="bg-muted p-3 rounded-md overflow-x-auto" {...props} />,
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
));

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

    const newMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");
    setIsLoading(true);

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: "",
      sender: "ai",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, aiMessage]);

    try {
      const response = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: newMessage.content }),
      });

      if (!response.body) throw new Error("No response body from server");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
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
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated[updated.length - 1];
                  if (last.sender === "ai") {
                    last.content += data.content;
                  }
                  return updated;
                });
              }

              if (data.type === "done") {
                done = true;
                setIsLoading(false);
                if (data.chat_url) {
                  console.log(`Chat stored at: ${data.chat_url}`);
                }
              }
            } catch (err) {
              console.error("Failed to parse chunk:", err);
            }
          }
        }
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error streaming AI response:", error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to stream response from AI. Please try again.",
        variant: "destructive",
      });
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.sender === "ai") {
          last.content += "**Error:** Failed to stream response. Please try again.";
        }
        return updated;
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-y-auto" role="log" aria-live="polite">
        <div className="max-w-4xl mx-auto p-6">
          {messages.length === 0 ? (
            <div className="text-center py-20">
              <h2 className="text-4xl font-bold text-foreground mb-8">JURIST MIND</h2>
              <p className="text-lg text-muted-foreground mb-12">
                {user ? "What do you want to know?" : "Please sign in to start chatting"}
              </p>
              {!user && (
                <Button onClick={() => (window.location.href = "/auth")} className="mt-4">
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
                    className={`max-w-2xl p-4 rounded-xl ${
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "bg-card border border-border shadow-sm"
                    }`}
                  >
                    {message.sender === "ai" ? (
                      <Markdown content={message.content} />
                    ) : (
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    )}
                    <p className="text-xs opacity-70 mt-2">{message.timestamp.toLocaleTimeString()}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3 items-center">
            <Button size="sm" variant="ghost" className="p-2 h-10 w-10 rounded-full" aria-label="Attach file" disabled>
              <Paperclip className="w-5 h-5" />
            </Button>
            <div className="flex-1 relative">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="What do you want to know?"
                className="pr-20 py-3 text-base bg-input border-border focus:ring-primary focus:border-primary rounded-full"
                aria-label="Chat input"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                <Button size="sm" variant="ghost" className="p-2 h-8 w-8 rounded-full" aria-label="Voice input" disabled>
                  <Mic className="w-4 h-4" />
                </Button>
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isLoading || !user}
                  size="sm"
                  className="p-2 h-8 w-8 rounded-full bg-primary hover:bg-primary-hover"
                  aria-label="Send message"
                >
                  <Send className="w-3 h-3" />
                </Button>
  
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
