import { useState, useEffect } from 'react';
import {
  getTodos,
  getTodo,
  createTodo,
  createTodoWithDocuments,
  updateTodo,
  deleteTodo,
  uploadDocument,
  deleteDocument,
  getStoredUser,
  removeToken,
} from './api';
import TodoList from './components/TodoList';
import TodoForm from './components/TodoForm';
import TodoDetail from './components/TodoDetail';
import Dashboard from './components/Dashboard';
import Auth from './components/Auth';
import Profile from './components/Profile';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedTodoDetail, setSelectedTodoDetail] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    const u = getStoredUser();
    if (u) setUser(u);
  }, []);

  const loadTodos = async () => {
    try {
      setError(null);
      const data = await getTodos();
      setTodos(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    loadTodos();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (!selectedId) {
      setSelectedTodoDetail(null);
      return;
    }
    getTodo(selectedId).then(setSelectedTodoDetail).catch(() => setSelectedTodoDetail(null));
  }, [user, selectedId]);

  const handleLoggedIn = (u) => {
    setUser(u);
  };

  const handleLogout = () => {
    removeToken();
    setUser(null);
    setTodos([]);
    setSelectedId(null);
    setSelectedTodoDetail(null);
  };

  if (!user) {
    return <Auth onLoggedIn={handleLoggedIn} />;
  }

  const handleCreate = async (title, description, files = []) => {
    if (files && files.length > 0) {
      await createTodoWithDocuments({ title, description, files });
    } else {
      await createTodo({ title, description });
    }
    await loadTodos();
    setShowForm(false);
  };

  const handleToggle = async (todo) => {
    await updateTodo(todo.id, { completed: todo.completed ? 0 : 1 });
    await loadTodos();
    if (selectedId === todo.id) setSelectedId(null);
  };

  const handleUpdate = async (id, data) => {
    await updateTodo(id, data);
    await loadTodos();
    setSelectedId(null);
  };

  const handleDelete = async (id) => {
    await deleteTodo(id);
    await loadTodos();
    if (selectedId === id) setSelectedId(null);
  };

  const refreshSelectedTodo = async () => {
    if (selectedId) {
      try {
        const detail = await getTodo(selectedId);
        setSelectedTodoDetail(detail);
      } catch (_) {}
    }
  };

  const handleUpload = async (todoId, file) => {
    await uploadDocument(todoId, file);
    await loadTodos();
    await refreshSelectedTodo();
  };

  const handleDeleteDoc = async (todoId, docId) => {
    await deleteDocument(todoId, docId);
    await loadTodos();
    await refreshSelectedTodo();
  };

  const selectedTodo = selectedTodoDetail || (selectedId ? todos.find((t) => t.id === selectedId) : null);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-row">
          <div>
            <h1>Todo List</h1>
            <p className="tagline">Tasks & documents in one place</p>
          </div>
          <div className="app-header-actions">
            {user?.email && (
              <span className="user-email">{user.email}</span>
            )}
            <button type="button" className="btn btn-primary" onClick={() => setShowForm(true)}>
              + New Todo
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowProfile(true)}>
              Profile
            </button>
            <button type="button" className="btn btn-ghost" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="banner error">
          {error}
          <button type="button" onClick={() => setError(null)} aria-label="Dismiss">×</button>
        </div>
      )}

      {showForm && (
        <TodoForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
          submitLabel="Add Todo"
          allowDocuments
        />
      )}

      {showProfile && (
        <Profile user={user} onClose={() => setShowProfile(false)} />
      )}

      <main className="app-main">
        {loading ? (
          <p className="loading">Loading…</p>
        ) : (
          <>
            <Dashboard todos={todos} />
            <TodoList
              todos={todos}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
            {selectedTodo && (
              <TodoDetail
                todo={selectedTodo}
                onClose={() => setSelectedId(null)}
                onUpdate={(data) => handleUpdate(selectedTodo.id, data)}
                onDelete={() => handleDelete(selectedTodo.id)}
                onUpload={(file) => handleUpload(selectedTodo.id, file)}
                onDeleteDoc={handleDeleteDoc}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
