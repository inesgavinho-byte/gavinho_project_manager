import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { Hash, Send, Paperclip, Smile, AtSign, Plus, Search } from "lucide-react";
import { useState } from "react";

export default function ProjectsChat() {
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: projects } = trpc.projects.list.useQuery();

  // Mock channels and messages
  const channels = [
    { id: "general", name: "geral", project: "MYRIAD", unread: 0 },
    { id: "design", name: "design-review", project: "MYRIAD", unread: 3 },
    { id: "technical", name: "questões-técnicas", project: "AS HOUSE", unread: 1 },
  ];

  const messages = selectedChannel ? [
    { id: 1, user: "Sofia Inácio", text: "Bom dia equipa! Já temos feedback do cliente?", time: "09:30", avatar: "SI" },
    { id: 2, user: "Você", text: "Sim, recebi ontem. Vou partilhar o ficheiro.", time: "09:32", isOwn: true },
    { id: 3, user: "Pedro Costa", text: "Excelente! Podemos agendar reunião para discutir?", time: "09:35", avatar: "PC" },
  ] : [];

  const handleSendMessage = () => {
    if (!message.trim()) return;
    // TODO: Implement send message
    setMessage("");
  };

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chat Projetos</h1>
          <p className="text-muted-foreground">
            Colaboração em equipa estilo Microsoft Teams
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
        {/* Channels Sidebar */}
        <Card className="col-span-3 p-0 flex flex-col">
          <div className="p-4 border-b">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button className="w-full" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Canal
            </Button>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2">
              <Tabs defaultValue="channels" className="w-full">
                <TabsList className="w-full grid grid-cols-2">
                  <TabsTrigger value="channels">Canais</TabsTrigger>
                  <TabsTrigger value="direct">Diretas</TabsTrigger>
                </TabsList>

                <TabsContent value="channels" className="mt-2 space-y-1">
                  {channels.map(channel => (
                    <button
                      key={channel.id}
                      onClick={() => setSelectedChannel(channel.id)}
                      className={`w-full p-2 rounded-lg text-left transition-colors flex items-center justify-between ${
                        selectedChannel === channel.id
                          ? 'bg-accent'
                          : 'hover:bg-accent/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Hash className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{channel.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{channel.project}</p>
                        </div>
                      </div>
                      {channel.unread > 0 && (
                        <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <span className="text-xs text-primary-foreground font-medium">
                            {channel.unread}
                          </span>
                        </div>
                      )}
                    </button>
                  ))}
                </TabsContent>

                <TabsContent value="direct" className="mt-2">
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Mensagens diretas em desenvolvimento
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </ScrollArea>
        </Card>

        {/* Chat Area */}
        <Card className="col-span-9 p-0 flex flex-col">
          {selectedChannel ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b">
                <div className="flex items-center gap-2">
                  <Hash className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">
                      {channels.find(c => c.id === selectedChannel)?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {channels.find(c => c.id === selectedChannel)?.project}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map(msg => (
                    <div key={msg.id} className="flex gap-3">
                      {!msg.isOwn && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">{msg.avatar}</AvatarFallback>
                        </Avatar>
                      )}
                      <div className="flex-1">
                        {!msg.isOwn && (
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="font-medium text-sm">{msg.user}</span>
                            <span className="text-xs text-muted-foreground">{msg.time}</span>
                          </div>
                        )}
                        <div className={`rounded-lg p-3 inline-block ${
                          msg.isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}>
                          <p className="text-sm">{msg.text}</p>
                          {msg.isOwn && (
                            <p className="text-xs mt-1 text-primary-foreground/70">{msg.time}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Paperclip className="h-5 w-5" />
                  </Button>
                  <Input
                    placeholder="Escrever mensagem..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button variant="ghost" size="icon">
                    <AtSign className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Smile className="h-5 w-5" />
                  </Button>
                  <Button onClick={handleSendMessage} size="icon">
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Hash className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Selecione um canal</p>
                <p className="text-sm">Escolha um canal para ver as mensagens</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
