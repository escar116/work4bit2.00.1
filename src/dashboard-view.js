const money = value => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 2 }).format(value);
const esc = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const colors = ['#6554e8', '#23a6a0', '#e6aa36', '#a1a9bd', '#df7393', '#739deb', '#8792a5'];
const metric = (label, value, note, icon) => `<article class="db-kpi"><span class="db-icon" aria-hidden="true">${icon}</span><strong>${value}</strong><h3>${label}</h3><p>${note}</p></article>`;
const heading = (title, note) => `<div><h3>${title}</h3><p class="db-note">${note}</p></div>`;

function trendChart(stats, period) {
  const months = stats.months.slice(-period);
  const max = Math.max(4, ...months.flatMap(m => [m.sent, m.received]));
  const ceiling = Math.ceil(max / 4) * 4;
  const x = index => 46 + index * 628 / (months.length - 1);
  const y = count => 206 - count / ceiling * 170;
  const line = key => months.map((m, i) => `${x(i)},${y(m[key])}`).join(' ');
  return `<section class="db-panel db-trend"><div class="db-panel-head">${heading('Activity trend', 'Applications sent and received · by creation month')}<div class="db-segment db-period" aria-label="Chart period">${[3, 6].map(n => `<button type="button" data-dashboard-months="${n}" aria-pressed="${period === n}">${n} months</button>`).join('')}</div></div>
    <div class="db-legend"><span><i style="background:#6554e8"></i>Sent</span><span><i style="background:#23a6a0"></i>Received</span></div>
    <svg class="db-line-chart" viewBox="0 0 710 244" role="img" aria-label="${esc(months.map(m => `${m.label}: ${m.sent} sent, ${m.received} received`).join('. '))}">
      ${Array.from({length:5}, (_, i) => { const value = ceiling * i / 4; return `<line x1="46" x2="674" y1="${y(value)}" y2="${y(value)}" class="db-grid-line"/><text x="32" y="${y(value) + 4}" text-anchor="end">${value}</text>`; }).join('')}
      <polygon points="46,206 ${line('sent')} 674,206" fill="#6554e8" opacity="0.07"/>
      ${[['sent','#6554e8'],['received','#23a6a0']].map(([key,color]) => `<polyline points="${line(key)}" fill="none" stroke="${color}" stroke-width="2.5" stroke-linejoin="round" ${key === 'received' ? 'stroke-dasharray="6 4"' : ''}/>${months.map((m,i) => `<circle cx="${x(i)}" cy="${y(m[key])}" r="4" fill="${color}" stroke="white" stroke-width="1.5"><title>${esc(m.label)} · ${key}: ${m[key]}</title></circle>`).join('')}`).join('')}
      ${months.map((m,i) => `<text x="${x(i)}" y="233" text-anchor="middle">${esc(m.label)}</text>`).join('')}
    </svg><p class="db-note db-chart-foot">${months.every(m => !m.sent && !m.received) ? 'No applications in this period. ' : ''}${stats.unknownDates ? `${stats.unknownDates} undated records excluded. ` : ''}Counts applications; financial totals below use completed engagements.</p>
  </section>`;
}

function outcomeChart(stats) {
  const rows = stats.statuses.filter(row => row.count > 0);
  let start = 0;
  const stops = rows.map((row,i) => { const end = start + row.count / stats.total * 100; const stop = `${colors[i % colors.length]} ${start}% ${end}%`; start = end; return stop; });
  return `<section class="db-panel db-outcomes"><div class="db-panel-head">${heading('Engagement status', 'All-time application outcomes')}</div><div class="db-donut-layout"><div class="db-donut" style="background:${stops.length ? `conic-gradient(${stops.join(',')})` : 'var(--border-light, #e2e8f0)'}" role="img" aria-label="${esc(rows.length ? rows.map(r => `${r.status}: ${r.count}`).join(', ') : 'No engagements yet')}"><div><strong>${stats.total}</strong><span>${stats.total === 1 ? 'engagement' : 'engagements'}</span></div></div><div class="db-status-legend">${rows.length ? rows.map((row,i) => `<div><span><i style="background:${colors[i % colors.length]}"></i>${esc(row.status.toLowerCase().replaceAll('_',' '))}</span><strong>${row.count} <small>${Number((row.count / stats.total * 100).toFixed(1))}%</small></strong></div>`).join('') : '<p class="db-note">Your engagement breakdown will appear here after your first application.</p>'}</div></div></section>`;
}

function comparison(stats) {
  const max = Math.max(1, stats.student.earned, stats.student.spent, stats.mentoring.earned, stats.mentoring.spent);
  return `<section class="db-panel"><div class="db-panel-head">${heading('Student services & mentoring', 'Completed amounts · all work types · all time')}</div><div class="db-legend"><span><i style="background:#6554e8"></i>Earned</span><span><i style="background:#23a6a0"></i>Spent</span></div><div class="db-comparison">${[['Student services',stats.student],['Mentoring',stats.mentoring]].map(([label,s]) => `<div><div class="db-comparison-label"><h4>${label}</h4><span>${s.completed} completed</span></div>${[['Earned',s.earned,'#6554e8'],['Spent',s.spent,'#23a6a0']].map(([type,value,color]) => `<div class="db-money-row"><span>${type}</span><div><i style="width:${value / max * 100}%;background:${color}"></i></div><strong>${money(value)}</strong></div>`).join('')}</div>`).join('')}</div>${stats.all.unknownAmounts ? `<p class="db-note">${stats.all.unknownAmounts} completed records with missing amounts are excluded.</p>` : ''}</section>`;
}

