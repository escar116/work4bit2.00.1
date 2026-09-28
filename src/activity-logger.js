// Activity Logger for Work4abit - Strictly Per User & Exact Action Types
const LOGS_STORAGE_KEY_PREFIX = 'w4a_activity_logs_';

// The 10 exact permitted action types requested by user:
// 'log in', 'log out', 'message', 'apply', 'post', 'delete', 'get accepted', 'terminate', 'complete transaction', 'rate'
export const VALID_ACTION_TYPES = [
  'log in',
  'log out',
  'message',
  'apply',
  'post',
  'delete',
  'get accepted',
  'terminate',
  'complete transaction',
  'rate'
];

export function getLogsStorageKey(userId) {
  if (!userId) return null;
  return `${LOGS_STORAGE_KEY_PREFIX}${userId}`;
}

export function getUserLogs(userId) {
  const key = getLogsStorageKey(userId);
  if (!key) return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to parse user activity logs', e);
    return [];
  }
}

export function saveUserLogs(userId, logs) {
  const key = getLogsStorageKey(userId);
  if (!key) return;
  try {
    localStorage.setItem(key, JSON.stringify(logs.slice(0, 500)));
  } catch (e) {
    console.error('Failed to save user activity logs', e);
  }
}

export function logUserAction(actionType, details = '', userId = null) {
  const currentUserId = userId || window.__currentUser?.uid;
  if (!currentUserId) return null;

  const normalized = (actionType || '').toLowerCase().trim();
  const matchedType = VALID_ACTION_TYPES.find(t => t === normalized) || normalized;

  const logs = getUserLogs(currentUserId);
  const newEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    action: matchedType, // e.g. 'log in', 'post', 'apply', etc.
    details: details || '',
    timestamp: Date.now(),
    device: 'Chromium / Web Desktop'
  };
  logs.unshift(newEntry);
  saveUserLogs(currentUserId, logs);

  window.dispatchEvent(new CustomEvent('w4a:action_logged', { detail: newEntry }));
  return newEntry;
}

export function clearUserLogs(userId) {
  const key = getLogsStorageKey(userId);
  if (!key) return;
  try {
    localStorage.removeItem(key);
    window.dispatchEvent(new CustomEvent('w4a:logs_cleared'));
  } catch (e) {
    console.error('Failed to clear user logs', e);
  }
}

export function exportLogsAsJson(userId, userName = 'student') {
  const logs = getUserLogs(userId);
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `work4abit_logs_${userName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function seedInitialLogsIfEmpty(userId, userData, requests = [], applications = []) {
  if (!userId) return [];
  const logs = getUserLogs(userId);
  if (logs.length > 0) return logs;

  const initial = [];

  // 1. Initial log in action
  initial.push({
    id: `seed_login_${Date.now()}`,
    action: 'log in',
    details: `Signed in as ${userData?.email || 'student'}`,
    timestamp: Date.now() - 1000 * 60 * 15,
    device: 'Chromium / Web Desktop'
  });

  // 2. User's own posted listings (action: 'post')
  if (Array.isArray(requests)) {
    requests.filter(r => r.requesterId === userId || r.requester?.id === userId).forEach(req => {
      const isOffer = req.type === 'OFFER' || (req.tags && req.tags.includes('STANDING_OFFER'));
      initial.push({
        id: `seed_post_${req.id}`,
        action: 'post',
        details: isOffer ? `Posted service offer: "${req.title}" (₱${Number(req.budget || 0).toLocaleString()})` : `Posted service request: "${req.title}" (₱${Number(req.budget || 0).toLocaleString()})`,
        timestamp: req.createdAt ? new Date(req.createdAt).getTime() : Date.now() - 86400000 * 2,
        device: 'Chromium / Web Desktop'
      });
    });
  }

  // 3. User's applications (actions: 'apply', 'get accepted', 'complete transaction')
  if (Array.isArray(applications)) {
    applications.forEach(app => {
      if (app.applicantId === userId) {
        initial.push({
          id: `seed_apply_${app.id}`,
          action: 'apply',
          details: `Applied with rate offer ₱${Number(app.priceOffer || app.proposedAmount || 0).toLocaleString()} for "${app.helpRequest?.title || 'Listing'}"`,
          timestamp: app.createdAt ? new Date(app.createdAt).getTime() : Date.now() - 86400000,
          device: 'Chromium / Web Desktop'
        });

        if (app.status === 'APPROVED' || app.status === 'COMPLETED') {
          initial.push({
            id: `seed_accepted_${app.id}`,
            action: 'get accepted',
            details: `Application approved for "${app.helpRequest?.title || 'Listing'}"`,
            timestamp: app.createdAt ? new Date(app.createdAt).getTime() + 3600000 : Date.now() - 43200000,
            device: 'Chromium / Web Desktop'
          });
        }

        if (app.status === 'COMPLETED') {
          initial.push({
            id: `seed_complete_${app.id}`,
            action: 'complete transaction',
            details: `Completed transaction for "${app.helpRequest?.title || 'Listing'}"`,
            timestamp: Date.now() - 1000 * 60 * 60,
            device: 'Chromium / Web Desktop'
          });
        }
      }
    });
  }

  initial.sort((a, b) => b.timestamp - a.timestamp);
  saveUserLogs(userId, initial);
  return initial;
}
