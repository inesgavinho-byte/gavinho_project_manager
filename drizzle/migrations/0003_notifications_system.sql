-- Drop old notifications table if exists
DROP TABLE IF EXISTS notifications;

-- Create new notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  type ENUM('ai_alert', 'deadline_warning', 'budget_exceeded', 'project_delayed', 'task_overdue', 'order_pending', 'system') NOT NULL,
  priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium' NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  projectId INT,
  taskId INT,
  isRead INT DEFAULT 0 NOT NULL,
  readAt TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX userId_idx (userId),
  INDEX type_idx (type),
  INDEX priority_idx (priority),
  INDEX isRead_idx (isRead)
);

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notificationPreferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL UNIQUE,
  aiAlerts INT DEFAULT 1 NOT NULL,
  deadlineWarnings INT DEFAULT 1 NOT NULL,
  budgetAlerts INT DEFAULT 1 NOT NULL,
  projectDelays INT DEFAULT 1 NOT NULL,
  taskOverdue INT DEFAULT 1 NOT NULL,
  orderPending INT DEFAULT 1 NOT NULL,
  systemNotifications INT DEFAULT 1 NOT NULL,
  deadlineWarningDays INT DEFAULT 7 NOT NULL,
  budgetThreshold INT DEFAULT 90 NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL
);
