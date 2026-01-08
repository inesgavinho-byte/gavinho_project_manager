CREATE TABLE IF NOT EXISTS materialSuggestions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  projectId INT NOT NULL,
  suggestedMaterialId INT NOT NULL,
  reason TEXT NOT NULL,
  confidence DECIMAL(5, 2) NOT NULL,
  status ENUM('pending', 'accepted', 'rejected') DEFAULT 'pending' NOT NULL,
  matchFactors TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  respondedAt TIMESTAMP NULL,
  respondedById INT NULL,
  FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (suggestedMaterialId) REFERENCES libraryMaterials(id) ON DELETE CASCADE,
  FOREIGN KEY (respondedById) REFERENCES users(id),
  INDEX materialSuggestion_project_idx (projectId),
  INDEX materialSuggestion_material_idx (suggestedMaterialId),
  INDEX materialSuggestion_status_idx (status)
);
