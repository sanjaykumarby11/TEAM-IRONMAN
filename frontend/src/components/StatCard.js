export function renderStatCard(iconClass, colorClass, label, value, subtext) {
    return `
        <div class="stat-card glassmorphic">
            <div class="stat-icon ${colorClass}">
                <i class="${iconClass}"></i>
            </div>
            <div>
                <span class="stat-label">${label}</span>
                <span class="stat-value">${value}</span>
                <span class="stat-sub ${colorClass}">${subtext}</span>
            </div>
        </div>
    `;
}
