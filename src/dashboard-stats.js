// Pure aggregation: one application is one engagement, regardless of the user's role.
export function summarizeDashboard(submitted, received, listings, isOffer, now = new Date()) {
  const posts = new Map(listings.map(post => [post.id, post]));
  const records = new Map();
  for (const [side, applications] of [['submitted', submitted], ['received', received]]) {
    for (const application of applications) {
      if (records.has(application.id)) continue;
      const job = posts.get(application.helpRequest?.id) || application.helpRequest || {};
      const value = application.priceOffer ?? job.budget;
      const amount = value == null || value === '' ? null : Number(value);
      records.set(application.id, {
        side, status: String(application.status || 'UNKNOWN').toUpperCase(),
        earning: side === 'received' ? isOffer(job) : !isOffer(job),
        amount: Number.isFinite(amount) && amount >= 0 ? amount : null,
        date: application.createdAt ? new Date(application.createdAt) : null,
      });
    }
  }
  const rows = [...records.values()];
  const complete = rows.filter(row => row.status === 'COMPLETED');
  const sum = (earning) => complete.filter(row => row.earning === earning).reduce((total, row) => total + (row.amount ?? 0), 0);
  const statuses = [...new Set(['PENDING', 'APPROVED', 'COMPLETED', 'REJECTED', 'CANCELLED', 'TERMINATED', ...rows.map(row => row.status)])];
  const months = Array.from({ length: 6 }, (_, offset) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + offset, 1);
    const matches = rows.filter(row => row.date && row.date.getFullYear() === date.getFullYear() && row.date.getMonth() === date.getMonth());
    return { label: date.toLocaleDateString('en', { month: 'short', year: '2-digit' }), submitted: matches.filter(row => row.side === 'submitted').length, received: matches.filter(row => row.side === 'received').length };
  });
  const open = listings.filter(post => String(post.status || 'OPEN').toUpperCase() === 'OPEN' && (isOffer(post) || !post.deadline || new Date(`${post.deadline}T23:59:59`) >= now));
  return {
    earned: sum(true), spent: sum(false), completed: complete.length,
    approved: rows.filter(row => row.status === 'APPROVED').length,
    pending: rows.filter(row => row.status === 'PENDING').length,
    total: rows.length, submitted: rows.filter(row => row.side === 'submitted').length,
    received: rows.filter(row => row.side === 'received').length,
    unknownAmounts: complete.filter(row => row.amount === null).length,
    unknownDates: rows.filter(row => !row.date || !Number.isFinite(row.date.getTime())).length,
    openOffers: open.filter(isOffer).length, openRequests: open.filter(post => !isOffer(post)).length,
    listings: listings.length, months,
    statuses: statuses.map(status => ({ status, submitted: rows.filter(row => row.side === 'submitted' && row.status === status).length, received: rows.filter(row => row.side === 'received' && row.status === status).length })),
  };
}
