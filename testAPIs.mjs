import axios from 'axios';

async function testMicrosoftGraphAPI() {
  try {
    console.log('🔍 Testando Microsoft Graph API...\n');

    const clientId = '4f40b8f6-d458-45e7-b5bc-10bc014f6232';
    const clientSecret = 'bZo8Q~finWHsSEH2u1b29qhCOzboeGPD3zNSwc_7';
    const tenantId = '647a8de4-0246-4f2d-9c7b-212315c8acd8';

    console.log('📝 Obtendo access token...\n');

    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('client_secret', clientSecret);
    params.append('scope', 'https://graph.microsoft.com/.default');
    params.append('grant_type', 'client_credentials');

    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      params,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
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
      mailResponse.data.value.forEach((email, index) => {
        console.log(`${index + 1}. ${email.subject} (${email.from.emailAddress.address})`);
      });
    }

    console.log('\n✅ Configuração do Microsoft Graph API está COMPLETA!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao conectar com Microsoft Graph API:');
    if (error.response?.data) {
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(error.message);
    }
    process.exit(1);
  }
}

testMicrosoftGraphAPI();
