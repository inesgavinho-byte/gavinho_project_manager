import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { trpc } from "@/lib/trpc";
import { Paperclip, Send, Search, Phone, Video, MoreVertical, HardHat } from "lucide-react";
import { useState } from "react";

export default function WorksChat() {
  const [selectedWork, setSelectedWork] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: constructions } = trpc.constructions.list.useQuery();
  
  // Mock messages - will be replaced with real data
  const messages = selectedWork ? [
    { id: 1, sender: "João Silva", text: "Bom dia! O material chegou?", time: "09:30", isOwn: false },
    { id: 2, sender: "Você", text: "Sim, chegou tudo. Vamos começar a aplicação hoje.", time: "09:32", isOwn: true },
    { id: 3, sender: "Maria Santos", text: "Atenção: previsão de chuva para amanhã", time: "10:15", isOwn: false },
  ] : [];

  const filteredWorks = constructions?.filter(work =>
    work.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    work.code?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (!message.trim()) return;
    // TODO: Implement send message
    setMessage("");
  };

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Chat Obras</h1>
          <p className="text-muted-foreground">
            Comunicação rápida com as equipas de obra
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <Card className="col-span-4 p-0 flex flex-col">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar obras..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {filteredWorks?.map(work => (
                <button
                  key={work.id}
                  onClick={() => setSelectedWork(work.id)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    selectedWork === work.id
                      ? 'bg-accent'
                      : 'hover:bg-accent/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
                      <HardHat className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium truncate">{work.code}</p>
                        <span className="text-xs text-muted-foreground">10:30</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {work.name}
                      </p>
                    </div>
                    {work.unreadMessages && (
                      <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs text-white font-medium">
                          {work.unreadMessages}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              ))}

              {(!filteredWorks || filteredWorks.length === 0) && (
                <div className="text-center py-12 text-muted-foreground">
                  <HardHat className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma obra encontrada</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat Area */}
        <Card className="col-span-8 p-0 flex flex-col">
          {selectedWork ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                    <HardHat className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {constructions?.find(w => w.id === selectedWork)?.code}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {constructions?.find(w => w.id === selectedWork)?.totalWorkers || 0} participantes
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon">
                    <Phone className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Video className="h-5 w-5" />
                  </Button>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-2 max-w-[70%] ${msg.isOwn ? 'flex-row-reverse' : ''}`}>
                        {!msg.isOwn && (
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {msg.sender.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          {!msg.isOwn && (
                            <p className="text-xs text-muted-foreground mb-1">{msg.sender}</p>
                          )}
                          <div className={`rounded-lg p-3 ${
                            msg.isOwn
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}>
                            <p className="text-sm">{msg.text}</p>
                            <p className={`text-xs mt-1 ${
                              msg.isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
                            }`}>
                              {msg.time}
                            </p>
                          </div>
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
                  <Button onClick={handleSendMessage} size="icon">
                    <Send className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <HardHat className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">Selecione uma obra</p>
                <p className="text-sm">Escolha uma obra para ver as mensagens</p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
