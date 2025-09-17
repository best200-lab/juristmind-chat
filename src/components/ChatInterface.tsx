import { useState, useEffect, useRef, memo } from "react";
import { Send, Mic, Paperclip, Copy, RefreshCw, ThumbsUp, ThumbsDown, Edit } from "lucide-react";
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
  liked?: boolean;
  disliked?: boolean;
}

const Markdown = memo(({ content }: { content: string }) => (
  <div className="prose prose-sm max-w-none text-gray-800">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={{
        a: ({ node, ...props }) => (
          <a
            {...props}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          />
        ),
        table: ({ node, ...props }) => (
          <table className="border border-gray-300 rounded-md my-2" {...props} />
        ),
        th: ({ node, ...props }) => (
          <th className="border border-gray-300 px-2 py-1 bg-gray-100" {...props} />
        ),
        td: ({ node, ...props }) => (
          <td className="border border-gray-300 px-2 py-1" {...props} />
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
            <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded" {...props} />
          ) : (
            <code className="block bg-gray-100 text-gray-800 p-2 rounded" {...props} />
          ),
        pre: ({ node, ...props }) => <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto" {...props} />,
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
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Message copied to clipboard",
      });
    } catch (err) {
      console.error("Failed to copy text: ", err);
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const refreshResponse = async (messageId: string) => {
    const messageToRefresh = messages.find(m => m.id === messageId);
    if (!messageToRefresh) return;

    // Find the user message that prompted this AI response
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex <= 0) return;

    const userMessage = messages[messageIndex - 1];
    if (userMessage.sender !== "user") return;

    // Remove the old AI response
    const updatedMessages = messages.filter(m => m.id !== messageId);
    setMessages(updatedMessages);
    
    // Resend the user message
    setInputValue(userMessage.content);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleReaction = (messageId: string, reaction: 'like' | 'dislike') => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId) {
        return {
          ...msg,
          liked: reaction === 'like',
          disliked: reaction === 'dislike'
        };
      }
      return msg;
    }));
  };

  const startEditing = (messageId: string, content: string) => {
    setEditingMessageId(messageId);
    setEditContent(content);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  const saveEditing = () => {
    if (!editingMessageId) return;
    
    setMessages(prev => prev.map(msg => {
      if (msg.id === editingMessageId) {
        return { ...msg, content: editContent };
      }
      return msg;
    }));
    
    setEditingMessageId(null);
    setEditContent("");
    
    toast({
      title: "Message updated",
      description: "Your message has been edited",
    });
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
      const response = await fetch("https://juristmind.onrender.com", {
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
        description: "Failed to connect with AI service at this moment. Please try again.",
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
    <div className="flex flex-col h-full bg-white text-gray-800">
      {/* Messages area with padding to avoid overlap with fixed input */}
      <div className="flex-1 overflow-y-auto pb-32" role="log" aria-live="polite">
        <div className="max-w-4xl mx-auto p-6">
          {messages.length === 0 ? (
            <div className="text-center py-20">
              <h2 className="text-4xl font-bold text-gray-900 mb-8">JURIST MIND</h2>
              <p className="text-lg text-gray-600 mb-12">
                {user ? "What do you want to know?" : "Please sign in to start chatting"}
              </p>
              {!user && (
                <Button 
                  onClick={() => (window.location.href = "/auth")} 
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
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
                    className={`max-w-2xl p-4 rounded-xl relative group ${
                      message.sender === "user"
                        ? "bg-blue-100 text-gray-800"
                        : "bg-gray-50"
                    }`}
                  >
                    {editingMessageId === message.id && message.sender === "user" ? (
                      <div className="mb-2">
                        <Input
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="bg-white text-gray-800 border-gray-300"
                        />
                        <div className="flex justify-end space-x-2 mt-2">
                          <Button 
                            size="sm" 
                            onClick={cancelEditing}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800"
                          >
                            Cancel
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={saveEditing}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : message.sender === "ai" ? (
                      <Markdown content={message.content} />
                    ) : (
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    )}
                    
                    <p className="text-xs text-gray-500 mt-2">{message.timestamp.toLocaleTimeString()}</p>
                    
                    {/* Message actions */}
                    <div className={`absolute -top-3 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity ${message.sender === "user" ? "bg-blue-100" : "bg-gray-50"} rounded-lg p-1 shadow-lg border border-gray-200`}>
                      {message.sender === "user" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-gray-600 hover:bg-blue-200 hover:text-gray-800"
                          onClick={() => startEditing(message.id, message.content)}
                          aria-label="Edit message"
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
                        onClick={() => copyToClipboard(message.content)}
                        aria-label="Copy message"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      {message.sender === "ai" && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-gray-600 hover:bg-gray-200 hover:text-gray-800"
                            onClick={() => refreshResponse(message.id)}
                            aria-label="Refresh response"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-6 w-6 ${message.liked ? "text-green-600" : "text-gray-600"} hover:bg-gray-200 hover:text-gray-800`}
                            onClick={() => handleReaction(message.id, 'like')}
                            aria-label="Like response"
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className={`h-6 w-6 ${message.disliked ? "text-red-600" : "text-gray-600"} hover:bg-gray-200 hover:text-gray-800`}
                            onClick={() => handleReaction(message.id, 'dislike')}
                            aria-label="Dislike response"
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Fixed Chat Input */}
      <div className="fixed bottom-3 left-0 right-0 px-4">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-3 flex gap-3 items-center border border-gray-200">
          <Button
            size="sm"
            variant="ghost"
            className="p-2 h-10 w-10 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            aria-label="Attach file"
            disabled
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="What do you want to know?"
              className="pr-20 py-3 text-base bg-white text-gray-800 border-gray-300 focus:ring-blue-500 focus:border-blue-500 rounded-full placeholder-gray-500"
              aria-label="Chat input"
              disabled={!user}
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                className="p-2 h-8 w-8 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                aria-label="Voice input"
                disabled
              >
                <Mic className="w-4 h-4" />
              </Button>
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading || !user}
                size="sm"
                className="p-2 h-8 w-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white"
                aria-label="Send message"
              >
                <Send className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}vv
