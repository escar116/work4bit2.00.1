// Activity & Audit Logger for Work4abit
const LOGS_STORAGE_KEY_PREFIX = 'w4a_activity_logs_';

export function getLogsStorageKey(userId) {
  return `${LOGS_STORAGE_KEY_PREFIX}${userId || 'guest'}`;
}

export function getUserLogs(userId) {
  try {
    const raw = localStorage.getItem(getLogsStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to parse activity logs', e);
    return [];
  }
}

export function saveUserLogs(userId, logs) {
  try {
    localStorage.setItem(getLogsStorageKey(userId), JSON.stringify(logs.slice(0, 500)));
  } catch (e) {
    console.error('Failed to save activity logs', e);
  }
}

export function logUserAction(action, details, category = 'General', status = 'success', userId = null) {
  const currentUserId = userId || window.__currentUser?.uid || 'guest';
  const logs = getUserLogs(currentUserId);
  const newEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    action,
    details: details || '',
    category, // 'Applications', 'Services', 'Messages', 'Orders', 'Profile', 'Security', 'Search', 'General'
    status, // 'completed', 'pending', 'success', 'info', 'rejected'
    timestamp: Date.now(),
    device: 'Chromium / Web Desktop'
  };
  logs.unshift(newEntry);
  saveUserLogs(currentUserId, logs);

  window.dispatchEvent(new CustomEvent('w4a:action_logged', { detail: newEntry }));
  return newEntry;
}

export function clearUserLogs(userId) {
  const currentUserId = userId || window.__currentUser?.uid || 'guest';
  try {
    localStorage.removeItem(getLogsStorageKey(currentUserId));
    window.dispatchEvent(new CustomEvent('w4a:logs_cleared'));
  } catch (e) {
    console.error('Failed to clear logs', e);
  }
}

export function exportLogsAsJson(userId, userName = 'student') {
  const logs = getUserLogs(userId);
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `work4abit_activity_logs_${userName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function seedInitialLogsIfEmpty(userId, userData, requests = [], applications = []) {
  const logs = getUserLogs(userId);
  if (logs.length >= 3) return logs;

  const initial = [];

  if (userData) {
    initial.push({
      id: `seed_acc_${userData.id || 'usr'}`,
      action: 'Account Verified & Synchronized',
      details: `Active profile: ${userData.fullName || 'Student'} · ID: ${userData.studentId || 'Verified'} · Faculty: ${userData.facultyReference || 'Engineering'}`,
      category: 'Profile',
      status: 'success',
      timestamp: userData.createdAt ? new Date(userData.createdAt).getTime() : Date.now() - 86400000 * 5,
      device: 'System Audit'
    });
  }

  if (Array.isArray(requests)) {
    requests.forEach(req => {
      const isOffer = req.type === 'OFFER' || (req.tags && req.tags.includes('STANDING_OFFER'));
      initial.push({
        id: `seed_req_${req.id}`,
        action: isOffer ? 'Created Service Offer' : 'Published Service Request',
        details: `"${req.title}" in ${req.category || 'General'} · Budget: ₱${Number(req.budget || 0).toLocaleString()}`,
        category: 'Services',
        status: req.status === 'COMPLETED' ? 'completed' : 'success',
        timestamp: req.createdAt ? new Date(req.createdAt).getTime() : Date.now() - 86400000 * 3,
        device: 'Web Client'
      });
    });
  }

  if (Array.isArray(applications)) {
    applications.forEach(app => {
      const isMine = app.applicantId === userId;
      initial.push({
        id: `seed_app_${app.id}`,
        action: isMine ? 'Submitted Proposal / Order' : 'Received Peer Proposal',
        details: `${isMine ? 'Proposed' : 'Agreed'} amount: ₱${Number(app.proposedAmount || 0).toLocaleString()} · Status: ${app.status}`,
        category: 'Applications',
        status: app.status === 'APPROVED' || app.status === 'COMPLETED' ? 'success' : app.status === 'PENDING' ? 'pending' : 'info',
        timestamp: app.createdAt ? new Date(app.createdAt).getTime() : Date.now() - 86400000,
        device: 'Web Client'
      });
    });
  }

  initial.unshift({
    id: `seed_session_${Date.now()}`,
    action: 'Session Initialized',
    details: 'Authenticated workspace environment ready with live audit telemetry.',
    category: 'Security',
    status: 'info',
    timestamp: Date.now() - 1000 * 60 * 10,
    device: 'Chromium / Windows'
  });

  initial.sort((a, b) => b.timestamp - a.timestamp);
  saveUserLogs(userId, initial);
  return initial;
}
