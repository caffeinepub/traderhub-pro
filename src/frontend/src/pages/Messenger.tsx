import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { MessageSquare, Paperclip, Send, UserPlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface Friend {
  id: string;
  name: string;
}
interface Message {
  id: string;
  senderId: string;
  text: string;
  fileUrl?: string;
  fileName?: string;
  isImage?: boolean;
  ts: number;
}
interface Conversation {
  friendId: string;
  messages: Message[];
}

const STORAGE_KEY_FRIENDS = "th_friends";
const STORAGE_KEY_CONVOS = "th_convos";
const ME = "me";

const DEMO_FRIENDS: Friend[] = [
  { id: "alex-trader-001", name: "Alex Trader" },
  { id: "sarah-fx-002", name: "Sarah FX" },
  { id: "mike-scalper-003", name: "Mike Scalper" },
];

const now = Date.now();
const DEMO_CONVOS: Record<string, Conversation> = {
  "alex-trader-001": {
    friendId: "alex-trader-001",
    messages: [
      {
        id: "d1",
        senderId: "alex-trader-001",
        text: "Hey! Did you catch the EUR/USD move this morning? 📈",
        ts: now - 3600000 * 3,
      },
      {
        id: "d2",
        senderId: ME,
        text: "Yeah, caught 45 pips on the breakout! Was waiting for that level all week",
        ts: now - 3600000 * 3 + 60000,
      },
      {
        id: "d3",
        senderId: "alex-trader-001",
        text: "Nice trade! I entered a bit late, only got 28 pips but still a good day",
        ts: now - 3600000 * 2,
      },
      {
        id: "d4",
        senderId: ME,
        text: "Better late than never 😄 What are you watching for the NY session?",
        ts: now - 3600000 * 2 + 120000,
      },
      {
        id: "d5",
        senderId: "alex-trader-001",
        text: "GBP/JPY looks interesting. Big resistance at 187.50, if it breaks could go 200 pips",
        ts: now - 1800000,
      },
    ],
  },
  "sarah-fx-002": {
    friendId: "sarah-fx-002",
    messages: [
      {
        id: "e1",
        senderId: "sarah-fx-002",
        text: "Good morning! Markets looking volatile today 👀",
        ts: now - 7200000,
      },
      {
        id: "e2",
        senderId: ME,
        text: "Morning Sarah! Yeah NFP data dropping soon, being careful",
        ts: now - 7200000 + 90000,
      },
      {
        id: "e3",
        senderId: "sarah-fx-002",
        text: "Smart move. I'm staying flat until the dust settles. Last NFP wrecked me lol",
        ts: now - 5400000,
      },
      {
        id: "e4",
        senderId: ME,
        text: "Same 😅 Risk management first. How's your week going overall?",
        ts: now - 3600000,
      },
      {
        id: "e5",
        senderId: "sarah-fx-002",
        text: "Up 2.3% so far, happy with that. Sticking to the plan!",
        ts: now - 1200000,
      },
    ],
  },
  "mike-scalper-003": {
    friendId: "mike-scalper-003",
    messages: [
      {
        id: "f1",
        senderId: "mike-scalper-003",
        text: "Bro, XAU/USD is printing 🔥 just took 3 scalp trades in 10 mins",
        ts: now - 5400000,
      },
      {
        id: "f2",
        senderId: ME,
        text: "Gold has been insane! What time frame you scalping on?",
        ts: now - 5400000 + 30000,
      },
      {
        id: "f3",
        senderId: "mike-scalper-003",
        text: "1-min chart, 5-pip targets. Quick in quick out 💨",
        ts: now - 5400000 + 90000,
      },
      {
        id: "f4",
        senderId: ME,
        text: "Respect the discipline. I prefer 15-min myself, less stress",
        ts: now - 3000000,
      },
      {
        id: "f5",
        senderId: "mike-scalper-003",
        text: "Different styles, same goal haha! Keep grinding 💪",
        ts: now - 2400000,
      },
    ],
  },
};

function initializeData(): {
  friends: Friend[];
  convos: Record<string, Conversation>;
} {
  let friends: Friend[];
  let convos: Record<string, Conversation>;
  try {
    friends = JSON.parse(localStorage.getItem(STORAGE_KEY_FRIENDS) || "[]");
  } catch {
    friends = [];
  }
  try {
    convos = JSON.parse(localStorage.getItem(STORAGE_KEY_CONVOS) || "{}");
  } catch {
    convos = {};
  }

  // Seed demo data on first visit
  if (friends.length === 0) {
    friends = DEMO_FRIENDS;
    convos = DEMO_CONVOS;
    localStorage.setItem(STORAGE_KEY_FRIENDS, JSON.stringify(friends));
    localStorage.setItem(STORAGE_KEY_CONVOS, JSON.stringify(convos));
  }

  return { friends, convos };
}

function saveFriends(f: Friend[]) {
  localStorage.setItem(STORAGE_KEY_FRIENDS, JSON.stringify(f));
}
function saveConvos(c: Record<string, Conversation>) {
  localStorage.setItem(STORAGE_KEY_CONVOS, JSON.stringify(c));
}

export default function Messenger() {
  const [{ friends, convos }, setData] = useState(() => initializeData());
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(() => {
    const { friends: f } = initializeData();
    return f[0] ?? null;
  });
  const [text, setText] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newId, setNewId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = selectedFriend
    ? convos[selectedFriend.id]?.messages || []
    : [];

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional scroll trigger
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, selectedFriend?.id]);

  const sendMessage = (content: {
    text?: string;
    fileUrl?: string;
    fileName?: string;
    isImage?: boolean;
  }) => {
    if (!selectedFriend) return;
    const msg: Message = {
      id: Date.now().toString(),
      senderId: ME,
      text: content.text || "",
      fileUrl: content.fileUrl,
      fileName: content.fileName,
      isImage: content.isImage,
      ts: Date.now(),
    };
    const updatedConvos = {
      ...convos,
      [selectedFriend.id]: {
        friendId: selectedFriend.id,
        messages: [...(convos[selectedFriend.id]?.messages || []), msg],
      },
    };
    setData((prev) => ({ ...prev, convos: updatedConvos }));
    saveConvos(updatedConvos);
    setText("");
  };

  const handleSend = () => {
    if (text.trim()) sendMessage({ text: text.trim() });
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const isImage = file.type.startsWith("image/");
    sendMessage({ fileUrl: url, fileName: file.name, isImage });
    e.target.value = "";
  };

  const addFriend = () => {
    if (!newName.trim() || !newId.trim()) return;
    const f: Friend = { id: newId.trim(), name: newName.trim() };
    const updatedFriends = [...friends, f];
    setData((prev) => ({ ...prev, friends: updatedFriends }));
    saveFriends(updatedFriends);
    setAddOpen(false);
    setNewName("");
    setNewId("");
    setSelectedFriend(f);
  };

  return (
    <div className="h-[calc(100vh-0px)] flex flex-col p-6 animate-slide-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">Messenger</h1>
          <p className="text-sm text-muted-foreground">
            Connect with your trading community
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button
              data-ocid="messenger.add_friend.button"
              size="sm"
              variant="outline"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Friend
            </Button>
          </DialogTrigger>
          <DialogContent data-ocid="messenger.add_friend.dialog">
            <DialogHeader>
              <DialogTitle>Add a Friend</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input
                  data-ocid="messenger.friend_name.input"
                  placeholder="Trader name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Principal ID</Label>
                <Input
                  data-ocid="messenger.friend_id.input"
                  placeholder="xxxxx-xxxxx-..."
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                />
              </div>
              <Button
                data-ocid="messenger.add_friend.confirm_button"
                className="w-full"
                onClick={addFriend}
                disabled={!newName || !newId}
              >
                Add Friend
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Friends List */}
        <Card className="w-64 flex-shrink-0 border border-border flex flex-col">
          <div className="p-3 border-b border-border">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Conversations
            </p>
          </div>
          <ScrollArea className="flex-1">
            {friends.length === 0 ? (
              <div
                data-ocid="messenger.friends.empty_state"
                className="p-4 text-center"
              >
                <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs text-muted-foreground">No contacts yet</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {friends.map((f, i) => {
                  const lastMsg = convos[f.id]?.messages.slice(-1)[0];
                  return (
                    <button
                      type="button"
                      data-ocid={`messenger.friend.item.${i + 1}`}
                      key={f.id}
                      onClick={() => setSelectedFriend(f)}
                      className={cn(
                        "w-full flex items-center gap-3 p-2 rounded-lg text-left transition-colors",
                        selectedFriend?.id === f.id
                          ? "bg-accent"
                          : "hover:bg-accent/50",
                      )}
                    >
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="text-xs bg-primary/20 text-primary">
                          {f.name[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{f.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {lastMsg?.text ||
                            lastMsg?.fileName ||
                            "No messages yet"}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </Card>

        {/* Chat Window */}
        <Card className="flex-1 border border-border flex flex-col min-h-0">
          {!selectedFriend ? (
            <div
              data-ocid="messenger.chat.empty_state"
              className="flex-1 flex flex-col items-center justify-center text-center p-8"
            >
              <MessageSquare className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Select a conversation</p>
              <p className="text-xs text-muted-foreground mt-1">
                Or add a friend to start chatting
              </p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs bg-primary/20 text-primary">
                    {selectedFriend.name[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{selectedFriend.name}</p>
                  <p className="text-xs text-green-500 font-medium">● Online</p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-xs text-muted-foreground">
                      No messages yet. Say hi!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg, i) => {
                      const isMe = msg.senderId === ME;
                      return (
                        <div
                          data-ocid={`messenger.message.item.${i + 1}`}
                          key={msg.id}
                          className={cn(
                            "flex",
                            isMe ? "justify-end" : "justify-start",
                          )}
                        >
                          {!isMe && (
                            <Avatar className="h-6 w-6 mr-2 flex-shrink-0 self-end">
                              <AvatarFallback className="text-xs bg-primary/20 text-primary">
                                {selectedFriend.name[0].toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={cn(
                              "max-w-[70%] rounded-2xl px-4 py-2 text-sm",
                              isMe
                                ? "bg-primary text-primary-foreground rounded-br-sm"
                                : "bg-accent text-foreground rounded-bl-sm",
                            )}
                          >
                            {msg.isImage && msg.fileUrl ? (
                              <img
                                src={msg.fileUrl}
                                alt={msg.fileName}
                                className="rounded-lg max-w-full max-h-48 object-cover"
                              />
                            ) : msg.fileUrl ? (
                              <a
                                href={msg.fileUrl}
                                download={msg.fileName}
                                className="flex items-center gap-2 underline"
                              >
                                <Paperclip className="h-3 w-3" />
                                {msg.fileName}
                              </a>
                            ) : (
                              <p>{msg.text}</p>
                            )}
                            <p
                              className={cn(
                                "text-xs mt-1",
                                isMe
                                  ? "text-primary-foreground/60"
                                  : "text-muted-foreground",
                              )}
                            >
                              {new Date(msg.ts).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={bottomRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="flex items-center gap-2 p-3 border-t border-border">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
                  className="hidden"
                  onChange={handleFile}
                />
                <Button
                  data-ocid="messenger.attach.upload_button"
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 flex-shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  data-ocid="messenger.message.input"
                  placeholder="Type a message..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  data-ocid="messenger.send.button"
                  size="icon"
                  className="h-9 w-9 flex-shrink-0"
                  onClick={handleSend}
                  disabled={!text.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
