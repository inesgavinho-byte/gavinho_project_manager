-- Add phaseId column to projectDocuments table
ALTER TABLE projectDocuments ADD COLUMN phaseId INT NULL AFTER projectId;

-- Add index for phaseId
CREATE INDEX phaseId_idx ON projectDocuments(phaseId);

-- Update category enum to include 'render' and 'approval'
ALTER TABLE projectDocuments MODIFY COLUMN category ENUM('contract', 'plan', 'license', 'invoice', 'drawing', 'specification', 'photo', 'report', 'render', 'approval', 'other') NOT NULL DEFAULT 'other';
