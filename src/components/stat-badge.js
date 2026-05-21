export function statBadge({ label, value }) {
  return `
    <div class="stat-badge">
      <span class="stat-badge__value">${value}</span>
      <span class="stat-badge__label">${label}</span>
    </div>
  `
}
