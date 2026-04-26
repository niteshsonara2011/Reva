"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Leaf,
  Send,
  Sparkles,
  ArrowLeft,
  Search,
  MessageCircle,
  BarChart3,
  Bookmark,
  Bell,
  Plus,
  ChevronRight,
} from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; content: string };
type NavId = "home" | "chat" | "compare" | "saved" | "alerts";

// ---------- Local persistence (24h TTL) ----------
const STORAGE_KEY = "geyvak.chat.v1";
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

type StoredChat = { messages: ChatMessage[]; savedAt: number };

function loadStoredChat(): StoredChat | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredChat;
    if (
      !parsed ||
      typeof parsed.savedAt !== "number" ||
      !Array.isArray(parsed.messages)
    ) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    if (Date.now() - parsed.savedAt > TTL_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    const messages = parsed.messages.filter(
      (m): m is ChatMessage =>
        !!m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string"
    );
    return { messages, savedAt: parsed.savedAt };
  } catch {
    return null;
  }
}

function saveStoredChat(messages: ChatMessage[], savedAt: number) {
  if (typeof window === "undefined") return;
  try {
    const payload: StoredChat = { messages, savedAt };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // quota exceeded or storage disabled; silent no-op
  }
}

function clearStoredChat() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

// ---------- Bottom navigation ----------
function AppShell({
  active,
  setActive,
}: {
  active: NavId;
  setActive: (id: NavId) => void;
}) {
  const nav: { id: NavId; label: string; icon: React.ElementType }[] = [
    { id: "home", label: "Home", icon: Search },
    { id: "chat", label: "Chat", icon: MessageCircle },
    { id: "compare", label: "Compare", icon: BarChart3 },
    { id: "saved", label: "Saved", icon: Bookmark },
    { id: "alerts", label: "Alerts", icon: Bell },
  ];

  return (
    <div className="fixed bottom-4 left-1/2 z-50 w-[92%] max-w-md -translate-x-1/2 rounded-3xl border border-white/70 bg-white/85 p-2 shadow-xl backdrop-blur-xl">
      <div className="grid grid-cols-5 gap-1">
        {nav.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActive(item.id)}
              className={`flex flex-col items-center justify-center rounded-2xl px-2 py-2 text-[11px] transition ${
                isActive
                  ? "bg-[#dbeee8] text-[#244b43]"
                  : "text-[#6f7f78] hover:bg-[#f2f7f4]"
              }`}
            >
              <Icon className="mb-1 h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Chat header ----------
function ChatHeader({ onNewChat }: { onNewChat: () => void }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <button className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-[#31544c] shadow-sm backdrop-blur">
        <ArrowLeft className="h-5 w-5" />
      </button>
      <div className="flex flex-col items-center">
        <div className="flex items-center gap-2 text-sm font-medium text-[#31544c]">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#5a8c7e] opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[#31544c]" />
          </span>
          Assistant
        </div>
        <p className="text-[11px] text-[#6a7c75]">Always ready to compare</p>
      </div>
      <button
        onClick={onNewChat}
        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-[#31544c] shadow-sm backdrop-blur"
        aria-label="New chat"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
}

// ---------- Welcome / empty state ----------
function WelcomeState({
  onSelectPrompt,
}: {
  onSelectPrompt: (text: string) => void;
}) {
  const prompts = [
    {
      icon: BarChart3,
      title: "Compare two products",
      sub: "Side-by-side breakdown",
      text: "Help me compare two mini cookers I'm looking at.",
    },
    {
      icon: Sparkles,
      title: "Find best value",
      sub: "Under a budget",
      text: "What's the best value air fryer under $100?",
    },
    {
      icon: Leaf,
      title: "Help me decide",
      sub: "When stuck between options",
      text: "I can't decide between two laptops, can you help?",
    },
    {
      icon: ChevronRight,
      title: "Worth the upgrade?",
      sub: "From what I already have",
      text: "Is upgrading from an iPhone 14 to 16 worth it?",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center pb-4 pt-6 text-center"
    >
      <div className="relative mb-5">
        <div className="absolute inset-0 -z-10 rounded-full bg-[#dbeee8] blur-2xl" />
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-[#3d6a60] to-[#244b43] shadow-lg">
          <Leaf className="h-7 w-7 text-[#dbeee8]" />
        </div>
      </div>
      <h2 className="text-2xl font-semibold tracking-tight text-[#203f39]">
        How can I help today?
      </h2>
      <p className="mt-1 max-w-xs text-sm text-[#6a7c75]">
        Ask me to compare products, find better value, or talk through a
        decision.
      </p>

      <div className="mt-6 grid w-full grid-cols-2 gap-3">
        {prompts.map((p, i) => {
          const Icon = p.icon;
          return (
            <motion.button
              key={p.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.06 }}
              onClick={() => onSelectPrompt(p.text)}
              className="group flex flex-col items-start gap-2 rounded-2xl border border-white/70 bg-white/80 p-3 text-left shadow-sm backdrop-blur transition hover:border-[#cce0d9] hover:bg-white"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eef5f1] text-[#31544c] transition group-hover:bg-[#dbeee8]">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[13px] font-medium leading-tight text-[#203f39]">
                  {p.title}
                </p>
                <p className="mt-0.5 text-[11px] text-[#6a7c75]">{p.sub}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ---------- Message bubble ----------
function Message({ role, content }: ChatMessage) {
  const isUser = role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"} mb-3`}
    >
      {!isUser && (
        <div className="mr-2 mt-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3d6a60] to-[#244b43] shadow-sm">
          <Leaf className="h-3.5 w-3.5 text-[#dbeee8]" />
        </div>
      )}
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed shadow-sm ${
          isUser
            ? "rounded-br-md bg-[#31544c] text-white"
            : "rounded-bl-md border border-white/70 bg-white/90 text-[#203f39] backdrop-blur"
        }`}
      >
        <div className="whitespace-pre-wrap">{content}</div>
      </div>
    </motion.div>
  );
}

// ---------- Typing indicator ----------
function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="mb-3 flex w-full justify-start"
    >
      <div className="mr-2 mt-auto flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#3d6a60] to-[#244b43] shadow-sm">
        <Leaf className="h-3.5 w-3.5 text-[#dbeee8]" />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-white/70 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-[#5a8c7e]"
            animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ---------- Input bar ----------
function InputBar({
  value,
  onChange,
  onSend,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
}) {
  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) onSend();
    }
  };

  return (
    <div className="fixed bottom-24 left-1/2 z-40 w-[92%] max-w-md -translate-x-1/2">
      <div className="flex items-end gap-2 rounded-3xl border border-white/70 bg-white/85 p-2 shadow-xl backdrop-blur-xl">
        <textarea
          rows={1}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask anything about a product…"
          disabled={disabled}
          className="max-h-32 flex-1 resize-none border-0 bg-transparent px-3 py-2 text-[14px] text-[#203f39] placeholder:text-[#9aaaa3] focus:outline-none"
        />
        <button
          onClick={() => value.trim() && onSend()}
          disabled={disabled || !value.trim()}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#31544c] text-white shadow-sm transition hover:bg-[#24443d] disabled:cursor-not-allowed disabled:bg-[#a8bdb6]"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ---------- Chat screen ----------
function ChatScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Tracks last user-activity time. Preserved across reloads so the 24h
  // window measures inactivity, not how long the tab has been open.
  const savedAtRef = useRef<number>(Date.now());
  const hydratedRef = useRef(false);

  // Hydrate from localStorage on mount (skipped on SSR — this is a client component)
  useEffect(() => {
    const stored = loadStoredChat();
    if (stored && stored.messages.length > 0) {
      setMessages(stored.messages);
      savedAtRef.current = stored.savedAt;
    }
    hydratedRef.current = true;
  }, []);

  // Persist whenever messages change (after hydration)
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (messages.length === 0) {
      clearStoredChat();
      return;
    }
    saveStoredChat(messages, savedAtRef.current);
  }, [messages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  async function sendMessage(textOverride?: string) {
    const text = (textOverride ?? input).trim();
    if (!text || isStreaming) return;

    // Mark this as activity so the 24h TTL rolls forward
    savedAtRef.current = Date.now();

    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setIsTyping(true);
    setIsStreaming(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });

      // Errors come back as JSON before any streaming starts
      if (!res.ok) {
        let errMsg = "Request failed";
        try {
          const data = await res.json();
          if (data?.error) errMsg = data.error;
        } catch {}
        throw new Error(errMsg);
      }

      if (!res.body) {
        throw new Error("No response body from server.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let firstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;
        accumulated += chunk;

        if (firstChunk) {
          firstChunk = false;
          setIsTyping(false);
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: accumulated },
          ]);
        } else {
          setMessages((prev) => {
            const updated = prev.slice();
            updated[updated.length - 1] = {
              role: "assistant",
              content: accumulated,
            };
            return updated;
          });
        }
      }

      // Flush any remaining bytes from the decoder
      const tail = decoder.decode();
      if (tail) {
        accumulated += tail;
        setMessages((prev) => {
          const updated = prev.slice();
          updated[updated.length - 1] = {
            role: "assistant",
            content: accumulated,
          };
          return updated;
        });
      }

      // Empty response edge case
      if (firstChunk) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "Hmm, I didn't catch that. Try asking again?",
          },
        ]);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(msg);
    } finally {
      setIsTyping(false);
      setIsStreaming(false);
    }
  }

  return (
    <>
      <ChatHeader onNewChat={() => setMessages([])} />

      <div
        ref={scrollRef}
        className="no-scrollbar -mx-1 max-h-[calc(100vh-260px)] overflow-y-auto px-1 pb-40"
      >
        {messages.length === 0 ? (
          <WelcomeState onSelectPrompt={(t) => sendMessage(t)} />
        ) : (
          <div className="pt-2">
            {messages.map((m, i) => (
              <Message key={i} role={m.role} content={m.content} />
            ))}
            <AnimatePresence>{isTyping && <TypingIndicator />}</AnimatePresence>
            {error && (
              <div className="mt-2 rounded-xl bg-[#fce9e4] px-3 py-2 text-[12px] text-[#9a3a2a]">
                {error}
              </div>
            )}
          </div>
        )}
      </div>

      <InputBar
        value={input}
        onChange={setInput}
        onSend={() => sendMessage()}
        disabled={isStreaming}
      />
    </>
  );
}

// ---------- App wrapper ----------
export default function GeyvakChat() {
  const [active, setActive] = useState<NavId>("chat");

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden">
      {/* Soft atmospheric blobs */}
      <div className="pointer-events-none fixed -top-24 -left-20 h-72 w-72 rounded-full bg-[#cfe2da] opacity-50 blur-3xl" />
      <div className="pointer-events-none fixed top-40 -right-24 h-72 w-72 rounded-full bg-[#e9dec8] opacity-60 blur-3xl" />

      <div className="relative mx-auto max-w-md px-4 pt-6">
        {active === "chat" ? (
          <ChatScreen />
        ) : (
          <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/80 text-[#31544c] shadow-sm backdrop-blur">
              <Leaf className="h-5 w-5" />
            </div>
            <p className="text-sm text-[#6a7c75]">
              Tap <span className="font-medium text-[#31544c]">Chat</span> to
              talk to the assistant.
            </p>
          </div>
        )}
      </div>

      <AppShell active={active} setActive={setActive} />
    </div>
  );
}
