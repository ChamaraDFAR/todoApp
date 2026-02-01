// Use backend port 5001 (5000 is often taken by macOS AirPlay)
const API = import.meta.env.DEV ? 'http://localhost:5001/api' : '/api';

async function checkRes(res) {
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `${res.status} ${res.statusText}`);
  }
}

export async function getTodos() {
  const res = await fetch(`${API}/todos`);
  await checkRes(res);
  return res.json();
}

export async function getTodo(id) {
  const res = await fetch(`${API}/todos/${id}`);
  await checkRes(res);
  return res.json();
}

export async function createTodo({ title, description }) {
  const res = await fetch(`${API}/todos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, description }),
  });
  await checkRes(res);
  return res.json();
}

export async function createTodoWithDocuments({ title, description, files }) {
  const form = new FormData();
  form.append('title', title || 'Untitled');
  form.append('description', description || '');
  (files || []).forEach((file) => form.append('files', file));
  const res = await fetch(`${API}/todos/with-documents`, {
    method: 'POST',
    body: form,
  });
  await checkRes(res);
  return res.json();
}

export async function updateTodo(id, data) {
  const res = await fetch(`${API}/todos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  await checkRes(res);
  return res.json();
}

export async function deleteTodo(id) {
  const res = await fetch(`${API}/todos/${id}`, { method: 'DELETE' });
  await checkRes(res);
  return res.json();
}

export async function uploadDocument(todoId, file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API}/todos/${todoId}/documents`, {
    method: 'POST',
    body: form,
  });
  await checkRes(res);
  return res.json();
}

export async function deleteDocument(todoId, docId) {
  const res = await fetch(`${API}/todos/${todoId}/documents/${docId}`, {
    method: 'DELETE',
  });
  await checkRes(res);
  return res.json();
}

export function documentDownloadUrl(todoId, docId) {
  return `${API}/todos/${todoId}/documents/${docId}`;
}
