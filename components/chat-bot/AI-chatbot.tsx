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
import {
  generatePersonalInfoPDF,
  generateMedicalInfoPDF,
  generateIdentificationPDF, 
  generateInsuranceInfoPDF
} from '@/components/chat-bot/pdf/index'
import { PatientProfileData, PatientService } from '@/lib/firebase/service/patients/service';
import {useChatHistory} from "@/hooks/use-chatHistory"
import { Timestamp } from 'firebase/firestore';
import { toast } from 'sonner';

interface ChatMessageProps {
  message: string;
  isUser: boolean;
  onDownloadPDF?: () => void;
  onDownloadPersonal?: () => void;
  onDownloadMedical?: () => void;
  onDownloadInsurance?: () => void;
  onDownloadIdentification?: () => void;
  showDownloadButton?: boolean | null;
}

const ChatMessage = ({ 
  message, 
  isUser, 
  onDownloadPDF,
  onDownloadPersonal,
  onDownloadMedical,
  onDownloadInsurance,
  onDownloadIdentification,
  showDownloadButton = false
}: ChatMessageProps) => {
  const messageRef = useRef<HTMLDivElement>(null);

  return (
    <div className={cn("flex w-full mb-4", isUser ? "justify-end" : "justify-start")}>
      <div className={cn(
        "max-w-[80%] rounded-lg px-4 py-2 relative group",
        isUser 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted"
      )}>
      
        
        {/* Message content */}
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

 <div className='flex items-center gap-1'>
  {/* General PDF Download Button - Always shows for assistant messages */}
  {!isUser && onDownloadPDF && (
    <Button
      variant="ghost"
      size="icon"
      className="absolute -bottom-8 left-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={onDownloadPDF}
      title="Download this chat as PDF"
    >
      <Download className="h-3 w-3" />
    </Button>
  )}
  
  {/* Section-specific PDF Buttons - Only show when user explicitly asked */}
  {!isUser && showDownloadButton && (
    <div className="absolute -bottom-8 left-10 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {onDownloadPersonal && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full bg-blue-100 hover:bg-blue-200 border-0"
          onClick={onDownloadPersonal}
          title="Download Personal Information"
        >
          <svg className="h-3 w-3 text-blue-700" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
          </svg>
        </Button>
      )}
      {onDownloadMedical && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full bg-green-100 hover:bg-green-200 border-0"
          onClick={onDownloadMedical}
          title="Download Medical History"
        >
          <svg className="h-3 w-3 text-green-700" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 8H17V4H3V19H20V8ZM7 16H5V14H7V16ZM7 12H5V10H7V12ZM7 8H5V6H7V8ZM11 16H9V14H11V16ZM11 12H9V10H11V12ZM11 8H9V6H11V8ZM16 19H13V17H16V19ZM16 15H13V13H16V15ZM16 11H13V9H16V11ZM19 19H17V17H19V19ZM19 15H17V13H19V15ZM19 11H17V9H19V11Z" fill="currentColor"/>
          </svg>
        </Button>
      )}
      {onDownloadInsurance && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full bg-purple-100 hover:bg-purple-200 border-0"
          onClick={onDownloadInsurance}
          title="Download Insurance Information"
        >
          <svg className="h-3 w-3 text-purple-700" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1ZM12 11.99H19C18.47 16.11 15.72 19.78 12 20.93V12H5V6.3L12 3.19V11.99Z" fill="currentColor"/>
          </svg>
        </Button>
      )}
      {onDownloadIdentification && (
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-full bg-amber-100 hover:bg-amber-200 border-0"
          onClick={onDownloadIdentification}
          title="Download Identification Documents"
        >
          <svg className="h-3 w-3 text-amber-700" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 4H4C2.9 4 2 4.9 2 6V18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V6C22 4.9 21.1 4 20 4ZM20 18H4V6H20V18ZM18 9H6V7H18V9ZM18 13H6V11H18V13ZM18 17H6V15H18V17Z" fill="currentColor"/>
          </svg>
        </Button>
      )}
    </div>
  )}
</div>

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
  const [patientProfile, setPatientProfile] = useState<PatientProfileData | null>(null)
  const {saveConversation, loadTodayHistory , loadHistory} = useChatHistory();
  //fetch patients data
 useEffect(() => {
  if (user) {
    PatientService.getPatientProfile(user.uid)
      .then((profile: PatientProfileData | null) => {
        setPatientProfile(profile);
      })
      .catch((error) => {
        console.error('Error fetching patient profile:', error);
        setPatientProfile(null);
      });
  } else {
    setPatientProfile(null);
  }
}, [user]);

