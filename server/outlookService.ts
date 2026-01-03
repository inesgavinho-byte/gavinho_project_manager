import { Client } from "@microsoft/microsoft-graph-client";
import { ConfidentialClientApplication } from "@azure/msal-node";
import "isomorphic-fetch";

interface OutlookConfig {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  redirectUri: string;
}

interface EmailMessage {
  id: string;
  subject: string;
  from: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  toRecipients: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;
  ccRecipients?: Array<{
    emailAddress: {
      name: string;
      address: string;
    };
  }>;
  bodyPreview: string;
  body: {
    contentType: string;
    content: string;
  };
  receivedDateTime: string;
  hasAttachments: boolean;
  attachments?: Array<{
    name: string;
    contentType: string;
    size: number;
  }>;
}

export class OutlookService {
  private config: OutlookConfig;
  private msalClient: ConfidentialClientApplication;

  constructor(config: OutlookConfig) {
    this.config = config;
    this.msalClient = new ConfidentialClientApplication({
      auth: {
        clientId: config.clientId,
        authority: `https://login.microsoftonline.com/${config.tenantId}`,
        clientSecret: config.clientSecret,
      },
    });
  }

  /**
   * Get authorization URL for OAuth flow
   */
  async getAuthUrl(): Promise<string> {
    const authCodeUrlParameters = {
      scopes: ["https://graph.microsoft.com/Mail.Read", "https://graph.microsoft.com/Mail.ReadWrite", "https://graph.microsoft.com/User.Read"],
      redirectUri: this.config.redirectUri,
    };

    return await this.msalClient.getAuthCodeUrl(authCodeUrlParameters);
  }

  /**
   * Exchange authorization code for access token
   */
  async getTokenFromCode(code: string): Promise<string> {
    const tokenRequest = {
      code,
      scopes: ["https://graph.microsoft.com/Mail.Read", "https://graph.microsoft.com/Mail.ReadWrite", "https://graph.microsoft.com/User.Read"],
      redirectUri: this.config.redirectUri,
    };

    const response = await this.msalClient.acquireTokenByCode(tokenRequest);
    return response.accessToken;
  }

  /**
   * Create authenticated Graph client
   */
  private getClient(accessToken: string): Client {
    return Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
  }

  /**
   * Get user's email messages
   */
  async getMessages(accessToken: string, options?: {
    top?: number;
    skip?: number;
    search?: string;
    filter?: string;
  }): Promise<EmailMessage[]> {
    const client = this.getClient(accessToken);
    
    let request = client.api("/me/messages").select([
      "id",
      "subject",
      "from",
      "toRecipients",
      "ccRecipients",
      "bodyPreview",
      "body",
      "receivedDateTime",
      "hasAttachments",
    ]).orderby("receivedDateTime DESC");

    if (options?.top) {
      request = request.top(options.top);
    }
    if (options?.skip) {
      request = request.skip(options.skip);
    }
    if (options?.search) {
      request = request.search(options.search);
    }
    if (options?.filter) {
      request = request.filter(options.filter);
    }

    const response = await request.get();
    return response.value;
  }

  /**
   * Get messages from a specific date range
   */
  async getMessagesByDateRange(
    accessToken: string,
    startDate: Date,
    endDate: Date,
    top: number = 50
  ): Promise<EmailMessage[]> {
    const startISO = startDate.toISOString();
    const endISO = endDate.toISOString();
    
    return this.getMessages(accessToken, {
      top,
      filter: `receivedDateTime ge ${startISO} and receivedDateTime le ${endISO}`,
    });
  }

  /**
   * Search messages by keywords
   */
  async searchMessages(
    accessToken: string,
    keywords: string,
    top: number = 50
  ): Promise<EmailMessage[]> {
    return this.getMessages(accessToken, {
      top,
      search: keywords,
    });
  }

  /**
   * Get message attachments
   */
  async getAttachments(accessToken: string, messageId: string): Promise<any[]> {
    const client = this.getClient(accessToken);
    const response = await client.api(`/me/messages/${messageId}/attachments`).get();
    return response.value;
  }

  /**
   * Get user profile
   */
  async getUserProfile(accessToken: string): Promise<any> {
    const client = this.getClient(accessToken);
    return await client.api("/me").get();
  }

  /**
   * Categorize email based on content using keywords
   */
  categorizeEmail(email: EmailMessage): "order" | "adjudication" | "purchase" | "communication" | "other" {
    const subject = email.subject?.toLowerCase() || "";
    const body = email.bodyPreview?.toLowerCase() || "";
    const content = `${subject} ${body}`;

    // Keywords for each category
    const orderKeywords = ["pedido", "order", "encomenda", "solicitação", "requisição", "po ", "purchase order"];
    const adjudicationKeywords = ["adjudicação", "adjudication", "contrato", "contract", "acordo", "licitação", "proposta aceita"];
    const purchaseKeywords = ["compra", "purchase", "pagamento", "payment", "fatura", "invoice", "nota fiscal", "cotação", "orçamento"];
    const communicationKeywords = ["reunião", "meeting", "atualização", "update", "status", "progresso", "relatório", "report"];

    if (orderKeywords.some(keyword => content.includes(keyword))) {
      return "order";
    }
    if (adjudicationKeywords.some(keyword => content.includes(keyword))) {
      return "adjudication";
    }
    if (purchaseKeywords.some(keyword => content.includes(keyword))) {
      return "purchase";
    }
    if (communicationKeywords.some(keyword => content.includes(keyword))) {
      return "communication";
    }

    return "other";
  }

  /**
   * Extract project references from email content
   */
  extractProjectReferences(email: EmailMessage, projectNames: string[]): number[] {
    const content = `${email.subject} ${email.bodyPreview}`.toLowerCase();
    const matchedProjects: number[] = [];

    projectNames.forEach((name, index) => {
      if (content.includes(name.toLowerCase())) {
        matchedProjects.push(index);
      }
    });

    return matchedProjects;
  }
}

/**
 * Create Outlook service instance
 */
export function createOutlookService(): OutlookService | null {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  const tenantId = process.env.MICROSOFT_TENANT_ID || "common";
  const redirectUri = process.env.MICROSOFT_REDIRECT_URI || "http://localhost:3000/api/outlook/callback";

  if (!clientId || !clientSecret) {
    console.warn("[Outlook] Microsoft credentials not configured");
    return null;
  }

  return new OutlookService({
    clientId,
    clientSecret,
    tenantId,
    redirectUri,
  });
}
