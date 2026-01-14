import { useState } from 'react';
import { Calendar, CheckCircle, AlertCircle, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees: string[];
  provider: 'google' | 'outlook' | 'internal';
  synced: boolean;
}

interface CalendarIntegrationProps {
  projectId: number;
}

export function CalendarIntegration({ projectId }: CalendarIntegrationProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: 'Reunião com Cliente - Projeto A',
      startTime: '2025-01-15T10:00:00',
      endTime: '2025-01-15T11:00:00',
      location: 'Sala de Conferências',
      attendees: ['cliente@example.com', 'gerente@gavinho.com'],
      provider: 'internal',
      synced: false,
    },
    {
      id: '2',
      title: 'Follow-up - Email de Acompanhamento',
      startTime: '2025-01-16T14:00:00',
      endTime: '2025-01-16T14:30:00',
      attendees: ['cliente@example.com'],
      provider: 'internal',
      synced: false,
    },
  ]);

  const [syncingId, setSyncingId] = useState<string | null>(null);

  const syncToGoogle = async (eventId: string) => {
    setSyncingId(eventId);
    try {
      // Simular sincronização com Google Calendar
      await new Promise(resolve => setTimeout(resolve, 1000));
      setEvents(events.map(e => 
        e.id === eventId ? { ...e, provider: 'google', synced: true } : e
      ));
    } finally {
      setSyncingId(null);
    }
  };

  const syncToOutlook = async (eventId: string) => {
    setSyncingId(eventId);
    try {
      // Simular sincronização com Outlook Calendar
      await new Promise(resolve => setTimeout(resolve, 1000));
      setEvents(events.map(e => 
        e.id === eventId ? { ...e, provider: 'outlook', synced: true } : e
      ));
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-[#C9A882]" />
          <h2 className="text-2xl font-bold text-[#5F5C59]">Integração com Calendário</h2>
        </div>
        <Button className="bg-[#C9A882] hover:bg-[#B89968] text-white">
          <Plus className="w-4 h-4 mr-2" />
          Novo Evento
        </Button>
      </div>

      <div className="grid gap-4">
        {events.map((event) => (
          <Card key={event.id} className="p-4 border-l-4 border-l-[#C9A882]">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-[#5F5C59]">{event.title}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {new Date(event.startTime).toLocaleDateString('pt-PT')} • {new Date(event.startTime).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              {event.synced && (
                <div className="flex items-center gap-1 text-green-600">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-xs font-medium">Sincronizado</span>
                </div>
              )}
            </div>

            {event.location && (
              <p className="text-sm text-gray-600 mb-2">📍 {event.location}</p>
            )}

            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-1">Participantes:</p>
              <div className="flex flex-wrap gap-2">
                {event.attendees.map((attendee, idx) => (
                  <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                    {attendee}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncToGoogle(event.id)}
                disabled={syncingId === event.id || event.provider === 'google'}
                className="text-xs"
              >
                {syncingId === event.id ? 'Sincronizando...' : 'Google Calendar'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncToOutlook(event.id)}
                disabled={syncingId === event.id || event.provider === 'outlook'}
                className="text-xs"
              >
                {syncingId === event.id ? 'Sincronizando...' : 'Outlook Calendar'}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {events.length === 0 && (
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600">Nenhum evento para sincronizar</p>
        </Card>
      )}
    </div>
  );
}
