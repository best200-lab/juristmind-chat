import { useState, useEffect, useRef, memo } from "react";
import { Send, Mic, Paperclip, ThumbsUp, ThumbsDown, RefreshCcw, Share2, Smartphone, MoreHorizontal, X, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";
interface Source {
  title: string;
  url: string;
}
interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  sources?: Source[]; // Optional array for sources
  attachments?: string[]; // Added: Optional array for attachment file names (for display)
  liked?: boolean; // Added: Track like status
  disliked?: boolean; // Added: Track dislike status
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
        pre: ({ node, ...props }) => (
          <pre className="bg-muted p-3 rounded-md overflow-x-auto" {...props} />
        ),
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
  const [shownSourcesMessages, setShownSourcesMessages] = useState<Set<string>>(new Set());
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]); // Added: State for selected files
  const fileInputRef = useRef<HTMLInputElement>(null); // Added: Ref for hidden file input
  const [chatId, setChatId] = useState<string | null>(null); // Added: State for chat_id
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...newFiles]);
      e.target.value = ""; // Reset input for future selections
    }
  };
  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };
  const handleSendMessage = async (regenerateMessageId?: string) => {
    let effectiveQuestion = inputValue.trim();
    let effectiveFiles = selectedFiles;
    if (regenerateMessageId) {
      // Find the user message before the AI message to regenerate
      const aiIndex = messages.findIndex((msg) => msg.id === regenerateMessageId);
      if (aiIndex > 0) {
        const userMsg = messages[aiIndex - 1];
        if (userMsg.sender === "user") {
          effectiveQuestion = userMsg.content;
          // Note: Attachments not regenerated; assume no files for retry or handle if needed
        }
      }
    }
    if (!effectiveQuestion && effectiveFiles.length === 0) return;
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to chat with JURIST MIND",
        variant: "destructive",
      });
      return;
    }
    const attachmentNames = effectiveFiles.map((file) => file.name);
    const userContent = effectiveQuestion
      ? effectiveQuestion + (attachmentNames.length > 0 ? "\n\nAttached files: " + attachmentNames.join(", ") : "")
      : "Attached files: " + attachmentNames.join(", ");
    const newMessage: Message = {
      id: Date.now().toString(),
      content: userContent,
      sender: "user",
      timestamp: new Date(),
      attachments: attachmentNames,
    };
    if (!regenerateMessageId) {
      setMessages((prev) => [...prev, newMessage]);
    }
    setInputValue("");
    setIsLoading(true);
    let aiMessageId = regenerateMessageId || (Date.now() + 1).toString();
    let aiMessage: Message = {
      id: aiMessageId,
      content: "",
      sender: "ai",
      timestamp: new Date(),
    };
    if (regenerateMessageId) {
      // Update existing AI message
      setMessages((prev) =>
        prev.map((msg) => (msg.id === regenerateMessageId ? { ...msg, content: "" } : msg))
      );
    } else {
      setMessages((prev) => [...prev, aiMessage]);
    }
    try {
      const effectiveChatId = regenerateMessageId ? chatId : localStorage.getItem("chat_id");
      const formData = new FormData();
      formData.append("question", effectiveQuestion); // Send raw inputValue (improvement)
      if (effectiveChatId) formData.append("chat_id", effectiveChatId);
      if (user?.id) formData.append("user_id", user.id);
      effectiveFiles.forEach((file) => {
        formData.append("files", file);
      });
      const response = await fetch("https://juristmind.onrender.com/ask", {
        method: "POST",
        body: formData,
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
                  const last = updated.find((msg) => msg.id === aiMessageId);
                  if (last && last.sender === "ai") {
                    last.content += data.content;
                  }
                  return updated;
                });
              }
              if (data.type === "done") {
                done = true;
                setIsLoading(false);
                if (data.chat_id) {
                  localStorage.setItem("chat_id", data.chat_id);
                  setChatId(data.chat_id);
                }
                if (data.chat_url) {
                  console.log(`Chat stored at: ${data.chat_url}`);
                }
                if (data.sources) {
                  setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated.find((msg) => msg.id === aiMessageId);
                    if (last && last.sender === "ai") {
                      last.sources = data.sources;
                    }
                    return updated;
                  });
                }
              }
            } catch (err) {
              console.error("Failed to parse chunk:", err);
            }
          }
        }
      }
      setSelectedFiles([]); // Clear files AFTER successful send
      setIsLoading(false);
    } catch (error) {
      console.error("Error streaming AI response:", error);
      setIsLoading(false);
      toast({
        title: "Error",
        description: "Failed to connect with AI service. Please try again.",
        variant: "destructive",
      });
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated.find((msg) => msg.id === aiMessageId);
        if (last && last.sender === "ai") {
          last.content += "**Error:** Failed to stream response. Please try again.";
        }
        return updated;
      });
    } finally {
      // Optionally clear here if you want to clear on error too
      // setSelectedFiles([]);
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  const toggleSources = (messageId: string) => {
    setShownSourcesMessages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };
  const handleFeedback = async (messageId: string, type: 'like' | 'dislike') => {
    if (!chatId) return;
    try {
      const response = await fetch(`https://juristmind.onrender.com/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, message_id: messageId, feedback_type: type }),
      });
      if (response.ok) {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId
              ? { ...msg, liked: type === 'like' ? true : msg.liked, disliked: type === 'dislike' ? true : msg.disliked }
              : msg
          )
        );
        toast({ title: "Feedback sent", description: `Message ${type}d successfully.` });
      }
    } catch (error) {
      console.error("Error sending feedback:", error);
      toast({ title: "Error", description: "Failed to send feedback.", variant: "destructive" });
    }
  };
  const handleRegenerate = (messageId: string) => {
    handleSendMessage(messageId);
  };
  const handleShare = (messageId: string) => {
    if (!chatId) return;
    navigator.clipboard.writeText(`${BASE_CHAT_URL}/public/chats/${chatId}.json`);
    toast({ title: "Shared", description: "Chat URL copied to clipboard." });
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Message copied to clipboard." });
  };
  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto pb-32" role="log" aria-live="polite">
        <div className="max-w-4xl mx-auto p-6">
          {messages.length === 0 ? (
            <div className="text-center py-20">
              <h2 className="text-4xl font-bold text-foreground mb-8">
                JURIST MIND
              </h2>
              <p className="text-lg text-muted-foreground mb-12">
                {user ? "What do you want to know?" : "Please sign in to start chatting"}
              </p>
              {!user && (
                <Button
                  onClick={() => (window.location.href = "/auth")}
                  className="mt-4"
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
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
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
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                    )}
                    <p className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                    {message.sender === "ai" && (
                      <>
                        <div className="flex items-center gap-2 mt-2">
                          {message.sources && message.sources.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleSources(message.id)}
                            >
                              Sources
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleFeedback(message.id, 'like')}
                            className={message.liked ? "text-green-500" : ""}
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleFeedback(message.id, 'dislike')}
                            className={message.disliked ? "text-red-500" : ""}
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleCopy(message.content)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
<Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleRegenerate(message.id)}
                          >
                            <RefreshCcw className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleShare(message.id)}
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost">
                            <Smartphone className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                        {shownSourcesMessages.has(message.id) && message.sources && message.sources.length > 0 && (
                          <div className="mt-2 border-t pt-2">
                            <h4 className="text-sm font-semibold mb-1">Sources</h4>
                            <ul className="text-sm space-y-1">
                              {message.sources.map((source, index) => (
                                <li key={index}>
                                  <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                  >
                                    {source.title || source.url}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
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
        <div className="max-w-4xl mx-auto bg-background rounded-2xl shadow-md p-3 flex flex-col gap-2 border border-border">
          {/* Added: Display selected files */}
          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 px-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-1 bg-muted px-2 py-1 rounded-full text-sm">
                  {file.name}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4"
                    onClick={() => removeFile(index)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-3 items-end">
            <Button
              size="sm"
              variant="ghost"
              className="p-2 h-10 w-10 rounded-full"
              aria-label="Attach file"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-5 h-5" />
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple // Allow multiple files
              accept=".pdf,.doc,.docx,.txt" // Accept documents
              className="hidden"
            />
            <div className="flex-1 relative">
              {/* ✅ Auto-Expanding Textarea */}
              <textarea
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                }}
                onKeyPress={handleKeyPress}
                placeholder="What do you want to know?"
                rows={1}
                aria-label="Chat input"
                className="w-full resize-none overflow-y-auto max-h-40 pr-20 py-3 text-base bg-input border border-border focus:ring-primary focus:border-primary rounded-2xl outline-none"
              />
              <div className="absolute right-2 bottom-2 flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="p-2 h-8 w-8 rounded-full"
                  aria-label="Voice input"
                  disabled
                >
                  <Mic className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => handleSendMessage()}
                  disabled={(!inputValue.trim() && selectedFiles.length === 0) || isLoading || !user}
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
