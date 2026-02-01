// Use backend port 5001 (5000 is often taken by macOS AirPlay)
const API = import.meta.env.DEV ? 'http://localhost:5001/api' : '/api';

const AUTH_KEY = 'todo_app_token';

export function getToken() {
  return localStorage.getItem(AUTH_KEY);
}

export function setToken(token) {
  localStorage.setItem(AUTH_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(AUTH_KEY);
}

export function isLoggedIn() {
  return !!getToken();
}

/** Decode JWT payload (no verification; used for display only). Returns { id, email } or null. */
export function getStoredUser() {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now() ? { id: payload.id, email: payload.email } : null;
  } catch (_) {
    return null;
  }
}

function authHeaders(extra = {}) {
  const token = getToken();
  return {
    ...extra,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function checkRes(res) {
  if (!res.ok) {
    const text = await res.text();
    let msg = text || `${res.status} ${res.statusText}`;
    try {
      const j = JSON.parse(text);
      if (j.error) msg = j.error;
    } catch (_) {}
    throw new Error(msg);
  }
}

// Auth
export async function login(email, password) {
  const res = await fetch(`${API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  await checkRes(res);
  return res.json();
}

export async function register(email, password) {
  const res = await fetch(`${API}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  await checkRes(res);
  return res.json();
}

export async function changePassword(currentPassword, newPassword) {
  const res = await fetch(`${API}/auth/password`, {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  await checkRes(res);
  return res.json();
}

/** Reset password from login page (email + current password + new password; no auth token). */
export async function resetPassword(email, currentPassword, newPassword) {
  const res = await fetch(`${API}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, currentPassword, newPassword }),
  });
  await checkRes(res);
  return res.json();
}

export async function getTodos() {
  const res = await fetch(`${API}/todos`, { headers: authHeaders() });
  await checkRes(res);
  return res.json();
}

export async function getTodo(id) {
  const res = await fetch(`${API}/todos/${id}`, { headers: authHeaders() });
  await checkRes(res);
  return res.json();
}

export async function createTodo({ title, description }) {
  const res = await fetch(`${API}/todos`, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
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
    headers: authHeaders(),
    body: form,
  });
  await checkRes(res);
  return res.json();
}

export async function updateTodo(id, data) {
  const res = await fetch(`${API}/todos/${id}`, {
    method: 'PUT',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(data),
  });
  await checkRes(res);
  return res.json();
}

export async function deleteTodo(id) {
  const res = await fetch(`${API}/todos/${id}`, { method: 'DELETE', headers: authHeaders() });
  await checkRes(res);
  return res.json();
}

export async function uploadDocument(todoId, file) {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API}/todos/${todoId}/documents`, {
    method: 'POST',
    headers: authHeaders(),
    body: form,
  });
  await checkRes(res);
  return res.json();
}

export async function deleteDocument(todoId, docId) {
  const res = await fetch(`${API}/todos/${todoId}/documents/${docId}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  await checkRes(res);
  return res.json();
}

/** Fetch document with auth and return { blob, filename } for programmatic download */
export async function downloadDocument(todoId, docId) {
  const res = await fetch(`${API}/todos/${todoId}/documents/${docId}`, { headers: authHeaders() });
  await checkRes(res);
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition');
  let filename = 'download';
  if (disposition) {
    const m = disposition.match(/filename="?([^";]+)"?/);
    if (m) filename = m[1].trim();
  }
  return { blob, filename };
}
