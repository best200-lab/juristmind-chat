// ...existing code...
import { useState, useEffect, useRef, memo } from "react";
import { Send, Mic, Paperclip, ThumbsUp, ThumbsDown, RefreshCcw, Share2, MoreHorizontal, X, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

interface Source { title: string; url: string; }
interface Message {
  id: string;
  content: string;
  sender: "user" | "ai";
  timestamp: Date;
  sources?: Source[];
  attachments?: string[];
  liked?: boolean;
  disliked?: boolean;
}

type SelectedFile = {
  id: string;
  file: File;
  preview?: string; // image preview URL for images
};

const Markdown = memo(({ content }: { content: string }) => (
  <div className="prose prose-sm max-w-none text-foreground">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeSanitize]}
      components={{
        a: ({ node, ...props }) => (
          <a {...props} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" />
        ),
        table: ({ node, ...props }) => <table className="border card-border-strong rounded-md my-2" {...props} />,
        th: ({ node, ...props }) => <th className="border card-border-strong px-2 py-1 bg-muted" {...props} />,
        td: ({ node, ...props }) => <td className="border card-border-strong px-2 py-1" {...props} />,
        ul: ({ node, ...props }) => <ul className="list-disc ml-6" {...props} />,
        ol: ({ node, ...props }) => <ol className="list-decimal ml-6" {...props} />,
        h1: ({ node, ...props }) => <h1 className="text-2xl font-bold glossy-heading mt-4 mb-2" {...props} />,
        h2: ({ node, ...props }) => <h2 className="text-xl font-semibold glossy-text mt-3 mb-2" {...props} />,
        h3: ({ node, ...props }) => <h3 className="text-lg font-medium glossy-text mt-2 mb-1" {...props} />,
        strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
        p: ({ node, ...props }) => <p className="mb-2 leading-relaxed" {...props} />,
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
  const [shownSourcesMessages, setShownSourcesMessages] = useState<Set<string>>(new Set());
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [chatId, setChatId] = useState<string | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // cleanup previews on unmount
  useEffect(() => {
    return () => {
      selectedFiles.forEach((sf) => {
        if (sf.preview) URL.revokeObjectURL(sf.preview);
      });
    };
  }, [selectedFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files).map((file) => {
      const id = `${file.name}-${file.size}-${Date.now()}`;
      const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
      return { id, file, preview } as SelectedFile;
    });

    setSelectedFiles((prev) => [...prev, ...newFiles]);
    // reset input so same file can be re-selected if removed immediately
    e.target.value = "";
  };

  const removeFile = (id: string) => {
    setSelectedFiles((prev) => {
      const toRemove = prev.find((p) => p.id === id);
      if (toRemove && toRemove.preview) URL.revokeObjectURL(toRemove.preview);
      return prev.filter((p) => p.id !== id);
    });
  };

  const handleSendMessage = async (regenerateMessageId?: string) => {
    let effectiveQuestion = inputValue.trim();
    let effectiveFiles = selectedFiles;
    if (regenerateMessageId) {
      const aiIndex = messages.findIndex((msg) => msg.id === regenerateMessageId);
      if (aiIndex > 0) {
        const userMsg = messages[aiIndex - 1];
        if (userMsg.sender === "user") effectiveQuestion = userMsg.content;
      }
    }
    if (!effectiveQuestion && effectiveFiles.length === 0) return;
    if (!user) {
      toast({ title: "Authentication Required", description: "Please sign in to chat with JURIST MIND", variant: "destructive" });
      return;
    }

    const attachmentNames = effectiveFiles.map((sf) => sf.file.name);
    const userContent = effectiveQuestion
      ? effectiveQuestion + (attachmentNames.length ? "\n\nAttached files: " + attachmentNames.join(", ") : "")
      : "Attached files: " + attachmentNames.join(", ");
    const newMessage: Message = {
      id: Date.now().toString(),
      content: userContent,
      sender: "user",
      timestamp: new Date(),
      attachments: attachmentNames,
    };

    if (!regenerateMessageId) setMessages((prev) => [...prev, newMessage]);
    setInputValue("");
    setIsLoading(true);

    let aiMessageId = regenerateMessageId || (Date.now() + 1).toString();
    let aiMessage: Message = { id: aiMessageId, content: "", sender: "ai", timestamp: new Date() };

    if (regenerateMessageId) {
      setMessages((prev) => prev.map((msg) => (msg.id === regenerateMessageId ? { ...msg, content: "" } : msg)));
    } else {
      setMessages((prev) => [...prev, aiMessage]);
    }

    try {
      const effectiveChatId = regenerateMessageId ? chatId : localStorage.getItem("chat_id");
      const formData = new FormData();
      formData.append("question", effectiveQuestion);
      if (effectiveChatId) formData.append("chat_id", effectiveChatId);
      if (user?.id) formData.append("user_id", user.id);
      effectiveFiles.forEach((sf) => formData.append("files", sf.file));

      const response = await fetch(""https://juristmind.onrender.com", { method: "POST", body: formData });
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
            if (dataStr === "[DONE]") { done = true; break; }
            try {
              const data = JSON.parse(dataStr);
              if (data.content) {
                setMessages((prev) => {
                  const updated = [...prev];
                  const last = updated.find((msg) => msg.id === aiMessageId);
                  if (last && last.sender === "ai") last.content += data.content;
                  return updated;
                });
              }
              if (data.type === "done") {
                done = true;
                setIsLoading(false);
                if (data.chat_id) { localStorage.setItem("chat_id", data.chat_id); setChatId(data.chat_id); }
                if (data.sources) {
                  setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated.find((msg) => msg.id === aiMessageId);
                    if (last && last.sender === "ai") last.sources = data.sources;
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
      // clear selected files after successful send
      setSelectedFiles((prev) => {
        prev.forEach((sf) => { if (sf.preview) URL.revokeObjectURL(sf.preview); });
        return [];
      });
      setIsLoading(false);
    } catch (error) {
      console.error("Error streaming AI response:", error);
      setIsLoading(false);
      toast({ title: "Error", description: "We are coming soon. Please try again.", variant: "destructive" });
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated.find((msg) => msg.id === aiMessageId);
        if (last && last.sender === "ai") last.content += "**Error:** Failed to stream response. Please try again.";
        return updated;
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleSources = (messageId: string) => {
    setShownSourcesMessages((prev) => {
      const newSet = new Set(prev);
      newSet.has(messageId) ? newSet.delete(messageId) : newSet.add(messageId);
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
        setMessages((prev) => prev.map((msg) =>
          msg.id === messageId ? { ...msg, liked: type === 'like' ? true : msg.liked, disliked: type === 'dislike' ? true : msg.disliked } : msg
        ));
        toast({ title: "Feedback sent", description: `Message ${type}d successfully.` });
      }
    } catch (error) {
      console.error("Error sending feedback:", error);
      toast({ title: "Error", description: "Failed to send feedback.", variant: "destructive" });
    }
  };

  const handleRegenerate = (messageId: string) => handleSendMessage(messageId);

  // Use chat.juristmind.com domain and non-.json path
  const handleShare = (messageId: string) => {
    if (!chatId) {
      toast({ title: "No chat to share", description: "Start a conversation before sharing.", variant: "warning" });
      return;
    }
    try {
      const shareUrl = `https://chat.juristmind.com/chats/${chatId}`;
      navigator.clipboard.writeText(shareUrl);
      toast({ title: "Shared", description: "Chat URL copied to clipboard." });
    } catch (err) {
      console.error("Share failed", err);
      toast({ title: "Error", description: "Unable to copy share link.", variant: "destructive" });
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Message copied to clipboard." });
  };

  return (
    <div className="flex flex-col h-full bg-background relative">
      <div className="parallax-bg" aria-hidden="true" />
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto pb-40" role="log" aria-live="polite">
        <div className="max-w-4xl mx-auto p-6">
          {messages.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-block glass-card glass-card--bold-edge p-8 rounded-2xl ultra-elevated max-w-2xl">
                <h2 className="text-3xl font-extrabold glossy-heading text-foreground mb-4">Jurist Mind</h2>
                <p className="text-lg text-muted mb-6"> {user ? "How can I assist you today?" : "Please sign in to start chatting"} </p>
                {!user && (
                  <Button onClick={() => (window.location.href = "/auth")} className="glass-pill">
                    Sign In to Continue
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <div key={message.id} className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}>
                  {message.sender === "ai" ? (
                    <article className="glass-card glass-card--bold-edge p-5 max-w-2xl">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <div className="mb-2">
                            <span className="text-sm glossy-text">Assistant</span>
                          </div>
                          <Markdown content={message.content} />
                          <div className="flex items-center justify-between mt-3">
                            <time className="text-xs text-muted">{message.timestamp.toLocaleTimeString()}</time>
                            <div className="flex items-center gap-2">
                              {message.sources && message.sources.length > 0 && (
                                <Button variant="ghost" size="sm" className="glass-pill" onClick={() => toggleSources(message.id)}>
                                  Sources
                                </Button>
                              )}
                              <Button size="icon" variant="ghost" onClick={() => handleFeedback(message.id, 'like')} className={message.liked ? "text-green-500" : ""}><ThumbsUp className="w-4 h-4" /></Button>
                              <Button size="icon" variant="ghost" onClick={() => handleFeedback(message.id, 'dislike')} className={message.disliked ? "text-red-500" : ""}><ThumbsDown className="w-4 h-4" /></Button>
                              <Button size="icon" variant="ghost" onClick={() => handleCopy(message.content)}><Copy className="w-4 h-4" /></Button>
                              <Button size="icon" variant="ghost" onClick={() => handleRegenerate(message.id)}><RefreshCcw className="w-4 h-4" /></Button>
                              <Button size="icon" variant="ghost" onClick={() => handleShare(message.id)}><Share2 className="w-4 h-4" /></Button>
                              <Button size="icon" variant="ghost"><MoreHorizontal className="w-4 h-4" /></Button>
                            </div>
                          </div>

                          {shownSourcesMessages.has(message.id) && message.sources && message.sources.length > 0 && (
                            <div className="mt-3 border-t pt-3">
                              <h4 className="text-sm font-semibold mb-1">Sources</h4>
                              <ul className="text-sm space-y-1">
                                {message.sources.map((source, idx) => (
                                  <li key={idx}>
                                    <a href={source.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{source.title || source.url}</a>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  ) : (
                    <div className="flex items-end gap-2">
                      <div className="glass-pill p-3 max-w-2xl">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">{message.content}</p>
                        <div className="flex items-center justify-between mt-2">
                          <time className="text-xs text-muted">{message.timestamp.toLocaleTimeString()}</time>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Fixed Chat Input */}
      <div className="fixed bottom-4 left-0 right-0 px-4">
        <div className="max-w-4xl mx-auto glass-card glass-card--bold-edge rounded-3xl p-3 border-border flex flex-col gap-3">
          {/* Selected files */}
          {selectedFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 px-2">
              {selectedFiles.map((sf) => (
                <div key={sf.id} className="flex items-center gap-2 glass-pill text-sm p-2">
                  {sf.preview ? (
                    <img src={sf.preview} alt={sf.file.name} className="w-12 h-12 object-cover rounded-md mr-2" />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center rounded-md bg-muted text-sm mr-2">
                      <Paperclip className="w-5 h-5" />
                    </div>
                  )}
                  <div className="truncate max-w-xs text-left">
                    <div className="text-sm font-medium">{sf.file.name}</div>
                    <div className="text-xs text-muted">{(sf.file.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeFile(sf.id)} aria-label={`Remove ${sf.file.name}`}><X className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 items-end">
            <div className="flex items-center gap-2">
              {/* single attach button used for both files and photos */}
              <Button size="sm" variant="ghost" className="p-2 h-10 w-10 rounded-full glass-pill" aria-label="Attach files or photos" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="w-5 h-5" />
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                multiple
                accept=".pdf,.doc,.docx,.txt,image/*"
                className="hidden"
                aria-label="Attach files or photos"
              />
            </div>

            <div className="flex-1 relative">
              <textarea
                value={inputValue}
                onChange={(e) => { setInputValue(e.target.value); e.currentTarget.style.height = "auto"; e.currentTarget.style.height = `${e.currentTarget.scrollHeight}px`; }}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything"
                rows={1}
                aria-label="Chat input"
                className="w-full resize-none overflow-y-auto max-h-40 pr-24 py-3 text-base bg-card border card-border-strong focus:ring-primary focus:border-primary rounded-2xl outline-none"
              />
              <div className="absolute right-3 bottom-3 flex gap-2">
                <Button size="sm" variant="ghost" className="p-2 h-8 w-8 rounded-full glass-pill" aria-label="Voice input" disabled><Mic className="w-4 h-4" /></Button>
                <Button onClick={() => handleSendMessage()} disabled={(!inputValue.trim() && selectedFiles.length === 0) || isLoading || !user} size="sm" className="p-2 h-8 w-8 rounded-full glass-pill bg-primary hover:bg-primary-hover text-primary-foreground" aria-label="Send message">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
