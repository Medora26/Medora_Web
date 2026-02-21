// components/AIChatBox.tsx
"use client";

import { BotMessageSquare, X, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from "@/lib/utils";
import { useState } from "react";

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
        <p className="text-sm">{message}</p>
      </div>
    </div>
  );
};

interface AIChatBoxProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIChatBox = ({ isOpen, onClose }: AIChatBoxProps) => {
  const [messages, setMessages] = useState([
    { text: "Hello! How can I help you today?", isUser: false },
  ]);
  const [inputMessage, setInputMessage] = useState("");

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    // Add user message
    setMessages(prev => [...prev, { text: inputMessage, isUser: true }]);
    
    // Simulate AI response (you'll replace this with actual AI logic later)
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        text: "Thanks for your message! This is a demo response. The actual AI integration will go here.", 
        isUser: false 
      }]);
    }, 1000);

    setInputMessage("");
  };

  return (
    <>
      {/* Backdrop overlay when chat is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Slide-in chat panel */}
      <div className={cn(
        "fixed top-0 right-0 h-full w-[400px] bg-background border-l shadow-lg z-50 transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Chat Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <BotMessageSquare className="h-5 w-5" />
            <h2 className="font-semibold">AI Assistant</h2>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Chat Messages */}
        <ScrollArea className="h-[calc(100vh-140px)] p-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <ChatMessage 
                key={index} 
                message={message.text} 
                isUser={message.isUser} 
              />
            ))}
          </div>
        </ScrollArea>

        {/* Chat Input */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!inputMessage.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AIChatBox;