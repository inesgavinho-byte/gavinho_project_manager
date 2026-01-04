import mysql from 'mysql2/promise';
import 'dotenv/config';

const gavinhoProjects = [
  {
    code: "GA00402",
    name: "MARIA RESIDENCES",
    clientName: "Maria Silva",
    location: "Lisboa, Portugal",
    startDate: new Date("2024-01-15"),
    endDate: new Date("2024-12-20"),
    budget: "450000",
    priority: "high",
    status: "in_progress",
    description: "Projeto residencial de luxo com 4 unidades habitacionais em Lisboa. Inclui design contemporâneo, acabamentos premium e espaços exteriores paisagísticos.",
    progress: 65
  },
  {
    code: "GA00413",
    name: "OEIRAS HOUSE S+K",
    clientName: "Santos & Klein Lda",
    location: "Oeiras, Portugal",
    startDate: new Date("2024-02-01"),
    endDate: new Date("2025-01-30"),
    budget: "380000",
    priority: "medium",
    status: "in_progress",
    description: "Moradia unifamiliar em Oeiras com design moderno. Projeto inclui remodelação completa, ampliação e criação de jardim com piscina.",
    progress: 45
  },
  {
    code: "GA00414",
    name: "OEIRAS HOUSE S",
    clientName: "João Santos",
    location: "Oeiras, Portugal",
    startDate: new Date("2024-03-10"),
    endDate: new Date("2024-11-15"),
    budget: "320000",
    priority: "medium",
    status: "in_progress",
    description: "Remodelação de moradia existente em Oeiras. Foco em eficiência energética, sustentabilidade e integração com o exterior.",
    progress: 55
  },
  {
    code: "GA00425",
    name: "EDITION 01",
    clientName: "Edition Group",
    location: "Porto, Portugal",
    startDate: new Date("2023-09-01"),
    endDate: new Date("2024-06-30"),
    budget: "850000",
    priority: "urgent",
    status: "in_progress",
    description: "Primeiro projeto da série Edition - desenvolvimento imobiliário de alto padrão no Porto. Inclui 8 apartamentos de luxo com acabamentos exclusivos.",
    progress: 85
  },
  {
    code: "GA00433",
    name: "OURIQUE",
    clientName: "Câmara Municipal de Ourique",
    location: "Ourique, Portugal",
    startDate: new Date("2024-01-20"),
    endDate: new Date("2024-10-30"),
    budget: "280000",
    priority: "medium",
    status: "in_progress",
    description: "Projeto de requalificação urbana no centro histórico de Ourique. Inclui restauro de fachadas e criação de espaços públicos.",
    progress: 40
  },
  {
    code: "GA00461",
    name: "FPM",
    clientName: "Francisco Pereira Martins",
    location: "Cascais, Portugal",
    startDate: new Date("2024-04-01"),
    endDate: new Date("2025-03-31"),
    budget: "620000",
    priority: "high",
    status: "planning",
    description: "Moradia de luxo em Cascais com vista para o mar. Projeto contemporâneo com ênfase em sustentabilidade e tecnologia smart home.",
    progress: 15
  },
  {
    code: "GA00462",
    name: "RESTELO VILLA",
    clientName: "Ana Restelo",
    location: "Lisboa (Restelo), Portugal",
    startDate: new Date("2023-11-01"),
    endDate: new Date("2024-08-31"),
    budget: "520000",
    priority: "high",
    status: "in_progress",
    description: "Villa de luxo no Restelo com arquitetura clássica portuguesa e interiores modernos. Inclui jardim privativo e garagem para 3 viaturas.",
    progress: 70
  },
  {
    code: "GA00464",
    name: "APARTMENT IG",
    clientName: "Inês Gonçalves",
    location: "Lisboa (Avenidas Novas), Portugal",
    startDate: new Date("2024-02-15"),
    endDate: new Date("2024-09-30"),
    budget: "180000",
    priority: "low",
    status: "in_progress",
    description: "Remodelação de apartamento T3 nas Avenidas Novas. Design minimalista com foco em aproveitamento de luz natural.",
    progress: 50
  },
  {
    code: "GA00466",
    name: "PENTHOUSE SI",
    clientName: "Sofia Inácio",
    location: "Lisboa (Parque das Nações), Portugal",
    startDate: new Date("2024-03-01"),
    endDate: new Date("2024-12-15"),
    budget: "750000",
    priority: "urgent",
    status: "in_progress",
    description: "Penthouse de luxo no Parque das Nações com terraço panorâmico. Inclui design de interiores exclusivo e automação completa.",
    progress: 35
  },
  {
    code: "GA00469",
    name: "MYRIAD",
    clientName: "Myriad Investments",
    location: "Lisboa (Parque das Nações), Portugal",
    startDate: new Date("2023-10-01"),
    endDate: new Date("2024-07-31"),
    budget: "920000",
    priority: "urgent",
    status: "in_progress",
    description: "Projeto de remodelação de espaços comerciais e residenciais no edifício Myriad. Inclui áreas comuns, lobby e 12 unidades.",
    progress: 75
  },
  {
    code: "GA00473",
    name: "LAAND",
    clientName: "Laand Developers",
    location: "Comporta, Portugal",
    startDate: new Date("2024-05-01"),
    endDate: new Date("2025-06-30"),
    budget: "1200000",
    priority: "high",
    status: "planning",
    description: "Desenvolvimento turístico sustentável na Comporta. Inclui 6 villas ecológicas integradas na paisagem natural.",
    progress: 10
  },
  {
    code: "GA00484",
    name: "ALTO DO TEJO",
    clientName: "Construtora Alto Tejo",
    location: "Vila Franca de Xira, Portugal",
    startDate: new Date("2024-01-10"),
    endDate: new Date("2024-11-30"),
    budget: "420000",
    priority: "medium",
    status: "in_progress",
    description: "Conjunto residencial de 4 moradias geminadas no Alto do Tejo. Design contemporâneo com eficiência energética classe A+.",
    progress: 60
  },
  {
    code: "GA00485",
    name: "GUIA HOUSE",
    clientName: "Ricardo Guia",
    location: "Cascais (Guia), Portugal",
    startDate: new Date("2024-02-20"),
    endDate: new Date("2024-10-31"),
    budget: "390000",
    priority: "medium",
    status: "in_progress",
    description: "Moradia unifamiliar na Guia com design moderno e sustentável. Inclui painéis solares, sistema de reaproveitamento de águas e jardim vertical.",
    progress: 48
  },
  {
    code: "GA00489",
    name: "AS HOUSE",
    clientName: "André Silva",
    location: "Sintra, Portugal",
    startDate: new Date("2024-04-15"),
    endDate: new Date("2025-02-28"),
    budget: "480000",
    priority: "medium",
    status: "planning",
    description: "Moradia contemporânea em Sintra com integração paisagística. Projeto inclui estúdio independente e piscina natural.",
    progress: 20
  },
  {
    code: "GA00491",
    name: "JOSÉ ESTEVÃO",
    clientName: "José Estevão Lopes",
    location: "Aveiro, Portugal",
    startDate: new Date("2023-12-01"),
    endDate: new Date("2024-09-30"),
    budget: "340000",
    priority: "medium",
    status: "in_progress",
    description: "Remodelação de edifício histórico em Aveiro para uso misto (comercial + residencial). Preservação de fachada original com interiores modernos.",
    progress: 68
  },
  {
    code: "GA00492",
    name: "CASTILHO 3",
    clientName: "Imobiliária Castilho",
    location: "Lisboa (Avenida da Liberdade), Portugal",
    startDate: new Date("2024-03-15"),
    endDate: new Date("2025-01-31"),
    budget: "680000",
    priority: "high",
    status: "in_progress",
    description: "Apartamento de luxo na Avenida da Liberdade. Design sofisticado com materiais nobres, tecnologia de ponta e vistas privilegiadas.",
    progress: 42
  }
];

