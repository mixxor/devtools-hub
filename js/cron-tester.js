/**
 * Cron Expression Tester - codeutils.de
 * Validate cron expressions and preview upcoming execution times
 */

const CronTester = {
    // Field definitions
    fields: {
        minute: { min: 0, max: 59, name: 'Minute' },
        hour: { min: 0, max: 23, name: 'Hour' },
        day: { min: 1, max: 31, name: 'Day of Month' },
        month: { min: 1, max: 12, name: 'Month' },
        weekday: { min: 0, max: 6, name: 'Day of Week' }
    },

    // Month names for parsing
    monthNames: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'],

    // Day names for parsing
    dayNames: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'],

    /**
     * Initialize the tester
     */
    init() {
        this.setupEventListeners();
        this.testExpression();
        if (typeof CodeUtils !== 'undefined') {
            CodeUtils.init();
        }
    },

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Main test button
        document.getElementById('test-btn').addEventListener('click', () => {
            this.testExpression();
        });

        // Enter key on main input
        document.getElementById('cron-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.testExpression();
            }
        });

        // Live update on input change
        document.getElementById('cron-input').addEventListener('input', () => {
            this.testExpression();
        });

        // Visual builder fields
        ['minute', 'hour', 'day', 'month', 'weekday'].forEach(field => {
            const input = document.getElementById(`field-${field}`);
            input.addEventListener('input', () => {
                this.updateFromBuilder();
            });
        });

        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setCronExpression(btn.dataset.cron);
            });
        });

        // Example rows
        document.querySelectorAll('.example-row').forEach(row => {
            row.addEventListener('click', () => {
                this.setCronExpression(row.dataset.cron);
            });
        });

        // Clear button
        document.getElementById('clear-btn').addEventListener('click', () => {
            this.clearAll();
        });
    },

    /**
     * Set cron expression and update UI
     */
    setCronExpression(expr) {
        document.getElementById('cron-input').value = expr;
        this.updateBuilderFromExpression(expr);
        this.testExpression();
    },

    /**
     * Update builder fields from main expression
     */
    updateBuilderFromExpression(expr) {
        const parts = expr.trim().split(/\s+/);
        if (parts.length === 5) {
            document.getElementById('field-minute').value = parts[0];
            document.getElementById('field-hour').value = parts[1];
            document.getElementById('field-day').value = parts[2];
            document.getElementById('field-month').value = parts[3];
            document.getElementById('field-weekday').value = parts[4];
        }
    },

    /**
     * Update main expression from builder fields
     */
    updateFromBuilder() {
        const minute = document.getElementById('field-minute').value || '*';
        const hour = document.getElementById('field-hour').value || '*';
        const day = document.getElementById('field-day').value || '*';
        const month = document.getElementById('field-month').value || '*';
        const weekday = document.getElementById('field-weekday').value || '*';

        const expr = `${minute} ${hour} ${day} ${month} ${weekday}`;
        document.getElementById('cron-input').value = expr;
        this.testExpression();
    },

    /**
     * Test the current cron expression
     */
    testExpression() {
        const input = document.getElementById('cron-input').value.trim();
        const errorEl = document.getElementById('cron-error');
        const resultsContent = document.getElementById('results-content');
        const resultsError = document.getElementById('results-error');
        const resultsPlaceholder = document.getElementById('results-placeholder');
        const validationStatus = document.getElementById('validation-status');

        // Reset error state
        errorEl.classList.add('hidden');
        resultsError.classList.add('hidden');
        resultsPlaceholder.classList.add('hidden');
        resultsContent.classList.remove('hidden');

        if (!input) {
            resultsPlaceholder.classList.remove('hidden');
            resultsContent.classList.add('hidden');
            return;
        }

        // Update builder fields
        this.updateBuilderFromExpression(input);

        // Parse expression
        const parseResult = this.parseExpression(input);

        if (!parseResult.valid) {
            this.showError(parseResult.error);
            return;
        }

        // Show valid status
        validationStatus.innerHTML = `
            <svg class="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span class="text-emerald-400 font-medium">Valid cron expression</span>
        `;
        validationStatus.className = 'flex items-center gap-3 p-4 rounded-lg bg-emerald-900/30';

        // Generate description
        const description = this.generateDescription(parseResult);
        document.getElementById('cron-description').innerHTML = `<p class="text-emerald-400 font-medium">${description}</p>`;

        // Calculate next executions
        const nextTimes = this.getNextExecutions(parseResult, 3);
        this.displayExecutions(nextTimes);
    },

    /**
     * Show error state
     */
    showError(message) {
        const errorEl = document.getElementById('cron-error');
        const resultsContent = document.getElementById('results-content');
        const resultsError = document.getElementById('results-error');
        const validationStatus = document.getElementById('validation-status');

        errorEl.textContent = message;
        errorEl.classList.remove('hidden');

        resultsContent.classList.add('hidden');
        resultsError.classList.remove('hidden');
        document.getElementById('results-error-message').textContent = message;

        validationStatus.innerHTML = `
            <svg class="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            <span class="text-red-400 font-medium">Invalid cron expression</span>
        `;
        validationStatus.className = 'flex items-center gap-3 p-4 rounded-lg bg-red-900/30';

        document.getElementById('cron-description').innerHTML = `<p class="text-red-400">${message}</p>`;
    },

    /**
     * Parse a cron expression
     */
    parseExpression(expr) {
        const parts = expr.trim().split(/\s+/);

        if (parts.length !== 5) {
            return { valid: false, error: `Expected 5 fields, got ${parts.length}` };
        }

        const fieldOrder = ['minute', 'hour', 'day', 'month', 'weekday'];
        const parsed = {};

        for (let i = 0; i < 5; i++) {
            const fieldName = fieldOrder[i];
            const fieldDef = this.fields[fieldName];
            const result = this.parseField(parts[i], fieldDef, fieldName);

            if (!result.valid) {
                return { valid: false, error: `${fieldDef.name}: ${result.error}` };
            }

            parsed[fieldName] = result.values;
        }

        return { valid: true, fields: parsed, raw: parts };
    },

    /**
     * Parse a single cron field
     */
    parseField(value, fieldDef, fieldName) {
        let normalized = value.toLowerCase();

        // Replace month names
        if (fieldName === 'month') {
            this.monthNames.forEach((name, i) => {
                normalized = normalized.replace(new RegExp(name, 'gi'), String(i + 1));
            });
        }

        // Replace day names
        if (fieldName === 'weekday') {
            this.dayNames.forEach((name, i) => {
                normalized = normalized.replace(new RegExp(name, 'gi'), String(i));
            });
        }

        const values = new Set();

        // Split by comma for lists
        const parts = normalized.split(',');

        for (const part of parts) {
            // Handle step values (e.g., */5, 1-10/2)
            const stepMatch = part.match(/^(.+)\/(\d+)$/);
            let range = stepMatch ? stepMatch[1] : part;
            const step = stepMatch ? parseInt(stepMatch[2], 10) : 1;

            if (step < 1) {
                return { valid: false, error: 'Step value must be at least 1' };
            }

            let start, end;

            if (range === '*') {
                start = fieldDef.min;
                end = fieldDef.max;
            } else if (range.includes('-')) {
                const [rangeStart, rangeEnd] = range.split('-').map(n => parseInt(n, 10));
                if (isNaN(rangeStart) || isNaN(rangeEnd)) {
                    return { valid: false, error: `Invalid range: ${range}` };
                }
                if (rangeStart < fieldDef.min || rangeEnd > fieldDef.max) {
                    return { valid: false, error: `Value out of range (${fieldDef.min}-${fieldDef.max})` };
                }
                if (rangeStart > rangeEnd) {
                    return { valid: false, error: 'Range start must be <= end' };
                }
                start = rangeStart;
                end = rangeEnd;
            } else {
                const num = parseInt(range, 10);
                if (isNaN(num)) {
                    return { valid: false, error: `Invalid value: ${range}` };
                }
                if (num < fieldDef.min || num > fieldDef.max) {
                    return { valid: false, error: `Value ${num} out of range (${fieldDef.min}-${fieldDef.max})` };
                }
                start = num;
                end = num;
            }

            for (let i = start; i <= end; i += step) {
                values.add(i);
            }
        }

        return { valid: true, values: Array.from(values).sort((a, b) => a - b) };
    },

    /**
     * Generate human-readable description
     */
    generateDescription(parseResult) {
        const { fields, raw } = parseResult;

        // Check for common patterns
        if (raw.join(' ') === '* * * * *') {
            return 'Every minute';
        }

        const parts = [];

        // Time part
        if (raw[0] === '*' && raw[1] === '*') {
            parts.push('Every minute');
        } else if (raw[0].startsWith('*/')) {
            const step = raw[0].slice(2);
            parts.push(`Every ${step} minutes`);
        } else if (raw[1].startsWith('*/')) {
            const step = raw[1].slice(2);
            if (raw[0] === '0') {
                parts.push(`Every ${step} hours`);
            } else {
                parts.push(`At minute ${fields.minute[0]}, every ${step} hours`);
            }
        } else if (raw[1] === '*') {
            if (fields.minute.length === 1) {
                parts.push(`At minute ${fields.minute[0]} of every hour`);
            } else {
                parts.push(`At minutes ${fields.minute.join(', ')} of every hour`);
            }
        } else {
            const timeStr = fields.hour.map(h => {
                return fields.minute.map(m => {
                    const hour = h % 12 || 12;
                    const ampm = h < 12 ? 'AM' : 'PM';
                    const min = String(m).padStart(2, '0');
                    return `${hour}:${min} ${ampm}`;
                }).join(', ');
            }).join(', ');
            parts.push(`At ${timeStr}`);
        }

        // Day part
        if (raw[2] !== '*' && raw[4] !== '*') {
            parts.push(`on day ${fields.day.join(', ')} and ${this.formatWeekdays(fields.weekday)}`);
        } else if (raw[2] !== '*') {
            if (fields.day.length === 1) {
                parts.push(`on day ${fields.day[0]} of the month`);
            } else {
                parts.push(`on days ${fields.day.join(', ')} of the month`);
            }
        } else if (raw[4] !== '*') {
            parts.push(`on ${this.formatWeekdays(fields.weekday)}`);
        }

        // Month part
        if (raw[3] !== '*') {
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];
            const months = fields.month.map(m => monthNames[m - 1]);
            parts.push(`in ${months.join(', ')}`);
        }

        return parts.join(' ');
    },

    /**
     * Format weekday values for description
     */
    formatWeekdays(values) {
        const names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

        if (values.length === 7) {
            return 'every day';
        }
        if (values.length === 5 && !values.includes(0) && !values.includes(6)) {
            return 'weekdays';
        }
        if (values.length === 2 && values.includes(0) && values.includes(6)) {
            return 'weekends';
        }

        return values.map(v => names[v]).join(', ');
    },

    /**
     * Get next N execution times
     */
    getNextExecutions(parseResult, count) {
        const executions = [];
        const now = new Date();
        let current = new Date(now);

        // Start from next minute
        current.setSeconds(0);
        current.setMilliseconds(0);
        current.setMinutes(current.getMinutes() + 1);

        // Search up to 2 years ahead
        const maxDate = new Date(now);
        maxDate.setFullYear(maxDate.getFullYear() + 2);

        while (executions.length < count && current < maxDate) {
            if (this.matchesExpression(current, parseResult)) {
                executions.push(new Date(current));
                // After finding a match, skip to next minute
                current.setMinutes(current.getMinutes() + 1);
            } else {
                // Smart skip: if day doesn't match, skip to next day
                const dayMatches = parseResult.fields.day.includes(current.getDate()) &&
                    parseResult.fields.month.includes(current.getMonth() + 1) &&
                    parseResult.fields.weekday.includes(current.getDay());

                if (!dayMatches) {
                    // Skip to start of next day
                    current.setDate(current.getDate() + 1);
                    current.setHours(0);
                    current.setMinutes(0);
                } else {
                    current.setMinutes(current.getMinutes() + 1);
                }
            }
        }

        return executions;
    },

    /**
     * Check if a date matches the cron expression
     */
    matchesExpression(date, parseResult) {
        const { fields } = parseResult;

        const minute = date.getMinutes();
        const hour = date.getHours();
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const weekday = date.getDay();

        return fields.minute.includes(minute) &&
            fields.hour.includes(hour) &&
            fields.day.includes(day) &&
            fields.month.includes(month) &&
            fields.weekday.includes(weekday);
    },

    /**
     * Display execution times
     */
    displayExecutions(executions) {
        const container = document.getElementById('results-content');
        const now = new Date();

        if (executions.length === 0) {
            container.innerHTML = '<p class="text-dark-500 text-center py-8">No upcoming executions found</p>';
            return;
        }

        container.innerHTML = executions.map((date, i) => {
            const relativeTime = this.getRelativeTime(date, now);
            const formattedDate = date.toLocaleString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            });

            return `
                <div class="flex items-center justify-between py-3 px-4 rounded-lg bg-dark-900 hover:bg-dark-800 transition-colors">
                    <div class="flex items-center gap-3">
                        <span class="w-6 h-6 flex items-center justify-center text-xs font-mono text-dark-500 bg-dark-800 rounded">${i + 1}</span>
                        <span class="text-dark-200">${formattedDate}</span>
                    </div>
                    <span class="text-emerald-400 text-sm">${relativeTime}</span>
                </div>
            `;
        }).join('');
    },

    /**
     * Get relative time string
     */
    getRelativeTime(date, now) {
        const diff = date - now;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 60) {
            return `in ${minutes} min`;
        }
        if (hours < 24) {
            const remainingMinutes = minutes % 60;
            if (remainingMinutes === 0) {
                return `in ${hours} hr`;
            }
            return `in ${hours} hr ${remainingMinutes} min`;
        }
        if (days < 7) {
            const remainingHours = hours % 24;
            if (remainingHours === 0) {
                return `in ${days} day${days > 1 ? 's' : ''}`;
            }
            return `in ${days} day${days > 1 ? 's' : ''} ${remainingHours} hr`;
        }

        const weeks = Math.floor(days / 7);
        return `in ${weeks} week${weeks > 1 ? 's' : ''}`;
    },

    /**
     * Clear all inputs
     */
    clearAll() {
        document.getElementById('cron-input').value = '* * * * *';
        document.getElementById('field-minute').value = '*';
        document.getElementById('field-hour').value = '*';
        document.getElementById('field-day').value = '*';
        document.getElementById('field-month').value = '*';
        document.getElementById('field-weekday').value = '*';

        this.testExpression();
    }
};

// Add styles for preset buttons
const style = document.createElement('style');
style.textContent = `
    .preset-btn {
        background: #0f172a;
        color: #94a3b8;
        padding: 0.375rem 0.75rem;
        border-radius: 0.375rem;
        font-size: 0.75rem;
        border: 1px solid #334155;
        cursor: pointer;
        transition: all 0.15s;
    }

    .preset-btn:hover {
        background: #1e293b;
        border-color: #10b981;
        color: #10b981;
    }

    .example-row {
        transition: all 0.15s;
    }

    .example-row:hover code {
        color: #34d399;
    }
`;
document.head.appendChild(style);

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    CronTester.init();
});
