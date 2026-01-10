-- Inserir 18 projetos reais extraídos dos contratos
-- Status mapping: signed → in_progress, in_progress → in_progress, draft → planning

INSERT INTO projects (name, description, status, priority, clientName, location, createdById, progress, createdAt, updatedAt) VALUES
('POP.001.2025 - Moradia Da Guia', 'Projeto Arquitetura e Especialidades', 'in_progress', 'medium', 'Cliente Moradia Da Guia', 'Guia, Cascais', 1, 25, NOW(), NOW()),
('POP.007.2025 - Oeiras Houses S+Kes', 'Projeto Arquitetura e Especialidades', 'in_progress', 'medium', 'Cliente Oeiras Houses', 'Oeiras', 1, 25, NOW(), NOW()),
('POP.008.2025 - Moradia António Saldanha', 'Projeto Arquitetura e Especialidades', 'in_progress', 'medium', 'Thais Manso', 'A definir', 1, 25, NOW(), NOW()),
('POP.010.2025 - Gestão de Projeto', 'Projeto Arquitetura e Especialidades', 'planning', 'medium', 'Cliente Gestão de Projeto', 'A definir', 1, 0, NOW(), NOW()),
('POP.017.2025 - Castilho 3', 'Projeto Arquitetura e Especialidades', 'in_progress', 'medium', 'Cliente Castilho 3', 'Lisboa', 1, 15, NOW(), NOW()),
('POP.011.2024 - Algarve Archviz', 'Projeto Arquitetura e Especialidades', 'planning', 'medium', 'Cliente Algarve Archviz', 'Algarve', 1, 0, NOW(), NOW()),
('POP.013.2024 - Shalva Bukia Obra', 'Projeto Arquitetura e Especialidades', 'in_progress', 'medium', 'Shalva Bukia', 'A definir', 1, 25, NOW(), NOW()),
('POP.014.2024 - Decor Restelo', 'Projeto Arquitetura e Especialidades', 'in_progress', 'medium', 'Cliente Decor Restelo', 'Restelo, Lisboa', 1, 25, NOW(), NOW()),
('POP.022.2024 - Myriad Hotel', 'Projeto Arquitetura e Especialidades', 'in_progress', 'high', 'Myriad Hotel', 'Parque das Nações, Lisboa', 1, 25, NOW(), NOW()),
('POP.026.2024 - 3ª Decor', 'Projeto Arquitetura e Especialidades', 'in_progress', 'medium', 'Cliente 3ª Decor', 'A definir', 1, 25, NOW(), NOW()),
('POP.029.2024 - Moradia Cascais Lote 3', 'Projeto Arquitetura e Especialidades', 'in_progress', 'medium', 'Cliente Moradia Cascais', 'Cascais', 1, 25, NOW(), NOW()),
('POP.033.2024 - Edifício Oeiras', 'Projeto Arquitetura e Especialidades', 'planning', 'medium', 'Cliente Edifício Oeiras', 'Oeiras', 1, 0, NOW(), NOW()),
('POP.035.2024 - Shalva Bukia Decor', 'Projeto Arquitetura e Especialidades', 'in_progress', 'medium', 'Shalva Bukia', 'A definir', 1, 25, NOW(), NOW()),
('POP.037.2024 - PIP Algarve', 'Projeto Arquitetura e Especialidades', 'planning', 'medium', 'Cliente PIP Algarve', 'Algarve', 1, 0, NOW(), NOW()),
('POP.044.2024 - Amelita Lote 12', 'Projeto Arquitetura e Especialidades', 'planning', 'medium', 'Cliente Amelita', 'A definir', 1, 0, NOW(), NOW()),
('POP.054.2024 - Vilas Cinquo', 'Projeto Arquitetura e Especialidades', 'in_progress', 'medium', 'SL Investment Unipessoal Lda', 'A definir', 1, 15, NOW(), NOW()),
('POP.055.2024 - Edifício Amadora Zume', 'Projeto Arquitetura e Especialidades', 'in_progress', 'medium', 'Zume', 'Amadora', 1, 25, NOW(), NOW());
