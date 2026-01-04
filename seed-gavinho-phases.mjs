import mysql from 'mysql2/promise';
import 'dotenv/config';

// Helper function to add days to a date
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Helper function to calculate phase dates based on project progress
function calculatePhaseDates(projectStartDate, projectEndDate, projectProgress) {
  const start = new Date(projectStartDate);
  const end = new Date(projectEndDate);
  const totalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24));
  
  // Phase 1: Projeto Base (30% of timeline)
  const phase1Start = start;
  const phase1End = addDays(start, Math.floor(totalDays * 0.30));
  
  // Phase 2: Licenciamento Arquitetura (35% of timeline)
  const phase2Start = addDays(phase1End, 1);
  const phase2End = addDays(phase2Start, Math.floor(totalDays * 0.35));
  
  // Phase 3: Licenciamento Especialidades (35% of timeline)
  const phase3Start = addDays(phase2End, 1);
  const phase3End = end;
  
  // Determine phase status based on project progress
  let phase1Status, phase2Status, phase3Status;
  
  if (projectProgress >= 100) {
    phase1Status = phase2Status = phase3Status = 'completed';
  } else if (projectProgress >= 70) {
    phase1Status = phase2Status = 'completed';
    phase3Status = 'in_progress';
  } else if (projectProgress >= 35) {
    phase1Status = 'completed';
    phase2Status = 'in_progress';
    phase3Status = 'not_started';
  } else {
    phase1Status = 'in_progress';
    phase2Status = phase3Status = 'not_started';
  }
  
  return {
    phase1: { start: phase1Start, end: phase1End, status: phase1Status },
    phase2: { start: phase2Start, end: phase2End, status: phase2Status },
    phase3: { start: phase3Start, end: phase3End, status: phase3Status }
  };
}

// Phase definitions with milestones
const phaseDefinitions = [
  {
    name: "Projeto Base",
    description: "Desenvolvimento do projeto base com plantas, mapas gerais, especificações, imagens 3D e design de interiores",
    order: 1,
    milestones: [
      { name: "Plantas Existente e Proposta", description: "Levantamento do estado atual e layout geral aprovado", daysOffset: 10 },
      { name: "Mapas Gerais", description: "Tetos refletidos, pontos elétricos, iluminação e revestimentos", daysOffset: 20 },
      { name: "Especificações e Materiais", description: "Definição de materiais e equipamentos", daysOffset: 25 },
      { name: "Imagens 3D e Design", description: "Renderizações finais e projeto de design de interiores", daysOffset: 30 }
    ]
  },
  {
    name: "Licenciamento de Arquitetura",
    description: "Projeto de licenciamento com desenhos gerais (existente e proposta), acessibilidades, pormenores construtivos e peças escritas",
    order: 2,
    milestones: [
      { name: "Desenhos Gerais - Existente", description: "Levantamento topográfico, plantas, cortes e alçados do existente", daysOffset: 15 },
      { name: "Desenhos Gerais - Proposta", description: "Plantas, cortes e alçados da proposta arquitetónica", daysOffset: 30 },
      { name: "Acessibilidades e Pormenores", description: "Projeto de acessibilidades e detalhes construtivos", daysOffset: 45 },
      { name: "Peças Escritas e Compatibilização", description: "Memória descritiva, orçamento preliminar e compatibilização", daysOffset: 60 }
    ]
  },
  {
    name: "Licenciamento de Especialidades",
    description: "Projetos de especialidades: demolição, estrutura, águas, esgotos, gás, eletricidade, ITED, térmico, AVAC, SCIE, acústico e outros",
    order: 3,
    milestones: [
      { name: "Demolição e Resíduos", description: "Projeto de demolição e plano de resíduos sólidos", daysOffset: 10 },
      { name: "Estrutura e Redes", description: "Projeto de estabilidade, águas, esgotos e gás", daysOffset: 25 },
      { name: "Instalações Elétricas e ITED", description: "Projeto de eletricidade, domótica e telecomunicações", daysOffset: 40 },
      { name: "Térmico, AVAC e SCIE", description: "Certificação energética, climatização e segurança contra incêndios", daysOffset: 55 },
      { name: "Acústico e Pré-Compatibilização", description: "Condicionamento acústico e integração final de especialidades", daysOffset: 70 }
    ]
  }
];

async function seedGavinhoPhases() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('🌱 Iniciando seed de fases GAVINHO...\n');

    // Get all GAVINHO projects
    const [projects] = await connection.execute(
      'SELECT id, name, startDate, endDate, progress FROM projects WHERE name LIKE "GA%"'
    );

    if (projects.length === 0) {
      throw new Error('Nenhum projeto GAVINHO encontrado. Execute seed-gavinho-projects.mjs primeiro.');
    }

    console.log(`📊 Encontrados ${projects.length} projetos GAVINHO\n`);

    let totalPhases = 0;
    let totalMilestones = 0;

    for (const project of projects) {
      console.log(`\n🏗️  ${project.name}`);
      
      // Calculate phase dates based on project timeline and progress
      const phaseDates = calculatePhaseDates(
        project.startDate,
        project.endDate,
        project.progress
      );

      // Insert phases
      for (let i = 0; i < phaseDefinitions.length; i++) {
        const phaseDef = phaseDefinitions[i];
        const phaseKey = `phase${i + 1}`;
        const phaseDate = phaseDates[phaseKey];

        const [phaseResult] = await connection.execute(
          `INSERT INTO projectPhases (
            projectId, name, description, startDate, endDate, 
            status, \`order\`, createdAt, updatedAt
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            project.id,
            phaseDef.name,
            phaseDef.description,
            phaseDate.start,
            phaseDate.end,
            phaseDate.status,
            phaseDef.order
          ]
        );

        const phaseId = phaseResult.insertId;
        totalPhases++;

        console.log(`   ✅ Fase ${i + 1}: ${phaseDef.name} (${phaseDate.status})`);

        // Insert milestones for this phase
        for (const milestone of phaseDef.milestones) {
          const milestoneDate = addDays(phaseDate.start, milestone.daysOffset);
          
          // Determine milestone status
          let milestoneStatus;
          if (phaseDate.status === 'completed') {
            milestoneStatus = 'completed';
          } else if (phaseDate.status === 'in_progress') {
          // Check if milestone date has passed
          const today = new Date();
          milestoneStatus = milestoneDate < today ? 'completed' : 'pending';
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
        }
      }
    }

    console.log(`\n\n🎉 Seed concluído com sucesso!`);
    console.log(`   📋 ${totalPhases} fases criadas`);
    console.log(`   🎯 ${totalMilestones} marcos criados`);
    console.log(`   🏗️  ${projects.length} projetos populados\n`);

    console.log('📊 Resumo das Fases:');
    phaseDefinitions.forEach((phase, index) => {
      console.log(`   ${index + 1}. ${phase.name} (${phase.milestones.length} marcos)`);
    });

  } catch (error) {
    console.error('❌ Erro ao criar fases:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

seedGavinhoPhases();
