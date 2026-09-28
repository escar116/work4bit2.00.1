const money = value => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(value);
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const metric = (label, value, caption, tone = '') => `<article class="analytics-metric ${tone}"><p>${label}</p><strong>${value}</strong><small>${caption}</small></article>`;

function activityChart(stats, kind) {
  const maximum = Math.max(1, ...stats.months.flatMap(month => [month.sent, month.received]));
  const label = kind === 'mentoring' ? 'Mentoring applications' : 'Student service applications';
  return `<section class="analytics-panel analytics-activity"><div class="analytics-panel-heading"><div><h3>Engagement activity</h3><p>Applications by month · last six calendar months</p></div><div class="chart-legend"><span>● Sent</span><span>● Received</span></div></div>
    <div class="activity-chart" role="img" aria-label="${label}. ${stats.months.map(month => `${month.label}: ${month.sent} sent, ${month.received} received`).join('. ')}">
      ${stats.months.map(month => `<div class="activity-month"><div class="activity-bars"><div class="activity-column"><span>${month.sent}</span><i style="height:${month.sent / maximum * 115}px"></i></div><div class="activity-column received"><span>${month.received}</span><i style="height:${month.received / maximum * 115}px"></i></div></div><small>${escape(month.label)}</small></div>`).join('')}
    </div><p class="analytics-note">${stats.months.every(month => !month.sent && !month.received) ? 'No application activity recorded in this period. ' : ''}${stats.unknownDates ? `${stats.unknownDates} records without dates are excluded. ` : ''}Counts applications, not payments.</p>
  </section>`;
}

function outcomesChart(stats) {
  const parts = [
    ['Completed', stats.outcomes.completed, 'completed'],
    ['In progress', stats.outcomes.active, 'active'],
    ['Awaiting decision', stats.outcomes.pending, 'pending'],
    ['Closed', stats.outcomes.closed, 'closed'],
  ];
  const maximum = Math.max(1, ...parts.map(([, count]) => count));
  return `<section class="analytics-panel"><div class="analytics-panel-heading"><div><h3>Engagement outcomes</h3><p>${stats.total} unique application${stats.total === 1 ? '' : 's'} · all time</p></div></div>
    <div class="outcome-chart" role="img" aria-label="${parts.map(([label, count]) => `${label}: ${count}`).join('. ')}">${parts.map(([label, count, tone]) => `<div class="outcome-row"><div class="outcome-label"><span>${label}</span><strong>${count}</strong></div><div class="outcome-track"><i class="${tone}" style="width:${count / maximum * 100}%"></i></div></div>`).join('')}</div>
    <div class="analytics-table-wrap"><table class="analytics-table"><thead><tr><th scope="col">Status</th><th scope="col">Count</th></tr></thead><tbody>${stats.statuses.map(row => `<tr><th scope="row">${escape(row.status.toLowerCase().replaceAll('_', ' '))}</th><td>${row.count}</td></tr>`).join('')}</tbody><tfoot><tr><th scope="row">Total</th><td>${stats.total}</td></tr></tfoot></table></div>
  </section>`;
}

