-- Drop existing table
DROP TABLE IF EXISTS tasks;

-- Create tasks table
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'TODO',
    priority TEXT DEFAULT 'MEDIUM',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE')),
    CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH'))
);

-- Insert sample data
INSERT INTO tasks (title, description, status, priority) VALUES
    ('Setup Environment', 'Install tools', 'DONE', 'HIGH'),
    ('Learn Architecture', 'Study patterns', 'IN_PROGRESS', 'HIGH'),
    ('Build Application', 'Create Task Board', 'TODO', 'HIGH');