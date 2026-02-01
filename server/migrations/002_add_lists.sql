-- Run if you already have todos table and want shared lists. Fresh installs: use schema.sql.

USE todo_app;

CREATE TABLE IF NOT EXISTS lists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  owner_id INT NOT NULL,
  name VARCHAR(255) NOT NULL DEFAULT 'Untitled list',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_owner_id (owner_id)
);

CREATE TABLE IF NOT EXISTS list_members (
  list_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('editor', 'viewer') NOT NULL DEFAULT 'editor',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (list_id, user_id),
  FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

ALTER TABLE todos ADD COLUMN list_id INT NULL;
ALTER TABLE todos ADD CONSTRAINT fk_todos_list FOREIGN KEY (list_id) REFERENCES lists(id) ON DELETE SET NULL;
CREATE INDEX idx_list_id ON todos (list_id);
