import './TodoList.css';

function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

function TodoList({ todos, selectedId, onSelect, onToggle, onDelete, showListBadge }) {
  if (todos.length === 0) {
    return (
      <div className="todo-list empty">
        <p>No todos yet.</p>
        <p className="hint">Click “New Todo” to add one.</p>
      </div>
    );
  }

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <li
          key={todo.id}
          className={`todo-item ${todo.completed ? 'completed' : ''} ${selectedId === todo.id ? 'selected' : ''}`}
        >
          <div className="todo-item-main">
            {todo.can_edit !== false ? (
              <button
                type="button"
                className="checkbox"
                onClick={() => onToggle(todo)}
                aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
              >
                {todo.completed ? '✓' : ''}
              </button>
            ) : (
              <span className="checkbox readonly" aria-hidden>{todo.completed ? '✓' : ''}</span>
            )}
            <button
              type="button"
              className="todo-content"
              onClick={() => onSelect(todo.id)}
            >
              <div className="todo-content-top">
                <span className="todo-title">{todo.title}</span>
                {showListBadge && todo.list_name && (
                  <span className="list-badge" title={todo.list_name}>{todo.list_name}</span>
                )}
                {todo.document_count > 0 && (
                  <span className="doc-badge">{todo.document_count} file{todo.document_count !== 1 ? 's' : ''}</span>
                )}
              </div>
              {todo.created_at && (
                <span className="todo-date">{formatDateTime(todo.created_at)}</span>
              )}
            </button>
            {(todo.can_edit !== false) && (
              <button
                type="button"
                className="btn btn-ghost btn-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Delete this todo and its documents?')) onDelete(todo.id);
                }}
                aria-label="Delete todo"
              >
                ×
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export default TodoList;
