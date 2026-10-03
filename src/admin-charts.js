// Admin Dashboard Statistical Charts & Analytics Visualizations
// work4abit platform intelligence

export function renderAdminStatisticalCharts(container, { requests = [], applications = [], users = [], periodLabel = 'This Month' } = {}) {
  if (!container) return;

  const completedJobs = requests.filter(r => r.status === 'COMPLETED').length;
  const activeJobs = requests.filter(r => r.status === 'OPEN' || !r.status).length;
  const terminatedJobs = applications.filter(a => a.status === 'TERMINATED').length;
  const totalJobs = completedJobs + activeJobs + terminatedJobs;

  const totalTrans = applications
    .filter(a => a.status === 'COMPLETED')
    .reduce((sum, a) => sum + (Number(a.priceOffer) || 0), 0);

  // Active users count
  const activeUserIds = new Set();
  requests.forEach(r => {
    const uid = r.requesterId || r.requester?.id;
    if (uid) activeUserIds.add(uid);
  });
  applications.forEach(a => {
    const uid = a.applicantId || a.applicant?.id;
    if (uid) activeUserIds.add(uid);
  });
  users.forEach(u => {
    if (u.verificationStatus === 'verified') activeUserIds.add(u.id);
  });
  const totalStudents = users.filter(u => u.verificationStatus !== 'pending').length || 1;
  const activeUsersCount = Math.max(activeUserIds.size, 1);
  const activeUserRatio = Math.min(100, Math.round((activeUsersCount / totalStudents) * 100));

  // Success rate
  const resolvedJobs = completedJobs + terminatedJobs;
  const successRate = resolvedJobs > 0 ? Math.round((completedJobs / resolvedJobs) * 100) : 100;

  // Average completed transaction
  const avgTrans = completedJobs > 0 ? Math.round(totalTrans / completedJobs) : 0;

  // Percentages for donut
  const pctCompleted = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0;
  const pctActive = totalJobs > 0 ? (activeJobs / totalJobs) * 100 : 0;
  const pctTerminated = totalJobs > 0 ? (terminatedJobs / totalJobs) * 100 : 0;

  // Donut circumference (r=50 -> c=314.16)
  const radius = 50;
  const circumference = 2 * Math.PI * radius; // ~314.16

  const strokeCompleted = (pctCompleted / 100) * circumference;
  const strokeActive = (pctActive / 100) * circumference;
  const strokeTerminated = (pctTerminated / 100) * circumference;

  const offsetCompleted = 0;
  const offsetActive = -strokeCompleted;
  const offsetTerminated = -(strokeCompleted + strokeActive);

  // Category breakdown
  const categoryMap = {};
  requests.forEach(r => {
    let cat = (r.category || 'General Technical').trim();
    if (cat.toUpperCase() === 'OFFER' || !cat) cat = 'General Technical';
    if (!categoryMap[cat]) {
      categoryMap[cat] = { count: 0, budget: 0 };
    }
    categoryMap[cat].count += 1;
    categoryMap[cat].budget += (Number(r.budget) || 0);
  });

  // Also include Mentoring if any exists in applications
  const mentoringCount = requests.filter(r => (r.category || '').toUpperCase() === 'MENTORING' || (r.title || '').toLowerCase().includes('mentoring')).length;
  if (mentoringCount > 0 && !categoryMap['Mentoring']) {
    categoryMap['Mentoring'] = { count: mentoringCount, budget: 0 };
  }

  const categoryList = Object.entries(categoryMap)
    .map(([name, data]) => ({ name, count: data.count, budget: data.budget }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const maxCategoryCount = Math.max(...categoryList.map(c => c.count), 1);

  container.innerHTML = `
    <div class="admin-charts-grid">
      <!-- Chart Card 1: Job Lifecycle & Outcomes Distribution -->
      <div class="dash-stat-card admin-chart-card">
        <div class="admin-chart-header">
          <div>
            <h3 class="admin-chart-title">Outcomes (${periodLabel})</h3>
            <p class="admin-chart-subtitle">Distribution of active, completed, and terminated listings for ${periodLabel}</p>
          </div>
          <span class="badge badge-normal">${totalJobs} Listings</span>
        </div>

        <div class="admin-donut-wrapper">
          <div class="admin-donut-svg-container">
            <svg class="admin-donut-svg" viewBox="0 0 140 140" width="140" height="140" aria-label="Job distribution donut chart">
              <circle class="donut-bg-ring" cx="70" cy="70" r="${radius}" fill="transparent" stroke="rgba(226, 232, 240, 0.6)" stroke-width="16" />
              <!-- Completed Segment (Green) -->
              <circle class="donut-segment donut-seg-completed" cx="70" cy="70" r="${radius}" fill="transparent"
                stroke="#10b981" stroke-width="16"
                stroke-dasharray="${strokeCompleted.toFixed(2)} ${(circumference - strokeCompleted).toFixed(2)}"
                stroke-dashoffset="${offsetCompleted.toFixed(2)}"
                stroke-linecap="round" />
              <!-- Active Segment (Purple) -->
              <circle class="donut-segment donut-seg-active" cx="70" cy="70" r="${radius}" fill="transparent"
                stroke="#4f46e5" stroke-width="16"
                stroke-dasharray="${strokeActive.toFixed(2)} ${(circumference - strokeActive).toFixed(2)}"
                stroke-dashoffset="${offsetActive.toFixed(2)}" />
              <!-- Terminated Segment (Red) -->
              <circle class="donut-segment donut-seg-terminated" cx="70" cy="70" r="${radius}" fill="transparent"
                stroke="#ef4444" stroke-width="16"
                stroke-dasharray="${strokeTerminated.toFixed(2)} ${(circumference - strokeTerminated).toFixed(2)}"
                stroke-dashoffset="${offsetTerminated.toFixed(2)}" />
            </svg>
            <div class="admin-donut-center">
              <span class="donut-center-value">${totalJobs}</span>
              <span class="donut-center-label">Jobs</span>
            </div>
          </div>

          <div class="admin-donut-legend">
            <div class="donut-legend-item">
              <div class="legend-color-dot" style="background: #4f46e5;"></div>
              <div class="legend-text">
                <span class="legend-label">Active / In Progress</span>
                <span class="legend-value">${activeJobs} <small class="text-muted">(${pctActive.toFixed(1)}%)</small></span>
              </div>
            </div>

            <div class="donut-legend-item">
              <div class="legend-color-dot" style="background: #10b981;"></div>
              <div class="legend-text">
                <span class="legend-label">Completed Successfully</span>
                <span class="legend-value text-green">${completedJobs} <small class="text-muted">(${pctCompleted.toFixed(1)}%)</small></span>
              </div>
            </div>

            <div class="donut-legend-item">
              <div class="legend-color-dot" style="background: #ef4444;"></div>
              <div class="legend-text">
                <span class="legend-label">Terminated</span>
                <span class="legend-value text-red">${terminatedJobs} <small class="text-muted">(${pctTerminated.toFixed(1)}%)</small></span>
              </div>
            </div>

            <div class="donut-kpi-bar mt-2">
              <div class="flex justify-between text-xs text-muted mb-1">
                <span>Completion Success Rate</span>
                <strong style="color: #10b981;">${successRate}%</strong>
              </div>
              <div class="progress-bar-bg" style="background: #e2e8f0; height: 6px; border-radius: 999px; overflow: hidden;">
                <div style="background: #10b981; width: ${successRate}%; height: 100%; border-radius: 999px; transition: width 0.4s ease;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Chart Card 2: Top Listing Categories & Demand -->
      <div class="dash-stat-card admin-chart-card">
        <div class="admin-chart-header">
          <div>
            <h3 class="admin-chart-title">Marketplace Categories (${periodLabel})</h3>
            <p class="admin-chart-subtitle">Top technical domains by listings count & value for ${periodLabel}</p>
          </div>
          <span class="badge badge-normal">${categoryList.length} Categories</span>
        </div>

        <div class="admin-category-bars">
          ${categoryList.map(cat => {
            const barWidth = Math.max(12, Math.round((cat.count / maxCategoryCount) * 100));
            const budgetText = cat.budget > 0 ? `₱${cat.budget.toLocaleString()}` : '';
            return `
              <div class="category-bar-row">
                <div class="category-bar-header">
                  <span class="category-name truncate" title="${cat.name}">${cat.name}</span>
                  <div class="category-stats">
                    <span class="category-count">${cat.count} ${cat.count === 1 ? 'job' : 'jobs'}</span>
                    ${budgetText ? `<span class="category-budget text-muted">${budgetText}</span>` : ''}
                  </div>
                </div>
                <div class="category-bar-track">
                  <div class="category-bar-fill" style="width: ${barWidth}%;"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Key Health Metrics Strip -->
        <div class="admin-mini-kpis">
          <div class="mini-kpi-item">
            <span class="text-xs text-muted">Active Student Ratio</span>
            <strong>${activeUserRatio}%</strong>
          </div>
          <div class="mini-kpi-divider"></div>
          <div class="mini-kpi-item">
            <span class="text-xs text-muted">Avg Transaction</span>
            <strong>₱${avgTrans.toLocaleString()}</strong>
          </div>
          <div class="mini-kpi-divider"></div>
          <div class="mini-kpi-item">
            <span class="text-xs text-muted">Active Users</span>
            <strong style="color: #4f46e5;">${activeUsersCount}</strong>
          </div>
        </div>
      </div>
    </div>
  `;
}
