import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL não encontrada no ambiente');
  process.exit(1);
}

async function seedMQTComplete() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    console.log('🚀 Iniciando seed do MQT completo da GA00466_Penthouse SI...\n');

    // 1. Buscar ID da obra GA00466
    const [constructions] = await connection.execute(
      'SELECT id FROM constructions WHERE code = ? LIMIT 1',
      ['GA00466']
    );

    if (constructions.length === 0) {
      console.error('❌ Obra GA00466 não encontrada');
      process.exit(1);
    }

    const constructionId = constructions[0].id;
    console.log(`✅ Obra encontrada: GA00466 (ID: ${constructionId})\n`);

    // 2. Limpar dados existentes
    await connection.execute('DELETE FROM mqtItems WHERE constructionId = ?', [constructionId]);
    await connection.execute('DELETE FROM mqtCategories WHERE constructionId = ?', [constructionId]);
    console.log('🗑️  Dados antigos removidos\n');

    // 3. Definir categorias
    const categories = [
      { code: '1', namePt: 'Demolições', nameEn: 'Demolitions', order: 1 },
      { code: '2', namePt: 'Paredes Interiores', nameEn: 'Interior Walls', order: 2 },
      { code: '3', namePt: 'Rede de Águas e Esgotos', nameEn: 'Water Supply and Drainage Network', order: 3 },
      { code: '4', namePt: 'Rede Elétrica', nameEn: 'Electrical Network', order: 4 },
      { code: '5', namePt: 'Sistema de Domótica', nameEn: 'Home Automation System', order: 5 },
      { code: '6', namePt: 'Sistema Wi-Fi Interior', nameEn: 'Indoor Wi-Fi System', order: 6 },
      { code: '8', namePt: 'Climatização', nameEn: 'Air Conditioning', order: 7 },
      { code: '9', namePt: 'Impermeabilizações', nameEn: 'Waterproofing', order: 8 },
      { code: '10', namePt: 'Revestimento de Pavimentos', nameEn: 'Floor Coverings', order: 9 },
      { code: '11', namePt: 'Revestimento de Paredes - Pedra Natural e Papel de Parede', nameEn: 'Wall Cladding - Natural Stone and Wallpaper', order: 10 },
      { code: '12', namePt: 'Tetos', nameEn: 'Ceilings', order: 11 },
      { code: '13', namePt: 'Pinturas', nameEn: 'Paintings', order: 12 },
      { code: '14', namePt: 'Marcenaria Fixa', nameEn: 'Fixed Joinery', order: 13 },
      { code: '15', namePt: 'Tampos de Bancadas, Backsplash e Lavatórios - Pedra Natural', nameEn: 'Countertops, Backsplash and Sinks - Natural Stone', order: 14 },
      { code: '16', namePt: 'Resguardos de Duche e Espelhos', nameEn: 'Shower Partitions and Mirrors', order: 15 },
      { code: '17', namePt: 'Equipamentos Sanitários', nameEn: 'Sanitary Equipment', order: 16 },
      { code: '18', namePt: 'Diversos', nameEn: 'Others', order: 17 }
    ];

    // 4. Inserir categorias
    const categoryMap = {};
    for (const cat of categories) {
      const [result] = await connection.execute(
        'INSERT INTO mqtCategories (constructionId, code, namePt, nameEn, `order`) VALUES (?, ?, ?, ?, ?)',
        [constructionId, cat.code, cat.namePt, cat.nameEn, cat.order]
      );
      categoryMap[cat.code] = result.insertId;
      console.log(`✅ Categoria ${cat.code}: ${cat.namePt} / ${cat.nameEn}`);
    }
    console.log('');

    // 5. Definir itens MQT completos (todas as 26 páginas)
    const mqtItems = [
      // CATEGORIA 1: Demolições
      { categoryCode: '1', item: '1.1', type: 'Demolições', subtype: 'Remoção de Pavimentos', zone: 'Geral', descriptionPT: 'Remoção de pavimento em madeira flutuante', descriptionEN: 'Removal of floating wooden floor', unit: 'm2', quantity: 170.0, order: 1 },
      { categoryCode: '1', item: '1.2', type: 'Demolições', subtype: 'Remoção de Revestimentos', zone: 'Geral', descriptionPT: 'Remoção de revestimento cerâmico de pavimento', descriptionEN: 'Removal of ceramic floor tiles', unit: 'm2', quantity: 31.91, order: 2 },
      { categoryCode: '1', item: '1.3', type: 'Demolições', subtype: 'Remoção de Revestimentos', zone: 'Geral', descriptionPT: 'Remoção de revestimento cerâmico de parede', descriptionEN: 'Removal of ceramic wall tiles', unit: 'm2', quantity: 105.0, order: 3 },
      { categoryCode: '1', item: '1.4', type: 'Demolições', subtype: 'Remoção de Louças', zone: 'Geral', descriptionPT: 'Remoção de louças sanitárias', descriptionEN: 'Removal of sanitary ware', unit: 'un', quantity: 10, order: 4 },
      { categoryCode: '1', item: '1.5', type: 'Demolições', subtype: 'Remoção de Carpintarias', zone: 'Geral', descriptionPT: 'Remoção de portas interiores', descriptionEN: 'Removal of interior doors', unit: 'un', quantity: 11, order: 5 },
      { categoryCode: '1', item: '1.6', type: 'Demolições', subtype: 'Remoção de Carpintarias', zone: 'Geral', descriptionPT: 'Remoção de roupeiros', descriptionEN: 'Removal of wardrobes', unit: 'un', quantity: 4, order: 6 },
      { categoryCode: '1', item: '1.7', type: 'Demolições', subtype: 'Remoção de Caixilharias', zone: 'Geral', descriptionPT: 'Remoção de caixilharia de alumínio', descriptionEN: 'Removal of aluminum window frames', unit: 'un', quantity: 1, order: 7 },
      { categoryCode: '1', item: '1.8', type: 'Demolições', subtype: 'Remoção de Tetos', zone: 'Geral', descriptionPT: 'Remoção de tetos falsos', descriptionEN: 'Removal of false ceilings', unit: 'm2', quantity: 33.75, order: 8 },
      { categoryCode: '1', item: '1.9', type: 'Demolições', subtype: 'Remoção de Paredes', zone: 'Geral', descriptionPT: 'Demolição de parede divisória em alvenaria de tijolo', descriptionEN: 'Demolition of brick partition wall', unit: 'm2', quantity: 7.5, order: 9 },
      { categoryCode: '1', item: '1.10', type: 'Demolições', subtype: 'Remoção de Paredes', zone: 'Geral', descriptionPT: 'Demolição de parede divisória em gesso cartonado', descriptionEN: 'Demolition of plasterboard partition wall', unit: 'm2', quantity: 22.5, order: 10 },
      { categoryCode: '1', item: '1.11', type: 'Demolições', subtype: 'Transporte de Resíduos', zone: 'Geral', descriptionPT: 'Transporte de resíduos para aterro', descriptionEN: 'Transport of waste to landfill', unit: 'vg', quantity: 1, order: 11 },
      { categoryCode: '1', item: '1.12', type: 'Demolições', subtype: 'Limpeza', zone: 'Geral', descriptionPT: 'Limpeza geral após demolições', descriptionEN: 'General cleaning after demolitions', unit: 'vg', quantity: 1, order: 12 },
      { categoryCode: '1', item: '1.13', type: 'Demolições', subtype: 'Proteções', zone: 'Geral', descriptionPT: 'Proteção de áreas não intervencionadas', descriptionEN: 'Protection of non-intervention areas', unit: 'vg', quantity: 1, order: 13 },

      // CATEGORIA 2: Paredes Interiores
      { categoryCode: '2', item: '2.1', type: 'Paredes', subtype: 'Execução - Gesso Cartonado', zone: 'Geral', descriptionPT: 'Execução de parede divisória em gesso cartonado duplo, estrutura metálica, isolamento acústico', descriptionEN: 'Execution of double plasterboard partition wall, metal structure, acoustic insulation', unit: 'm2', quantity: 22.5, order: 1 },
      { categoryCode: '2', item: '2.2', type: 'Paredes', subtype: 'Execução - Alvenaria', zone: 'Geral', descriptionPT: 'Execução de parede divisória em alvenaria de tijolo furado 15cm', descriptionEN: 'Execution of 15cm hollow brick masonry partition wall', unit: 'm2', quantity: 7.5, order: 2 },
      { categoryCode: '2', item: '2.3', type: 'Paredes', subtype: 'Reforço Estrutural', zone: 'IS Master 1', descriptionPT: 'Reforço estrutural de parede para suporte de lavatório suspenso', descriptionEN: 'Structural reinforcement of wall for suspended washbasin support', unit: 'un', quantity: 1, order: 3 },
      { categoryCode: '2', item: '2.4', type: 'Paredes', subtype: 'Reforço Estrutural', zone: 'IS Master 2', descriptionPT: 'Reforço estrutural de parede para suporte de lavatório suspenso', descriptionEN: 'Structural reinforcement of wall for suspended washbasin support', unit: 'un', quantity: 1, order: 4 },
      { categoryCode: '2', item: '2.5', type: 'Paredes', subtype: 'Reforço Estrutural', zone: 'IS Social', descriptionPT: 'Reforço estrutural de parede para suporte de lavatório suspenso', descriptionEN: 'Structural reinforcement of wall for suspended washbasin support', unit: 'un', quantity: 1, order: 5 },

      // CATEGORIA 3: Rede de Águas e Esgotos
      { categoryCode: '3', item: '3.1', type: 'Instalações', subtype: 'Rede de Águas', zone: 'Geral', descriptionPT: 'Alteração e ampliação da rede de abastecimento de água fria em tubo multicamadas', descriptionEN: 'Alteration and expansion of cold water supply network in multilayer pipe', unit: 'vg', quantity: 1, order: 1 },
      { categoryCode: '3', item: '3.2', type: 'Instalações', subtype: 'Rede de Esgotos', zone: 'Geral', descriptionPT: 'Alteração e ampliação da rede de drenagem de águas residuais domésticas em tubo PVC', descriptionEN: 'Alteration and expansion of domestic wastewater drainage network in PVC pipe', unit: 'vg', quantity: 1, order: 2 },
      { categoryCode: '3', item: '3.3', type: 'Instalações', subtype: 'Testes', zone: 'Geral', descriptionPT: 'Ensaios de estanquidade das redes de águas e esgotos', descriptionEN: 'Watertightness tests of water and sewage networks', unit: 'vg', quantity: 1, order: 3 },

      // CATEGORIA 4: Rede Elétrica
      { categoryCode: '4', item: '4.1', type: 'Instalações Elétricas', subtype: 'Quadro Elétrico', zone: 'Geral', descriptionPT: 'Fornecimento e instalação de quadro elétrico', descriptionEN: 'Supply and installation of electrical panel', unit: 'un', quantity: 1, order: 1 },
      { categoryCode: '4', item: '4.2', type: 'Instalações Elétricas', subtype: 'Cablagem', zone: 'Geral', descriptionPT: 'Execução de rede elétrica em tubo VD embebido', descriptionEN: 'Execution of electrical network in embedded conduit', unit: 'vg', quantity: 1, order: 2 },
      { categoryCode: '4', item: '4.3', type: 'Instalações Elétricas', subtype: 'Tomadas', zone: 'Geral', descriptionPT: 'Tomadas elétricas (quantidade a definir)', descriptionEN: 'Electrical sockets (quantity to be defined)', unit: 'un', quantity: 45, order: 3 },
      { categoryCode: '4', item: '4.4', type: 'Instalações Elétricas', subtype: 'Iluminação', zone: 'Geral', descriptionPT: 'Pontos de iluminação (quantidade a definir)', descriptionEN: 'Lighting points (quantity to be defined)', unit: 'un', quantity: 38, order: 4 },
      { categoryCode: '4', item: '4.5', type: 'Instalações Elétricas', subtype: 'Luminárias', zone: 'Geral', descriptionPT: 'Fornecimento e instalação de luminárias (a definir)', descriptionEN: 'Supply and installation of luminaires (to be defined)', unit: 'vg', quantity: 1, order: 5 },

      // CATEGORIA 5: Sistema de Domótica
      { categoryCode: '5', item: '5.1', type: 'Domótica', subtype: 'Central de Controlo', zone: 'Geral', descriptionPT: 'Central de controlo domótico', descriptionEN: 'Home automation control center', unit: 'un', quantity: 1, order: 1 },
      { categoryCode: '5', item: '5.2', type: 'Domótica', subtype: 'Interruptores', zone: 'Área Social', descriptionPT: 'Interruptores tácteis domóticos', descriptionEN: 'Touch home automation switches', unit: 'un', quantity: 8, order: 2 },
      { categoryCode: '5', item: '5.3', type: 'Domótica', subtype: 'Interruptores', zone: 'Circulação', descriptionPT: 'Interruptores tácteis domóticos', descriptionEN: 'Touch home automation switches', unit: 'un', quantity: 4, order: 3 },
      { categoryCode: '5', item: '5.4', type: 'Domótica', subtype: 'Interruptores', zone: 'Master 1', descriptionPT: 'Interruptores tácteis domóticos', descriptionEN: 'Touch home automation switches', unit: 'un', quantity: 6, order: 4 },
      { categoryCode: '5', item: '5.5', type: 'Domótica', subtype: 'Interruptores', zone: 'Master 2', descriptionPT: 'Interruptores tácteis domóticos', descriptionEN: 'Touch home automation switches', unit: 'un', quantity: 6, order: 5 },
      { categoryCode: '5', item: '5.6', type: 'Domótica', subtype: 'Interruptores', zone: 'Quarto', descriptionPT: 'Interruptores tácteis domóticos', descriptionEN: 'Touch home automation switches', unit: 'un', quantity: 3, order: 6 },
      { categoryCode: '5', item: '5.7', type: 'Domótica', subtype: 'Interruptores', zone: 'IS Social', descriptionPT: 'Interruptores tácteis domóticos', descriptionEN: 'Touch home automation switches', unit: 'un', quantity: 2, order: 7 },
      { categoryCode: '5', item: '5.8', type: 'Domótica', subtype: 'Sensores', zone: 'Geral', descriptionPT: 'Sensores de presença e luminosidade', descriptionEN: 'Presence and light sensors', unit: 'un', quantity: 5, order: 8 },
      { categoryCode: '5', item: '5.9', type: 'Domótica', subtype: 'Atuadores', zone: 'Geral', descriptionPT: 'Atuadores para controlo de iluminação', descriptionEN: 'Actuators for lighting control', unit: 'un', quantity: 12, order: 9 },
      { categoryCode: '5', item: '5.10', type: 'Domótica', subtype: 'Programação', zone: 'Geral', descriptionPT: 'Programação e configuração do sistema', descriptionEN: 'System programming and configuration', unit: 'vg', quantity: 1, order: 10 },
      { categoryCode: '5', item: '5.11', type: 'Domótica', subtype: 'Testes', zone: 'Geral', descriptionPT: 'Testes e comissionamento do sistema', descriptionEN: 'System testing and commissioning', unit: 'vg', quantity: 1, order: 11 },

      // CATEGORIA 6: Sistema Wi-Fi Interior
      { categoryCode: '6', item: '6.1', type: 'ITED', subtype: 'Cablagem Estruturada', zone: 'Geral', descriptionPT: 'Rede de cablagem estruturada Cat 6A', descriptionEN: 'Cat 6A structured cabling network', unit: 'vg', quantity: 1, order: 1 },
      { categoryCode: '6', item: '6.2', type: 'ITED', subtype: 'Tomadas RJ45', zone: 'Geral', descriptionPT: 'Tomadas RJ45 Cat 6A', descriptionEN: 'RJ45 Cat 6A sockets', unit: 'un', quantity: 12, order: 2 },
      { categoryCode: '6', item: '6.3', type: 'ITED', subtype: 'Patch Panel', zone: 'Geral', descriptionPT: 'Patch panel 24 portas Cat 6A', descriptionEN: '24-port Cat 6A patch panel', unit: 'un', quantity: 1, order: 3 },
      { categoryCode: '6', item: '6.4', type: 'ITED', subtype: 'Switch', zone: 'Geral', descriptionPT: 'Switch gerido 24 portas Gigabit PoE+', descriptionEN: 'Managed 24-port Gigabit PoE+ switch', unit: 'un', quantity: 1, order: 4 },
      { categoryCode: '6', item: '6.5', type: 'ITED', subtype: 'Access Points', zone: 'Geral', descriptionPT: 'Access points Wi-Fi 6 (802.11ax)', descriptionEN: 'Wi-Fi 6 (802.11ax) access points', unit: 'un', quantity: 3, order: 5 },
      { categoryCode: '6', item: '6.6', type: 'ITED', subtype: 'Configuração', zone: 'Geral', descriptionPT: 'Configuração e otimização da rede Wi-Fi', descriptionEN: 'Wi-Fi network configuration and optimization', unit: 'vg', quantity: 1, order: 6 },
      { categoryCode: '6', item: '6.7', type: 'ITED', subtype: 'Testes', zone: 'Geral', descriptionPT: 'Testes de cobertura e velocidade', descriptionEN: 'Coverage and speed tests', unit: 'vg', quantity: 1, order: 7 },

      // CATEGORIA 8: Climatização
      { categoryCode: '8', item: '8.1', type: 'AVAC', subtype: 'Unidade Exterior', zone: 'Geral', descriptionPT: 'Unidade exterior VRF multi-split', descriptionEN: 'VRF multi-split outdoor unit', unit: 'un', quantity: 1, order: 1 },
      { categoryCode: '8', item: '8.2', type: 'AVAC', subtype: 'Unidades Interiores', zone: 'Área Social', descriptionPT: 'Unidade interior cassete 4 vias', descriptionEN: '4-way cassette indoor unit', unit: 'un', quantity: 2, order: 2 },
      { categoryCode: '8', item: '8.3', type: 'AVAC', subtype: 'Unidades Interiores', zone: 'Master 1', descriptionPT: 'Unidade interior mural', descriptionEN: 'Wall-mounted indoor unit', unit: 'un', quantity: 1, order: 3 },
      { categoryCode: '8', item: '8.4', type: 'AVAC', subtype: 'Unidades Interiores', zone: 'Master 2', descriptionPT: 'Unidade interior mural', descriptionEN: 'Wall-mounted indoor unit', unit: 'un', quantity: 1, order: 4 },
      { categoryCode: '8', item: '8.5', type: 'AVAC', subtype: 'Unidades Interiores', zone: 'Quarto', descriptionPT: 'Unidade interior mural', descriptionEN: 'Wall-mounted indoor unit', unit: 'un', quantity: 1, order: 5 },
      { categoryCode: '8', item: '8.6', type: 'AVAC', subtype: 'Unidades Interiores', zone: 'Office', descriptionPT: 'Unidade interior mural', descriptionEN: 'Wall-mounted indoor unit', unit: 'un', quantity: 1, order: 6 },
      { categoryCode: '8', item: '8.7', type: 'AVAC', subtype: 'Tubagem Frigorífica', zone: 'Geral', descriptionPT: 'Tubagem frigorífica em cobre isolada', descriptionEN: 'Insulated copper refrigerant piping', unit: 'ml', quantity: 85, order: 7 },
      { categoryCode: '8', item: '8.8', type: 'AVAC', subtype: 'Drenagem', zone: 'Geral', descriptionPT: 'Tubagem de drenagem de condensados', descriptionEN: 'Condensate drainage piping', unit: 'ml', quantity: 85, order: 8 },
      { categoryCode: '8', item: '8.9', type: 'AVAC', subtype: 'Controlo', zone: 'Geral', descriptionPT: 'Sistema de controlo centralizado', descriptionEN: 'Centralized control system', unit: 'un', quantity: 1, order: 9 },
      { categoryCode: '8', item: '8.10', type: 'AVAC', subtype: 'Comandos', zone: 'Geral', descriptionPT: 'Comandos murais por zona', descriptionEN: 'Wall-mounted controls per zone', unit: 'un', quantity: 6, order: 10 },
      { categoryCode: '8', item: '8.11', type: 'Pavimento Radiante', subtype: 'Sistema', zone: 'Master 1', descriptionPT: 'Sistema de pavimento radiante elétrico', descriptionEN: 'Electric underfloor heating system', unit: 'm2', quantity: 18, order: 11 },
      { categoryCode: '8', item: '8.12', type: 'Pavimento Radiante', subtype: 'Sistema', zone: 'Master 2', descriptionPT: 'Sistema de pavimento radiante elétrico', descriptionEN: 'Electric underfloor heating system', unit: 'm2', quantity: 18, order: 12 },
      { categoryCode: '8', item: '8.13', type: 'Pavimento Radiante', subtype: 'Sistema', zone: 'IS Master 1', descriptionPT: 'Sistema de pavimento radiante elétrico', descriptionEN: 'Electric underfloor heating system', unit: 'm2', quantity: 5.88, order: 13 },
      { categoryCode: '8', item: '8.14', type: 'Pavimento Radiante', subtype: 'Sistema', zone: 'IS Master 2', descriptionPT: 'Sistema de pavimento radiante elétrico', descriptionEN: 'Electric underfloor heating system', unit: 'm2', quantity: 4.79, order: 14 },
      { categoryCode: '8', item: '8.15', type: 'Pavimento Radiante', subtype: 'Termostatos', zone: 'Geral', descriptionPT: 'Termostatos digitais para pavimento radiante', descriptionEN: 'Digital thermostats for underfloor heating', unit: 'un', quantity: 4, order: 15 },
      { categoryCode: '8', item: '8.16', type: 'AVAC', subtype: 'Comissionamento', zone: 'Geral', descriptionPT: 'Comissionamento e balanceamento do sistema', descriptionEN: 'System commissioning and balancing', unit: 'vg', quantity: 1, order: 16 },
      { categoryCode: '8', item: '8.17', type: 'AVAC', subtype: 'Certificação', zone: 'Geral', descriptionPT: 'Certificação energética e térmica', descriptionEN: 'Energy and thermal certification', unit: 'vg', quantity: 1, order: 17 },

      // CATEGORIA 9: Impermeabilizações
      { categoryCode: '9', item: '9.1', type: 'Impermeabilizações', subtype: 'Zonas Húmidas', zone: 'Geral', descriptionPT: 'Impermeabilização de pavimentos e paredes de instalações sanitárias', descriptionEN: 'Waterproofing of floors and walls in bathrooms', unit: 'm2', quantity: 65, order: 1 },

      // CATEGORIA 10: Revestimento de Pavimentos
      { categoryCode: '10', item: '10.1', type: 'Pavimentos', subtype: 'Betonilha', zone: 'Geral', descriptionPT: 'Execução de betonilha hidrofugada de regularização em pavimentos interiores', descriptionEN: 'Execution of water-repellent leveling screed on interior floors', unit: 'm2', quantity: 31.91, order: 1 },
      { categoryCode: '10', item: '10.2', type: 'Pavimentos', subtype: 'Aplicação - Pavimento de Madeira', zone: 'Geral', descriptionPT: 'Aplicação de pavimento multicamadas em madeira nobre - HW2078 ALZON', descriptionEN: 'Application of multi-layer noble wood flooring - HW2078 ALZON', unit: 'm2', quantity: 170.0, order: 2 },
      { categoryCode: '10', item: '10.3', type: 'Pavimentos', subtype: 'Regularização Resina', zone: 'Geral', descriptionPT: 'Execução de regularização de betonilha em zonas de remoção de madeira', descriptionEN: 'Carrying out screed regularization in areas where the old wooden floor has been removed', unit: 'm2', quantity: 170.0, order: 3 },
      { categoryCode: '10', item: '10.4', type: 'Pavimentos', subtype: 'Material - Pavimento Madeira', zone: 'Geral', descriptionPT: 'Fornecimento de pavimento com madeira nobre multicamadas - HW2078 ALZON', descriptionEN: 'Supply of flooring with multi-layer noble wood - HW2078 ALZON', unit: 'm2', quantity: 200.0, order: 4 },
      { categoryCode: '10', item: '10.5', type: 'Pavimentos', subtype: 'Aplicação - Pedra Natural', zone: 'IS Master 1 + IS Master 2 + IS Circulação', descriptionPT: 'Aplicação de pavimento de pedra natural com 20mm de espessura', descriptionEN: 'Application of 20mm thick natural stone flooring', unit: 'm2', quantity: 14.9, order: 5 },
      { categoryCode: '10', item: '10.6', type: 'Pedras', subtype: 'Material - Pavimentos', zone: 'IS Master 1', descriptionPT: 'Fornecimento de pavimento em pedra natural Creme Calahari', descriptionEN: 'Supply of flooring in natural stone Creme Calahari', unit: 'm2', quantity: 5.88, order: 6 },
      { categoryCode: '10', item: '10.7', type: 'Pedras', subtype: 'Material - Pavimentos', zone: 'IS Master 2', descriptionPT: 'Fornecimento de pavimento em pedra natural Carrara', descriptionEN: 'Supply of flooring in natural stone Carrara', unit: 'm2', quantity: 4.79, order: 7 },
      { categoryCode: '10', item: '10.8', type: 'Pedras', subtype: 'Material - Pavimentos', zone: 'IS Circulação', descriptionPT: 'Fornecimento de pavimento em pedra natural A DEFINIR', descriptionEN: 'Supply of flooring in natural stone TO BE DEFINED', unit: 'm2', quantity: 4.25, order: 8 },
      { categoryCode: '10', item: '10.9', type: 'Pavimentos', subtype: 'Aplicação - Perfil de Transição', zone: 'Geral', descriptionPT: 'Aplicação de perfil de transição, tipo PROFILPAS, 8mm de altura', descriptionEN: 'Application of transition profile, type PROFILPAS, 8mm high', unit: 'ml', quantity: 3.54, order: 9 },
      { categoryCode: '10', item: '10.10', type: 'Pavimentos', subtype: 'Material - Perfil de Transição', zone: 'Geral', descriptionPT: 'Fornecimento de perfil de transição, tipo PROFILPAS, 8mm de altura', descriptionEN: 'Supply of transition profile, type PROFILPAS, 8mm high', unit: 'ml', quantity: 3.54, order: 10 },
      { categoryCode: '10', item: '10.11', type: 'Pavimentos', subtype: 'Aplicação - Rodapés', zone: 'Geral', descriptionPT: 'Aplicação de rodapé existente, incluindo colas de assentamento', descriptionEN: 'Application of existing skirting board, including laying glues', unit: 'ml', quantity: 27.22, order: 11 },

      // CATEGORIA 11: Revestimento de Paredes
      { categoryCode: '11', item: '11.1', type: 'Paredes', subtype: 'Aplicação - Revestimento de Paredes', zone: 'IS Master 1', descriptionPT: 'Aplicação de revestimento pedra natural Creme Calahari, 20mm de espessura', descriptionEN: 'Application of natural stone slabs Creme Calahari, 20mm thick', unit: 'm2', quantity: 18.97, order: 1 },
      { categoryCode: '11', item: '11.2', type: 'Pedras', subtype: 'Material - Revestimento de Paredes', zone: 'IS Master 1', descriptionPT: 'Fornecimento de revestimento pedra natural Creme Calahari, 20mm de espessura', descriptionEN: 'Supply of natural stone slabs Creme Calahari, 20mm thick', unit: 'm2', quantity: 18.97, order: 2 },
      { categoryCode: '11', item: '11.3', type: 'Paredes', subtype: 'Aplicação - Revestimento de Paredes', zone: 'IS Master 2', descriptionPT: 'Aplicação de revestimento pedra natural Carrara, 20mm de espessura', descriptionEN: 'Application of natural stone slabs Carrara, 20mm thick', unit: 'm2', quantity: 22.70, order: 3 },
      { categoryCode: '11', item: '11.4', type: 'Pedras', subtype: 'Material - Revestimento de Paredes', zone: 'IS Master 2', descriptionPT: 'Fornecimento de revestimento pedra natural Carrara, 20mm de espessura', descriptionEN: 'Supply of natural stone slabs Carrara, 20mm thick', unit: 'm2', quantity: 22.70, order: 4 },
      { categoryCode: '11', item: '11.5', type: 'Paredes', subtype: 'Aplicação - Revestimento de Paredes', zone: 'IS Social', descriptionPT: 'Aplicação de revestimento pedra natural Green River, 20mm de espessura', descriptionEN: 'Application of natural stone slabs Green River, 20mm thick', unit: 'm2', quantity: 3.80, order: 5 },
      { categoryCode: '11', item: '11.6', type: 'Pedras', subtype: 'Material - Revestimento de Paredes', zone: 'IS Social', descriptionPT: 'Fornecimento de revestimento pedra natural Green River, 20mm de espessura', descriptionEN: 'Supply of natural stone slabs Green River, 20mm thick', unit: 'm2', quantity: 3.80, order: 6 },
      { categoryCode: '11', item: '11.7', type: 'Paredes', subtype: 'Aplicação - Revestimento de Paredes', zone: 'IS Circulação', descriptionPT: 'Aplicação de revestimento pedra natural A DEFINIR, 20mm de espessura', descriptionEN: 'Application of natural stone slabs TO BE DEFINED, 20mm thick', unit: 'm2', quantity: 20.33, order: 7 },
      { categoryCode: '11', item: '11.8', type: 'Pedras', subtype: 'Material - Revestimento de Paredes', zone: 'IS Circulação', descriptionPT: 'Fornecimento de revestimento pedra natural A DEFINIR, 20mm de espessura', descriptionEN: 'Supply of natural stone slabs TO BE DEFINED, 20mm thick', unit: 'm2', quantity: 20.33, order: 8 },
      { categoryCode: '11', item: '11.9', type: 'Paredes', subtype: 'Aplicação - Revestimento de Paredes', zone: 'Mastercloset 1', descriptionPT: 'Aplicação de revestimento pedra natural Creme Calahari, 20mm de espessura', descriptionEN: 'Application of natural stone slabs Creme Calahari, 20mm thick', unit: 'm2', quantity: 5.10, order: 9 },
      { categoryCode: '11', item: '11.10', type: 'Pedras', subtype: 'Material - Revestimento de Paredes', zone: 'Mastercloset 1', descriptionPT: 'Fornecimento de revestimento pedra natural Creme Calahari, 20mm de espessura', descriptionEN: 'Supply of natural stone slabs Creme Calahari, 20mm thick', unit: 'm2', quantity: 5.10, order: 10 },
      { categoryCode: '11', item: '11.11', type: 'Paredes', subtype: 'Aplicação - Revestimento de Paredes', zone: 'Cozinha', descriptionPT: 'Aplicação de revestimento pedra natural Carrara, 20mm de espessura', descriptionEN: 'Application of natural stone slabs Carrara, 20mm thick', unit: 'm2', quantity: 2.75, order: 11 },
      { categoryCode: '11', item: '11.12', type: 'Pedras', subtype: 'Material - Revestimento de Paredes', zone: 'Cozinha', descriptionPT: 'Fornecimento de revestimento pedra natural Carrara, 20mm de espessura', descriptionEN: 'Supply of natural stone slabs Carrara, 20mm thick', unit: 'm2', quantity: 2.75, order: 12 },
      { categoryCode: '11', item: '11.13', type: 'Paredes', subtype: 'Aplicação - Revestimento de Paredes', zone: 'Móvel TV - MF. 01', descriptionPT: 'Aplicação de revestimento pedra natural Green River, 20mm de espessura', descriptionEN: 'Application of natural stone slabs Green River, 20mm thick', unit: 'm2', quantity: 2.00, order: 13 },
      { categoryCode: '11', item: '11.14', type: 'Pedras', subtype: 'Material - Revestimento de Paredes', zone: 'Móvel TV - MF. 01', descriptionPT: 'Fornecimento de revestimento pedra natural Green River, 20mm de espessura', descriptionEN: 'Supply of natural stone slabs Green River, 20mm thick', unit: 'm2', quantity: 2.00, order: 14 },
      { categoryCode: '11', item: '11.15', type: 'Paredes', subtype: 'Aplicação - Papel de Parede', zone: 'Master 2', descriptionPT: 'Aplicação de revestimento a papel de parede ARTE, ref. Sunburst cor natural, 90510', descriptionEN: 'Application of ARTE wallpaper, ref. Sunburst natural color, 90510', unit: 'm2', quantity: 17, order: 15 },
      { categoryCode: '11', item: '11.16', type: 'Papel de Parede', subtype: 'Material - Papel de Parede', zone: 'Master 2', descriptionPT: 'Fornecimento de revestimento a papel de parede ARTE, ref. Sunburst cor natural, 90510', descriptionEN: 'Supply of ARTE wallpaper, ref. Sunburst natural color, 90510', unit: 'un', quantity: 2, order: 16 },

      // CATEGORIA 12: Tetos
      { categoryCode: '12', item: '12.1', type: 'Tetos', subtype: 'Tetos em Gesso Cartonado Standard', zone: 'Geral', descriptionPT: 'Fornecimento e execução de tetos falsos constituídos por placa de gesso cartonado standard', descriptionEN: 'Supply and execution of false ceilings consisting of standard plasterboard', unit: 'm2', quantity: 27.07, order: 1 },
      { categoryCode: '12', item: '12.1', type: 'Tetos', subtype: 'Tetos em Gesso Cartonado Hidrófugo', zone: 'Zonas Húmidas', descriptionPT: 'Fornecimento e execução de tetos falsos constituídos por placa de gesso cartonado hidrófugo', descriptionEN: 'Supply and execution of false ceilings consisting of water-repellent plasterboard', unit: 'm2', quantity: 6.68, order: 2 },

      // CATEGORIA 13: Pinturas
      { categoryCode: '13', item: '13.1', type: 'Pinturas', subtype: 'Paredes Interiores - Primário', zone: 'Geral', descriptionPT: 'Pintura de paredes interiores - Apenas Pintura tipo Primário', descriptionEN: 'Painting of interior walls - Only Primer Paint', unit: 'm2', quantity: 36.93, order: 1 },
      { categoryCode: '13', item: '13.2', type: 'Pinturas', subtype: 'Paredes Interiores - Pintura Finalizada', zone: 'Geral', descriptionPT: 'Pintura de paredes interiores - Primário e Pintura Finalizada', descriptionEN: 'Painting of interior walls - Primer and Finished Painting', unit: 'm2', quantity: 36.93, order: 2 },
      { categoryCode: '13', item: '13.3', type: 'Pinturas', subtype: 'Tetos Interiores - Pintura Finalizada', zone: 'Geral', descriptionPT: 'Pintura de tetos interiores - Primário e Pintura Finalizada', descriptionEN: 'Painting of interior ceilings - Primer and Finished Painting', unit: 'm2', quantity: 200, order: 3 },

      // CATEGORIA 14: Marcenaria Fixa
      { categoryCode: '14', item: '14.1', type: 'Marcenaria Fixa', subtype: 'Transporte e Montagem', zone: 'Geral', descriptionPT: 'Transporte e montagem de todos os artigos descritos neste capítulo', descriptionEN: 'Transport and assembly of all the items described in this chapter', unit: 'dias', quantity: 13, order: 1 },
      { categoryCode: '14', item: '14.2', type: 'Marcenaria Fixa', subtype: 'MF.01', zone: 'Móvel de TV', descriptionPT: 'Fornecimento de móvel de TV suspenso e MDF lacado', descriptionEN: 'Supply of suspended TV cabinet in lacquered MDF', unit: 'ml', quantity: 4.39, order: 2 },
      { categoryCode: '14', item: '14.3', type: 'Marcenaria Fixa', subtype: 'MF.02', zone: 'Apainelado Hall de Entrada', descriptionPT: 'Fornecimento de apainelado na zona de entrada do Apartamento', descriptionEN: 'Supply of paneling in the entrance area of the Apartment', unit: 'ml', quantity: 24.69, order: 3 },
      { categoryCode: '14', item: '14.4', type: 'Marcenaria Fixa', subtype: 'MF.02.1', zone: 'Consola Hall de Entrada', descriptionPT: 'Fornecimento de consola em pedra natural tipo mármore Calacata', descriptionEN: 'Supply of console in natural stone like Calacata marble', unit: 'vg', quantity: 1, order: 4 },
      { categoryCode: '14', item: '14.5', type: 'Marcenaria Fixa', subtype: 'MF.03', zone: 'Móvel de Canto', descriptionPT: 'Fornecimento de móvel de canto em MDF revestido a folha de madeira', descriptionEN: 'Supply of corner furniture in MDF covered with wood veneer', unit: 'ml', quantity: 2.7, order: 5 },
      { categoryCode: '14', item: '14.6', type: 'Marcenaria Fixa', subtype: 'MF.04', zone: 'Portas de Correr Office', descriptionPT: 'Fornecimento de Portas de Correr em MDF revestido a folha de madeira de carvalho', descriptionEN: 'Supply of sliding doors in MDF covered in oak veneer', unit: 'ml', quantity: 4.66, order: 6 },
      { categoryCode: '14', item: '14.7', type: 'Marcenaria Fixa', subtype: 'MF.05', zone: 'Apainelado Circulação', descriptionPT: 'Fornecimento de apainelado na Circulação', descriptionEN: 'Supply of panelling in Circulation', unit: 'ml', quantity: 14, order: 7 },
      { categoryCode: '14', item: '14.8', type: 'Marcenaria Fixa', subtype: 'MF.06', zone: 'Móvel de Arrumação Circulação', descriptionPT: 'Fornecimento de Móvel em MDF folheado a folha TABU - Eucaliptus Frisé', descriptionEN: 'Supply of furniture in MDF veneer TABU - Eucaliptus Frisé', unit: 'ml', quantity: 1.69, order: 8 },
      { categoryCode: '14', item: '14.9', type: 'Marcenaria Fixa', subtype: 'MF.07', zone: 'Estante Office', descriptionPT: 'Fornecimento de estantes em MDF lacado', descriptionEN: 'Supply of shelves in MDF lacquered', unit: 'ml', quantity: 2.8, order: 9 },
      { categoryCode: '14', item: '14.10', type: 'Marcenaria Fixa', subtype: 'MF.08', zone: 'Móvel de Arrumação Office + Apainelados', descriptionPT: 'Fornecimento de Apainelado folheado em folha de carvalho natural', descriptionEN: 'Supply of natural oak veneer panelling', unit: 'ml', quantity: 9.95, order: 10 },
      { categoryCode: '14', item: '14.11', type: 'Marcenaria Fixa', subtype: 'MF.09', zone: 'Closet Master 01', descriptionPT: 'Fornecimento de Móvel em MDF folheado a folha TABU - Eucaliptus Frisé', descriptionEN: 'Supply of furniture in MDF veneer TABU - Eucaliptus Frisé', unit: 'ml', quantity: 7.81, order: 11 },
      { categoryCode: '14', item: '14.12', type: 'Marcenaria Fixa', subtype: 'MF.10', zone: 'IS Social', descriptionPT: 'Fornecimento de Móvel de IS em MDF Hidrófugo', descriptionEN: 'IS furniture supplied in water-repellent MDF', unit: 'ml', quantity: 1.3, order: 12 },
      { categoryCode: '14', item: '14.13', type: 'Marcenaria Fixa', subtype: 'MF.11', zone: 'Móvel IS Master 01', descriptionPT: 'Fornecimento de Móvel de IS em MDF Hidrófugo', descriptionEN: 'IS furniture supplied in water-repellent MDF', unit: 'ml', quantity: 1.4, order: 13 },
      { categoryCode: '14', item: '14.14', type: 'Marcenaria Fixa', subtype: 'MF.12', zone: 'Móvel Alto IS Master 01', descriptionPT: 'Fornecimento de módulo alto para embutir em nicho', descriptionEN: 'Supply of tall module for niche incorporation', unit: 'ml', quantity: 0.5, order: 14 },
      { categoryCode: '14', item: '14.15', type: 'Marcenaria Fixa', subtype: 'MF.13', zone: 'Móvel TV Master 02', descriptionPT: 'Fornecimento de estrutura para embutir TV em MDF lacado', descriptionEN: 'Supply of structure for TV inlay in MDF lacquered', unit: 'ml', quantity: 4, order: 15 },
      { categoryCode: '14', item: '14.16', type: 'Marcenaria Fixa', subtype: 'MF.14', zone: 'Secretária Master 02', descriptionPT: 'Fornecimento de secretária e laterais em MDF standard', descriptionEN: 'Supply of desk and sides in standard MDF', unit: 'ml', quantity: 1.15, order: 16 },
      { categoryCode: '14', item: '14.17', type: 'Marcenaria Fixa', subtype: 'MF.15', zone: 'Closet Master 02', descriptionPT: 'Fornecimento de Móvel em MDF folheado a folha TABU - Eucaliptus Frisé', descriptionEN: 'Supply of furniture in MDF veneer TABU - Eucaliptus Frisé', unit: 'ml', quantity: 4, order: 17 },
      { categoryCode: '14', item: '14.18', type: 'Marcenaria Fixa', subtype: 'MF.16', zone: 'Móvel IS Master 02', descriptionPT: 'Fornecimento de Móvel de IS em MDF Hidrófugo', descriptionEN: 'IS furniture supplied in water-repellent MDF', unit: 'ml', quantity: 1.9, order: 18 },
      { categoryCode: '14', item: '14.19', type: 'Marcenaria Fixa', subtype: 'MF.17', zone: 'Móvel Coluna IS Master 02', descriptionPT: 'Fornecimento de móvel alto em MDF hidrófugo folheado a madeira de carvalho', descriptionEN: 'Supply of tall cabinet in water-repellent MDF veneered in oak', unit: 'ml', quantity: 0.9, order: 19 },
      { categoryCode: '14', item: '14.20', type: 'Marcenaria Fixa', subtype: 'MF.18', zone: 'Móvel Cozinha', descriptionPT: 'Fornecimento de móveis altos e módulos baixos em MDF hidrófugo', descriptionEN: 'Supply of tall units and low units in water-repellent MDF', unit: 'ml', quantity: 6.23, order: 20 },
      { categoryCode: '14', item: '14.21', type: 'Marcenaria Fixa', subtype: 'MF.19', zone: 'Apainelado Cozinha', descriptionPT: 'Fornecimento de apainelado na Cozinha', descriptionEN: 'Supply of panelling in Kitchen', unit: 'ml', quantity: 5.22, order: 21 },
      { categoryCode: '14', item: '14.22', type: 'Marcenaria Fixa', subtype: 'MF.20', zone: 'IS Circulação', descriptionPT: 'Fornecimento de Móvel de IS em MDF Hidrófugo', descriptionEN: 'IS furniture supplied in water-repellent MDF', unit: 'ml', quantity: 1.59, order: 22 },

      // CATEGORIA 15: Tampos de Bancadas
      { categoryCode: '15', item: '15.1', type: 'Pedras', subtype: 'MF.11', zone: 'IS Master 01', descriptionPT: 'Fornecimento e assentamento de tampo de bancada e lavatório em pedra natural', descriptionEN: 'Supply and installation of counter tops and washbasin made of natural stone', unit: 'un', quantity: 1, order: 1 },
      { categoryCode: '15', item: '15.1.1', type: 'Pedras', subtype: 'MF.11', zone: 'IS Master 01', descriptionPT: 'Lavatório - peça única', descriptionEN: 'Sink - unique piece', unit: 'un', quantity: 1, order: 2 },
      { categoryCode: '15', item: '15.2', type: 'Pedras', subtype: 'MF.16', zone: 'IS Master 02', descriptionPT: 'Fornecimento e assentamento de tampo de bancada e lavatório em pedra natural', descriptionEN: 'Supply and installation of counter tops and washbasin made of natural stone', unit: 'un', quantity: 1, order: 3 },
      { categoryCode: '15', item: '15.2.1', type: 'Pedras', subtype: 'MF.16', zone: 'IS Master 02', descriptionPT: 'Tampo de Bancada - 1,90m x 0,55m - 1,05 m2', descriptionEN: 'Counter Top - 1.90m x 0.55m - 1.05 m2', unit: 'un', quantity: 1, order: 4 },
      { categoryCode: '15', item: '15.2.2', type: 'Pedras', subtype: 'MF.16', zone: 'IS Master 02', descriptionPT: 'Lavatório - 0,45m x 0,32m x 0,20m', descriptionEN: 'Washbasin - 0.45m x 0.32m x 0.20m', unit: 'un', quantity: 2, order: 5 },
      { categoryCode: '15', item: '15.3', type: 'Pedras', subtype: 'MF.10', zone: 'I.S. Social', descriptionPT: 'Fornecimento e colocação de lavatório executado em pedra natural', descriptionEN: 'Supply and installation of washbasin made of natural stone', unit: 'un', quantity: 1, order: 6 },
      { categoryCode: '15', item: '15.3.1', type: 'Pedras', subtype: 'MF.10', zone: 'I.S. Social', descriptionPT: 'Lavatório - 1,20m x 0,50m x 0,90m', descriptionEN: 'Washbasin - 1.20m x 0.50m x 0.90m', unit: 'un', quantity: 1, order: 7 },
      { categoryCode: '15', item: '15.4', type: 'Pedras', subtype: 'MF.01', zone: 'Base TV', descriptionPT: 'Fornecimento e assentamento de tampo em pedra natural', descriptionEN: 'Supply and installation of countertop made of natural stone', unit: 'un', quantity: 1, order: 8 },
      { categoryCode: '15', item: '15.4.1', type: 'Pedras', subtype: 'MF.01', zone: 'Base TV', descriptionPT: 'Tampo - 3,06 m2', descriptionEN: 'Countertop - 3.06 m2', unit: 'un', quantity: 1, order: 9 },
      { categoryCode: '15', item: '15.5', type: 'Pedras', subtype: 'MF.18', zone: 'Cozinha', descriptionPT: 'Fornecimento e colocação de bancada e backsplash executados em pedra natural', descriptionEN: 'Supply and installation of countertop and backsplash made of natural stone', unit: 'un', quantity: 1, order: 10 },
      { categoryCode: '15', item: '15.5.1', type: 'Pedras', subtype: 'MF.18', zone: 'Cozinha', descriptionPT: 'Bancada - 2,06m x 0,60m x 0,70m', descriptionEN: 'Washbasin - 2.06m x 0.60m x 0.70m', unit: 'un', quantity: 1, order: 11 },
      { categoryCode: '15', item: '15.5', type: 'Pedras', subtype: 'MF.20', zone: 'IS Circulação', descriptionPT: 'Fornecimento e assentamento de tampo de bancada e lavatório em pedra natural', descriptionEN: 'Supply and installation of counter tops and washbasin made of natural stone', unit: 'un', quantity: 1, order: 12 },
      { categoryCode: '15', item: '15.5.1', type: 'Pedras', subtype: 'MF.20', zone: 'IS Circulação', descriptionPT: 'Tampo de Bancada - 1,90m x 0,55m - 1,05 m2', descriptionEN: 'Worktop - 1.90m x 0.55m - 1.05 m2', unit: 'un', quantity: 1, order: 13 },
      { categoryCode: '15', item: '15.5.2', type: 'Pedras', subtype: 'MF.20', zone: 'IS Circulação', descriptionPT: 'Lavatório - 0,45m x 0,32m x 0,20m', descriptionEN: 'Washbasin - 0.45m x 0.32m x 0.20m', unit: 'un', quantity: 1, order: 14 },

      // CATEGORIA 16: Resguardos de Duche e Espelhos
      { categoryCode: '16', item: '16.1', type: 'Vidraria', subtype: 'Espelho simples', zone: 'Geral', descriptionPT: 'Fornecimento e assentamento de espelho incolor com 5mm de espessura', descriptionEN: 'Supply and installation of a 5mm thick colourless mirror', unit: 'un', quantity: 1, order: 1 },
      { categoryCode: '16', item: '16.1.1', type: 'Vidraria', subtype: 'Espelho simples', zone: 'IS Master 02', descriptionPT: 'E.01 - 1,80 m x 1,45 m = 2,61 m2', descriptionEN: 'E.01 - 1.80 m x 1.45 m = 2.61 m2', unit: 'un', quantity: 1, order: 2 },
      { categoryCode: '16', item: '16.1.2', type: 'Vidraria', subtype: 'Espelho simples', zone: 'IS Circulação', descriptionPT: 'E.02 - 1,80 m x 1,45 m = 2,61 m2', descriptionEN: 'E.02 - 1.80 m x 1.45 m = 2.61 m2', unit: 'un', quantity: 1, order: 3 },
      { categoryCode: '16', item: '16.2', type: 'Vidraria', subtype: 'Espelho bronze', zone: 'Geral', descriptionPT: 'Fornecimento e assentamento de espelho bronze com 5mm de espessura', descriptionEN: 'Supply and installation of a 5mm thick bronze mirror', unit: 'un', quantity: 1, order: 4 },
      { categoryCode: '16', item: '16.2.1', type: 'Vidraria', subtype: 'Espelho bronze', zone: 'IS Social', descriptionPT: 'E.02 - 1,05 m x 2,35 m = 2,47 m2', descriptionEN: 'E.02 - 1.05 m x 2.35 m = 2.47 m2', unit: 'un', quantity: 1, order: 5 },
      { categoryCode: '16', item: '16.2.2', type: 'Vidraria', subtype: 'Espelho bronze', zone: 'Área Social', descriptionPT: 'E.03 - 6,78 m2', descriptionEN: 'E.03 - 6.78 m2', unit: 'un', quantity: 1, order: 6 },
      { categoryCode: '16', item: '16.3', type: 'Serralharia', subtype: 'Resguardos de Duche', zone: 'IS Master 02', descriptionPT: 'Fornecimento e aplicação de resguardos de duche de porta de batente em vidro incolor', descriptionEN: 'Supply and installation of shower enclosures for swing doors in 8mm toughened colourless glass', unit: 'un', quantity: 1, order: 7 },
      { categoryCode: '16', item: '16.3.1', type: 'Serralharia', subtype: 'Resguardos de Duche', zone: 'IS Master 02', descriptionPT: 'R.02 - 1,20 m x 1,85 m = 2,22 m2', descriptionEN: 'R.02 - 1.20 m x 1.85 m = 2.22 m2', unit: 'un', quantity: 1, order: 8 },
      { categoryCode: '16', item: '16.3.2', type: 'Serralharia', subtype: 'Resguardos de Duche', zone: 'IS Circulação', descriptionPT: 'R.03 - 1,15 m x 2,17 m = 2,50 m2', descriptionEN: 'R.03 - 1.15 m x 2.17 m = 2.50 m2', unit: 'un', quantity: 1, order: 9 },
      { categoryCode: '16', item: '16.4', type: 'Serralharia', subtype: 'Resguardos de Duche', zone: 'IS Master 01', descriptionPT: 'Fornecimento e aplicação de resguardos de duche de porta de correr em vidro incolor', descriptionEN: 'Supply and installation of 8mm tempered colourless glass sliding door shower enclosures', unit: 'un', quantity: 1, order: 10 },
      { categoryCode: '16', item: '16.4.1', type: 'Serralharia', subtype: 'Resguardos de Duche', zone: 'IS Master 01', descriptionPT: 'R.01 (Bathroom Master 01) - 1,85 m x 2,20 m = 4,07 m2', descriptionEN: 'R.01 (Bathroom Master 01) - 1.85 m x 2.20 m = 4.07 m2', unit: 'un', quantity: 1, order: 11 },

      // CATEGORIA 17: Equipamentos Sanitários
      { categoryCode: '17', item: '17.1', type: 'Transporte e Montagem', subtype: 'Montagem', zone: 'Geral', descriptionPT: 'Montagem de todos os artigos descritos neste capítulo', descriptionEN: 'Assembly of all the items described in this chapter', unit: 'un', quantity: 1, order: 1 },
      { categoryCode: '17', item: '17.1.1', type: 'Transporte e Montagem', subtype: 'Sanitários', zone: 'Geral', descriptionPT: 'Sanita', descriptionEN: 'Toilet', unit: 'un', quantity: 4, order: 2 },
      { categoryCode: '17', item: '17.1.2', type: 'Transporte e Montagem', subtype: 'Sanitários', zone: 'Geral', descriptionPT: 'Tampo de Sanita', descriptionEN: 'Toilet Seat', unit: 'un', quantity: 4, order: 3 },
      { categoryCode: '17', item: '17.1.3', type: 'Transporte e Montagem', subtype: 'Sanitários', zone: 'Geral', descriptionPT: 'Tanque de Sanita', descriptionEN: 'Flushing Tank System', unit: 'un', quantity: 4, order: 4 },
      { categoryCode: '17', item: '17.1.4', type: 'Transporte e Montagem', subtype: 'Sanitários', zone: 'Geral', descriptionPT: 'Par de Botões de Descarga', descriptionEN: 'Pair of Flush Buttons', unit: 'un', quantity: 4, order: 5 },
      { categoryCode: '17', item: '17.1.5', type: 'Transporte e Montagem', subtype: 'Sanitários', zone: 'Geral', descriptionPT: 'Sifão Cilíndrico de Lavatório', descriptionEN: 'Cylindrical Washbasin Siphon', unit: 'un', quantity: 5, order: 6 },
      { categoryCode: '17', item: '17.1.6', type: 'Transporte e Montagem', subtype: 'Sanitários', zone: 'Geral', descriptionPT: 'Válvula tic-tac', descriptionEN: 'Tic-tac Valve', unit: 'un', quantity: 5, order: 7 },
      { categoryCode: '17', item: '17.1.7', type: 'Transporte e Montagem', subtype: 'Sanitários', zone: 'Geral', descriptionPT: 'Misturadora de Lavatório de manipulo Duplo', descriptionEN: 'Basin Mixer', unit: 'un', quantity: 4, order: 8 },
      { categoryCode: '17', item: '17.1.8', type: 'Transporte e Montagem', subtype: 'Sanitários', zone: 'Geral', descriptionPT: 'Chuveiro de Teto', descriptionEN: 'Overhead Shower', unit: 'un', quantity: 3, order: 9 },
      { categoryCode: '17', item: '17.1.9', type: 'Transporte e Montagem', subtype: 'Sanitários', zone: 'Geral', descriptionPT: 'Misturadora de Parede com Torneira de Saída com sistema de fecho', descriptionEN: 'Wall-mounted mixer with pull-out tap with locking system', unit: 'un', quantity: 2, order: 10 },
      { categoryCode: '17', item: '17.1.10', type: 'Transporte e Montagem', subtype: 'Sanitários', zone: 'Geral', descriptionPT: 'Misturadora de Banheira com chuveiro de mão extraível', descriptionEN: 'Bathtub Mixer with Pull-out Hand Shower', unit: 'un', quantity: 1, order: 11 },
      { categoryCode: '17', item: '17.1.11', type: 'Transporte e Montagem', subtype: 'Sanitários', zone: 'Geral', descriptionPT: 'Torneira de Parede para Banheira', descriptionEN: 'Bathtub Wall Outlet', unit: 'un', quantity: 1, order: 12 },
      { categoryCode: '17', item: '17.1.12', type: 'Transporte e Montagem', subtype: 'Sanitários', zone: 'Geral', descriptionPT: 'Set de drenagem para banheiras especiais', descriptionEN: 'Drainage Set for special baths', unit: 'un', quantity: 1, order: 13 },
      { categoryCode: '17', item: '17.1.13', type: 'Transporte e Montagem', subtype: 'Sanitários', zone: 'Geral', descriptionPT: 'Calha Duche', descriptionEN: 'Shower Rail', unit: 'un', quantity: 2, order: 14 },
      { categoryCode: '17', item: '17.2', type: 'Sanitários', subtype: 'Sanitários', zone: 'Geral', descriptionPT: 'Fornecimento dos artigos listados abaixo, conforme projeto', descriptionEN: 'Supply of the items listed below, according to the project', unit: 'vg', quantity: 1, order: 15 },
      { categoryCode: '17', item: '17.2.1', type: 'Sanitários', subtype: 'Tanque de Descarga', zone: 'Geral', descriptionPT: 'Fornecimento de Tanque de Descarga, tipo GEBERIT, modelo SIGMA', descriptionEN: 'Supply of Unloading Tank, GEBERIT type, model SIGMA', unit: 'un', quantity: 4, order: 16 },
      { categoryCode: '17', item: '17.2.2', type: 'Sanitários', subtype: 'Par de Botões de Descarga', zone: 'Geral', descriptionPT: 'Fornecimento de par de botões de descarga dupla PULL, ref.: PUL06', descriptionEN: 'Supply of a pair of PULL double flush buttons, ref.: PUL06', unit: 'un', quantity: 4, order: 17 },
      { categoryCode: '17', item: '17.2.3', type: 'Sanitários', subtype: 'Sanita', zone: 'Geral', descriptionPT: 'Fornecimento de sanita, tipo FLAMINIA, modelo MONO NOKÉ gosilent', descriptionEN: 'Supply of toilet, FLAMINIA type, MONO NOKÉ model', unit: 'un', quantity: 3, order: 18 },
      { categoryCode: '17', item: '17.2.4', type: 'Sanitários', subtype: 'Tampa de Sanita', zone: 'Geral', descriptionPT: 'Fornecimento de tampa de sanita, tipo FLAMINIA, modelo MONO', descriptionEN: 'Supply of toiletseat, FLAMINIA type, MONO model', unit: 'un', quantity: 3, order: 19 },
      { categoryCode: '17', item: '17.2.5', type: 'Sanitários', subtype: 'Sanita', zone: 'Geral', descriptionPT: 'Fornecimento de sanita, tipo FLAMINIA, modelo MONO NOKÉ, acabamento black glossy finish', descriptionEN: 'Supply of toilet, FLAMINIA type, MONO NOKÉ model, black glossy finish', unit: 'un', quantity: 1, order: 20 },
      { categoryCode: '17', item: '17.2.6', type: 'Sanitários', subtype: 'Tampa de Sanita', zone: 'Geral', descriptionPT: 'Fornecimento de tampa de sanita, tipo FLAMINIA, modelo MONO, acabamento black glossy finish', descriptionEN: 'Supply of toilet seat, FLAMINIA type, MONO model, black glossy finish', unit: 'un', quantity: 1, order: 21 },
      { categoryCode: '17', item: '17.2.7', type: 'Sanitários', subtype: 'Misturadora de Lavatório de manipulo Duplo', zone: 'Geral', descriptionPT: 'Fornecimento de misturadora de lavatório tipo GESSI, modelo Inciso, acabamento Aged Bronze', descriptionEN: 'Supply of GESSI basin mixer, model Inciso, Aged Bronze finish', unit: 'un', quantity: 4, order: 22 },
      { categoryCode: '17', item: '17.2.8', type: 'Sanitários', subtype: 'Sifão Cilíndrico de Lavatório', zone: 'Geral', descriptionPT: 'Fornecimento de sifão cilíndrico de lavatório, tipo SANINDUSA, acabamento Preto mate', descriptionEN: 'Supply of cylindrical washbasin siphon, type SANINDUSA, matt black finish', unit: 'un', quantity: 4, order: 23 },
      { categoryCode: '17', item: '17.2.9', type: 'Sanitários', subtype: 'Válvula', zone: 'Geral', descriptionPT: 'Fornecimento de válvula, tipo GESSI, acabamento Aged Bronze', descriptionEN: 'Supply of GESSI type valve, Aged Bronze finish', unit: 'un', quantity: 4, order: 24 },
      { categoryCode: '17', item: '17.2.10', type: 'Sanitários', subtype: 'Chuveiro de Teto', zone: 'Geral', descriptionPT: 'Fornecimento de Chuveiro de Teto Embutido - 3 vias, tipo ANTONIO LUPI, modelo GHOSTCOMBILED', descriptionEN: 'Supply of Recessed Ceiling Shower - 3-way, type ANTONIO LUPI, model GHOSTCOMBILED', unit: 'un', quantity: 3, order: 25 },
      { categoryCode: '17', item: '17.2.11', type: 'Sanitários', subtype: 'Misturadora de Saída 4 vias com sistema de fecho', zone: 'Geral', descriptionPT: 'Fornecimento de Misturadora de Ducha com inversor 4 vias, tipo GESSI, modelo Inciso', descriptionEN: 'Supply of shower mixer with 4-way inverter, type GESSI, model Inciso', unit: 'un', quantity: 2, order: 26 },
      { categoryCode: '17', item: '17.2.12', type: 'Sanitários', subtype: 'Chuveiro de Mão + Mangueira Flexível', zone: 'Geral', descriptionPT: 'Chuveiro Monocomando + Torneira de Água + Mangueira Flexível 1,50m, tipo GESSI, modelo Inciso', descriptionEN: 'Single-lever shower + water tap + 1.50m flexible hose, GESSI type, Inciso model', unit: 'un', quantity: 3, order: 27 },
      { categoryCode: '17', item: '17.2.13', type: 'Sanitários', subtype: 'Encastrável de misturadora de duche', zone: 'Geral', descriptionPT: 'Peça Encastrável Termostático - 4 Vias, tipo GESSI, modelo Inciso', descriptionEN: '4-way thermostatic flush-mounted part, type GESSI, model Inciso', unit: 'un', quantity: 2, order: 28 },
      { categoryCode: '17', item: '17.2.14', type: 'Sanitários', subtype: 'Calha Duche', zone: 'Geral', descriptionPT: 'Calha Duche / usar a existente. Conforme projeto', descriptionEN: 'Shower gutter / use the existing one. As per project', unit: 'un', quantity: 3, order: 29 },
      { categoryCode: '17', item: '17.2.15', type: 'Sanitários', subtype: 'Torneira de Saída 5 vias com sistema de fecho', zone: 'Geral', descriptionPT: 'Fornecimento de Misturadora de Ducha com inversor 5 vias, tipo GESSI, modelo Inciso', descriptionEN: 'Supply of shower mixer with 5-way inverter, type GESSI, model Inciso', unit: 'un', quantity: 1, order: 30 },
      { categoryCode: '17', item: '17.2.16', type: 'Sanitários', subtype: 'Encastrável de misturadora de duche', zone: 'Geral', descriptionPT: 'Peça Encastrável Termostático - 5 Vias, tipo GESSI, modelo Inciso', descriptionEN: '5-way thermostatic flush-mounted part, type GESSI, model Inciso', unit: 'un', quantity: 1, order: 31 },
      { categoryCode: '17', item: '17.2.17', type: 'Sanitários', subtype: 'Bica de Banheira de Parede + Mangueira Flexível', zone: 'Geral', descriptionPT: 'Bica de Banheira de Parede, tipo GESSI, modelo Inciso, acabamento Aged Bronze', descriptionEN: 'Single-lever shower + water tap + 1.50m flexible hose, GESSI type, Inciso model', unit: 'un', quantity: 1, order: 32 },
      { categoryCode: '17', item: '17.2.18', type: 'Sanitários', subtype: 'Chuveiro de Mão + Mangueira Flexível', zone: 'Geral', descriptionPT: 'Válvula de Banheira com Bica de Enchimento, tipo GESSI, modelo Inciso', descriptionEN: 'Single-lever shower + water tap + 1.50m flexible hose, GESSI type, Inciso model', unit: 'un', quantity: 1, order: 33 },

      // CATEGORIA 18: Diversos
      { categoryCode: '18', item: '18.1', type: 'Limpeza', subtype: 'Limpeza de Obra', zone: 'Geral', descriptionPT: 'Realização de Limpeza Geral de Obra', descriptionEN: 'Carrying out General Construction Cleaning', unit: 'vg', quantity: 1, order: 1 }
    ];

    // 6. Inserir itens MQT
    let insertedCount = 0;
    for (const item of mqtItems) {
      const categoryId = categoryMap[item.categoryCode];
      
      await connection.execute(
        `INSERT INTO mqtItems 
        (constructionId, categoryId, code, typePt, typeEn, subtypePt, subtypeEn, zonePt, zoneEn, descriptionPt, descriptionEn, unit, quantity, \`order\`) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          constructionId,
          categoryId,
          item.item,
          item.type,
          item.type, // typeEn = typePt (mesmo valor)
          item.subtype,
          item.subtype, // subtypeEn = subtypePt
          item.zone,
          item.zone, // zoneEn = zonePt
          item.descriptionPT,
          item.descriptionEN,
          item.unit,
          item.quantity,
          item.order
        ]
      );
      insertedCount++;
    }

    console.log(`\n✅ ${insertedCount} itens MQT inseridos com sucesso!\n`);
    console.log('📊 Resumo por categoria:');
    
    // 7. Exibir resumo
    const [summary] = await connection.execute(`
      SELECT 
        c.code,
        c.namePt,
        c.nameEn,
        COUNT(i.id) as itemCount
      FROM mqtCategories c
      LEFT JOIN mqtItems i ON c.id = i.categoryId
      WHERE c.constructionId = ?
      GROUP BY c.id
      ORDER BY c.\`order\`
    `, [constructionId]);

    summary.forEach(row => {
      console.log(`   ${row.code.padEnd(3)} - ${row.namePt.padEnd(50)} / ${row.nameEn.padEnd(50)} : ${row.itemCount} itens`);
    });

    console.log('\n🎉 Seed completo! MQT da GA00466_Penthouse SI populado com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante seed:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

seedMQTComplete();
