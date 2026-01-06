-- Migração: Associar ArchViz a Projetos ao invés de Obras
-- Este script preserva todos os dados existentes

-- 1. Adicionar coluna temporária projectId em archvizCompartments
ALTER TABLE archvizCompartments ADD COLUMN projectId INT;

-- 2. Popul ar projectId com base em constructionId
UPDATE archvizCompartments ac
JOIN constructions c ON ac.constructionId = c.id
SET ac.projectId = c.projectId;

-- 3. Tornar projectId NOT NULL e adicionar índice
ALTER TABLE archvizCompartments 
MODIFY COLUMN projectId INT NOT NULL,
ADD INDEX projectId_idx (projectId);

-- 4. Remover constructionId e seu índice
ALTER TABLE archvizCompartments 
DROP INDEX constructionId_idx,
DROP COLUMN constructionId;

-- 5. Adicionar coluna projectId em archvizRenders
ALTER TABLE archvizRenders ADD COLUMN projectId INT;

-- 6. Popul ar projectId com base em constructionId
UPDATE archvizRenders ar
JOIN constructions c ON ar.constructionId = c.id
SET ar.projectId = c.projectId;

-- 7. Tornar projectId NOT NULL e adicionar índice
ALTER TABLE archvizRenders 
MODIFY COLUMN projectId INT NOT NULL,
ADD INDEX projectId_idx (projectId);

-- 8. Remover constructionId e seu índice, tornar compartmentId opcional
ALTER TABLE archvizRenders 
DROP INDEX constructionId_idx,
DROP COLUMN constructionId,
MODIFY COLUMN compartmentId INT NULL;

SELECT 'Migração concluída com sucesso!' as status;
