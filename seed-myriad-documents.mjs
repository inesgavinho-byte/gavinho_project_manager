import mysql from 'mysql2/promise';
import 'dotenv/config';

// Realistic MYRIAD project documents organized by phase
const myriadDocuments = [
  // FASE 1 - ESTUDO PRÉVIO
  {
    phaseName: "Estudo Prévio",
    documents: [
      {
        name: "GA00469_EP_Moodboard_Lobby_v01.pdf",
        description: "Moodboard conceitual para área de lobby e receção com referências de materiais e paleta de cores",
        category: "plan",
        fileUrl: "https://storage.gavinho.example/myriad/fase1/moodboard_lobby_v01.pdf",
        fileSize: 2456789
      },
      {
        name: "GA00469_EP_Layout_Quartos_Tipo1-4_v01.pdf",
        description: "Layouts preliminares dos 4 tipos de quartos com implantação de mobiliário",
        category: "plan",
        fileUrl: "https://storage.gavinho.example/myriad/fase1/layout_quartos_v01.pdf",
        fileSize: 3892456
      },
      {
        name: "GA00469_EP_Render3D_Lobby_v01.jpg",
        description: "Perspetiva 3D do lobby principal - vista geral da receção",
        category: "plan",
        fileUrl: "https://storage.gavinho.example/myriad/fase1/render_lobby_v01.jpg",
        fileSize: 4567890
      },
      {
        name: "GA00469_EP_Render3D_Bar_v01.jpg",
        description: "Perspetiva 3D do bar - vista do balcão e zona de estar",
        category: "plan",
        fileUrl: "https://storage.gavinho.example/myriad/fase1/render_bar_v01.jpg",
        fileSize: 5123456
      },
      {
        name: "GA00469_EP_Render3D_Restaurante_v01.jpg",
        description: "Perspetiva 3D do restaurante - vista geral da sala",
        category: "plan",
        fileUrl: "https://storage.gavinho.example/myriad/fase1/render_restaurante_v01.jpg",
        fileSize: 4890123
      },
      {
        name: "GA00469_EP_Render3D_SPA_v01.jpg",
        description: "Perspetiva 3D do SPA (Piso 22) - zona de piscina e relaxamento",
        category: "plan",
        fileUrl: "https://storage.gavinho.example/myriad/fase1/render_spa_v01.jpg",
        fileSize: 5678901
      },
      {
        name: "GA00469_EP_Listagem_Equipamentos_v01.xlsx",
        description: "Listagem preliminar de equipamentos e artigos de decoração com estimativa orçamental",
        category: "contract",
        fileUrl: "https://storage.gavinho.example/myriad/fase1/listagem_equipamentos_v01.xlsx",
        fileSize: 1234567
      }
    ]
  },
  
  // FASE 2 - PROJETO BASE
  {
    phaseName: "Projeto Base",
    documents: [
      {
        name: "GA00469_PB_Plantas_Piso0_v02.pdf",
        description: "Plantas do Piso 0 (Lobby, Receção, Bar, Restaurante) com implantação de mobiliário",
        category: "plan",
        fileUrl: "https://storage.gavinho.example/myriad/fase2/plantas_piso0_v02.pdf",
        fileSize: 6789012
      },
      {
        name: "GA00469_PB_Plantas_Piso1_v02.pdf",
        description: "Plantas do Piso 1 (Salas de Reuniões) com layout detalhado",
        category: "plan",
        fileUrl: "https://storage.gavinho.example/myriad/fase2/plantas_piso1_v02.pdf",
        fileSize: 4567890
      },
      {
        name: "GA00469_PB_Plantas_Piso22_SPA_v02.pdf",
        description: "Plantas do Piso 22 (SPA, Ginásio, Piscina) com zonas técnicas",
        category: "plan",
        fileUrl: "https://storage.gavinho.example/myriad/fase2/plantas_piso22_spa_v02.pdf",
        fileSize: 5890123
      },
      {
        name: "GA00469_PB_Desenhos_Tecnicos_Mobiliario_v02.pdf",
        description: "Desenhos técnicos base das peças decorativas com definição de materialidade e acabamentos",
        category: "plan",
        fileUrl: "https://storage.gavinho.example/myriad/fase2/desenhos_tecnicos_mobiliario_v02.pdf",
        fileSize: 7890123
      },
      {
        name: "GA00469_PB_Selecao_Tecidos_v02.pdf",
        description: "Seleção de tecidos para estofo e cortinas com amostras físicas",
        category: "contract",
        fileUrl: "https://storage.gavinho.example/myriad/fase2/selecao_tecidos_v02.pdf",
        fileSize: 3456789
      },
      {
        name: "GA00469_PB_Render3D_Lobby_Final_v02.jpg",
        description: "Render 3D final do lobby com materiais e iluminação definitivos",
        category: "plan",
        fileUrl: "https://storage.gavinho.example/myriad/fase2/render_lobby_final_v02.jpg",
        fileSize: 6123456
      },
      {
        name: "GA00469_PB_Render3D_Quarto_Tipo1_v02.jpg",
        description: "Render 3D do Quarto Tipo 1 com decoração completa",
        category: "plan",
        fileUrl: "https://storage.gavinho.example/myriad/fase2/render_quarto_tipo1_v02.jpg",
        fileSize: 5234567
      },
      {
        name: "GA00469_PB_Render3D_Quarto_Tipo2_v02.jpg",
        description: "Render 3D do Quarto Tipo 2 com decoração completa",
        category: "plan",
        fileUrl: "https://storage.gavinho.example/myriad/fase2/render_quarto_tipo2_v02.jpg",
        fileSize: 5345678
      },
      {
        name: "GA00469_PB_Render3D_Bar_Final_v02.jpg",
        description: "Render 3D final do bar com iluminação decorativa",
        category: "plan",
        fileUrl: "https://storage.gavinho.example/myriad/fase2/render_bar_final_v02.jpg",
        fileSize: 5890123
      },
      {
        name: "GA00469_PB_Render3D_Restaurante_Final_v02.jpg",
        description: "Render 3D final do restaurante com mobiliário e decoração",
        category: "plan",
        fileUrl: "https://storage.gavinho.example/myriad/fase2/render_restaurante_final_v02.jpg",
        fileSize: 6234567
      }
    ]
  },
  
  // FASE 3.1 - PROJETO DE EXECUÇÃO - OBRA ACABAMENTOS
  {
    phaseName: "Projeto de Execução - Obra Acabamentos",
    documents: [
      {
        name: "GA00469_PE_Mapas_Acabamentos_Piso0_v03.pdf",
        description: "Mapas de acabamentos do Piso 0 - pavimentos, paredes, tetos",
        category: "plan",
        fileUrl: "https://storage.gavinho.example/myriad/fase3.1/mapas_acabamentos_piso0_v03.pdf",
        fileSize: 8901234
      },
      {
        name: "GA00469_PE_Mapas_Vaos_Portas_v03.pdf",
        description: "Mapas de vãos e portas decorativas com especificações técnicas",
        category: "plan",
        fileUrl: "https://storage.gavinho.example/myriad/fase3.1/mapas_vaos_portas_v03.pdf",
        fileSize: 5678901
      },
      {
        name: "GA00469_PE_Plantas_Tetos_Coordenadas_v03.pdf",
        description: "Plantas de tetos coordenadas com instalações elétricas e AVAC",
        category: "plan",
        fileUrl: "https://storage.gavinho.example/myriad/fase3.1/plantas_tetos_coordenadas_v03.pdf",
        fileSize: 7890123
      },
      {
        name: "GA00469_PE_Programa_Implantacao_FFE_v03.pdf",
        description: "Programa de implantação de mobiliário e equipamentos soltos (FF&E)",
        category: "plan",
        fileUrl: "https://storage.gavinho.example/myriad/fase3.1/programa_implantacao_ffe_v03.pdf",
        fileSize: 6789012
      },
      {
        name: "GA00469_PE_Medicoes_Quantidades_v03.xlsx",
        description: "Medições e mapas de quantidades de trabalho/mapas recapitulativos",
        category: "contract",
        fileUrl: "https://storage.gavinho.example/myriad/fase3.1/medicoes_quantidades_v03.xlsx",
        fileSize: 2345678
      },
      {
        name: "GA00469_PE_Caderno_Encargos_Acabamentos_v03.pdf",
        description: "Caderno de encargos - condições técnicas de execução de acabamentos",
        category: "contract",
        fileUrl: "https://storage.gavinho.example/myriad/fase3.1/caderno_encargos_acabamentos_v03.pdf",
        fileSize: 9012345
      },
      {
        name: "GA00469_PE_Pormenorizacao_Bar_v03.pdf",
        description: "Desenhos de pormenorização da zona de bar e cafetaria",
        category: "plan",
        fileUrl: "https://storage.gavinho.example/myriad/fase3.1/pormenorizacao_bar_v03.pdf",
        fileSize: 6123456
      },
      {
        name: "GA00469_PE_Pormenorizacao_Recepcao_v03.pdf",
        description: "Desenhos de pormenorização da receção e lobby",
        category: "plan",
        fileUrl: "https://storage.gavinho.example/myriad/fase3.1/pormenorizacao_recepcao_v03.pdf",
        fileSize: 5890123
      },
      {
        name: "GA00469_PE_Pormenorizacao_SPA_v03.pdf",
        description: "Desenhos de pormenorização do SPA, ginásio e piscina",
        category: "plan",
        fileUrl: "https://storage.gavinho.example/myriad/fase3.1/pormenorizacao_spa_v03.pdf",
        fileSize: 7234567
      }
    ]
  },
  
  // FASE 3.2 - PROJETO DE EXECUÇÃO - DECORAÇÃO E MOBILIÁRIO SOLTO
  {
    phaseName: "Projeto de Execução - Decoração e Mobiliário Solto",
    documents: [
      {
        name: "GA00469_PE_Definicao_Mobiliario_Solto_v03.pdf",
        description: "Definição completa de mobiliário e equipamentos soltos incluídos no FF&E",
        category: "contract",
        fileUrl: "https://storage.gavinho.example/myriad/fase3.2/definicao_mobiliario_solto_v03.pdf",
        fileSize: 8901234
      },
      {
        name: "GA00469_PE_Mapas_Quantidades_FFE_v03.xlsx",
        description: "Mapas recapitulativos de mobiliário, alcatifas, cortinados, iluminação decorativa",
        category: "contract",
        fileUrl: "https://storage.gavinho.example/myriad/fase3.2/mapas_quantidades_ffe_v03.xlsx",
        fileSize: 3456789
      },
      {
        name: "GA00469_PE_Separacao_Processos_v03.pdf",
        description: "Separação de elementos para empreitada geral vs fornecimentos diretos do Dono de Obra",
        category: "contract",
        fileUrl: "https://storage.gavinho.example/myriad/fase3.2/separacao_processos_v03.pdf",
        fileSize: 4567890
      },
      {
        name: "GA00469_PE_Render3D_Lobby_Promocional_v03.jpg",
        description: "Render 3D final do lobby para promoção turística do empreendimento",
        category: "plan",
        fileUrl: "https://storage.gavinho.example/myriad/fase3.2/render_lobby_promocional_v03.jpg",
        fileSize: 7890123
      },
      {
        name: "GA00469_PE_Render3D_Quarto_Suite_Promocional_v03.jpg",
        description: "Render 3D da suite premium para material promocional",
        category: "plan",
        fileUrl: "https://storage.gavinho.example/myriad/fase3.2/render_suite_promocional_v03.jpg",
        fileSize: 6789012
      },
      {
        name: "GA00469_PE_Render3D_SPA_Promocional_v03.jpg",
        description: "Render 3D do SPA para promoção turística",
        category: "plan",
        fileUrl: "https://storage.gavinho.example/myriad/fase3.2/render_spa_promocional_v03.jpg",
        fileSize: 7123456
      },
      {
        name: "GA00469_PE_Render3D_Restaurante_Promocional_v03.jpg",
        description: "Render 3D do restaurante para material de marketing",
        category: "plan",
        fileUrl: "https://storage.gavinho.example/myriad/fase3.2/render_restaurante_promocional_v03.jpg",
        fileSize: 6890123
      }
    ]
  },
  
  // FASE 3.3 - PROJETO DE EXECUÇÃO - BOM PARA CONSTRUÇÃO
  {
    phaseName: "Projeto de Execução - Bom Para Construção",
    documents: [
      {
        name: "GA00469_BPC_Compatibilizacao_Especialidades_v04.pdf",
        description: "Coordenação e compatibilização com estruturas, instalações técnicas e equipamentos hoteleiros",
        category: "plan",
        fileUrl: "https://storage.gavinho.example/myriad/fase3.3/compatibilizacao_especialidades_v04.pdf",
        fileSize: 9012345
      },
      {
        name: "GA00469_BPC_Condicoes_Tecnicas_Execucao_v04.pdf",
        description: "Condições técnicas de execução completas - BOM PARA CONSTRUÇÃO",
        category: "contract",
        fileUrl: "https://storage.gavinho.example/myriad/fase3.3/condicoes_tecnicas_execucao_v04.pdf",
        fileSize: 10123456
      },
      {
        name: "GA00469_BPC_Mapas_Resumo_Medicoes_v04.xlsx",
        description: "Mapas resumo de medições e estimativas orçamentais finais",
        category: "contract",
        fileUrl: "https://storage.gavinho.example/myriad/fase3.3/mapas_resumo_medicoes_v04.xlsx",
        fileSize: 4567890
      },
      {
        name: "GA00469_BPC_Ajustes_Quartos_Modelo_v04.pdf",
        description: "Integração de ajustes dos quartos modelo e comentários da fiscalização",
        category: "plan",
        fileUrl: "https://storage.gavinho.example/myriad/fase3.3/ajustes_quartos_modelo_v04.pdf",
        fileSize: 5678901
      },
      {
        name: "GA00469_BPC_Desenhos_Pormenorizacao_Final_v04.pdf",
        description: "Desenhos gerais e de pormenorização final para entendimento total das soluções",
        category: "plan",
        fileUrl: "https://storage.gavinho.example/myriad/fase3.3/desenhos_pormenorizacao_final_v04.pdf",
        fileSize: 11234567
      },
      {
        name: "GA00469_BPC_Modelo_BIM_LOD300.rvt",
        description: "Modelo BIM (LOD300) completo do projeto para coordenação",
        category: "plan",
        fileUrl: "https://storage.gavinho.example/myriad/fase3.3/modelo_bim_lod300.rvt",
        fileSize: 45678901
      }
    ]
  }
];

