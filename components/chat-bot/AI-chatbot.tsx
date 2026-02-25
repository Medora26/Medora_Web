"use client";

import { BotMessageSquare, X, Send, Loader2, Settings2, ArrowBigRight, MoveUp, ArrowUp, Plus, FileText, Shield, IdCard, Upload, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from "@/lib/utils";
import { useAuth } from '@/context/auth/authContext';
import { useState, useRef, useEffect } from 'react';
import { ModelSelector } from '@/components/chat-bot/model-config/model-selector';
import { DEFAULT_MODEL } from '@/lib/ai/model-config';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '../ui/dropdown-menu';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  onDownloadPDF?: () => void;
}

const ChatMessage = ({ message, isUser, onDownloadPDF }: ChatMessageProps) => {
  const messageRef = useRef<HTMLDivElement>(null);

  return (
    <div className={cn("flex w-full mb-4", isUser ? "justify-end" : "justify-start")}>
      <div className={cn(
        "max-w-[80%] rounded-lg px-4 py-2 relative group",
        isUser 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted"
      )}>
        {!isUser && message && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute -bottom-7 left-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={onDownloadPDF}
            title="Download as PDF"
          >
            <Download className="h-3 w-3" />
          </Button>
        )}
        
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message}</p>
        ) : (
          <div ref={messageRef} className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                //@ts-ignore
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                    //@ts-ignore
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
                table({ children }) {
                  return (
                    <div className="overflow-x-auto">
                      <table className="border-collapse border border-gray-300">
                        {children}
                      </table>
                    </div>
                  );
                },
                th({ children }) {
                  return (
                    <th className="border border-gray-300 bg-gray-100 px-3 py-2">
                      {children}
                    </th>
                  );
                },
                td({ children }) {
                  return (
                    <td className="border border-gray-300 px-3 py-2">
                      {children}
                    </td>
                  );
                }
              }}
            >
              {message}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

