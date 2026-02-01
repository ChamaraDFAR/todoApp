# Todo List App with Document Upload

A full-stack todo list app with document upload, built with **Node.js**, **React**, and **MySQL**.

## Features

- Create, edit, complete, and delete todos
- Attach documents to each todo (PDF, DOC, DOCX, TXT, images; max 10 MB)
- Drag-and-drop or click to upload
- Download or remove attached documents
- Dark UI with responsive layout

## Tech Stack

- **Backend:** Node.js, Express, MySQL (mysql2), Multer (file uploads)
- **Frontend:** React 18, Vite
- **Database:** MySQL

## Setup

### 1. Database

Create the database and tables:

```bash
mysql -u root -p < server/schema.sql
```

Or run the SQL in `server/schema.sql` in your MySQL client (create database `todo_app`, then the `todos` and `documents` tables).

### 2. Backend

```bash
cd server
cp .env.example .env
# Edit .env with your MySQL host, user, password, and database name
npm install
npm run dev
```

Server runs at **http://localhost:5001** (5000 is often used by macOS AirPlay).

### 3. Frontend

```bash
cd client
npm install
npm run dev
```

App runs at **http://localhost:3000** and proxies API requests to the backend.

### 4. Environment (server/.env)

| Variable         | Description              | Example    |
|------------------|--------------------------|------------|
| PORT             | Server port              | 5001       |
| MYSQL_HOST       | MySQL host               | localhost  |
| MYSQL_USER       | MySQL user               | root       |
| MYSQL_PASSWORD   | MySQL password           | (your pwd) |
| MYSQL_DATABASE   | Database name            | todo_app   |

## Project Structure

```
Todo app DFAR/
├── client/                 # React (Vite) frontend
│   ├── src/
│   │   ├── components/     # TodoList, TodoForm, TodoDetail, DocumentUpload
│   │   ├── api.js         # API client
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
├── server/                 # Node.js backend
│   ├── routes/todos.js    # CRUD + document upload/download/delete
│   ├── upload.js         # Multer config
│   ├── db.js             # MySQL pool
│   ├── schema.sql        # DB schema
│   └── index.js
└── README.md
```

## API Overview

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/todos | List all todos (with document count) |
| GET | /api/todos/:id | Get one todo with documents |
| POST | /api/todos | Create todo |
| PUT | /api/todos/:id | Update todo |
| DELETE | /api/todos/:id | Delete todo and its documents |
| POST | /api/todos/:id/documents | Upload file (multipart) |
| GET | /api/todos/:todoId/documents/:docId | Download file |
| DELETE | /api/todos/:todoId/documents/:docId | Delete document |

## Allowed file types

PDF, DOC, DOCX, TXT, PNG, JPG, JPEG, GIF — max 10 MB per file.