function section(title, description, stats, mentoring = false) {
  const activityCaption = mentoring ? 'Mentoring requests and proposals' : 'Peer services and one-time requests';
  return `<section class="dashboard-analytics-section ${mentoring ? 'mentoring' : 'student'}" aria-labelledby="${mentoring ? 'mentoring' : 'student'}-analytics-title">
    <div class="analytics-section-heading"><div><span class="analytics-eyebrow">${mentoring ? 'Learning & guidance' : 'Campus marketplace'}</span><h2 id="${mentoring ? 'mentoring' : 'student'}-analytics-title">${title}</h2><p>${description}</p></div><span class="analytics-period">All-time totals · activity chart: 6 months</span></div>
    <div class="analytics-metrics analytics-metrics-four">
      ${metric(mentoring ? 'Mentor earnings' : 'Service earnings', money(stats.earned), 'Completed engagements')}
      ${metric(mentoring ? 'Mentoring spend' : 'Service spend', money(stats.spent), 'Completed engagements')}
      ${metric('Completed', stats.completed, 'Finished engagements', 'metric-positive')}
      ${metric('In progress', stats.active, 'Accepted or ongoing', 'metric-active')}
      ${metric(mentoring ? 'Proposals sent' : 'Requests sent', stats.sent, mentoring ? 'You asked for guidance' : 'You applied for posted help')}
      ${metric(mentoring ? 'Proposals received' : 'Applications received', stats.received, mentoring ? 'Learners requested your help' : 'Others applied to your listings')}
      ${metric('Awaiting decision', stats.pending, 'Pending applications')}
      ${mentoring
        ? metric('Mentoring interactions', stats.total, 'Requests and proposals')
        : metric('Open listings', stats.openOffers + stats.openRequests, `${stats.openOffers} offers · ${stats.openRequests} requests`)}
    </div>
    ${stats.unknownAmounts ? `<p class="analytics-warning">${stats.unknownAmounts} completed ${mentoring ? 'mentoring' : 'service'} engagement${stats.unknownAmounts === 1 ? '' : 's'} has no valid amount and is excluded from financial totals.</p>` : ''}
    <div class="analytics-grid analytics-grid-graphs">${activityChart(stats, mentoring ? 'mentoring' : 'student')}${outcomesChart(stats)}
      ${mentoring
        ? `<section class="analytics-panel"><div class="analytics-panel-heading"><div><h3>Your mentoring role</h3><p>How mentoring activity is split by your role</p></div></div>
          <div class="outcome-chart" role="img" aria-label="Mentoring roles. ${stats.sent} mentorship requests sent. ${stats.received} proposals received.">
            <div class="outcome-row"><div class="outcome-label"><span>Learner · requests sent</span><strong>${stats.sent}</strong></div><div class="outcome-track"><i style="width:${stats.total ? stats.sent / stats.total * 100 : 0}%"></i></div></div>
            <div class="outcome-row"><div class="outcome-label"><span>Mentor · proposals received</span><strong>${stats.received}</strong></div><div class="outcome-track"><i class="active" style="width:${stats.total ? stats.received / stats.total * 100 : 0}%"></i></div></div>
          </div><dl class="analytics-totals"><div><dt>Completed mentoring</dt><dd>${stats.completed}</dd></div><div><dt>In progress</dt><dd>${stats.active}</dd></div></dl>
          <p class="analytics-note">Mentoring engagements are identified by the MENTORING category or legacy “Mentoring:” title.</p>
        </section>`
        : `<section class="analytics-panel"><div class="analytics-panel-heading"><div><h3>Service marketplace activity</h3><p>${activityCaption}</p></div></div>
          <dl class="analytics-totals"><div><dt>Open service offers</dt><dd>${stats.openOffers}</dd></div><div><dt>Open service requests</dt><dd>${stats.openRequests}</dd></div><div><dt>All listings</dt><dd>${stats.listings}</dd></div><div><dt>Total engagements</dt><dd>${stats.total}</dd></div></dl>
          <p class="analytics-note">Student services exclude mentoring requests. Expired requests are excluded from open counts.</p>
        </section>`}
    </div>
  </section>`;
}

export function renderDashboard(stats, reviewResult) {
  const reviews = reviewResult?.status === 'fulfilled'
    ? reviewResult.value.docs.map(doc => Number(doc.data().rating)).filter(value => Number.isFinite(value) && value >= 1 && value <= 5)
    : null;
  const rating = reviews?.length ? (reviews.reduce((sum, value) => sum + value, 0) / reviews.length).toFixed(1) : null;
  return `<div class="dashboard-analytics-overview">
    <div class="analytics-overview-heading"><div><span class="analytics-eyebrow">Your activity at a glance</span><h2>Work summary</h2><p>${stats.totalApplications} unique application${stats.totalApplications === 1 ? '' : 's'} across student services and mentoring</p></div><div class="analytics-profile-rating"><span>Overall profile rating</span><strong>${reviews === null ? 'Unavailable' : rating ? `${rating} <small>/ 5</small>` : '—'}</strong><small>${reviews === null ? 'Reviews could not be loaded' : reviews.length ? `${reviews.length} review${reviews.length === 1 ? '' : 's'} across all work types` : 'No reviews yet'}</small></div></div>
    ${section('Student services', 'Track one-time student requests and ongoing peer service offers separately from mentoring.', stats.student)}
    ${section('Mentoring', 'See your learner requests, mentor proposals, and completed guidance engagements.', stats.mentoring, true)}
  </div>`;
}
