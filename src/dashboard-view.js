const money = value => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(value);
const escape = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const metric = (label, value, caption) => `<article class="analytics-metric"><p>${label}</p><strong>${value}</strong><small>${caption}</small></article>`;

export function renderDashboard(stats, reviewResult) {
  const reviewRows = reviewResult?.status === 'fulfilled' ? reviewResult.value.docs.map(doc => Number(doc.data().rating)).filter(rating => Number.isFinite(rating) && rating >= 1 && rating <= 5) : null;
  const rating = reviewRows?.length ? (reviewRows.reduce((a, b) => a + b, 0) / reviewRows.length).toFixed(1) : null;
  const maximum = Math.max(1, ...stats.months.flatMap(month => [month.submitted, month.received]));
  return `<div class="analytics-metrics">
    ${metric('Total earned', money(stats.earned), 'From completed work')}
    ${metric('Total spent', money(stats.spent), 'For completed orders and requests')}
    ${metric('Completed engagements', stats.completed, 'Across your client and provider roles')}
    ${metric('In progress', stats.approved, 'Accepted applications and orders')}
    ${metric('Awaiting a decision', stats.pending, 'Pending applications sent and received')}
    ${metric('Average rating', reviewRows === null ? 'Unavailable' : rating ? `${rating} <span>/ 5</span>` : 'No reviews', reviewRows === null ? 'Reviews could not be loaded' : `${reviewRows.length} verified review record${reviewRows.length === 1 ? '' : 's'}`)}
  </div>
  ${stats.unknownAmounts ? `<p class="analytics-warning">${stats.unknownAmounts} completed engagement(s) have no valid amount and are excluded from financial totals.</p>` : ''}
  <div class="analytics-grid"><section class="analytics-panel analytics-activity"><div class="analytics-panel-heading"><div><h2>Application activity</h2><p>Submitted dates · last six calendar months</p></div><div class="chart-legend"><span>● Sent</span><span>● Received</span></div></div>
    <div class="activity-chart" role="img" aria-label="Application counts. ${stats.months.map(month => `${month.label}: ${month.submitted} sent, ${month.received} received`).join('. ')}">
    ${stats.months.map(month => `<div class="activity-month"><div class="activity-bars"><div class="activity-column"><span>${month.submitted}</span><i style="height:${month.submitted / maximum * 125}px"></i></div><div class="activity-column received"><span>${month.received}</span><i style="height:${month.received / maximum * 125}px"></i></div></div><small>${month.label}</small></div>`).join('')}</div>
    <p class="analytics-note">${stats.months.every(month => month.submitted + month.received === 0) ? 'No application activity during these months. ' : ''}${stats.unknownDates ? `${stats.unknownDates} record(s) without a valid date are excluded from this chart. ` : ''}This chart counts applications, not payments.</p>
  </section><section class="analytics-panel"><h2>Your listings</h2><p class="analytics-note">Currently open and available</p><dl class="analytics-totals"><div><dt>Service offers</dt><dd>${stats.openOffers}</dd></div><div><dt>Service requests</dt><dd>${stats.openRequests}</dd></div><div><dt>All listings, all statuses</dt><dd>${stats.listings}</dd></div></dl><p class="analytics-note">Expired requests are excluded from the open counts. Standing offers remain available after an order is completed.</p></section>
  <section class="analytics-panel"><h2>Application outcomes</h2><p class="analytics-note">${stats.total} unique applications and orders · all time</p><div class="analytics-table-wrap"><table class="analytics-table"><thead><tr><th scope="col">Status</th><th scope="col">Sent</th><th scope="col">Received</th></tr></thead><tbody>${stats.statuses.map(row => `<tr><th scope="row">${escape(row.status.toLowerCase().replaceAll('_', ' '))}</th><td>${row.submitted}</td><td>${row.received}</td></tr>`).join('')}</tbody><tfoot><tr><th scope="row">Total</th><td>${stats.submitted}</td><td>${stats.received}</td></tr></tfoot></table></div></section>
  <section class="analytics-panel"><h2>Review distribution</h2><p class="analytics-note">Feedback received on your profile</p>${reviewRows === null ? '<p class="analytics-warning">Review statistics are unavailable. Use Refresh to try again.</p>' : reviewRows.length === 0 ? '<p class="analytics-empty">No reviews yet. Your rating distribution will appear after you receive feedback.</p>' : `<div class="review-distribution">${[5, 4, 3, 2, 1].map(stars => { const count = reviewRows.filter(rating => Math.round(rating) === stars).length; return `<div><span>${stars} ★</span><progress max="${reviewRows.length}" value="${count}" aria-label="${stars} stars: ${count} reviews"></progress><strong>${count}</strong></div>`; }).join('')}</div>`}</section></div>`;
}
