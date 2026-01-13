import { db } from '../db';
import { emailTracking, emailClassificationFeedback, emailMLModel } from '../../drizzle/schema';
import { eq, and, gte, lte } from 'drizzle-orm';
import { invokeLLM } from '../_core/llm';

interface EmailFeatures {
  subject: string;
  sender: string;
  body: string;
  keywords: string[];
  hasAttachment: boolean;
  urgencyScore: number;
  lengthScore: number;
}

interface ClassificationResult {
  category: string;
  confidence: number;
  reasoning: string;
}

interface ModelMetrics {
  accuracy: number;
  precision: Record<string, number>;
  recall: Record<string, number>;
  f1Score: Record<string, number>;
  totalSamples: number;
  trainingDate: Date;
}

export class EmailMLService {
  private readonly CATEGORIES = ['order', 'adjudication', 'purchase', 'delivery', 'invoice', 'communication', 'other'];
  private readonly MIN_TRAINING_SAMPLES = 50;
  private readonly RETRAINING_THRESHOLD = 0.85; // Se acurácia < 85%, retraining

  /**
   * Classifica um email usando o modelo treinado
   */
  async classifyEmail(email: {
    subject: string;
    from: string;
    body: string;
    bodyPreview: string;
  }): Promise<ClassificationResult> {
    try {
      // Extrair features do email
      const features = this.extractFeatures(email);

      // Buscar modelo treinado mais recente
      const model = await this.getLatestModel();

      if (!model || !model.modelWeights) {
        // Se não houver modelo, usar classificação com LLM
        return await this.classifyWithLLM(email);
      }

      // Usar modelo treinado para predição
      const prediction = this.predictWithModel(features, model.modelWeights);

      return {
        category: prediction.category,
        confidence: prediction.confidence,
        reasoning: `Classificado com modelo treinado (${(prediction.confidence * 100).toFixed(0)}% confiança)`,
      };
    } catch (error) {
      console.error('Error classifying email with ML:', error);
      // Fallback para LLM
      return await this.classifyWithLLM(email);
    }
  }

  /**
   * Registra feedback do usuário para treinamento
   */
  async recordFeedback(emailId: number, correctCategory: string, userConfidence: number = 1.0) {
    try {
      // Buscar email original
      const email = await db.select().from(emailTracking).where(eq(emailTracking.id, emailId)).limit(1);

      if (!email[0]) {
        throw new Error('Email não encontrado');
      }

      // Registrar feedback
      await db.insert(emailClassificationFeedback).values({
        emailId,
        originalCategory: email[0].category,
        correctCategory,
        userConfidence,
        feedbackDate: new Date(),
        isCorrect: email[0].category === correctCategory ? 1 : 0,
      });

      // Verificar se deve fazer retraining
      await this.checkAndRetrain();

      return { success: true, message: 'Feedback registrado com sucesso' };
    } catch (error) {
      console.error('Error recording feedback:', error);
      throw error;
    }
  }

  /**
   * Treina o modelo com base no histórico de correções
   */
  async trainModel(): Promise<ModelMetrics> {
    try {
      console.log('[EmailMLService] Iniciando treinamento do modelo...');

      // Buscar todos os feedbacks
      const feedbacks = await db.select().from(emailClassificationFeedback);

      if (feedbacks.length < this.MIN_TRAINING_SAMPLES) {
        throw new Error(
          `Mínimo de ${this.MIN_TRAINING_SAMPLES} amostras necessário. Atual: ${feedbacks.length}`
        );
      }

      // Preparar dados de treinamento
      const trainingData = await this.prepareTrainingData(feedbacks);

      // Treinar modelo (simulado com pesos)
      const modelWeights = this.trainNaiveBayesModel(trainingData);

      // Calcular métricas
      const metrics = this.calculateMetrics(trainingData, modelWeights);

      // Salvar modelo
      await db.insert(emailMLModel).values({
        modelName: `email-classifier-v${Date.now()}`,
        modelType: 'naive-bayes',
        modelWeights: JSON.stringify(modelWeights),
        accuracy: metrics.accuracy,
        precision: JSON.stringify(metrics.precision),
        recall: JSON.stringify(metrics.recall),
        f1Score: JSON.stringify(metrics.f1Score),
        totalSamples: trainingData.length,
        trainingDate: new Date(),
        isActive: 1,
      });

      console.log(`[EmailMLService] Modelo treinado com sucesso. Acurácia: ${(metrics.accuracy * 100).toFixed(2)}%`);

      return metrics;
    } catch (error) {
      console.error('Error training model:', error);
      throw error;
    }
  }

