import { useState, useRef } from 'react';
import './TodoForm.css';

const ALLOWED = /\.(pdf|doc|docx|txt|png|jpg|jpeg|gif)$/i;
const MAX_MB = 10;

function TodoForm({ onSubmit, onCancel, submitLabel = 'Save', initialTitle = '', initialDescription = '', allowDocuments = false }) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [files, setFiles] = useState([]);
  const [fileError, setFileError] = useState(null);
  const fileInputRef = useRef(null);

  const addFiles = (newFiles) => {
    setFileError(null);
    const valid = [];
    for (const file of Array.from(newFiles || [])) {
      if (!ALLOWED.test(file.name)) {
        setFileError('Allowed: .pdf, .doc, .docx, .txt, .png, .jpg, .jpeg, .gif');
        continue;
      }
      if (file.size > MAX_MB * 1024 * 1024) {
        setFileError(`Max size: ${MAX_MB} MB per file`);
        continue;
      }
      valid.push(file);
    }
    setFiles((prev) => [...prev, ...valid]);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (allowDocuments) {
      onSubmit(title.trim() || 'Untitled', description.trim(), files);
    } else {
      onSubmit(title.trim() || 'Untitled', description.trim());
    }
  };

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Todo title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="todo-form-input"
        autoFocus
      />
      <textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="todo-form-textarea"
        rows={2}
      />
      {allowDocuments && (
        <div className="todo-form-documents">
          <div
            className="todo-form-upload-zone"
            onDrop={(e) => { e.preventDefault(); addFiles(e.dataTransfer.files); }}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif"
              multiple
              className="upload-input"
              onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
            />
            Add documents (optional) — drop or click (max {MAX_MB} MB each)
          </div>
          {files.length > 0 && (
            <ul className="todo-form-file-list">
              {files.map((f, i) => (
                <li key={i}>
                  <span className="todo-form-file-name">{f.name}</span>
                  <button type="button" className="btn btn-ghost btn-icon" onClick={() => removeFile(i)} aria-label="Remove">×</button>
                </li>
              ))}
            </ul>
          )}
          {fileError && <p className="upload-error">{fileError}</p>}
        </div>
      )}
      <div className="todo-form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

export default TodoForm;
