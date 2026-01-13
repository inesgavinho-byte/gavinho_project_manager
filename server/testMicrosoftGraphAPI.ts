import axios from 'axios';

async function testMicrosoftGraphAPI() {
  try {
    console.log('🔍 Testando Microsoft Graph API...\n');

    const clientId = '4f40b8f6-d458-45e7-b5bc-10bc014f6232';
    const clientSecret = 'bZo8Q~finWHsSEH2u1b29qhCOzboeGPD3zNSwc_7';
    const tenantId = '647a8de4-0246-4f2d-9c7b-212315c8acd8';

    console.log('📝 Obtendo access token...\n');

    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      {
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }
    );

    const accessToken = tokenResponse.data.access_token;

    console.log('✅ Access token obtido com sucesso\n');
    console.log('📧 Testando acesso aos emails...\n');

    const mailResponse = await axios.get(
      'https://graph.microsoft.com/v1.0/me/messages?$top=5',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    console.log('✅ Microsoft Graph API: CONECTADO\n');
    console.log('📊 Emails encontrados:', mailResponse.data.value.length);
    
    if (mailResponse.data.value.length > 0) {
      console.log('\n📋 Últimos emails:');
      mailResponse.data.value.forEach((email: any, index: number) => {
        console.log(`${index + 1}. ${email.subject} (${email.from.emailAddress.address})`);
      });
    }

    process.exit(0);
  } catch (error: any) {
    console.error('❌ Erro ao conectar com Microsoft Graph API:');
    console.error(error.response?.data || error.message);
    process.exit(1);
  }
}

testMicrosoftGraphAPI();