  /**
   * Extrai features de um email
   */
  private extractFeatures(email: { subject: string; from: string; body: string; bodyPreview: string }): EmailFeatures {
    const fullText = `${email.subject} ${email.from} ${email.body || email.bodyPreview}`.toLowerCase();

    // Palavras-chave por categoria
    const categoryKeywords = {
      order: ['pedido', 'encomenda', 'order', 'purchase order', 'po', 'qty', 'quantidade', 'unidades'],
      adjudication: ['adjudicação', 'adjudication', 'licitação', 'tender', 'bid', 'proposta', 'proposal'],
      purchase: ['compra', 'purchase', 'invoice', 'fatura', 'payment', 'pagamento', 'preço', 'price'],
      delivery: ['entrega', 'delivery', 'shipped', 'enviado', 'tracking', 'rastreamento', 'chegada', 'arrival'],
      invoice: ['fatura', 'invoice', 'nota fiscal', 'recibo', 'receipt', 'total', 'amount'],
      communication: ['reunião', 'meeting', 'discussão', 'discussion', 'alinhamento', 'alignment'],
    };

    // Calcular scores para cada categoria
    const categoryScores: Record<string, number> = {};
    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      const matches = keywords.filter((kw) => fullText.includes(kw.toLowerCase())).length;
      categoryScores[category] = matches / keywords.length;
    }

    // Extrair features
    const urgencyKeywords = ['urgente', 'urgent', 'asap', 'imediato', 'critical', 'crítico'];
    const urgencyScore = urgencyKeywords.filter((kw) => fullText.includes(kw.toLowerCase())).length > 0 ? 1 : 0;

    const lengthScore = Math.min(fullText.length / 1000, 1); // Normalizar para 0-1

