import mysql from 'mysql2/promise';
import 'dotenv/config';

// Helper function to add days to a date (working days)
function addWorkingDays(date, days) {
  const result = new Date(date);
  let addedDays = 0;
  
  while (addedDays < days) {
    result.setDate(result.getDate() + 1);
    // Skip weekends (Saturday = 6, Sunday = 0)
    if (result.getDay() !== 0 && result.getDay() !== 6) {
      addedDays++;
    }
  }
  
  return result;
}

// Real phases from MYRIAD project scope document
const myriadPhases = [
  {
    name: "Estudo Prévio",
    description: "Apresentação de propostas da arquitetura de interior e design de interiores para todos os espaços públicos e de clientes, áreas técnicas e de serviço",
    workingDays: 90,
    milestones: [
      { name: "Estudo Prévio de Arquitetura de Interior", description: "Propostas de arquitetura de interior para espaços públicos e clientes", daysOffset: 30 },
      { name: "Estudo Prévio de Design e Decoração", description: "Moodboards, layouts, perspetivas 3D (10 imagens), materiais", daysOffset: 60 },
      { name: "Listagem de Equipamentos", description: "Equipamentos e artigos de decoração com estimativa orçamental", daysOffset: 75 },
      { name: "Aprovação pelo Dono de Obra", description: "Avaliação de custos e aprovação para sequência ao projeto", daysOffset: 90 }
    ]
  },
  {
    name: "Projeto Base",
    description: "Desenvolvimento e apresentação de propostas das peças decorativas e de mobiliário para todos os espaços públicos e de clientes",
    workingDays: 60, // Estimado (não especificado no PDF)
    milestones: [
      { name: "Layouts e Plantas", description: "Layouts com implantação de mobiliário, elementos decoração e iluminação", daysOffset: 20 },
      { name: "Desenhos Técnicos Base", description: "Desenhos técnicos das peças decorativas com definição de materialidade", daysOffset: 35 },
      { name: "Seleção de Materiais", description: "Seleção de tecidos, peças autorais, iluminação decorativa", daysOffset: 50 },
      { name: "Imagens 3D de Decoração", description: "Máximo 35 imagens 3D com qualidade final", daysOffset: 60 }
    ]
  },
  {
    name: "Projeto de Execução - Obra Acabamentos",
    description: "Define todos os acabamentos das zonas públicas e de clientes, incluindo portas decorativas, iluminação e equipamentos fixos",
    workingDays: 100,
    milestones: [
      { name: "Mapas de Acabamentos", description: "Mapas de acabamentos, vãos, paredes, tetos coordenados com engenharia", daysOffset: 30 },
      { name: "Programa de Implantação FF&E", description: "Implantação de mobiliário e equipamentos soltos", daysOffset: 50 },
      { name: "Medições e Cadernos de Encargos", description: "Medições, mapas de quantidades e condições técnicas de execução", daysOffset: 75 },
      { name: "Desenhos Gerais e Pormenorização", description: "Desenhos gerais e de pormenorização completos", daysOffset: 100 }
    ]
  },
  {
    name: "Projeto de Execução - Decoração e Mobiliário Solto",
    description: "Mobiliário e equipamento solto sem interferência nas empreitadas de construção (FF&E)",
    workingDays: 100,
    milestones: [
      { name: "Definição de Mobiliário Solto", description: "Define todo o mobiliário e equipamentos soltos incluídos no FF&E", daysOffset: 30 },
      { name: "Medições e Mapas de Quantidades", description: "Mapas recapitulativos de mobiliário, alcatifas, cortinados, iluminação", daysOffset: 60 },
      { name: "Separação de Processos", description: "Elementos para empreitada geral vs fornecimentos diretos", daysOffset: 80 },
      { name: "Renders/3D Finais", description: "Renders 3D das soluções finais para promoção turística", daysOffset: 100 }
    ]
  },
  {
    name: "Projeto de Execução - Bom Para Construção",
    description: "BOM PARA CONSTRUÇÃO articulados, coordenados e compatibilizados com todos os restantes projetos",
    workingDays: 60,
    milestones: [
      { name: "Compatibilização com Especialidades", description: "Coordenação com estruturas, instalações técnicas, equipamentos hoteleiros", daysOffset: 20 },
      { name: "Condições Técnicas de Execução", description: "Mapas resumo de medições, estimativas orçamentais", daysOffset: 40 },
      { name: "Ajustes Quartos Modelo", description: "Integração de ajustes dos quartos modelo e comentários da fiscalização", daysOffset: 50 },
      { name: "Desenhos de Pormenorização Final", description: "Desenhos gerais e pormenorização para entendimento total", daysOffset: 60 }
    ]
  },
  {
    name: "Apoio à Fase de Consultas",
    description: "Apoio à fase de consultas a empreiteiros e fornecedores",
    workingDays: 30, // Estimado
    milestones: [
      { name: "Preparação de Dossiers de Consulta", description: "Quadros e fichas técnicas com especificações", daysOffset: 10 },
      { name: "Listagens de Fornecedores", description: "Listagens de fornecedores e fabricantes", daysOffset: 20 },
      { name: "Apoio a Consultas ao Mercado", description: "Suporte durante consultas a empreiteiros", daysOffset: 30 }
    ]
  },
  {
    name: "Apoio à Contratação",
    description: "Apoio à contratação das empreitadas e fornecimentos, incluindo eventuais ajustes nos projetos",
    workingDays: 30, // Estimado
    milestones: [
      { name: "Análise de Propostas", description: "Assessoria na análise e comparação de propostas técnicas/comerciais", daysOffset: 15 },
      { name: "Ajustes nos Projetos", description: "Eventuais ajustes necessários para contratação", daysOffset: 30 }
    ]
  },
  {
    name: "Assistência Técnica à Obra",
    description: "Acompanhamento técnico durante a execução da obra com visitas quinzenais",
    workingDays: 180, // Estimado (6 meses)
    milestones: [
      { name: "Início de Acompanhamento", description: "Visitas à obra 2x por mês para acompanhamento", daysOffset: 30 },
      { name: "Aprovação de Materiais", description: "Avaliação e aprovação de materiais e desenhos de preparação", daysOffset: 90 },
      { name: "Verificação de Qualidade", description: "Assessoria na verificação da qualidade dos materiais e execução", daysOffset: 150 },
      { name: "Acompanhamento Final", description: "Acompanhamento de acabamentos finais", daysOffset: 180 }
    ]
  }
];

