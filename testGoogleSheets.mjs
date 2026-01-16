import { google } from 'googleapis';

const googleCredentials = {
  "type": "service_account",
  "project_id": "gavinho-mqt",
  "private_key_id": "b1505a9b6d16e15729db411e02de9fe6e2c51705",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCSDvCS2x7TAXa3\nq9oyUo2vIumqKDsogOkYl1X8sTLP20kr2RVgwR2xU5dK5XddYqIjVhrFNNHCMeCH\nAdxSiUZU9Qt0vyiL9Fedgmn3fMva7oGsDQZRaVBRpLesHKNhg3nMn/avYqchI1Ep\nrcvu9vgF6gEMvo0wsiZaZtMI4+QtIFMC9C2pc/4y/kRYm9bPKrBqa+vX5BbuuF/H\nhaYSH6jiUXsISHnrHUiCu1kAkVefobW+7I9Rm+/mfY+IawniLGOLykyEoUxd23pB\nfYWlaGPVd7gVrs2feRgbKYnjGJJEV6O/75WIB69snI9vE4sSTXVS9alh06F73sWx\nLCxakDqJAgMBAAECggEAA+NdLOGjqU0UjJjo8PZA4pDIvOB/i6lb2y1bKwQKFN2y\n7dWEc8wMRu5RXJttcSlZJNzrz0Rj0Zo7joiChZl1K3mO/aOBmDEv3Gfue3nBYQGA\npvR9TrFBo7zBbXXhNQ03kraO7fYPuip7JIOFhmXhbiHft4fCkTFq4zTxyP6tEjTr\n52Xh6yXlFMKl8f6ZMyje2+g+Hy7hnJzCZenAUokSwX5zcxnZ/jlRTG15RiKlrxdV\n2u04Z3SbRsGca2HoUBnzXGyHCeUtgVaXylvTbyXeutSmUBpddQ6J3aCOwMMP6LSn\nxyiAW8MMSDh9CnDkkmvB/FOjVeQMjt3GoUf8FrTXYQKBgQDIsqpuNP9zDAUO7i41\nSAjj4FT7zdttUzRNJzFQaTPcEB9zV83jPrqoVA3a3kUO2GOF6UdcCKVBqZ7Tvvi8\nZpC7Eo4g8YGmLa5axLQNDqEDrrbu8zf9gUKYwE5df0dZftAT6z5vrWqIshFsdFj7\nP06kQfSPSOd6p5KkHRekgQsSYQKBgQC6Tfi9V1Ga4qJPftrZAumF2FcYCScopTze\nDQ66iSZOH2dJCNM0HEf9YQX7W4S2bcR+xufTPRONvMkjM0mEmXLVjvM2Bc2VRkOX\najUwCBs8K+gSVl1FoO/ybU0YWaVuuzY8T2Vf2X2KnePkY2qkwu8z9FFJtYaGn7d8\n28MvNhDpKQKBgFm+EpmPFz7hfA2OEZl/qYIEGNwz08+R6gwp31I+iJL5nqab95OK\nxDpqw3s/8o9N0Ura4i7UKtkuuLekaGMOVd9gz68JbtjZCmLKHFzOUs9ru58joMC5\noQbezuvd8xCgtPiDM3sKh12yijn92KAYUdj/KRU9G0zsS5UY8S59CW9hAoGAYN88\nME+f+hZP6V//sYlnHZZxKulPeD37GUbW2r2HsmV30i0JjPYLpL93WcyrhCQtYPJS\nBq+iZDe+qlP3rUAQyuSqp/N6g1zmtmuePlxotO/rmuVXWGYnffnBdaDfeWVU/SUX\nhDBVq+cPYWkkQYmu0Wf/gIEn8wZHZV/r7LeDMYkCgYBQDjvCycZbmC4vpBB2Q8jI\nIqDTsvcUIdMYfWU1OczmAgPFP36Ttu0t9Dj39eMp3LS2evQY1mV/HM5HX7GrD0hU\n6Rl/6M9aCAZIRceVXkUHPGFh78wp3/ZAIAv+487jJ/4ZyjtwSAFoPP1iKMu8U1xk\nB2b6RHq3rYR5i5K5dG5JSA==\n-----END PRIVATE KEY-----\n",
  "client_email": "gavinho-mqt-service@gavinho-mqt.iam.gserviceaccount.com",
  "client_id": "109041780579243361494",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/gavinho-mqt-service%40gavinho-mqt.iam.gserviceaccount.com",
  "universe_domain": "googleapis.com"
};

async function testGoogleSheetsAPI() {
  try {
    console.log('🔍 Testando Google Sheets API...\n');

    const auth = new google.auth.GoogleAuth({
      credentials: googleCredentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', authClient: auth });

    console.log('✅ Google Sheets API: CONECTADO\n');
    console.log('📊 Credenciais carregadas com sucesso!');
    console.log(`   Project: ${googleCredentials.project_id}`);
    console.log(`   Service Account: ${googleCredentials.client_email}`);
    
    console.log('\n✅ Configuração do Google Sheets API está COMPLETA!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao conectar com Google Sheets API:');
    console.error(error.message);
    process.exit(1);
  }
}

testGoogleSheetsAPI();