async function seedMyriadDocuments() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('🔄 Populando documentos do projeto GA00469_MYRIAD...\n');

    // Find MYRIAD project
    const [projects] = await connection.execute(
      'SELECT id, name FROM projects WHERE name LIKE "%MYRIAD%"'
    );

    if (projects.length === 0) {
      throw new Error('Projeto MYRIAD não encontrado.');
    }

    const project = projects[0];
    console.log(`📊 Projeto encontrado: ${project.name} (ID: ${project.id})\n`);

    // Get all phases for MYRIAD project
    const [phases] = await connection.execute(
      'SELECT id, name FROM projectPhases WHERE projectId = ? ORDER BY `order`',
      [project.id]
    );

    console.log(`📋 ${phases.length} fases encontradas\n`);

    let totalDocuments = 0;

    for (const phaseData of myriadDocuments) {
      // Find matching phase
      const phase = phases.find(p => p.name === phaseData.phaseName);
      
      if (!phase) {
        console.log(`⚠️  Fase "${phaseData.phaseName}" não encontrada, pulando...`);
        continue;
      }

      console.log(`📁 Fase: ${phaseData.phaseName} (ID: ${phase.id})`);
      console.log(`   Adicionando ${phaseData.documents.length} documentos...\n`);

      for (const doc of phaseData.documents) {
        // Extract file extension and type
        const fileExtension = doc.name.split('.').pop().toLowerCase();
        let fileType = 'application/octet-stream';
        if (fileExtension === 'pdf') fileType = 'application/pdf';
        else if (['jpg', 'jpeg'].includes(fileExtension)) fileType = 'image/jpeg';
        else if (fileExtension === 'png') fileType = 'image/png';
        else if (fileExtension === 'xlsx') fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        else if (fileExtension === 'rvt') fileType = 'application/octet-stream';

        await connection.execute(
          `INSERT INTO projectDocuments (
            projectId, name, description, category, fileUrl, fileKey, fileType, fileSize, uploadedById, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            project.id,
            doc.name,
            doc.description,
            doc.category,
            doc.fileUrl,
            `myriad/documents/${doc.name}`, // fileKey
            fileType,
            doc.fileSize,
            1 // uploadedById (assuming owner user ID is 1)
          ]
        );

        totalDocuments++;
        console.log(`   ✅ ${doc.name} (${(doc.fileSize / 1024 / 1024).toFixed(2)} MB)`);
      }
      
      console.log('');
    }

    console.log(`\n🎉 Seed concluído com sucesso!`);
    console.log(`   📄 ${totalDocuments} documentos adicionados ao projeto MYRIAD`);
    console.log(`   📊 Distribuídos em ${myriadDocuments.length} fases\n`);

    console.log('📊 Resumo por Fase:');
    myriadDocuments.forEach((phaseData) => {
      console.log(`   ${phaseData.phaseName}: ${phaseData.documents.length} documentos`);
    });

  } catch (error) {
    console.error('❌ Erro ao popular documentos:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

seedMyriadDocuments();