useEffect(() => { 
  if (user) {
    // Load today's chat history when user logs in
    loadHistory().then(historyMessages => {
      if (historyMessages && historyMessages.length > 0) {
        // Sort by timestamp ascending (oldest first) just to be safe
        const sortedMessages = [...historyMessages].sort((a, b) => {
          const timeA = a.timestamp?.getTime() || 0;
          const timeB = b.timestamp?.getTime() || 0;
          return timeA - timeB; // Ascending = oldest first
        });
        
        // Convert Firestore messages to your message format
        const formattedMessages = sortedMessages.map(msg => ({
          id: msg.id,
          role: msg.role,
          content: msg.content
        }));
        
        setMessages(formattedMessages);
        console.log('Loaded messages in chronological order:', formattedMessages.length);
      } else {
        // If no history, keep welcome message
        console.log('No chat history found');
      }
    }).catch(error => {
      console.error('Error loading chat history:', error);
    });
  } else {
    // Reset to welcome message when user logs out
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `# 👋 Welcome I'm Meditalk👾

I'm here to help you with your **medical history, insurance details, and documents**. Here's what I can do for you:

## 📋 Available Features
- Answer questions about your medical records
- Help with insurance information
- Assist with document management
- Generate structured medical summaries.`
    }]);
  }
}, [user]);

  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `# 👋 Welcome I'm Meditalk👾

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
  // PDF download handler using your template 
   const handleDownloadPersonalInfo = () => {
      if(patientProfile) {
         generatePersonalInfoPDF(patientProfile)
      } else {
         console.log(`No patient profile available`)
      }
   }

   // PDF for medical temp 
   const handleDownloadMedicalInfo = () => {
     if(patientProfile) {
       generateMedicalInfoPDF(patientProfile)
     } else {
        console.log('no patient medical data')
     }
   }

   //PDF for insurance data 
   const handleDownloadInsuranceData = () => {
     if(patientProfile) {
       generateInsuranceInfoPDF(patientProfile)
     } else {
        console.log('no patient insurance data')
     }
   }

   //PDF for identification temp
    const handleDownloadIdentification = () => { 
      if(patientProfile) {
         generateIdentificationPDF(patientProfile)
      } else {
         console.log('No patient id data')
      }
    }
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    
    const userMessageContent = input
    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessageContent
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
    const startTime = Date.now();
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

      // calculate processing time 
      const processingTime = Date.now() - startTime;

      //save the conversation to firebase 
      try {
        await saveConversation(
           userMessageContent,
           assistantMessage,
           {
             model: selectedModel,
             processingTime,
             tokens: Math.ceil((userMessageContent.length + assistantMessage.length) / 4)
           }
        );
        console.log(`conversation saved to history`)
      } catch (error) {
         console.log("error saving conversation",error)
         toast.error("error saving chat history")
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
        "fixed top-0 right-0 h-full w-96 md:w-[450px] bg-background border-l shadow-lg z-50 transform transition-transform duration-300 ease-in-out",
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
          "px-4 pt-4 pb-5 ",
          showModelSelector ? "h-[calc(100vh-280px)]" : "h-[calc(100vh-200px)]"
        )}>
          <div className="space-y-4">
            {messages.map((message) => {
      // Check if this is an assistant message (not user)
      const isAssistant = message.role === 'assistant';
      
      // Determine which specific download buttons to show based on content
      const showPersonalButton = isAssistant && 
        patientProfile !== null && 
        (message.content.toLowerCase().includes('personal information') ||
         message.content.toLowerCase().includes('personal info') ||
         message.content.toLowerCase().includes('demographic') ||
         message.content.toLowerCase().includes('emergency contact'));

      const showMedicalButton = isAssistant && 
        patientProfile !== null && 
        (message.content.toLowerCase().includes('medical history') ||
         message.content.toLowerCase().includes('medical information') ||
         message.content.toLowerCase().includes('health record') ||
         message.content.toLowerCase().includes('allergies') ||
         message.content.toLowerCase().includes('medications') ||
         message.content.toLowerCase().includes('vital signs') ||
         message.content.toLowerCase().includes('blood type'));

      const showInsuranceButton = isAssistant && 
        patientProfile !== null && 
        (message.content.toLowerCase().includes('insurance') ||
         message.content.toLowerCase().includes('policy') ||
         message.content.toLowerCase().includes('coverage') ||
         message.content.toLowerCase().includes('provider'));

      const showIdentificationButton = isAssistant && 
        patientProfile !== null && 
        (message.content.toLowerCase().includes('identification') ||
         message.content.toLowerCase().includes('id card') ||
         message.content.toLowerCase().includes('aadhaar') ||
         message.content.toLowerCase().includes('passport') ||
         message.content.toLowerCase().includes('driving license'));

      // Always show general download button for assistant messages
      const showGeneralDownload = isAssistant && message.content.length > 0;

      return (
        <ChatMessage
          key={message.id}
          message={message.content}
          isUser={message.role === 'user'}
          onDownloadPDF={showGeneralDownload ? () => handleDownloadPDF(message.id) : undefined}
          onDownloadPersonal={showPersonalButton ? handleDownloadPersonalInfo : undefined}
          onDownloadMedical={showMedicalButton ? handleDownloadMedicalInfo : undefined}
          onDownloadInsurance={showInsuranceButton ? handleDownloadInsuranceData : undefined}
          onDownloadIdentification={showIdentificationButton ? handleDownloadIdentification : undefined}
          showDownloadButton={showPersonalButton || showMedicalButton || showInsuranceButton || showIdentificationButton}
        />
      );
    })}
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