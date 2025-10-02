// src/app/home/cemtemChat/page.tsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import io, { Socket } from 'socket.io-client';

interface ChatMessage {
    text: string;
    awaiting?: boolean;
}
interface DisplayMessage {
    id: string;
    content: string;
    role: 'user' | 'assistant' | 'system';
    timestamp: Date;
}

function SafeTimeDisplay({ timestamp }: { timestamp: Date }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return <span className="opacity-0">...</span>;
    return (
        <span className="text-xs text-muted-foreground">
            {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
    );
}

export default function CemtemChatPage() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);
    const [messages, setMessages] = useState<DisplayMessage[]>([]);
    const [inputMessage, setInputMessage] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const didWelcomeRef = useRef(false);

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);
    useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom, isLoading]);

    // watchdog to clear stuck typing
    useEffect(() => {
        if (!isLoading) return;
        const t = setTimeout(() => setIsLoading(false), 15000);
        return () => clearTimeout(t);
    }, [isLoading]);

    useEffect(() => {
        const WS_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || 'http://localhost:5055';
        const newSocket = io(WS_URL, {
            path: '/socket.io',
            transports: ['websocket', 'polling'],
            timeout: 20000,    // give it 20s to handshake
            withCredentials: false,   //no cookies to store
        });

        newSocket.on('connect', () => {
            console.log('Socket connected');
            setIsConnected(true);
            setIsLoading(false);
        });

        newSocket.onAny((event, ...args) => console.log('[socket]', event, ...args));
        newSocket.io.on('reconnect_attempt', (n) => console.log('[socket] reconnect_attempt', n));
        newSocket.io.on('error', (e) => console.log('[socket.io error]', e));

        newSocket.on('disconnect', () => {
            console.log('Socket disconnected');
            setIsConnected(false);
            setIsLoading(false);
        });

        newSocket.on('connect_error', (err) => {
            console.error('connect_error', err);
            setIsConnected(false);
            setIsLoading(false);
        });

        newSocket.on('error', (payload) => {
            console.error('server error', payload);
            setIsLoading(false);
        });

        newSocket.on('ready', () => {
            if (!didWelcomeRef.current) {
                didWelcomeRef.current = true;
                setMessages([{
                    id: crypto.randomUUID(),
                    content:
                        "Hello! I'm CemTemBot. How can I assist you with your FastMCP data today? I can help you with reports, dealer info, and more. Just ask!",
                    role: 'assistant',
                    timestamp: new Date(),
                }]);
            }
        });

        newSocket.on('status', (data: { typing: boolean }) => setIsLoading(data.typing === true));

        newSocket.on('message', (data: ChatMessage) => {
            setAwaitingConfirmation(data.awaiting === true);
            setMessages(prev => [
                ...prev,
                {
                    id: crypto.randomUUID(),
                    content: data.text,
                    role: 'assistant',
                    timestamp: new Date(),
                },
            ]);
            setIsLoading(false);
        });

        setSocket(newSocket);
        return () => { newSocket.disconnect(); };
    }, []);

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputMessage(e.target.value);
        if (textareaRef.current) {
            textareaRef.current.style.height = '44px';
            const h = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${Math.min(h, 120)}px`;
        }
    };

    const handleSendMessage = useCallback(() => {
        if (!socket || !isConnected || isLoading) return;
        const message = inputMessage.trim();
        if (!message) return;

        // confirmation path
        if (awaitingConfirmation && message.toUpperCase() === 'Y') {
            socket.emit('confirm_post');
            setMessages(prev => [
                ...prev,
                { id: crypto.randomUUID(), content: message, role: 'user', timestamp: new Date() },
            ]);
            setIsLoading(true);
            setAwaitingConfirmation(false);
            setInputMessage('');
            if (textareaRef.current) textareaRef.current.style.height = '44px';
            return;
        }

        // normal send
        setMessages(prev => [
            ...prev,
            { id: crypto.randomUUID(), content: message, role: 'user', timestamp: new Date() },
        ]);
        socket.emit('send_message', { text: message }); // <-- fixed
        setIsLoading(true);
        setInputMessage('');
        if (textareaRef.current) textareaRef.current.style.height = '44px';
    }, [socket, isConnected, isLoading, inputMessage, awaitingConfirmation]);

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const renderMessage = (msg: DisplayMessage) => {
        const isUser = msg.role === 'user';
        if (msg.role === 'system') {
            return (
                <div key={msg.id} className="my-2 text-center text-xs text-gray-500 italic">
                    {msg.content}
                </div>
            );
        }
        return (
            <div key={msg.id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
                <div className="flex items-end max-w-[80%]">
                    {!isUser && (
                        <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback className="bg-primary/10 text-primary">
                                <Bot className="w-5 h-5" />
                            </AvatarFallback>
                        </Avatar>
                    )}
                    <div
                        className={`p-3 rounded-xl shadow-md transition-colors duration-200 ${isUser
                            ? 'bg-primary text-primary-foreground rounded-br-none'
                            : 'bg-secondary text-secondary-foreground rounded-tl-none'
                            }`}
                    >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <div className={`mt-1 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                            <SafeTimeDisplay timestamp={msg.timestamp} />
                        </div>
                    </div>
                    {isUser && (
                        <Avatar className="h-8 w-8 ml-2">
                            <AvatarFallback className="bg-slate-200 text-black">
                                <User className="w-5 h-5" />
                            </AvatarFallback>
                        </Avatar>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="flex-1 min-w-0 flex flex-col px-4 md:px-6 py-6">
            {/* Status banner */}
            <div className="flex items-center justify-center text-xs text-muted-foreground border border-border rounded-lg bg-muted/50 p-2 mb-4">
                <Bot className="w-4 h-4 mr-2 text-primary" />
                CemTemBot - Status:
                <span
                    className={`ml-2 h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"
                        } transition-colors duration-300`}
                    title={isConnected ? "Connected" : "Disconnected"}
                />
                <span className="ml-2">{isConnected ? "Connected" : "Disconnected"}</span>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 overflow-y-auto space-y-4 pr-2">
                {messages.map(renderMessage)}

                {isLoading && (
                    <div className="flex justify-start mb-4">
                        <div className="flex items-end">
                            <Avatar className="h-8 w-8 mr-3 mt-1 shadow-sm">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                    <Bot className="w-5 h-5" />
                                </AvatarFallback>
                            </Avatar>
                            <div className="p-3.5 rounded-3xl rounded-tl-md bg-muted text-foreground shadow-sm border border-border">
                                <div className="flex space-x-1 items-center h-4">
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }} />
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-border bg-background sticky bottom-0 py-4">
                <div className="flex gap-3 items-end">
                    <div className="flex-1 relative">
                        <Textarea
                            ref={textareaRef}
                            value={inputMessage}
                            onChange={handleTextareaChange}
                            onKeyDown={handleKeyPress}
                            placeholder={
                                isConnected
                                    ? awaitingConfirmation
                                        ? "Awaiting your confirmation... (Send 'Y' or type a new message)"
                                        : "Message CemTemBot..."
                                    : "Connecting to server..."
                            }
                            className="min-h-[44px] max-h-[120px] resize-none pr-12 text-base rounded-xl border border-input bg-muted text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50"
                            disabled={!isConnected}
                        />
                        <Button
                            onClick={handleSendMessage}
                            disabled={isLoading || !isConnected || !inputMessage.trim()}
                            size="icon"
                            className="absolute right-2 bottom-2 h-8 w-8 p-0 rounded-lg"
                        >
                            <Send className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
                <p className="text-xs text-center text-muted-foreground mt-2">
                    {isConnected
                        ? "CemTemBot can make mistakes. Please verify important information."
                        : "Not connected to the chat service. Check the server endpoint."}
                </p>
            </div>
        </div>
    );

}
