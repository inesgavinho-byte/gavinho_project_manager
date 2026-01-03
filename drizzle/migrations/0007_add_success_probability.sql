ALTER TABLE whatIfScenarios 
ADD COLUMN successProbability INT,
ADD COLUMN criticalFactors TEXT,
ADD COLUMN riskFactors TEXT,
ADD COLUMN mitigationStrategies TEXT,
ADD COLUMN confidenceLevel ENUM('low', 'medium', 'high') DEFAULT 'medium';