export function renderDashboard(stats, reviewResult, scope = 'all', period = 6, name = 'Student') {
  const selected = stats[scope] || stats.all;
  const reviews = reviewResult?.status === 'fulfilled' ? reviewResult.value.docs.map(doc => Number(doc.data().rating)).filter(n => Number.isFinite(n) && n >= 1 && n <= 5) : null;
  const rating = reviews?.length ? (reviews.reduce((sum,n) => sum + n,0) / reviews.length).toFixed(1) : '—';
  const date = stats.updatedAt.toLocaleDateString('en-PH', {weekday:'long',month:'long',day:'numeric',year:'numeric'});
  return `<div class="db-board">
    <div class="db-banner"><div><span class="db-eyebrow">YOUR CAMPUS ACTIVITY</span><h2>Welcome back, ${esc(name)}!</h2><p>Here's an overview of your work and learning.</p></div><div class="db-banner-date"><strong>${esc(date)}</strong><span>Updated ${esc(stats.updatedAt.toLocaleTimeString('en-PH',{hour:'2-digit',minute:'2-digit'}))}</span></div></div>
    <div class="db-toolbar"><div class="db-segment" aria-label="Dashboard category">${[['all','Overview'],['student','Student services'],['mentoring','Mentoring']].map(([key,label]) => `<button type="button" data-dashboard-scope="${key}" aria-pressed="${scope === key}">${label}</button>`).join('')}</div><span class="db-note">All-time totals · chart period selectable</span></div>
    <div class="db-attention ${selected.pendingReceived ? 'has-pending' : ''}"><span aria-hidden="true">${selected.pendingReceived ? '◷' : '✓'}</span><div><strong>${selected.pendingReceived ? `${selected.pendingReceived} incoming application${selected.pendingReceived === 1 ? '' : 's'} awaiting your decision` : 'No incoming applications awaiting your decision'}</strong><p>${selected.pending - selected.pendingReceived} sent application${selected.pending - selected.pendingReceived === 1 ? '' : 's'} awaiting a response · ${selected.active} engagement${selected.active === 1 ? '' : 's'} in progress</p></div><a href="/applications">View applications <span aria-hidden="true">→</span></a></div>
    ${selected.unknownAmounts ? `<p class="analytics-warning">${selected.unknownAmounts} completed engagements have no valid amount and are excluded from earnings and spending.</p>` : ''}
    <div class="db-kpis">${metric('Total earned',money(selected.earned),'Completed engagements','₱')}${metric('Total spent',money(selected.spent),'Completed engagements','↗')}${metric('Completed',selected.completed,'Finished engagements','✓')}${metric('In progress',selected.active,'Accepted applications','↔')}${metric('Pending',selected.pending,'Sent and received','◷')}</div>
    <div class="db-main-charts">${trendChart(selected,period)}${outcomeChart(selected)}</div>
    <div class="db-support"><article><span>Applications sent</span><strong>${selected.sent}</strong><small>${scope === 'mentoring' ? 'Mentoring proposals sent' : 'Applications and order requests'}</small></article><article><span>Applications received</span><strong>${selected.received}</strong><small>${scope === 'mentoring' ? 'Mentoring proposals received' : 'Requests from other students'}</small></article><article><span>${scope === 'mentoring' ? 'Mentoring engagements' : 'Open service listings'}</span><strong>${scope === 'mentoring' ? selected.total : stats.student.openOffers + stats.student.openRequests}</strong><small>${scope === 'mentoring' ? 'Completed, pending, and closed' : `${stats.student.openOffers} offers · ${stats.student.openRequests} requests`}</small></article><article><span>Overall profile rating</span><strong>${reviews === null ? 'Unavailable' : rating}${reviews?.length ? ' <small>/ 5</small>' : ''}</strong><small>${reviews === null ? 'Reviews could not be loaded' : `${reviews.length} reviews across all work types`}</small></article></div>
    <div class="db-bottom">${comparison(stats)}<section class="db-panel"><div class="db-panel-head">${heading('Feedback received','Profile reviews · all work types')}</div>${reviews === null ? '<p class="db-note">Review data is unavailable. Refresh to try again.</p>' : `<div class="db-reviews">${[5,4,3,2,1].map(star => {const count = reviews.filter(n => Math.round(n) === star).length; return `<div><span>${star} <span aria-hidden="true">★</span></span><progress max="${Math.max(1,reviews.length)}" value="${count}" aria-label="${star} stars: ${count} reviews"></progress><strong>${count}</strong></div>`;}).join('')}</div>${!reviews.length ? '<p class="db-note">No reviews yet.</p>' : ''}`}</section></div>
  </div>`;
}