async function updateMyriadProject() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('🔄 Atualizando projeto GA00469_MYRIAD com dados reais...\n');

    // Find MYRIAD project
    const [projects] = await connection.execute(
      'SELECT id, name, startDate, endDate FROM projects WHERE name LIKE "%MYRIAD%"'
    );

    if (projects.length === 0) {
      throw new Error('Projeto MYRIAD não encontrado.');
    }

    const project = projects[0];
    console.log(`📊 Projeto encontrado: ${project.name} (ID: ${project.id})\n`);

    // Delete existing phases and milestones for this project
    console.log('🗑️  Removendo fases e marcos antigos...');
    await connection.execute('DELETE FROM projectMilestones WHERE projectId = ?', [project.id]);
    await connection.execute('DELETE FROM projectPhases WHERE projectId = ?', [project.id]);
    console.log('   ✅ Fases antigas removidas\n');

    // Calculate phase dates based on project start date
    let currentDate = new Date(project.startDate);
    let totalPhases = 0;
    let totalMilestones = 0;

    for (let i = 0; i < myriadPhases.length; i++) {
      const phaseDef = myriadPhases[i];
      
      // Calculate phase start and end dates
      const phaseStartDate = new Date(currentDate);
      const phaseEndDate = addWorkingDays(phaseStartDate, phaseDef.workingDays);
      
      // Determine phase status based on current date
      const today = new Date();
      let phaseStatus;
      if (today > phaseEndDate) {
        phaseStatus = 'completed';
      } else if (today >= phaseStartDate) {
        phaseStatus = 'in_progress';
      } else {
        phaseStatus = 'not_started';
      }

      // Calculate progress percentage
      let phaseProgress = 0;
      if (phaseStatus === 'completed') {
        phaseProgress = 100;
      } else if (phaseStatus === 'in_progress') {
        const totalDays = (phaseEndDate - phaseStartDate) / (1000 * 60 * 60 * 24);
        const elapsedDays = (today - phaseStartDate) / (1000 * 60 * 60 * 24);
        phaseProgress = Math.min(Math.round((elapsedDays / totalDays) * 100), 99);
      }

      // Insert phase
      const [phaseResult] = await connection.execute(
        `INSERT INTO projectPhases (
          projectId, name, description, startDate, endDate, 
          status, \`order\`, progress, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          project.id,
          phaseDef.name,
          phaseDef.description,
          phaseStartDate,
          phaseEndDate,
          phaseStatus,
          i + 1,
          phaseProgress
        ]
      );

      const phaseId = phaseResult.insertId;
      totalPhases++;

      console.log(`   ✅ Fase ${i + 1}: ${phaseDef.name}`);
      console.log(`      📅 ${phaseStartDate.toLocaleDateString('pt-PT')} → ${phaseEndDate.toLocaleDateString('pt-PT')} (${phaseDef.workingDays} dias úteis)`);
      console.log(`      📊 Status: ${phaseStatus} | Progresso: ${phaseProgress}%\n`);

      // Insert milestones for this phase
      for (const milestone of phaseDef.milestones) {
        const milestoneDate = addWorkingDays(phaseStartDate, milestone.daysOffset);
        
        // Determine milestone status
        let milestoneStatus;
        if (phaseStatus === 'completed') {
          milestoneStatus = 'completed';
        } else if (phaseStatus === 'in_progress') {
          milestoneStatus = today > milestoneDate ? 'completed' : 'pending';
        } else {
          milestoneStatus = 'pending';
        }

        await connection.execute(
          `INSERT INTO projectMilestones (
            projectId, phaseId, name, description, dueDate, status, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            project.id,
            phaseId,
            milestone.name,
            milestone.description,
            milestoneDate,
            milestoneStatus
          ]
        );

        totalMilestones++;
        console.log(`      🎯 ${milestone.name} (${milestoneDate.toLocaleDateString('pt-PT')}) - ${milestoneStatus}`);
      }
      
      console.log('');

      // Move to next phase start date (next working day after current phase ends)
      currentDate = addWorkingDays(phaseEndDate, 1);
    }

    console.log(`\n🎉 Atualização concluída com sucesso!`);
    console.log(`   📋 ${totalPhases} fases criadas`);
    console.log(`   🎯 ${totalMilestones} marcos criados`);
    console.log(`   🏗️  Projeto GA00469_MYRIAD atualizado com dados reais\n`);

    console.log('📊 Resumo das Fases:');
    myriadPhases.forEach((phase, index) => {
      console.log(`   ${index + 1}. ${phase.name} (${phase.workingDays} dias úteis, ${phase.milestones.length} marcos)`);
    });

  } catch (error) {
    console.error('❌ Erro ao atualizar projeto MYRIAD:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

updateMyriadProject();
