-- Run this only if you already have todos table without user_id (existing DB).
-- Fresh installs: use schema.sql instead.

USE todo_app;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);

-- Add user_id; create a default user and assign existing todos to it
INSERT IGNORE INTO users (id, email, password_hash) VALUES (1, 'migrate@local', 'migrate');
ALTER TABLE todos ADD COLUMN user_id INT NULL;
UPDATE todos SET user_id = 1 WHERE user_id IS NULL;
ALTER TABLE todos MODIFY user_id INT NOT NULL;
ALTER TABLE todos ADD CONSTRAINT fk_todos_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX idx_user_id ON todos (user_id);
