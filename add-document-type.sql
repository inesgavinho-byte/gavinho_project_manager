-- Add documentType column to projectDocuments table
ALTER TABLE projectDocuments ADD COLUMN documentType ENUM('design_review', 'project_management') NOT NULL DEFAULT 'design_review' AFTER phaseId;

-- Add index for documentType
CREATE INDEX documentType_idx ON projectDocuments(documentType);

-- Update category enum to include new administrative categories
ALTER TABLE projectDocuments MODIFY COLUMN category ENUM(
  'plan', 'drawing', 'specification', 'render', 'approval', 'photo', 'report',
  'contract', 'invoice', 'receipt', 'meeting_minutes', 'correspondence', 'legal_document', 'other'
) NOT NULL DEFAULT 'other';
