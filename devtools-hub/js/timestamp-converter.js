/**
 * Timestamp Converter - codeutils.de
 * Convert between Unix timestamps and human-readable dates
 */

const TimestampConverter = {
    // Current unit selection (seconds or milliseconds)
    currentUnit: 'seconds',

    // Update interval for live timestamp
    updateInterval: null,

    /**
     * Initialize the converter
     */
    init() {
        this.setupEventListeners();
        this.startLiveClock();
        this.renderNotableTimestamps();
        this.setDefaultDateTime();
        CodeUtils.init();
    },

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Convert timestamp to date
        document.getElementById('convert-ts-btn').addEventListener('click', () => {
            this.convertTimestampToDate();
        });

        document.getElementById('timestamp-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.convertTimestampToDate();
            }
        });

        // Unit selection buttons
        document.querySelectorAll('.unit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentUnit = btn.dataset.unit;
            });
        });

        // Quick timestamp buttons
        document.querySelectorAll('[data-quick]').forEach(btn => {
            btn.addEventListener('click', () => {
                const timestamp = this.getQuickTimestamp(btn.dataset.quick);
                document.getElementById('timestamp-input').value = timestamp;
                this.convertTimestampToDate();
            });
        });

        // Convert date to timestamp
        document.getElementById('convert-date-btn').addEventListener('click', () => {
            this.convertDateToTimestamp();
        });

        // Parse date string
        document.getElementById('parse-date-btn').addEventListener('click', () => {
            this.parseDateString();
        });

        document.getElementById('datestring-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.parseDateString();
            }
        });

        // Copy current timestamp
        document.getElementById('copy-current-btn').addEventListener('click', () => {
            const timestamp = document.getElementById('current-timestamp').textContent;
            CodeUtils.copyToClipboard(timestamp, document.getElementById('copy-current-btn'));
        });

        // Clear button
        document.getElementById('clear-btn').addEventListener('click', () => {
            this.clearResults();
        });
    },

    /**
     * Start the live clock display
     */
    startLiveClock() {
        const updateClock = () => {
            const now = new Date();
            const timestamp = Math.floor(now.getTime() / 1000);
            document.getElementById('current-timestamp').textContent = timestamp;
            document.getElementById('current-datetime').textContent = this.formatLocalDateTime(now);
        };

        updateClock();
        this.updateInterval = setInterval(updateClock, 1000);
    },

    /**
     * Set default date/time inputs to current time
     */
    setDefaultDateTime() {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = now.toTimeString().slice(0, 8);

        document.getElementById('date-input').value = dateStr;
        document.getElementById('time-input').value = timeStr;
    },

    /**
     * Get quick timestamp based on selection
     * @param {string} type - Quick timestamp type
     * @returns {number} Timestamp in seconds
     */
    getQuickTimestamp(type) {
        const now = new Date();
        let date;

        switch (type) {
            case 'now':
                return Math.floor(now.getTime() / 1000);
            case 'today-start':
                date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
                return Math.floor(date.getTime() / 1000);
            case 'today-end':
                date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                return Math.floor(date.getTime() / 1000);
            case 'week-ago':
                date = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return Math.floor(date.getTime() / 1000);
            case 'month-ago':
                date = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                return Math.floor(date.getTime() / 1000);
            case 'year-ago':
                date = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                return Math.floor(date.getTime() / 1000);
            default:
                return Math.floor(now.getTime() / 1000);
        }
    },

    /**
     * Convert timestamp to date and display results
     */
    convertTimestampToDate() {
        const input = document.getElementById('timestamp-input').value.trim();
        const errorEl = document.getElementById('timestamp-error');

        // Validate input
        if (!input) {
            errorEl.textContent = 'Please enter a timestamp';
            errorEl.classList.remove('hidden');
            return;
        }

        const timestamp = parseInt(input, 10);
        if (isNaN(timestamp)) {
            errorEl.textContent = 'Invalid timestamp format';
            errorEl.classList.remove('hidden');
            return;
        }

        errorEl.classList.add('hidden');

        // Convert to milliseconds if input is in seconds
        let timestampMs = timestamp;
        if (this.currentUnit === 'seconds') {
            timestampMs = timestamp * 1000;
        }

        // Validate timestamp range (between year 1970 and 3000)
        const minTs = 0;
        const maxTs = 32503680000000; // Year 3000
        if (timestampMs < minTs || timestampMs > maxTs) {
            errorEl.textContent = 'Timestamp out of valid range';
            errorEl.classList.remove('hidden');
            return;
        }

        const date = new Date(timestampMs);
        this.displayResults(date, timestamp);
    },

    /**
     * Convert date inputs to timestamp
     */
    convertDateToTimestamp() {
        const dateInput = document.getElementById('date-input').value;
        const timeInput = document.getElementById('time-input').value || '00:00:00';
        const timezone = document.getElementById('timezone-select').value;

        if (!dateInput) {
            return;
        }

        let date;
        const dateTimeStr = `${dateInput}T${timeInput}`;

        if (timezone === 'local') {
            date = new Date(dateTimeStr);
        } else if (timezone === 'UTC') {
            date = new Date(dateTimeStr + 'Z');
        } else {
            // For other timezones, we need to calculate the offset
            const tempDate = new Date(dateTimeStr);
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: timezone,
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });

            // Get the current offset for the timezone
            const parts = formatter.formatToParts(tempDate);
            const tzDate = new Date(dateTimeStr);

            // Calculate offset by comparing with UTC
            const utcDate = new Date(Date.UTC(
                parseInt(dateInput.split('-')[0]),
                parseInt(dateInput.split('-')[1]) - 1,
                parseInt(dateInput.split('-')[2]),
                parseInt(timeInput.split(':')[0]) || 0,
                parseInt(timeInput.split(':')[1]) || 0,
                parseInt(timeInput.split(':')[2]) || 0
            ));

            // Get timezone offset in minutes
            const tzOffsetStr = new Intl.DateTimeFormat('en-US', {
                timeZone: timezone,
                timeZoneName: 'shortOffset'
            }).format(utcDate);

            // Parse offset (e.g., "GMT+1", "GMT-5")
            const offsetMatch = tzOffsetStr.match(/GMT([+-]\d+(?::\d+)?)/);
            if (offsetMatch) {
                const offsetParts = offsetMatch[1].split(':');
                const offsetHours = parseInt(offsetParts[0]);
                const offsetMinutes = offsetParts[1] ? parseInt(offsetParts[1]) : 0;
                const totalOffsetMs = (offsetHours * 60 + (offsetHours < 0 ? -offsetMinutes : offsetMinutes)) * 60 * 1000;
                date = new Date(utcDate.getTime() - totalOffsetMs);
            } else {
                date = tzDate;
            }
        }

        if (isNaN(date.getTime())) {
            return;
        }

        const timestampSeconds = Math.floor(date.getTime() / 1000);
        const timestampMillis = date.getTime();

        document.getElementById('date-result').classList.remove('hidden');
        document.getElementById('date-result-seconds').textContent = timestampSeconds;
        document.getElementById('date-result-millis').textContent = timestampMillis;
    },

    /**
     * Parse a date string and convert to timestamp
     */
    parseDateString() {
        const input = document.getElementById('datestring-input').value.trim();
        const errorEl = document.getElementById('datestring-error');
        const resultEl = document.getElementById('datestring-result');

        if (!input) {
            errorEl.textContent = 'Please enter a date string';
            errorEl.classList.remove('hidden');
            resultEl.classList.add('hidden');
            return;
        }

        const date = new Date(input);

        if (isNaN(date.getTime())) {
            errorEl.textContent = 'Could not parse date string';
            errorEl.classList.remove('hidden');
            resultEl.classList.add('hidden');
            return;
        }

        errorEl.classList.add('hidden');
        resultEl.classList.remove('hidden');

        const timestampSeconds = Math.floor(date.getTime() / 1000);
        document.getElementById('datestring-timestamp').textContent =
            `${timestampSeconds} (seconds) | ${date.getTime()} (milliseconds)`;

        // Also populate the main input and show results
        document.getElementById('timestamp-input').value = timestampSeconds;
        this.displayResults(date, timestampSeconds);
    },

    /**
     * Display conversion results
     * @param {Date} date - Date object
     * @param {number} originalTimestamp - Original timestamp input
     */
    displayResults(date, originalTimestamp) {
        document.getElementById('results-placeholder').classList.add('hidden');
        document.getElementById('results-content').classList.remove('hidden');

        // Basic formats
        document.getElementById('result-local').textContent = this.formatLocalDateTime(date);
        document.getElementById('result-utc').textContent = date.toUTCString();
        document.getElementById('result-iso').textContent = date.toISOString();
        document.getElementById('result-rfc').textContent = this.formatRFC2822(date);

        // Timestamps
        const timestampSeconds = Math.floor(date.getTime() / 1000);
        const timestampMillis = date.getTime();
        document.getElementById('result-seconds').textContent = timestampSeconds;
        document.getElementById('result-millis').textContent = timestampMillis;

        // Relative time
        document.getElementById('result-relative').textContent = this.getRelativeTime(date);

        // Additional info
        document.getElementById('result-day-of-year').textContent = this.getDayOfYear(date);
        document.getElementById('result-week').textContent = this.getWeekNumber(date);
        document.getElementById('result-day-of-week').textContent = this.getDayOfWeek(date);
        document.getElementById('result-leap-year').textContent = this.isLeapYear(date.getFullYear()) ? 'Yes' : 'No';
    },

    /**
     * Format date as local datetime string
     * @param {Date} date - Date object
     * @returns {string} Formatted string
     */
    formatLocalDateTime(date) {
        const options = {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };
        return date.toLocaleDateString('en-US', options);
    },

    /**
     * Format date as RFC 2822
     * @param {Date} date - Date object
     * @returns {string} RFC 2822 formatted string
     */
    formatRFC2822(date) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        const day = days[date.getDay()];
        const dayNum = String(date.getDate()).padStart(2, '0');
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        // Get timezone offset
        const offset = date.getTimezoneOffset();
        const offsetHours = String(Math.floor(Math.abs(offset) / 60)).padStart(2, '0');
        const offsetMinutes = String(Math.abs(offset) % 60).padStart(2, '0');
        const offsetSign = offset <= 0 ? '+' : '-';

        return `${day}, ${dayNum} ${month} ${year} ${hours}:${minutes}:${seconds} ${offsetSign}${offsetHours}${offsetMinutes}`;
    },

    /**
     * Get relative time string
     * @param {Date} date - Date object
     * @returns {string} Relative time string
     */
    getRelativeTime(date) {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffSec = Math.abs(Math.floor(diffMs / 1000));
        const diffMin = Math.floor(diffSec / 60);
        const diffHour = Math.floor(diffMin / 60);
        const diffDay = Math.floor(diffHour / 24);
        const diffWeek = Math.floor(diffDay / 7);
        const diffMonth = Math.floor(diffDay / 30);
        const diffYear = Math.floor(diffDay / 365);

        const suffix = diffMs > 0 ? 'ago' : 'from now';

        if (diffSec < 60) {
            return diffSec === 1 ? `1 second ${suffix}` : `${diffSec} seconds ${suffix}`;
        } else if (diffMin < 60) {
            return diffMin === 1 ? `1 minute ${suffix}` : `${diffMin} minutes ${suffix}`;
        } else if (diffHour < 24) {
            return diffHour === 1 ? `1 hour ${suffix}` : `${diffHour} hours ${suffix}`;
        } else if (diffDay < 7) {
            return diffDay === 1 ? `1 day ${suffix}` : `${diffDay} days ${suffix}`;
        } else if (diffWeek < 4) {
            return diffWeek === 1 ? `1 week ${suffix}` : `${diffWeek} weeks ${suffix}`;
        } else if (diffMonth < 12) {
            return diffMonth === 1 ? `1 month ${suffix}` : `${diffMonth} months ${suffix}`;
        } else {
            return diffYear === 1 ? `1 year ${suffix}` : `${diffYear} years ${suffix}`;
        }
    },

    /**
     * Get day of year
     * @param {Date} date - Date object
     * @returns {number} Day of year (1-366)
     */
    getDayOfYear(date) {
        const start = new Date(date.getFullYear(), 0, 0);
        const diff = date - start;
        const oneDay = 1000 * 60 * 60 * 24;
        return Math.floor(diff / oneDay);
    },

    /**
     * Get ISO week number
     * @param {Date} date - Date object
     * @returns {number} Week number (1-53)
     */
    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    },

    /**
     * Get day of week name
     * @param {Date} date - Date object
     * @returns {string} Day name
     */
    getDayOfWeek(date) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[date.getDay()];
    },

    /**
     * Check if year is a leap year
     * @param {number} year - Year
     * @returns {boolean} Is leap year
     */
    isLeapYear(year) {
        return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    },

    /**
     * Clear all results
     */
    clearResults() {
        document.getElementById('timestamp-input').value = '';
        document.getElementById('timestamp-error').classList.add('hidden');
        document.getElementById('results-placeholder').classList.remove('hidden');
        document.getElementById('results-content').classList.add('hidden');
        document.getElementById('date-result').classList.add('hidden');
        document.getElementById('datestring-input').value = '';
        document.getElementById('datestring-result').classList.add('hidden');
        document.getElementById('datestring-error').classList.add('hidden');
        this.setDefaultDateTime();
    },

    /**
     * Render notable timestamps table
     */
    renderNotableTimestamps() {
        const notableTimestamps = [
            { event: 'Unix Epoch', timestamp: 0, date: 'Jan 1, 1970' },
            { event: 'Y2K', timestamp: 946684800, date: 'Jan 1, 2000' },
            { event: '1 Billion', timestamp: 1000000000, date: 'Sep 9, 2001' },
            { event: 'Year 2025', timestamp: 1735689600, date: 'Jan 1, 2025' },
            { event: 'Max 32-bit', timestamp: 2147483647, date: 'Jan 19, 2038' },
            { event: '2 Billion', timestamp: 2000000000, date: 'May 18, 2033' }
        ];

        const tbody = document.getElementById('notable-timestamps');
        tbody.innerHTML = notableTimestamps.map(item => `
            <tr class="border-t border-dark-800">
                <td class="py-2">${item.event}</td>
                <td class="py-2 font-mono text-emerald-400">${item.timestamp}</td>
                <td class="py-2 text-dark-400">${item.date}</td>
            </tr>
        `).join('');
    }
};

// Add styles for unit buttons
const style = document.createElement('style');
style.textContent = `
    .unit-btn {
        background: #0f172a;
        color: #94a3b8;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        border: 1px solid #334155;
        cursor: pointer;
    }

    .unit-btn:hover {
        background: #1e293b;
        border-color: #475569;
    }

    .unit-btn.active {
        background: #10b981;
        color: #020617;
        border-color: #10b981;
    }
`;
document.head.appendChild(style);

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    TimestampConverter.init();
});
