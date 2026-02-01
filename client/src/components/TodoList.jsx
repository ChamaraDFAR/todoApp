import './TodoList.css';

function TodoList({ todos, selectedId, onSelect, onToggle, onDelete }) {
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
            <button
              type="button"
              className="checkbox"
              onClick={() => onToggle(todo)}
              aria-label={todo.completed ? 'Mark incomplete' : 'Mark complete'}
            >
              {todo.completed ? '✓' : ''}
            </button>
            <button
              type="button"
              className="todo-content"
              onClick={() => onSelect(todo.id)}
            >
              <span className="todo-title">{todo.title}</span>
              {todo.document_count > 0 && (
                <span className="doc-badge">{todo.document_count} file{todo.document_count !== 1 ? 's' : ''}</span>
              )}
            </button>
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
          </div>
        </li>
      ))}
    </ul>
  );
}

export default TodoList;
