const isMentoring = value => {
  const category = String(value?.category || '').trim().toUpperCase();
  const title = String(value?.title || '').trim();
  return category === 'MENTORING' || /^mentoring\s*:/i.test(title);
};

const validDate = value => {
  if (!value) return null;
  const date = value instanceof Date ? value : value?.toDate ? value.toDate() : new Date(value);
  return Number.isFinite(date.getTime()) ? date : null;
};

function summarizeGroup(records, listings, isOffer, now, mentoring) {
  const selected = records.filter(row => row.mentoring === mentoring);
  const completed = selected.filter(row => row.status === 'COMPLETED');
  const total = predicate => completed.filter(predicate).reduce((sum, row) => sum + (row.amount ?? 0), 0);
  const relevantListings = listings.filter(post => isMentoring(post) === mentoring);
  const openListings = relevantListings.filter(post => String(post.status || 'OPEN').toUpperCase() === 'OPEN' && (isOffer(post) || !post.deadline || new Date(`${post.deadline}T23:59:59`) >= now));
  const statuses = ['PENDING', 'APPROVED', 'COMPLETED', 'REJECTED', 'CANCELLED', 'TERMINATED', ...new Set(selected.map(row => row.status))];
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 5 + index, 1);
    const matches = selected.filter(row => row.date && row.date.getFullYear() === date.getFullYear() && row.date.getMonth() === date.getMonth());
    return {
      label: date.toLocaleDateString('en', { month: 'short', year: '2-digit' }),
      sent: matches.filter(row => row.side === 'submitted').length,
      received: matches.filter(row => row.side === 'received').length,
    };
  });
  const active = selected.filter(row => ['APPROVED', 'IN_PROGRESS', 'ONGOING'].includes(row.status)).length;
  const pending = selected.filter(row => row.status === 'PENDING').length;

  return {
    earned: total(row => row.earning),
    spent: total(row => !row.earning),
    completed: completed.length,
    active,
    pending,
    sent: selected.filter(row => row.side === 'submitted').length,
    received: selected.filter(row => row.side === 'received').length,
    total: selected.length,
    unknownAmounts: completed.filter(row => row.amount === null).length,
    unknownDates: selected.filter(row => !row.date).length,
    openOffers: openListings.filter(isOffer).length,
    openRequests: openListings.filter(post => !isOffer(post)).length,
    listings: relevantListings.length,
    months,
    statuses: [...new Set(statuses)].map(status => ({
      status,
      count: selected.filter(row => row.status === status).length,
    })).filter(row => row.count > 0 || ['PENDING', 'APPROVED', 'COMPLETED'].includes(row.status)),
    outcomes: {
      completed: completed.length,
      active,
      pending,
      closed: selected.filter(row => ['REJECTED', 'CANCELLED', 'TERMINATED'].includes(row.status)).length,
    },
  };
}

// An application is counted once even when both the applicant and listing queries return it.
export function summarizeDashboard(submitted = [], received = [], listings = [], isOffer = () => false, now = new Date()) {
  const posts = new Map(listings.map(post => [post.id, post]));
  const records = new Map();
  for (const [side, applications] of [['submitted', submitted], ['received', received]]) {
    for (const application of applications) {
      if (!application?.id || records.has(application.id)) continue;
      const job = posts.get(application.helpRequest?.id) || application.helpRequest || {};
      const value = application.priceOffer ?? job.budget;
      const amount = value == null || value === '' ? null : Number(value);
      records.set(application.id, {
        side,
        status: String(application.status || 'UNKNOWN').toUpperCase(),
        mentoring: isMentoring(job),
        // Mentoring flows use requests/proposals instead of the service-offer
        // flag: proposals received are mentor earnings, and proposals sent are
        // learner spend. Service listings continue to use offer/request roles.
        earning: isMentoring(job) ? side === 'received' : side === 'received' ? isOffer(job) : !isOffer(job),
        amount: Number.isFinite(amount) && amount >= 0 ? amount : null,
        date: validDate(application.createdAt),
      });
    }
  }

  const rows = [...records.values()];
  return {
    student: summarizeGroup(rows, listings, isOffer, now, false),
    mentoring: summarizeGroup(rows, listings, isOffer, now, true),
    totalApplications: rows.length,
    unknownDates: rows.filter(row => !row.date).length,
  };
}
