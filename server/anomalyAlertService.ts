import { initDb } from './db';
import { notifyOwner } from './_core/notification';
import { invokeLLM } from './_core/llm';

export interface AnomalyAlert {
  id: string;
  actionType: string;
  severity: 'high' | 'medium' | 'low';
  anomalyType: string;
  expectedValue: number;
  actualValue: number;
  deviation: number;
  description: string;
  suggestedAction: string;
  createdAt: Date;
  resolvedAt?: Date;
  notifiedUsers: string[];
}

/**
 * Detecta anomalias críticas e cria alertas
 */
export async function detectAndCreateAnomalyAlerts(
  anomalies: any[]
): Promise<AnomalyAlert[]> {
  const alerts: AnomalyAlert[] = [];
  const criticalAnomalies = anomalies.filter((a) => a.severity === 'high');

  for (const anomaly of criticalAnomalies) {
    const alert: AnomalyAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      actionType: anomaly.actionType,
      severity: anomaly.severity,
      anomalyType: anomaly.type || 'performance_degradation',
      expectedValue: anomaly.expectedDuration,
      actualValue: anomaly.actualDuration,
      deviation: anomaly.deviation,
      description: generateAnomalyDescription(anomaly),
      suggestedAction: generateSuggestedAction(anomaly),
      createdAt: new Date(),
      notifiedUsers: [],
    };

    alerts.push(alert);
  }

  return alerts;
}

/**
 * Gera descrição da anomalia
 */
function generateAnomalyDescription(anomaly: any): string {
  const percentageIncrease = ((anomaly.deviation / anomaly.expectedDuration) * 100).toFixed(1);
  return `A ação "${anomaly.actionType}" está demorando ${percentageIncrease}% mais do que o esperado. Esperado: ${anomaly.expectedDuration}ms, Real: ${anomaly.actualDuration}ms.`;
}

/**
 * Gera ação sugerida baseada no tipo de anomalia
 */
function generateSuggestedAction(anomaly: any): string {
  const actionType = anomaly.actionType.toLowerCase();

  if (actionType.includes('email')) {
    return 'Verificar fila de envio de emails, limpar logs antigos e reiniciar serviço de email.';
  } else if (actionType.includes('notification')) {
    return 'Verificar sistema de notificações, validar conexões WebSocket e limpar cache.';
  } else if (actionType.includes('database')) {
    return 'Executar análise de índices do banco de dados, limpar tabelas temporárias e otimizar queries.';
  } else if (actionType.includes('api')) {
    return 'Verificar latência de APIs externas, aumentar timeouts e implementar retry logic.';
  } else if (actionType.includes('file')) {
    return 'Verificar espaço em disco, limpar arquivos temporários e otimizar processamento de arquivos.';
  }

  return 'Investigar logs de erro, verificar recursos do servidor e considerar escalonamento.';
}

/**
 * Notifica gestores sobre anomalias críticas
 */
export async function notifyManagersAboutAnomalies(alerts: AnomalyAlert[]): Promise<void> {
  if (alerts.length === 0) return;

  const criticalCount = alerts.filter((a) => a.severity === 'high').length;
  const mediumCount = alerts.filter((a) => a.severity === 'medium').length;

  const title = `⚠️ Anomalias Críticas Detectadas - ${criticalCount} Críticas, ${mediumCount} Médias`;

  const alertDetails = alerts
    .slice(0, 5)
    .map(
      (a) =>
        `• **${a.actionType}** (${a.severity.toUpperCase()}): ${a.description}\n  Ação: ${a.suggestedAction}`
    )
    .join('\n\n');

  const content = `
## Resumo de Anomalias

Foram detectadas **${alerts.length}** anomalias no sistema:
- **${criticalCount}** Críticas (requerem ação imediata)
- **${mediumCount}** Médias (monitorar)

### Anomalias Principais:

${alertDetails}

${alerts.length > 5 ? `\n**+ ${alerts.length - 5} outras anomalias** - Verifique o dashboard para detalhes completos.` : ''}

### Recomendações:
1. Verifique o Dashboard de Análise de Tendências para detalhes completos
2. Execute as ações sugeridas para cada anomalia
3. Monitore as métricas nos próximos 30 minutos
4. Escale para o time de DevOps se o problema persistir
  `;

  try {
    await notifyOwner({ title, content });
  } catch (error) {
    console.error('Erro ao notificar gestores sobre anomalias:', error);
  }
}

/**
 * Gera recomendações de ação usando LLM
 */
export async function generateAIRecommendations(alerts: AnomalyAlert[]): Promise<string[]> {
  if (alerts.length === 0) return [];

  const alertSummary = alerts
    .map((a) => `${a.actionType}: ${a.description}`)
    .join('\n');

  try {
    const response = await invokeLLM({
      messages: [
        {
          role: 'system',
          content:
            'Você é um especialista em otimização de sistemas. Analise as anomalias e forneça recomendações práticas e acionáveis.',
        },
        {
          role: 'user',
          content: `Analise estas anomalias de sistema e forneça 3-5 recomendações de ação prioritárias:\n\n${alertSummary}`,
        },
      ],
    });

    const content =
      typeof response.choices[0].message.content === 'string'
        ? response.choices[0].message.content
        : '';

    return content
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .slice(0, 5);
  } catch (error) {
    console.error('Erro ao gerar recomendações com IA:', error);
    return [];
  }
}

/**
 * Implementa escalonamento de alertas
 */
export async function escalateAlert(
  alert: AnomalyAlert,
  escalationLevel: 'manager' | 'director' | 'admin'
): Promise<void> {
  const escalationMessages = {
    manager: `Gestor: Anomalia crítica detectada em ${alert.actionType}. Ação sugerida: ${alert.suggestedAction}`,
    director: `Diretor: Anomalia crítica persistente em ${alert.actionType}. Requer revisão de recursos e possível escalonamento.`,
    admin: `Admin: Anomalia crítica de sistema. Ação imediata necessária para ${alert.actionType}.`,
  };

  try {
    await notifyOwner({
      title: `[ESCALAÇÃO ${escalationLevel.toUpperCase()}] ${alert.actionType}`,
      content: escalationMessages[escalationLevel],
    });

    alert.notifiedUsers.push(escalationLevel);
  } catch (error) {
    console.error(`Erro ao escalar alerta para ${escalationLevel}:`, error);
  }
}

/**
 * Monitora anomalias e cria alertas periodicamente
 */
export async function startAnomalyMonitoring(): Promise<void> {
  // Executar verificação a cada 5 minutos
  setInterval(async () => {
    try {
      // Aqui seria integrado com o serviço de análise de tendências
      // para detectar novas anomalias e criar alertas
      console.log('[AnomalyAlert] Verificação de anomalias executada');
    } catch (error) {
      console.error('[AnomalyAlert] Erro durante verificação:', error);
    }
  }, 5 * 60 * 1000);
}
