import { useState } from 'react';
import { Mail, Send, Eye, MousePointerClick, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  preview: string;
  opens: number;
  clicks: number;
  bounces: number;
  sent: number;
}

interface EmailAutomationProps {
  projectId: number;
}

export function EmailAutomation({ projectId }: EmailAutomationProps) {
  const [templates] = useState<EmailTemplate[]>([
    {
      id: '1',
      name: 'Acompanhamento Inicial',
      subject: 'Seguindo em relação ao nosso projeto...',
      preview: 'Olá, gostaria de acompanhar o progresso do nosso projeto...',
      opens: 45,
      clicks: 12,
      bounces: 2,
      sent: 50,
    },
    {
      id: '2',
      name: 'Proposta de Reunião',
      subject: 'Proposta de Reunião - Projeto em Discussão',
      preview: 'Gostaria de agendar uma reunião para discutir os detalhes...',
      opens: 38,
      clicks: 8,
      bounces: 1,
      sent: 45,
    },
    {
      id: '3',
      name: 'Relatório Mensal',
      subject: 'Seu Relatório Mensal de Progresso',
      preview: 'Segue em anexo o relatório mensal do seu projeto...',
      opens: 52,
      clicks: 15,
      bounces: 0,
      sent: 55,
    },
  ]);

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const handleSendEmail = async (templateId: string) => {
    setSending(true);
    try {
      // Simular envio de email
      await new Promise(resolve => setTimeout(resolve, 1500));
      alert('Email enviado com sucesso!');
    } finally {
      setSending(false);
    }
  };

  const totalStats = {
    sent: templates.reduce((a, b) => a + b.sent, 0),
    opens: templates.reduce((a, b) => a + b.opens, 0),
    clicks: templates.reduce((a, b) => a + b.clicks, 0),
    bounces: templates.reduce((a, b) => a + b.bounces, 0),
  };

  const openRate = Math.round((totalStats.opens / totalStats.sent) * 100);
  const clickRate = Math.round((totalStats.clicks / totalStats.opens) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Mail className="w-6 h-6 text-[#C9A882]" />
        <h2 className="text-2xl font-bold text-[#5F5C59]">Automação de Emails</h2>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-[#C9A882]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">Total Enviados</p>
              <p className="text-2xl font-bold text-[#5F5C59] mt-2">{totalStats.sent}</p>
            </div>
            <Mail className="w-8 h-8 text-[#C9A882] opacity-20" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-blue-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">Taxa de Abertura</p>
              <p className="text-2xl font-bold text-[#5F5C59] mt-2">{openRate}%</p>
            </div>
            <Eye className="w-8 h-8 text-blue-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-green-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">Taxa de Cliques</p>
              <p className="text-2xl font-bold text-[#5F5C59] mt-2">{clickRate}%</p>
            </div>
            <Click className="w-8 h-8 text-green-500 opacity-20" />
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-red-500">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-gray-600 font-medium">Devoluções</p>
              <p className="text-2xl font-bold text-[#5F5C59] mt-2">{totalStats.bounces}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500 opacity-20" />
          </div>
        </Card>
      </div>

      {/* Email Templates */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-[#5F5C59]">Templates de Email</h3>
        {templates.map((template) => (
          <Card 
            key={template.id} 
            className={`p-4 border-l-4 cursor-pointer transition-all ${
              selectedTemplate === template.id 
                ? 'border-l-[#C9A882] bg-[#F2F0E7]' 
                : 'border-l-gray-300 hover:border-l-[#C9A882]'
            }`}
            onClick={() => setSelectedTemplate(selectedTemplate === template.id ? null : template.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h4 className="font-semibold text-[#5F5C59]">{template.name}</h4>
                <p className="text-sm text-gray-600 mt-1">{template.subject}</p>
                <p className="text-xs text-gray-500 mt-2">{template.preview}</p>
              </div>
              <Button
                size="sm"
                className="bg-[#C9A882] hover:bg-[#B89968] text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  handleSendEmail(template.id);
                }}
                disabled={sending}
              >
                <Send className="w-4 h-4 mr-1" />
                {sending ? 'Enviando...' : 'Enviar'}
              </Button>
            </div>

            {selectedTemplate === template.id && (
              <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-600 font-medium">Enviados</p>
                  <p className="text-lg font-bold text-[#5F5C59] mt-1">{template.sent}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Aberturas</p>
                  <p className="text-lg font-bold text-blue-600 mt-1">
                    {template.opens} ({Math.round((template.opens / template.sent) * 100)}%)
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Cliques</p>
                  <p className="text-lg font-bold text-green-600 mt-1">
                    {template.clicks} ({Math.round((template.clicks / template.opens) * 100)}%)
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 font-medium">Devoluções</p>
                  <p className="text-lg font-bold text-red-600 mt-1">{template.bounces}</p>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Performance Insights */}
      <Card className="p-6 bg-blue-50 border-l-4 border-l-blue-500">
        <h3 className="text-lg font-semibold text-[#5F5C59] mb-3">Insights de Performance</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• O template "Relatório Mensal" tem a maior taxa de abertura ({Math.round((52 / 55) * 100)}%)</li>
          <li>• Emails com assuntos mais curtos tendem a ter melhor taxa de cliques</li>
          <li>• Melhor horário para envio: Terça a Quinta, 10h-14h</li>
          <li>• Considere A/B testing para melhorar as taxas de conversão</li>
        </ul>
      </Card>
    </div>
  );
}