interface AIChatBoxProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIChatBox = ({ isOpen, onClose }: AIChatBoxProps) => {
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `# 👋 Welcome to Medora AI Assistant!

I'm here to help you with your **medical history, insurance details, and documents**. Here's what I can do for you:

## 📋 Available Features
- Answer questions about your medical records
- Help with insurance information
- Assist with document management
- Generate structured medical summaries.`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL);
  const [showModelSelector, setShowModelSelector] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Function to generate PDF from markdown content
  const generatePDF = async (content: string, messageId: string) => {
    try {
      // Create a temporary div to render markdown for PDF
      const tempDiv = document.createElement('div');
      tempDiv.className = 'p-6 bg-white';
      tempDiv.innerHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto;">
          ${content}
        </div>
      `;
      
      // Use html2canvas to convert the div to canvas
      document.body.appendChild(tempDiv);
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      document.body.removeChild(tempDiv);

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pdf.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      
      // Save the PDF
      pdf.save(`medora-chat-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to simple text PDF if markdown rendering fails
      const pdf = new jsPDF();
      const lines = pdf.splitTextToSize(content.replace(/[#*`]/g, ''), 180);
      pdf.text(lines, 15, 20);
      pdf.save(`medora-chat-${new Date().toISOString().split('T')[0]}.pdf`);
    }
  };

  const handleDownloadPDF = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      generatePDF(message.content, messageId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    const assistantMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, {
      id: assistantMessageId,
      role: 'assistant',
      content: ''
    }]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          userId: user.uid,
          model: selectedModel,
          formatResponse: true // Signal to API that we want markdown formatting
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          assistantMessage += chunk;
          
          setMessages(prev => {
            const newMessages = [...prev];
            const assistantIndex = newMessages.findIndex(msg => msg.id === assistantMessageId);
            if (assistantIndex !== -1) {
              newMessages[assistantIndex] = {
                ...newMessages[assistantIndex],
                content: assistantMessage
              };
            }
            return newMessages;
          });

          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
          }
        }
      }

    } catch (err) {
      console.error('Chat error:', err);
      setError(err as Error);
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={onClose}
        />
      )}
      
      <div className={cn(
        "fixed top-0 right-0 h-full w-[450px] bg-background border-l shadow-lg z-50 transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <BotMessageSquare className="h-5 w-5 text-primary" />
            <div>
              <h2 className="font-semibold">Meditalk</h2>
              <p className="text-xs text-muted-foreground font-semibold">
                {user ? `Helping ${user.displayName}` : 'Please log in'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setShowModelSelector(!showModelSelector)}
              title="Select AI Model"
            >
              <Settings2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Model selector */}
        {showModelSelector && (
          <div className="p-4 border-b bg-muted/50">
            <div className="mb-2 text-sm font-medium">Select AI Model</div>
            <ModelSelector 
              onModelChange={setSelectedModel}
              initialModel={selectedModel}
            />
          </div>
        )}

        {/* Messages */}
        <ScrollArea className={cn(
          "px-4 pt-0 pb-5 ",
          showModelSelector ? "h-[calc(100vh-280px)]" : "h-[calc(100vh-200px)]"
        )}>
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage 
                key={message.id} 
                message={message.content} 
                isUser={message.role === 'user'} 
                onDownloadPDF={() => handleDownloadPDF(message.id)}
              />
            ))}
            
            {isLoading && messages[messages.length - 1]?.content === '' && (
              <div className="flex justify-start mb-4">
                <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Thinking...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-center mb-4">
                <div className="bg-destructive/10 text-destructive rounded-lg px-4 py-2 text-sm">
                  Error: {error.message}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="absolute bottom-0 left-0 right-0 border-t bg-background">
          <div className="p-4">
            <form onSubmit={handleSubmit} className="relative">
              {/* Main Input Container */}
              <div className="flex items-end gap-2 rounded-2xl border bg-muted/50 px-4 py-3 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary">
                {/* Plus Button with Dropdown */}
                <div className="relative">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full hover:bg-muted"
                        disabled={!user}
                      >
                        <Plus className="h-5 w-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56">
                      <DropdownMenuLabel>Upload Document</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      
                      {/* Medical Documents */}
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          <span>Medical Records</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>Prescription</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>Lab Report</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>X-Ray / MRI</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>Discharge Summary</span>
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>

                      {/* Insurance Documents */}
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="flex items-center gap-2">
                          <Shield className="h-4 w-4" />
                          <span>Insurance</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>Insurance Card</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>Policy Document</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>Claim Form</span>
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>

                      {/* Identification */}
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="flex items-center gap-2">
                          <IdCard className="h-4 w-4" />
                          <span>Identification</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>Aadhaar Card</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>Passport</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>Driver's License</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              <span>PAN Card</span>
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>

                      <DropdownMenuSeparator />
                      
                      {/* Quick Upload Option */}
                      <DropdownMenuItem className="flex items-center gap-2 text-primary">
                        <Upload className="h-4 w-4" />
                        <span>Quick Upload</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Text Input Area */}
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder={user ? "Ask anything (supports markdown formatting)" : "Please log in to chat"}
                  disabled={!user || isLoading}
                  className="flex-1 bg-transparent border-0 outline-none resize-none max-h-32 min-h-[24px] py-1 text-sm placeholder:text-muted-foreground disabled:cursor-not-allowed"
                  rows={1}
                />

                {/* Send Button */}
                <Button 
                  type="submit" 
                  size="icon" 
                  className="h-8 w-8 rounded-full shrink-0"
                  disabled={!user || isLoading || !input.trim()}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowUp className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {/* Helper Text */}
              {user && (
                <div className="mt-2 flex items-center justify-between px-2">
                  <p className="text-xs text-muted-foreground">
                    Responses are formatted with markdown.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedModel}
                  </p>
                </div>
              )}
            </form>
          </div>
          
          {/* Login Prompt */}
          {!user && (
            <div className="p-2 text-center">
              <p className="text-xs text-muted-foreground">
                Please log in to use the AI assistant
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default AIChatBox;