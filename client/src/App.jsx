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
  getLists,
  createList,
  getStoredUser,
  removeToken,
} from './api';
import TodoList from './components/TodoList';
import TodoForm from './components/TodoForm';
import TodoDetail from './components/TodoDetail';
import Dashboard from './components/Dashboard';
import ListSelector from './components/ListSelector';
import CreateListModal from './components/CreateListModal';
import ListManageModal from './components/ListManageModal';
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
  const [lists, setLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState(null);
  const [showCreateList, setShowCreateList] = useState(false);
  const [manageList, setManageList] = useState(null);
  const [filterSearch, setFilterSearch] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterCompleted, setFilterCompleted] = useState(''); // '' = all, '0' = pending, '1' = completed

  const loadLists = async () => {
    try {
      const data = await getLists();
      setLists(data);
    } catch (_) {}
  };

  useEffect(() => {
    const u = getStoredUser();
    if (u) setUser(u);
  }, []);

  const loadTodos = async (filterOverride) => {
    try {
      setError(null);
      setLoading(true);
      const search = filterOverride?.search !== undefined ? filterOverride.search : filterSearch;
      const dateFrom = filterOverride?.date_from !== undefined ? filterOverride.date_from : filterDateFrom;
      const dateTo = filterOverride?.date_to !== undefined ? filterOverride.date_to : filterDateTo;
      const completed = filterOverride?.completed !== undefined ? filterOverride.completed : filterCompleted;
      const data = await getTodos({
        search: (search && String(search).trim()) || undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        completed: completed === '0' || completed === '1' ? completed : undefined,
      });
      setTodos(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = (filters) => {
    loadTodos({
      search: filters?.search,
      date_from: filters?.date_from,
      date_to: filters?.date_to,
      completed: filters?.completed,
    });
  };

  useEffect(() => {
    if (!user) return;
    loadTodos();
    loadLists();
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
    const list_id = selectedListId || undefined;
    if (files && files.length > 0) {
      await createTodoWithDocuments({ title, description, files, list_id });
    } else {
      await createTodo({ title, description, list_id });
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

  const filteredTodos =
    selectedListId == null
      ? todos.filter((t) => !t.list_id && t.is_owner)
      : todos.filter((t) => t.list_id === selectedListId);

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

      {showCreateList && (
        <CreateListModal
          onClose={() => setShowCreateList(false)}
          onCreate={async (name) => {
            await createList(name);
            loadLists();
          }}
        />
      )}

      {manageList && (
        <ListManageModal
          listId={manageList.id}
          listName={manageList.name}
          currentUserId={user?.id}
          onClose={() => setManageList(null)}
          onUpdated={() => {
            loadLists();
            loadTodos();
          }}
          onDeleted={() => {
            setManageList(null);
            setSelectedListId(null);
            loadLists();
            loadTodos();
          }}
        />
      )}

      <main className="app-main">
        {showProfile ? (
          <Profile user={user} onBack={() => setShowProfile(false)} />
        ) : loading ? (
          <p className="loading">Loading…</p>
        ) : (
          <>
            <div className="app-list-bar">
              <ListSelector
                lists={lists}
                selectedListId={selectedListId}
                onSelect={setSelectedListId}
                onNewList={() => setShowCreateList(true)}
                onManageList={setManageList}
              />
            </div>
            <Dashboard
              todos={filteredTodos}
              filterSearch={filterSearch}
              filterDateFrom={filterDateFrom}
              filterDateTo={filterDateTo}
              filterCompleted={filterCompleted}
              onFilterSearchChange={setFilterSearch}
              onFilterDateFromChange={setFilterDateFrom}
              onFilterDateToChange={setFilterDateTo}
              onFilterCompletedChange={setFilterCompleted}
              onApplyFilters={handleApplyFilters}
            />
            <TodoList
              todos={filteredTodos}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onToggle={handleToggle}
              onDelete={handleDelete}
              showListBadge
            />
            {selectedTodo && (
              <TodoDetail
                todo={selectedTodo}
                canEdit={selectedTodo?.can_edit !== false}
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
