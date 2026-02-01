import { useState } from 'react';
import TodoForm from './TodoForm';
import DocumentUpload from './DocumentUpload';
import {
  updateTodo,
  deleteDocument,
  downloadDocument,
} from '../api';
import './TodoDetail.css';

function TodoDetail({ todo, canEdit = true, onClose, onUpdate, onDelete, onUpload, onDeleteDoc }) {
  const [downloading, setDownloading] = useState(null);
  const [editing, setEditing] = useState(false);
  const documents = todo.documents || [];

  const handleSaveEdit = async (title, description) => {
    await updateTodo(todo.id, { title, description });
    onUpdate({ title, description });
    setEditing(false);
  };

  const handleDeleteDoc = async (docId) => {
    if (window.confirm('Remove this document?')) {
      await deleteDocument(todo.id, docId);
      onDeleteDoc(todo.id, docId);
    }
  };

  const handleDownload = async (doc) => {
    if (downloading === doc.id) return;
    setDownloading(doc.id);
    try {
      const { blob, filename } = await downloadDocument(todo.id, doc.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (_) {}
    setDownloading(null);
  };

  return (
    <div className="todo-detail">
      <div className="todo-detail-header">
        <button type="button" className="btn btn-ghost btn-icon close-btn" onClick={onClose} aria-label="Close">
          ×
        </button>
      </div>

      {editing ? (
        <TodoForm
          initialTitle={todo.title || ''}
          initialDescription={todo.description || ''}
          onSubmit={handleSaveEdit}
          onCancel={() => setEditing(false)}
          submitLabel="Save"
        />
      ) : (
        <>
          <div className="todo-detail-content">
            <h2 className="todo-detail-title">{todo.title}</h2>
            {todo.description && (
              <p className="todo-detail-description">{todo.description}</p>
            )}
            {canEdit && (
              <div className="todo-detail-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setEditing(true)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    if (window.confirm('Delete this todo and its documents?')) onDelete();
                  }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>

          <section className="todo-documents">
            <h3>Documents</h3>
            {canEdit && <DocumentUpload onUpload={onUpload} />}
            {documents.length === 0 ? (
              <p className="no-docs">{canEdit ? 'No documents attached.' : 'No documents.'}</p>
            ) : (
              <ul className="document-list">
                {documents.map((doc) => (
                  <li key={doc.id} className="document-item">
                    <button
                      type="button"
                      className="document-name document-link"
                      onClick={() => handleDownload(doc)}
                      disabled={downloading === doc.id}
                    >
                      {doc.original_name}
                    </button>
                    {canEdit && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon"
                        onClick={() => handleDeleteDoc(doc.id)}
                        aria-label="Remove document"
                      >
                        ×
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default TodoDetail;
