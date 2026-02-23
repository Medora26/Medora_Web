// components/AIChatBox.tsx
"use client";

import { BotMessageSquare, X, Send, Loader2, Settings2, ArrowBigRight, MoveUp, ArrowUp, Plus, FileText, Shield, IdCard, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from "@/lib/utils";
import { useAuth } from '@/context/auth/authContext';
import { useState, useRef, useEffect } from 'react';
import { ModelSelector } from '@/components/chat-bot/model-config/model-selector';
import { DEFAULT_MODEL } from '@/lib/ai/model-config';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from '../ui/dropdown-menu';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
}

const ChatMessage = ({ message, isUser }: ChatMessageProps) => {
  return (
    <div className={cn("flex w-full mb-4", isUser ? "justify-end" : "justify-start")}>
      <div className={cn(
        "max-w-[80%] rounded-lg px-4 py-2",
        isUser 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted"
      )}>
        <p className="text-sm whitespace-pre-wrap ">{message}</p>
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
      content: "Hello! I'm your Medora AI assistant. I can help you with your medical history, insurance details, and documents. What would you like to know?"
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
// Add this useEffect to monitor messages
useEffect(() => {
  console.log('Current messages:', messages);
}, [messages]);


  // In your AIChatBox.tsx, replace the handleSubmit function with this:

// More robust version that handles potential multiple formats
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
        model: selectedModel
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
        
        // Since we're seeing plain text chunks, just append them directly
        assistantMessage += chunk;
        
        // Update the message with the accumulated text
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

        // Auto-scroll to bottom
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
          "p-4",
          showModelSelector ? "h-[calc(100vh-280px)]" : "h-[calc(100vh-140px)]"
        )}>
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage 
                key={message.id} 
                message={message.content} 
                isUser={message.role === 'user'} 
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
      {/* Main Input Container - GPT Style */}
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
          placeholder={user ? "Ask anything" : "Please log in to chat"}
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
            Medora AI may make mistakes. Check important info.
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