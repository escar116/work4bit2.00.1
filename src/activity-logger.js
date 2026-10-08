// Activity & System Audit Logger for Work4abit
// Oversees all actions happening by users with timestamp, user profile, details, modules, and filtering.

const LOGS_STORAGE_KEY_PREFIX = 'w4a_activity_logs_';
export const GLOBAL_AUDIT_LOGS_KEY = 'w4a_global_audit_logs';

// The 10 exact permitted action types:
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

export function formatFullDateTime(timestamp) {
  if (!timestamp) return 'Just now';
  try {
    const d = new Date(timestamp);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  } catch (e) {
    return 'Just now';
  }
}

export function formatRelativeTime(timestamp) {
  if (!timestamp) return 'Just now';
  const now = Date.now();
  const diff = now - timestamp;
  if (diff < 45000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 86400000 * 2) return 'Yesterday';
  if (diff < 86400000 * 7) return `${Math.floor(diff / 86400000)}d ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getActionModule(action) {
  switch ((action || '').toLowerCase().trim()) {
    case 'log in':
    case 'log out':
      return 'Security & Auth';
    case 'post':
    case 'delete':
      return 'Marketplace';
    case 'apply':
      return 'Proposals & Bids';
    case 'get accepted':
      return 'Contracts';
    case 'complete transaction':
      return 'Escrow & Orders';
    case 'terminate':
      return 'Disputes & Cancellations';
    case 'rate':
      return 'Reviews & Reputation';
    case 'message':
      return 'Direct Chat';
    default:
      return 'System Core';
  }
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

// Global Platform-wide Audit Logs for Admin Overseeing All Users
export function getGlobalAuditLogs() {
  try {
    let globalLogs = [];
    const raw = localStorage.getItem(GLOBAL_AUDIT_LOGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) globalLogs = parsed;
    }

    // Also scan any individual user logs in localStorage to aggregate unrecorded actions
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey && storageKey.startsWith(LOGS_STORAGE_KEY_PREFIX)) {
        try {
          const userLogsRaw = localStorage.getItem(storageKey);
          if (userLogsRaw) {
            const userLogs = JSON.parse(userLogsRaw);
            if (Array.isArray(userLogs)) {
              userLogs.forEach(entry => {
                if (!globalLogs.some(g => g.id === entry.id)) {
                  globalLogs.push({
                    ...entry,
                    userId: entry.userId || storageKey.replace(LOGS_STORAGE_KEY_PREFIX, ''),
                    userName: entry.userName || 'Student User',
                    userEmail: entry.userEmail || '',
                    studentId: entry.studentId || 'N/A',
                    userRole: entry.userRole || 'Student Freelancer',
                    module: entry.module || getActionModule(entry.action),
                    device: entry.device || 'Chromium / Web Desktop',
                    clientIp: entry.clientIp || '192.168.1.104'
                  });
                }
              });
            }
          }
        } catch (err) {
          // Ignore individual parsing failures
        }
      }
    }

    globalLogs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
    return globalLogs;
  } catch (e) {
    console.error('Failed to get global audit logs', e);
    return [];
  }
}

export function saveGlobalAuditLogs(logs) {
  try {
    localStorage.setItem(GLOBAL_AUDIT_LOGS_KEY, JSON.stringify((logs || []).slice(0, 1000)));
  } catch (e) {
    console.error('Failed to save global audit logs', e);
  }
}

export function clearGlobalAuditLogs() {
  try {
    localStorage.removeItem(GLOBAL_AUDIT_LOGS_KEY);
    window.dispatchEvent(new CustomEvent('w4a:global_logs_cleared'));
  } catch (e) {
    console.error('Failed to clear global audit logs', e);
  }
}

export function logUserAction(actionType, details = '', userId = null, metadata = {}) {
  const currentUserId = userId || window.__currentUser?.uid || window.__currentUserData?.id;
  if (!currentUserId && !metadata.userId) return null;

  const effectiveUserId = currentUserId || metadata.userId;
  const normalized = (actionType || '').toLowerCase().trim();
  const matchedType = VALID_ACTION_TYPES.find(t => t === normalized) || normalized;

  // Resolve user profile details
  let userName = metadata.userName;
  let userEmail = metadata.userEmail;
  let studentId = metadata.studentId;
  let userRole = metadata.userRole;

  if (window.__usersMap && window.__usersMap.has(effectiveUserId)) {
    const cached = window.__usersMap.get(effectiveUserId);
    if (!userName) userName = cached.fullName || cached.displayName;
    if (!userEmail) userEmail = cached.email;
    if (!studentId) studentId = cached.studentId;
    if (!userRole) userRole = cached.preferredRole || cached.role;
  }

  if (window.__currentUserData && (window.__currentUserData.id === effectiveUserId || window.__currentUserData.uid === effectiveUserId)) {
    if (!userName) userName = window.__currentUserData.fullName;
    if (!userEmail) userEmail = window.__currentUserData.email;
    if (!studentId) studentId = window.__currentUserData.studentId;
    if (!userRole) userRole = window.__currentUserData.preferredRole;
  }

  if (window.__currentUser && window.__currentUser.uid === effectiveUserId) {
    if (!userName) userName = window.__currentUser.displayName || (window.__currentUser.email ? window.__currentUser.email.split('@')[0] : 'User');
    if (!userEmail) userEmail = window.__currentUser.email;
  }

  // 1. Personal user log entry
  const userEntry = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    action: matchedType,
    details: details || '',
    timestamp: Date.now(),
    device: 'Chromium / Web Desktop'
  };

  if (effectiveUserId) {
    const logs = getUserLogs(effectiveUserId);
    logs.unshift(userEntry);
    saveUserLogs(effectiveUserId, logs);
  }

  // 2. Global platform audit record for Admin
  const globalEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    action: matchedType,
    details: details || '',
    timestamp: Date.now(),
    userId: effectiveUserId,
    userName: userName || (effectiveUserId ? `User (${effectiveUserId.slice(0, 6)})` : 'Campus Student'),
    userEmail: userEmail || '',
    studentId: studentId || 'N/A',
    userRole: userRole || 'Student Freelancer',
    module: getActionModule(matchedType),
    device: 'Chromium / Web Desktop',
    clientIp: '192.168.1.104'
  };

  const globalLogs = getGlobalAuditLogs();
  globalLogs.unshift(globalEntry);
  saveGlobalAuditLogs(globalLogs);

  // Dispatch events for real-time reactivity
  window.dispatchEvent(new CustomEvent('w4a:action_logged', { detail: userEntry }));
  window.dispatchEvent(new CustomEvent('w4a:global_action_logged', { detail: globalEntry }));

  return globalEntry;
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

export function exportAuditLogsAsJson(logs = null) {
  const data = logs || getGlobalAuditLogs();
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `work4abit_system_audit_logs_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function exportAuditLogsAsCsv(logs = null) {
  const data = logs || getGlobalAuditLogs();
  const headers = [
    'Timestamp',
    'Date & Time',
    'Relative Time',
    'User Name',
    'User Email',
    'Student ID',
    'User Role',
    'Action Type',
    'Module / Scope',
    'Details',
    'Client Device',
    'Client IP'
  ];

  const escapeCsv = (str) => {
    if (str === null || str === undefined) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = data.map(item => [
    item.timestamp || '',
    formatFullDateTime(item.timestamp),
    formatRelativeTime(item.timestamp),
    escapeCsv(item.userName),
    escapeCsv(item.userEmail),
    escapeCsv(item.studentId),
    escapeCsv(item.userRole),
    escapeCsv(item.action?.toUpperCase()),
    escapeCsv(item.module || getActionModule(item.action)),
    escapeCsv(item.details),
    escapeCsv(item.device || 'Chromium / Web Desktop'),
    escapeCsv(item.clientIp || '192.168.1.104')
  ].join(','));

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `work4abit_system_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// Seed historical audit logs across all users for presentation and admin audit oversight
export function seedHistoricalAuditLogsIfEmpty(users = [], requests = [], applications = []) {
  const existing = getGlobalAuditLogs();
  if (existing.length >= 8) return existing;

  const now = Date.now();
  const m = 60 * 1000;
  const h = 60 * m;
  const d = 24 * h;

  const seeded = [
    // Today: Active administrative & user actions
    {
      id: 'audit_seed_01',
      timestamp: now - 3 * m,
      action: 'log in',
      details: 'Administrator session authenticated via secure portal',
      userId: 'u_admin_test4',
      userName: 'Test Four',
      userEmail: 'test4@email.com',
      studentId: '2023-01004',
      userRole: 'Administrator',
      module: 'Security & Auth',
      device: 'Chromium / Web Desktop',
      clientIp: '192.168.1.104'
    },
    {
      id: 'audit_seed_02',
      timestamp: now - 18 * m,
      action: 'post',
      details: 'Posted service offer: "3D Printing & Rapid Prototyping (PLA/PETG/Resin)" (₱150)',
      userId: 'u_test5',
      userName: 'Test Five',
      userEmail: 'test5@email.com',
      studentId: '2023-01054',
      userRole: 'Student Freelancer',
      module: 'Marketplace',
      device: 'Chromium / Web Desktop',
      clientIp: '192.168.1.105'
    },
    {
      id: 'audit_seed_03',
      timestamp: now - 22 * m,
      action: 'post',
      details: 'Posted service offer: "Precision Laser Cutting & Engraving (Acrylic/Wood)" (₱250)',
      userId: 'u_test5',
      userName: 'Test Five',
      userEmail: 'test5@email.com',
      studentId: '2023-01054',
      userRole: 'Student Freelancer',
      module: 'Marketplace',
      device: 'Chromium / Web Desktop',
      clientIp: '192.168.1.105'
    },
    {
      id: 'audit_seed_04',
      timestamp: now - 25 * m,
      action: 'post',
      details: 'Posted service offer: "High-Quality Ink & Document Printing (A4/Booklet)" (₱5)',
      userId: 'u_test5',
      userName: 'Test Five',
      userEmail: 'test5@email.com',
      studentId: '2023-01054',
      userRole: 'Student Freelancer',
      module: 'Marketplace',
      device: 'Chromium / Web Desktop',
      clientIp: '192.168.1.105'
    },
    {
      id: 'audit_seed_05',
      timestamp: now - 45 * m,
      action: 'apply',
      details: 'Ordered service: "3D Printing & Rapid Prototyping (PLA/PETG/Resin)" (₱150)',
      userId: 'u_charles',
      userName: 'Charles Jan Paraggua',
      userEmail: 'charlesjanparaggua@gmail.com',
      studentId: '2023-10482',
      userRole: 'Student Client',
      module: 'Proposals & Bids',
      device: 'Chromium / Web Desktop',
      clientIp: '192.168.1.102'
    },
    {
      id: 'audit_seed_06',
      timestamp: now - 52 * m,
      action: 'get accepted',
      details: 'Order accepted for "3D Printing & Rapid Prototyping" with Test Five',
      userId: 'u_test5',
      userName: 'Test Five',
      userEmail: 'test5@email.com',
      studentId: '2023-01054',
      userRole: 'Student Freelancer',
      module: 'Contracts',
      device: 'Chromium / Web Desktop',
      clientIp: '192.168.1.105'
    },
    {
      id: 'audit_seed_07',
      timestamp: now - 58 * m,
      action: 'message',
      details: 'Sent message: "Hi Test Five! I uploaded the STL 3D model for the drone casing."',
      userId: 'u_charles',
      userName: 'Charles Jan Paraggua',
      userEmail: 'charlesjanparaggua@gmail.com',
      studentId: '2023-10482',
      userRole: 'Student Client',
      module: 'Direct Chat',
      device: 'Chromium / Web Desktop',
      clientIp: '192.168.1.102'
    },
    {
      id: 'audit_seed_08',
      timestamp: now - 62 * m,
      action: 'message',
      details: 'Sent message: "Got it! Slicing right now with 0.2mm layer height and PETG filament."',
      userId: 'u_test5',
      userName: 'Test Five',
      userEmail: 'test5@email.com',
      studentId: '2023-01054',
      userRole: 'Student Freelancer',
      module: 'Direct Chat',
      device: 'Chromium / Web Desktop',
      clientIp: '192.168.1.105'
    },
    {
      id: 'audit_seed_09',
      timestamp: now - 2 * h,
      action: 'log in',
      details: 'Signed in as test5@email.com',
      userId: 'u_test5',
      userName: 'Test Five',
      userEmail: 'test5@email.com',
      studentId: '2023-01054',
      userRole: 'Student Freelancer',
      module: 'Security & Auth',
      device: 'Chromium / Web Desktop',
      clientIp: '192.168.1.105'
    },

    // Yesterday: Transactions, ratings, and listing interactions
    {
      id: 'audit_seed_10',
      timestamp: now - 18 * h,
      action: 'complete transaction',
      details: 'Completed transaction for "Precision Laser Cutting & Engraving"',
      userId: 'u_test5',
      userName: 'Test Five',
      userEmail: 'test5@email.com',
      studentId: '2023-01054',
      userRole: 'Student Freelancer',
      module: 'Escrow & Orders',
      device: 'Chromium / Web Desktop',
      clientIp: '192.168.1.105'
    },
    {
      id: 'audit_seed_11',
      timestamp: now - 18 * h - 2 * m,
      action: 'rate',
      details: 'Rated Test Five 5 stars: "Fast turnaround time and extremely clean laser edge cuts!"',
      userId: 'u_charles',
      userName: 'Charles Jan Paraggua',
      userEmail: 'charlesjanparaggua@gmail.com',
      studentId: '2023-10482',
      userRole: 'Student Client',
      module: 'Reviews & Reputation',
      device: 'Chromium / Web Desktop',
      clientIp: '192.168.1.102'
    },
    {
      id: 'audit_seed_12',
      timestamp: now - 22 * h,
      action: 'log in',
      details: 'Signed in as noel@university.edu',
      userId: 'u_noel',
      userName: 'Engr. Noel Villanueva',
      userEmail: 'noel@university.edu',
      studentId: 'FAC-01',
      userRole: 'Faculty Adviser',
      module: 'Security & Auth',
      device: 'Chromium / Web Desktop',
      clientIp: '192.168.1.80'
    },
    {
      id: 'audit_seed_13',
      timestamp: now - 23 * h,
      action: 'post',
      details: 'Posted service request: "Circuit Schematic & PCB Review" (₱1,200)',
      userId: 'u_noel',
      userName: 'Engr. Noel Villanueva',
      userEmail: 'noel@university.edu',
      studentId: 'FAC-01',
      userRole: 'Faculty Adviser',
      module: 'Marketplace',
      device: 'Chromium / Web Desktop',
      clientIp: '192.168.1.80'
    },
    {
      id: 'audit_seed_14',
      timestamp: now - 25 * h,
      action: 'apply',
      details: 'Applied for: "Circuit Schematic & PCB Review" (₱1,200)',
      userId: 'u_anna',
      userName: 'Dr. Anna Salcedo',
      userEmail: 'anna@university.edu',
      studentId: '2022-90124',
      userRole: 'Student Freelancer',
      module: 'Proposals & Bids',
      device: 'Chromium / Web Desktop',
      clientIp: '192.168.1.88'
    },
    {
      id: 'audit_seed_15',
      timestamp: now - 26 * h,
      action: 'get accepted',
      details: 'Application approved for "Circuit Schematic & PCB Review"',
      userId: 'u_noel',
      userName: 'Engr. Noel Villanueva',
      userEmail: 'noel@university.edu',
      studentId: 'FAC-01',
      userRole: 'Faculty Adviser',
      module: 'Contracts',
      device: 'Chromium / Web Desktop',
      clientIp: '192.168.1.80'
    },

    // Past 2 to 4 days: Earlier platform achievements & contracts
    {
      id: 'audit_seed_16',
      timestamp: now - 2 * d,
      action: 'complete transaction',
      details: 'Completed transaction for "Arduino Firmware for Water IoT"',
      userId: 'u_anna',
      userName: 'Dr. Anna Salcedo',
      userEmail: 'anna@university.edu',
      studentId: '2022-90124',
      userRole: 'Student Freelancer',
      module: 'Escrow & Orders',
      device: 'Chromium / Web Desktop',
      clientIp: '192.168.1.88'
    },
    {
      id: 'audit_seed_17',
      timestamp: now - 2 * d - 10 * m,
      action: 'rate',
      details: 'Rated Dr. Anna Salcedo 5 stars: "Firmware was thoroughly tested and well-commented."',
      userId: 'u_charles',
      userName: 'Charles Jan Paraggua',
      userEmail: 'charlesjanparaggua@gmail.com',
      studentId: '2023-10482',
      userRole: 'Student Client',
      module: 'Reviews & Reputation',
      device: 'Chromium / Web Desktop',
      clientIp: '192.168.1.102'
    },
    {
      id: 'audit_seed_18',
      timestamp: now - 3 * d,
      action: 'complete transaction',
      details: 'Completed transaction for "Laser Cutting Acrylic Chassis"',
      userId: 'u_maria',
      userName: 'Maria Santos',
      userEmail: 'maria@university.edu',
      studentId: '2024-34011',
      userRole: 'Student Freelancer',
      module: 'Escrow & Orders',
      device: 'Chromium / Web Desktop',
      clientIp: '192.168.1.92'
    },
    {
      id: 'audit_seed_19',
      timestamp: now - 3 * d - 1 * h,
      action: 'post',
      details: 'Posted service request: "CAD 3D Modeling for Robotics" (₱800)',
      userId: 'u_ashley',
      userName: 'Ashley Esmarin',
      userEmail: 'ashelyesmarin@gmail.com',
      studentId: '2023-04421',
      userRole: 'Student Client',
      module: 'Marketplace',
      device: 'Chromium / Web Desktop',
      clientIp: '192.168.1.110'
    },
    {
      id: 'audit_seed_20',
      timestamp: now - 3 * d - 3 * h,
      action: 'apply',
      details: 'Applied for: "CAD 3D Modeling for Robotics" (₱800)',
      userId: 'u_rovillos',
      userName: 'Rovillos Mark',
      userEmail: 'rovillos@gmail.com',
      studentId: '2023-08819',
      userRole: 'Student Freelancer',
      module: 'Proposals & Bids',
      device: 'Chromium / Web Desktop',
      clientIp: '192.168.1.115'
    },
    {
      id: 'audit_seed_21',
      timestamp: now - 4 * d,
      action: 'log out',
      details: 'Signed out from session',
      userId: 'u_admin_test4',
      userName: 'Test Four',
      userEmail: 'test4@email.com',
      studentId: '2023-01004',
      userRole: 'Administrator',
      module: 'Security & Auth',
      device: 'Chromium / Web Desktop',
      clientIp: '192.168.1.104'
    }
  ];

  // Merge any existing with seeded
  const merged = [...existing];
  seeded.forEach(s => {
    if (!merged.some(m => m.id === s.id)) {
      merged.push(s);
    }
  });

  merged.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  saveGlobalAuditLogs(merged);
  return merged;
}

// User Personal Seed (kept for backwards-compatibility)
export function seedInitialLogsIfEmpty(userId, userData, requests = [], applications = []) {
  if (!userId) return [];
  const logs = getUserLogs(userId);
  if (logs.length > 0) return logs;

  const initial = [];

  // Initial log in action
  initial.push({
    id: `seed_login_${Date.now()}`,
    action: 'log in',
    details: `Signed in as ${userData?.email || 'student'}`,
    timestamp: Date.now() - 1000 * 60 * 15,
    device: 'Chromium / Web Desktop'
  });

  // User's own posted listings (action: 'post')
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

  // User's applications (actions: 'apply', 'get accepted', 'complete transaction')
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
