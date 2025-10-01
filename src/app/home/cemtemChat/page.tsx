// src/app/home/cemtemChat/page.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Send,
    Bot,
    User,
    Plus,
    Menu,
    Settings,
    MessageSquare,
    Trash2,
    Edit3,
    MoreVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Sheet,
    SheetContent,
} from '@/components/ui/sheet';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Define the Message interface to ensure type safety
interface Message {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
}

// Define the ChatSession interface
interface ChatSession {
    id: string;
    title: string;
    lastMessage: string;
    timestamp: Date;
    messageCount: number;
}

// Safe time display component to fix hydration error
function SafeTimeDisplay({ timestamp }: { timestamp: Date }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <span className="text-xs text-muted-foreground mt-1">...</span>;
    }

    return (
        <span className="text-xs text-muted-foreground mt-1">
            {timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            })}
        </span>
    );
}

// Safe relative time display for chat history
function SafeRelativeTime({ timestamp }: { timestamp: Date }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <span className="text-xs text-muted-foreground">...</span>;
    }

    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return <span className="text-xs text-muted-foreground">Just now</span>;
    if (minutes < 60) return <span className="text-xs text-muted-foreground">{minutes}m ago</span>;
    if (hours < 24) return <span className="text-xs text-muted-foreground">{hours}h ago</span>;
    return <span className="text-xs text-muted-foreground">{days}d ago</span>;
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // State for chat history
    const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);

    // State to track the active chat session (for API calls)
    // You would set these dynamically based on user selection in the sidebar.
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [activeReportType, setActiveReportType] = useState<string | null>(null);
    const [activeReportId, setActiveReportId] = useState<string | null>(null);

    // Fetch chat history on component mount
    useEffect(() => {
        const fetchChatHistory = async () => {
            try {
                // Fetch chat sessions from your history API route
                const response = await fetch('/api/chatbot/chatHistory');
                if (!response.ok) {
                    throw new Error('Failed to fetch chat history');
                }
                const data = await response.json();
                setChatSessions(data);
                console.log('Chat history fetched:', data);
            } catch (error) {
                console.error('Error fetching chat history:', error);
            }
        };
        fetchChatHistory();
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Function to start a new chat, resetting the state
    const handleNewChat = () => {
        setMessages([
            {
                id: Date.now().toString(),
                content: 'Hello! I\'m CemTemBot, your AI-powered business assistant. How can I help you manage your company today?',
                role: 'assistant',
                timestamp: new Date(),
            }
        ]);
        setActiveChatId(null);
        setActiveReportType(null);
        setActiveReportId(null);
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;
        if (!activeReportType || !activeReportId) {
            console.error('No report selected. Please select a report or add logic to your app to handle this.');
            // Add a user-facing message here later
            return;
        }

        const userMessage: Message = {
            id: Date.now().toString(),
            content: inputMessage,
            role: 'user',
            timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        // Auto-resize textarea back to single line
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }

        try {
            const response = await fetch('/api/chatbot/chatArea', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: [...messages, userMessage], // Send the entire history for context
                    reportType: activeReportType,
                    reportId: activeReportId,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to get AI response');
            }

            const data = await response.json();
            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: data.response,
                role: 'assistant',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Error sending message:', error);
            // Handle error by showing a message to the user
            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                content: 'Sorry, something went wrong. Please try again.',
                role: 'assistant',
                timestamp: new Date(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputMessage(e.target.value);
        const textarea = e.target;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    };

    const ChatHistorySidebar = () => (
        <div className="w-80 border-r border-border bg-card h-full flex flex-col">
            <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                            <Bot className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <span className="font-semibold text-foreground">Chat History</span>
                    </div>
                    <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4" />
                    </Button>
                </div>

                <Button className="w-full" onClick={handleNewChat}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Chat
                </Button>
            </div>
            <ScrollArea className="flex-1 px-2">
                <div className="space-y-2 py-2">
                    {chatSessions.length > 0 ? (
                        chatSessions.map((session) => (
                            <Card key={session.id} className="p-3 hover:bg-accent cursor-pointer transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <MessageSquare className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                                            <h4 className="text-sm font-medium truncate">{session.title}</h4>
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate mb-2">
                                            {session.lastMessage}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <SafeRelativeTime timestamp={new Date(session.timestamp)} />
                                            <Badge variant="secondary" className="text-xs">
                                                {session.messageCount}
                                            </Badge>
                                        </div>
                                    </div>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-2">
                                                <MoreVertical className="w-3 h-3" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem>
                                                <Edit3 className="w-4 h-4 mr-2" />
                                                Rename
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive">
                                                <Trash2 className="w-4 h-4 mr-2" />
                                                Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </Card>
                        ))
                    ) : (
                        <div className="p-4 text-center text-muted-foreground">No chat sessions found.</div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );

    return (
        <div className="flex flex-col flex-1 h-full bg-background"> {/* <-- FIXED: Changed absolute inset-0 to flex flex-col flex-1 h-full */}
            {/* The global AppSidebar from ConditionalSidebar is now handling the main navigation */}

            {/* You currently have an internal ChatHistorySidebar here, which you may want to keep or remove.
                If you keep it, you'll need to wrap this ChatPage in a container that supports two sidebars.
                If you remove it (recommended if the global sidebar is enough), just delete the blocks below.
            */}

            {/* <div className="hidden md:block">
                <ChatHistorySidebar />
            </div> */}
            {/* For mobile */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetContent side="left" className="w-80 p-0">
                    {/* <ChatHistorySidebar /> */}
                </SheetContent>
            </Sheet>

            <div className="flex-1 flex flex-col">
                <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSidebarOpen(true)}
                    >
                        <Menu className="w-5 h-5" />
                    </Button>

                    <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                            <Bot className="w-3 h-3 text-primary-foreground" />
                        </div>
                        <span className="font-semibold">CemTemBot</span>
                    </div>

                    <Button variant="ghost" size="sm">
                        <Settings className="w-5 h-5" />
                    </Button>
                </div>

                <ScrollArea className="flex-1 px-4 md:px-6">
                    <div className="max-w-4xl mx-auto py-6 space-y-6">
                        {messages.map((message) => (
                            <div
                                key={message.id}
                                className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {message.role === 'assistant' && (
                                    <Avatar className="w-8 h-8 border border-border">
                                        <AvatarFallback className="bg-primary text-primary-foreground">
                                            <Bot className="w-4 h-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={`flex flex-col max-w-[80%] md:max-w-[70%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                                    <div
                                        className={`rounded-lg px-4 py-3 ${message.role === 'user'
                                            ? 'bg-primary text-primary-foreground'
                                            : 'bg-card border border-border text-card-foreground'
                                            }`}
                                    >
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                            {message.content}
                                        </p>
                                    </div>
                                    <SafeTimeDisplay timestamp={message.timestamp} />
                                </div>

                                {message.role === 'user' && (
                                    <Avatar className="w-8 h-8 border border-border">
                                        <AvatarFallback className="bg-secondary text-secondary-foreground">
                                            <User className="w-4 h-4" />
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex gap-4 justify-start">
                                <Avatar className="w-8 h-8 border border-border">
                                    <AvatarFallback className="bg-primary text-primary-foreground">
                                        <Bot className="w-4 h-4" />
                                    </AvatarFallback>
                                </Avatar>
                                <div className="bg-card border border-border rounded-lg px-4 py-3">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                        <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>

                <div className="border-t border-border bg-card p-4">
                    <div className="max-w-4xl mx-auto">
                        <div className="flex gap-2 items-end">
                            <div className="flex-1 relative">
                                <Textarea
                                    ref={textareaRef}
                                    value={inputMessage}
                                    onChange={handleTextareaChange}
                                    onKeyDown={handleKeyPress}
                                    placeholder="Message CemTemBot..."
                                    className="min-h-[44px] max-h-[120px] resize-none pr-12"
                                    disabled={isLoading}
                                />
                                <Button
                                    onClick={handleSendMessage}
                                    disabled={isLoading || !inputMessage.trim()}
                                    size="sm"
                                    className="absolute right-2 bottom-2 h-8 w-8 p-0"
                                >
                                    <Send className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                            CemTemBot can make mistakes. Please verify important information.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