    return {
      subject: email.subject,
      sender: email.from,
      body: email.body || email.bodyPreview,
      keywords: Object.entries(categoryScores)
        .filter(([_, score]) => score > 0)
        .map(([category]) => category),
      hasAttachment: false, // Seria preenchido se tivéssemos info de anexo
      urgencyScore,
      lengthScore,
    };
  }

  /**
   * Classifica email usando LLM (fallback)
   */
  private async classifyWithLLM(email: { subject: string; from: string; body: string; bodyPreview: string }) {
    try {
      const response = await invokeLLM({
        messages: [
          {
            role: 'system',
            content: `Você é um classificador de emails especializado em gestão de projetos de construção.
Classifique o email em uma das seguintes categorias:
- order: Pedidos de materiais ou serviços
- adjudication: Adjudicações e licitações
- purchase: Compras e faturas
- delivery: Entregas e rastreamento
- invoice: Faturas e pagamentos
- communication: Comunicações gerais
- other: Outros

Responda em JSON com: {"category": "...", "confidence": 0.0-1.0, "reasoning": "..."}`,
            type: 'text' as const,
          },
          {
            role: 'user',
            content: `Classifique este email:\n\nAssunto: ${email.subject}\nDe: ${email.from}\n\n${email.body || email.bodyPreview}`,
            type: 'text' as const,
          },
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'email_classification',
            strict: true,
            schema: {
              type: 'object',
              properties: {
                category: {
                  type: 'string',
                  enum: ['order', 'adjudication', 'purchase', 'delivery', 'invoice', 'communication', 'other'],
                },
                confidence: { type: 'number', minimum: 0, maximum: 1 },
                reasoning: { type: 'string' },
              },
              required: ['category', 'confidence', 'reasoning'],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0].message.content;
      if (typeof content === 'string') {
        const result = JSON.parse(content);
        return result;
      }

      throw new Error('Resposta inválida do LLM');
    } catch (error) {
      console.error('Error classifying with LLM:', error);
      return {
        category: 'other',
        confidence: 0.5,
        reasoning: 'Classificação padrão (erro no processamento)',
      };
    }
  }

  /**
   * Prediz categoria usando modelo treinado
   */
  private predictWithModel(features: EmailFeatures, weights: Record<string, any>) {
    const scores: Record<string, number> = {};

    for (const category of this.CATEGORIES) {
      let score = weights[category]?.prior || 0.1;

      // Multiplicar por probabilidades de features
      for (const keyword of features.keywords) {
        score *= weights[category]?.features?.[keyword] || 0.5;
      }

      score *= 1 + features.urgencyScore * 0.2; // Boost para urgência
      score *= 1 + features.lengthScore * 0.1; // Boost para emails mais longos

      scores[category] = score;
    }

    // Normalizar scores
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    const normalizedScores = Object.entries(scores).map(([cat, score]) => ({
      category: cat,
      confidence: score / total,
    }));

    // Retornar categoria com maior score
    const best = normalizedScores.reduce((prev, current) =>
      current.confidence > prev.confidence ? current : prev
    );

    return best;
  }

  /**
   * Treina modelo Naive Bayes
   */
  private trainNaiveBayesModel(trainingData: any[]): Record<string, any> {
    const weights: Record<string, any> = {};

    for (const category of this.CATEGORIES) {
      const categoryEmails = trainingData.filter((d) => d.category === category);
      const prior = categoryEmails.length / trainingData.length;

      weights[category] = {
        prior,
        features: {},
      };

      // Contar ocorrências de features
      const featureCounts: Record<string, number> = {};
      for (const email of categoryEmails) {
        for (const keyword of email.keywords) {
          featureCounts[keyword] = (featureCounts[keyword] || 0) + 1;
        }
      }

      // Calcular probabilidades
      for (const [keyword, count] of Object.entries(featureCounts)) {
        weights[category].features[keyword] = (count + 1) / (categoryEmails.length + 2); // Laplace smoothing
      }
    }

    return weights;
  }

  /**
   * Prepara dados de treinamento
   */
  private async prepareTrainingData(feedbacks: any[]) {
    const trainingData = [];

    for (const feedback of feedbacks) {
      const email = await db.select().from(emailTracking).where(eq(emailTracking.id, feedback.emailId)).limit(1);

      if (email[0]) {
        const features = this.extractFeatures({
          subject: email[0].subject || '',
          from: email[0].from || '',
          body: email[0].body || '',
          bodyPreview: email[0].bodyPreview || '',
        });

        trainingData.push({
          category: feedback.correctCategory,
          keywords: features.keywords,
          urgencyScore: features.urgencyScore,
          lengthScore: features.lengthScore,
        });
      }
    }

    return trainingData;
  }

  /**
   * Calcula métricas do modelo
   */
  private calculateMetrics(trainingData: any[], weights: Record<string, any>): ModelMetrics {
    const predictions: Record<string, { correct: number; total: number }> = {};

    for (const category of this.CATEGORIES) {
      predictions[category] = { correct: 0, total: 0 };
    }

    let totalCorrect = 0;

    for (const sample of trainingData) {
      const prediction = this.predictWithModel(
        {
          subject: '',
          sender: '',
          body: '',
          keywords: sample.keywords,
          hasAttachment: false,
          urgencyScore: sample.urgencyScore,
          lengthScore: sample.lengthScore,
        },
        weights
      );

      predictions[sample.category].total++;

      if (prediction.category === sample.category) {
        predictions[sample.category].correct++;
        totalCorrect++;
      }
    }

    // Calcular métricas por categoria
    const precision: Record<string, number> = {};
    const recall: Record<string, number> = {};
    const f1Score: Record<string, number> = {};

    for (const category of this.CATEGORIES) {
      const p = predictions[category].correct / Math.max(predictions[category].total, 1);
      const r = predictions[category].correct / Math.max(predictions[category].total, 1);
      const f1 = (2 * p * r) / (p + r || 1);

      precision[category] = p;
      recall[category] = r;
      f1Score[category] = f1;
    }

    return {
      accuracy: totalCorrect / trainingData.length,
      precision,
      recall,
      f1Score,
      totalSamples: trainingData.length,
      trainingDate: new Date(),
    };
  }

  /**
   * Verifica se deve fazer retraining
   */
  private async checkAndRetrain() {
    try {
      const latestModel = await this.getLatestModel();

      if (!latestModel) {
        // Se não houver modelo, treinar um novo
        await this.trainModel();
        return;
      }

      // Se acurácia < threshold, retraining
      if (latestModel.accuracy < this.RETRAINING_THRESHOLD) {
        console.log('[EmailMLService] Acurácia abaixo do threshold. Iniciando retraining...');
        await this.trainModel();
      }
    } catch (error) {
      console.error('Error checking and retraining:', error);
    }
  }

  /**
   * Busca modelo treinado mais recente
   */
  private async getLatestModel() {
    try {
      const models = await db
        .select()
        .from(emailMLModel)
        .where(eq(emailMLModel.isActive, 1))
        .orderBy((t) => t.trainingDate)
        .limit(1);

      return models[0] || null;
    } catch (error) {
      console.error('Error getting latest model:', error);
      return null;
    }
  }

  /**
   * Retorna métricas do modelo
   */
  async getModelMetrics() {
    try {
      const model = await this.getLatestModel();

      if (!model) {
        return null;
      }

      return {
        modelName: model.modelName,
        accuracy: model.accuracy,
        precision: JSON.parse(model.precision || '{}'),
        recall: JSON.parse(model.recall || '{}'),
        f1Score: JSON.parse(model.f1Score || '{}'),
        totalSamples: model.totalSamples,
        trainingDate: model.trainingDate,
      };
    } catch (error) {
      console.error('Error getting model metrics:', error);
      throw error;
    }
  }

  /**
   * Retorna histórico de correções
   */
  async getCorrectionHistory(projectId?: number) {
    try {
      let query = db.select().from(emailClassificationFeedback);

      if (projectId) {
        // Filtrar por projeto se necessário
        query = query.where(
          eq(
            emailClassificationFeedback.emailId,
            db
              .select({ id: emailTracking.id })
              .from(emailTracking)
              .where(eq(emailTracking.projectId, projectId))
          )
        );
      }

      return await query;
    } catch (error) {
      console.error('Error getting correction history:', error);
      throw error;
    }
  }
}

export const emailMLService = new EmailMLService();
