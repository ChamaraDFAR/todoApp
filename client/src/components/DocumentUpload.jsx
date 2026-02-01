import { useState, useRef } from 'react';
import './DocumentUpload.css';

const ALLOWED = '.pdf, .doc, .docx, .txt, .png, .jpg, .jpeg, .gif';
const MAX_MB = 10;

function DocumentUpload({ onUpload }) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    const valid = /\.(pdf|doc|docx|txt|png|jpg|jpeg|gif)$/i.test(file.name);
    if (!valid) {
      setError('Allowed: ' + ALLOWED);
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Max size: ${MAX_MB} MB`);
      return;
    }
    setError(null);
    setUploading(true);
    try {
      await onUpload(file);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const onDragLeave = () => setDragging(false);

  const onInputChange = (e) => {
    const file = e.target.files[0];
    handleFile(file);
    e.target.value = '';
  };

  return (
    <div className="document-upload">
      <div
        className={`upload-zone ${dragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif"
          onChange={onInputChange}
          className="upload-input"
          disabled={uploading}
        />
        {uploading ? (
          <span>Uploading…</span>
        ) : (
          <span>Drop a file here or click to upload ({ALLOWED}, max {MAX_MB} MB)</span>
        )}
      </div>
      {error && <p className="upload-error">{error}</p>}
    </div>
  );
}

export default DocumentUpload;
