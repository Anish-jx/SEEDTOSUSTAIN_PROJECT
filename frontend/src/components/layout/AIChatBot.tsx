import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useStore } from '@/store/useStore';
import { cn } from '@/lib/utils';
import { AIService } from '@/services/ai';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export function AIChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "Hello! I am your Seed2Sustain Assistant. I can help you with your aeroponics system, plant care, and sensor readings. How can I assist you today?",
            timestamp: new Date()
        }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const scrollEndRef = useRef<HTMLDivElement>(null);
    const { devices } = useStore();

    const scrollToBottom = () => {
        scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = {
            role: 'user',
            content: input,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);

        // Process response
        try {
            const result = await AIService.getAssistantResponse(input, { devices });
            const assistantMsg: Message = {
                role: 'assistant',
                content: result.content,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, assistantMsg]);
        } catch (error) {
            console.error("AI Error:", error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I'm sorry, I'm having trouble connecting to my brain right now. Please try again in a moment.",
                timestamp: new Date()
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
            {/* Chat Window */}
            {isOpen && (
                <Card className="w-[380px] h-[520px] mb-4 shadow-2xl border-none overflow-hidden animate-in slide-in-from-bottom-5 duration-300 flex flex-col">
                    <CardHeader className="bg-primary text-primary-foreground p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-white/20 rounded-lg">
                                    <Bot size={20} className="text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-bold">Seed2Sustain Assistant</CardTitle>
                                    <p className="text-[10px] opacity-80">Online & Ready to Help</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/10" onClick={() => setIsOpen(false)}>
                                <X size={20} />
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="flex-1 overflow-hidden p-0 relative">
                        <ScrollArea className="h-full p-4">
                            <div className="space-y-4 pb-4">
                                {messages.map((msg, i) => (
                                    <div key={i} className={cn(
                                        "flex flex-col gap-1 max-w-[85%]",
                                        msg.role === 'user' ? "ml-auto items-end" : "items-start"
                                    )}>
                                        <div className={cn(
                                            "p-3 rounded-2xl text-sm",
                                            msg.role === 'user'
                                                ? "bg-primary text-primary-foreground rounded-tr-none shadow-md"
                                                : "bg-muted text-foreground rounded-tl-none border border-border/50"
                                        )}>
                                            {msg.content.split('\n').map((line, j) => <p key={j}>{line}</p>)}
                                        </div>
                                        <span className="text-[10px] text-muted-foreground px-1">
                                            {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))}
                                {isTyping && (
                                    <div className="flex items-center gap-2 text-muted-foreground bg-muted/30 p-2 rounded-xl w-fit">
                                        <Sparkles size={14} className="animate-pulse" />
                                        <span className="text-xs italic">Sustaining the response...</span>
                                    </div>
                                )}
                                <div ref={scrollEndRef} />
                            </div>
                        </ScrollArea>
                    </CardContent>

                    <CardFooter className="p-4 border-t border-border/50 bg-card">
                        <form
                            className="flex w-full items-center gap-2"
                            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        >
                            <Input
                                placeholder="Ask about your plants..."
                                className="h-10 rounded-xl bg-muted/50 border-none shadow-none focus-visible:ring-1"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                            />
                            <Button size="icon" className="h-10 w-10 shrink-0 rounded-xl shadow-lg" disabled={!input.trim()}>
                                <Send size={18} />
                            </Button>
                        </form>
                    </CardFooter>
                </Card>
            )}

            {/* Toggle Button */}
            <Button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "h-14 w-14 rounded-2xl shadow-2xl transition-all duration-300",
                    isOpen ? "rotate-90 bg-muted text-foreground hover:bg-muted/80" : "bg-primary hover:scale-105"
                )}
            >
                {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
            </Button>
        </div>
    );
}