async function seedGavinhoProjects() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  try {
    console.log('🌱 Iniciando seed de projetos GAVINHO...\n');

    // Get the owner user ID (assuming it's the first user or owner)
    const [users] = await connection.execute('SELECT id FROM users LIMIT 1');
    if (users.length === 0) {
      throw new Error('Nenhum usuário encontrado no banco de dados. Por favor, faça login primeiro.');
    }
    const ownerId = users[0].id;

    // Clear existing test projects (optional - remove if you want to keep them)
    // await connection.execute('DELETE FROM projects WHERE name LIKE "Test Project%"');
    // console.log('✅ Projetos de teste removidos\n');

    // Insert GAVINHO projects
    for (const project of gavinhoProjects) {
      const [result] = await connection.execute(
        `INSERT INTO projects (
          name, clientName, location, startDate, endDate, 
          budget, priority, status, description, progress, 
          createdById, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          `${project.code}_${project.name}`,
          project.clientName,
          project.location,
          project.startDate,
          project.endDate,
          project.budget,
          project.priority,
          project.status,
          project.description,
          project.progress,
          ownerId
        ]
      );

      console.log(`✅ ${project.code}_${project.name} - ${project.status} (${project.progress}%)`);
    }

    console.log(`\n🎉 ${gavinhoProjects.length} projetos GAVINHO criados com sucesso!`);
    console.log('\n📊 Resumo por status:');
    const statusCount = gavinhoProjects.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {});
    Object.entries(statusCount).forEach(([status, count]) => {
      console.log(`   - ${status}: ${count} projetos`);
    });

  } catch (error) {
    console.error('❌ Erro ao criar projetos:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

seedGavinhoProjects();
