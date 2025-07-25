const API_BASE = 'http://localhost:3000';

export async function createReminder(reminder: any) {
  const res = await fetch(`${API_BASE}/reminders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reminder),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to create reminder');
  return res.json();
}

export async function updateReminder(id: string, update: any) {
  const res = await fetch(`${API_BASE}/reminders/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(update),
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to update reminder');
  return res.json();
}

export async function deleteReminder(id: string) {
  const res = await fetch(`${API_BASE}/reminders/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete reminder');
  return res.json();
} 