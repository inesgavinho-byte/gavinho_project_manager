CREATE TABLE IF NOT EXISTS activityFeed (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  actorId INT NOT NULL,
  activityType ENUM('scenario_created', 'scenario_updated', 'scenario_shared', 'scenario_commented', 'scenario_favorited', 'scenario_deleted') NOT NULL,
  scenarioId INT,
  projectId INT,
  metadata TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_userId (userId),
  INDEX idx_actorId (actorId),
  INDEX idx_scenarioId (scenarioId),
  INDEX idx_createdAt (createdAt)
);
