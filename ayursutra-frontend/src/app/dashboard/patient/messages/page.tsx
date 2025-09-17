"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  listMessageThreads,
  listChatMessages,
  sendChatMessage,
} from "@/lib/api";

export default function PatientMessagesPage() {
  const { user, token } = useAuth();
  const [threads, setThreads] = useState<
    Array<{ chatId: string; doctor: Record<string, unknown> }>
  >([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Array<Record<string, unknown>>>([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  const activeThread = useMemo(
    () => threads.find((t) => t.chatId === activeChatId) || null,
    [threads, activeChatId]
  );

  function scrollToBottom() {
    if (endRef.current) endRef.current.scrollIntoView({ behavior: "smooth" });
  }

  async function loadThreads() {
    if (!user?.uid || !token) return;
    setLoadingThreads(true);
    setError(null);
    try {
      const list = await listMessageThreads(user.uid, token);
      setThreads(list);
      if (!activeChatId && list.length > 0) setActiveChatId(list[0].chatId);
    } catch (err: unknown) {
      setError((err as Error)?.message || "Failed to load threads");
    } finally {
      setLoadingThreads(false);
    }
  }

  async function loadMessages(chatId: string) {
    if (!token || !user?.uid) return;
    setLoadingMessages(true);
    setError(null);
    try {
      const res = await listChatMessages(chatId, token, user.uid);
      setMessages(res.messages || []);
      setTimeout(scrollToBottom, 0);
    } catch (err: unknown) {
      setError((err as Error)?.message || "Failed to load messages");
    } finally {
      setLoadingMessages(false);
    }
  }

  async function handleSend() {
    if (!activeChatId || !user?.uid || !token) return;
    if (!text.trim() && !attachmentUrl.trim()) return;
    try {
      const res = await sendChatMessage(
        activeChatId,
        {
          senderId: user.uid,
          text: text.trim() || undefined,
          attachmentUrl: attachmentUrl.trim() || undefined,
        },
        token
      );
      setMessages(res.messages || []);
      setText("");
      setAttachmentUrl("");
      setTimeout(scrollToBottom, 0);
    } catch (err: unknown) {
      setError((err as Error)?.message || "Failed to send message");
    }
  }

  useEffect(() => {
    loadThreads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, token]);

  useEffect(() => {
    if (activeChatId) loadMessages(activeChatId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId]);

  return (
    <ProtectedRoute allowedRoles={["patient"]}>
      <DashboardLayout>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-200px)]">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Therapists</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[60vh] overflow-y-auto">
                {loadingThreads && (
                  <p className="text-sm text-gray-500 px-4">Loading...</p>
                )}
                {!loadingThreads && threads.length === 0 && (
                  <p className="text-sm text-gray-500 px-4">
                    No assigned therapists found.
                  </p>
                )}
                <div className="divide-y">
                  {threads.map((t) => (
                    <button
                      key={t.chatId}
                      onClick={() => setActiveChatId(t.chatId)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 ${
                        activeChatId === t.chatId ? "bg-indigo-50" : ""
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={t.doctor?.avatar || ""} />
                          <AvatarFallback>
                            {(t.doctor?.name || "D").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">
                            {t.doctor?.name || "Therapist"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {t.doctor?.specialty || "Doctor"}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 flex flex-col">
            <CardHeader>
              <CardTitle>
                {activeThread ? activeThread.doctor?.name : "Messages"}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <div className="flex-1 h-[50vh] overflow-y-auto px-4">
                <div className="space-y-3 pt-3">
                  {loadingMessages && (
                    <p className="text-sm text-gray-500">
                      Loading conversation...
                    </p>
                  )}
                  {messages.map((m, idx) => {
                    const isMe =
                      m.sender?.uid === user?.uid || m.sender === user?.uid;
                    return (
                      <div
                        key={idx}
                        className={`flex ${
                          isMe ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                            isMe ? "bg-indigo-600 text-white" : "bg-gray-100"
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={endRef} />
                </div>
              </div>

              <div className="border-t p-3 flex items-center gap-2">
                <Input
                  placeholder="Type a message"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
                <Input
                  placeholder="Attachment URL (optional)"
                  value={attachmentUrl}
                  onChange={(e) => setAttachmentUrl(e.target.value)}
                />
                <Button
                  onClick={handleSend}
                  disabled={
                    !activeChatId || (!text.trim() && !attachmentUrl.trim())
                  }
                >
                  <Send className="h-4 w-4 mr-1" /> Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
