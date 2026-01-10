/**
 * Password Checker - codeutils.de
 * Check password strength using zxcvbn
 */

const PasswordChecker = {
    // Common passwords for quick check
    COMMON_PASSWORDS: [
        'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', 'letmein',
        'dragon', '111111', 'baseball', 'iloveyou', 'trustno1', 'sunshine', 'master',
        'welcome', 'shadow', 'ashley', 'football', 'jesus', 'michael', 'ninja',
        'mustang', 'password1', '123456789', 'adobe123', 'admin', '1234567890',
        'photoshop', '1234', '12345', 'princess', 'azerty', '000000', 'access',
        '696969', 'batman', 'superman', 'qwertyuiop', 'login', 'passw0rd',
        'starwars', '654321', 'qazwsx', 'whatever', 'donald', 'charlie', 'lovely'
    ],

    /**
     * Initialize the checker
     */
    init() {
        this.setupEventListeners();
        if (typeof CodeUtils !== 'undefined') {
            CodeUtils.init();
        }
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Password input
        document.getElementById('check-password-input').addEventListener('input',
            this.debounce((e) => this.checkPassword(e.target.value), 200));

        // Toggle visibility
        document.getElementById('toggle-visibility').addEventListener('click', () => {
            const input = document.getElementById('check-password-input');
            const eyeIcon = document.getElementById('eye-icon');
            const eyeOffIcon = document.getElementById('eye-off-icon');

            if (input.type === 'password') {
                input.type = 'text';
                eyeIcon.classList.add('hidden');
                eyeOffIcon.classList.remove('hidden');
            } else {
                input.type = 'password';
                eyeIcon.classList.remove('hidden');
                eyeOffIcon.classList.add('hidden');
            }
        });
    },

    /**
     * Check password strength
     */
    checkPassword(password) {
        const resultEl = document.getElementById('check-result');

        if (!password) {
            resultEl.classList.add('hidden');
            return;
        }

        resultEl.classList.remove('hidden');

        // Analyze with zxcvbn
        let result;
        if (typeof zxcvbn !== 'undefined') {
            result = zxcvbn(password);
        } else {
            result = this.simpleStrengthAnalysis(password);
        }

        this.updateDisplay(result, password);
    },

    /**
     * Simple strength analysis fallback
     */
    simpleStrengthAnalysis(password) {
        const length = password.length;
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSymbol = /[^a-zA-Z0-9]/.test(password);

        let charsetSize = 0;
        if (hasLower) charsetSize += 26;
        if (hasUpper) charsetSize += 26;
        if (hasNumber) charsetSize += 10;
        if (hasSymbol) charsetSize += 32;

        const entropy = Math.log2(Math.pow(charsetSize || 1, length));

        let score = 0;
        if (entropy >= 28) score = 1;
        if (entropy >= 36) score = 2;
        if (entropy >= 60) score = 3;
        if (entropy >= 80) score = 4;

        const guesses = Math.pow(charsetSize || 1, length);

        return {
            score: score,
            guesses: guesses,
            guessesLog10: Math.log10(guesses),
            crackTimesDisplay: {
                onlineThrottling100PerHour: this.formatTime(guesses / (100 / 3600)),
                onlineNoThrottling10PerSecond: this.formatTime(guesses / 10),
                offlineSlowHashing1e4PerSecond: this.formatTime(guesses / 1e4),
                offlineFastHashing1e10PerSecond: this.formatTime(guesses / 1e10)
            },
            feedback: {
                warning: '',
                suggestions: []
            }
        };
    },

    /**
     * Format time duration
     */
    formatTime(seconds) {
        if (seconds < 1) return 'instant';
        if (seconds < 60) return `${Math.round(seconds)} seconds`;
        if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
        if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
        if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
        if (seconds < 31536000 * 100) return `${Math.round(seconds / 31536000)} years`;
        if (seconds < 31536000 * 1000000) return `${Math.round(seconds / 31536000 / 1000)} thousand years`;
        return 'centuries';
    },

    /**
     * Calculate adjusted strength based on crack time
     * This ensures the strength label matches the actual security
     */
    getAdjustedStrength(result) {
        // Get the number of guesses (use fast hash scenario - 10 billion/sec)
        const guesses = result.guesses ?? Math.pow(10, result.guesses_log10 ?? 0);
        const secondsToCrack = guesses / 1e10; // Fast hash scenario

        // Determine strength based on crack time thresholds
        // Very Weak: < 1 minute
        // Weak: < 1 hour
        // Fair: < 1 day
        // Strong: < 1 year
        // Very Strong: >= 1 year
        if (secondsToCrack < 60) return 0;           // Very Weak - under 1 minute
        if (secondsToCrack < 3600) return 1;         // Weak - under 1 hour
        if (secondsToCrack < 86400) return 2;        // Fair - under 1 day
        if (secondsToCrack < 31536000) return 3;     // Strong - under 1 year
        return 4;                                     // Very Strong - over 1 year
    },

    /**
     * Update the display with results
     */
    updateDisplay(result, password) {
        // Use adjusted strength based on crack time, not just zxcvbn score
        const score = this.getAdjustedStrength(result);
        const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
        const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
        const widths = ['20%', '40%', '60%', '80%', '100%'];

        // Strength label and bar
        const strengthLabel = document.getElementById('check-strength-label');
        strengthLabel.textContent = labels[score];
        strengthLabel.style.color = colors[score];

        const bar = document.getElementById('check-strength-bar');
        bar.style.width = widths[score];
        bar.style.backgroundColor = colors[score];

        // Entropy (handle both camelCase and snake_case from different zxcvbn versions)
        const guessesLog10 = result.guessesLog10 ?? result.guesses_log10 ?? 0;
        const entropy = Math.round(guessesLog10 * 3.32);
        document.getElementById('check-entropy-display').textContent = `~${entropy} bits`;

        // Main crack time (fast hash)
        const crackTime = result.crackTimesDisplay?.offlineFastHashing1e10PerSecond ||
                         result.crack_times_display?.offline_fast_hashing_1e10_per_second ||
                         'unknown';
        document.getElementById('check-crack-time-display').textContent = crackTime;

        // Detailed crack times
        document.getElementById('crack-online').textContent =
            result.crackTimesDisplay?.onlineNoThrottling10PerSecond ||
            result.crack_times_display?.online_no_throttling_10_per_second || '-';
        document.getElementById('crack-slow').textContent =
            result.crackTimesDisplay?.offlineSlowHashing1e4PerSecond ||
            result.crack_times_display?.offline_slow_hashing_1e4_per_second || '-';
        document.getElementById('crack-fast').textContent =
            result.crackTimesDisplay?.offlineFastHashing1e10PerSecond ||
            result.crack_times_display?.offline_fast_hashing_1e10_per_second || '-';

        // Warnings
        const warningsEl = document.getElementById('check-warnings');
        const warningText = document.getElementById('warning-text');
        if (result.feedback?.warning) {
            warningText.textContent = result.feedback.warning;
            warningsEl.classList.remove('hidden');
        } else {
            warningsEl.classList.add('hidden');
        }

        // Suggestions
        const suggestionsEl = document.getElementById('check-suggestions');
        const suggestionsList = document.getElementById('suggestions-list');
        if (result.feedback?.suggestions?.length > 0) {
            suggestionsList.innerHTML = result.feedback.suggestions
                .map(s => `<li>- ${s}</li>`)
                .join('');
            suggestionsEl.classList.remove('hidden');
        } else {
            suggestionsEl.classList.add('hidden');
        }

        // Common password check
        const commonWarning = document.getElementById('common-password-warning');
        if (this.COMMON_PASSWORDS.includes(password.toLowerCase())) {
            commonWarning.classList.remove('hidden');
        } else {
            commonWarning.classList.add('hidden');
        }
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Add custom styles
const style = document.createElement('style');
style.textContent = `
    /* Remove focus-within outline on cards */
    .tool-card:focus-within {
        outline: none;
    }

    .top-1\\/2 { top: 50%; }
    .right-3 { right: 0.75rem; }
    .-translate-y-1\\/2 { transform: translateY(-50%); }
    .bg-emerald-900\\/10 { background-color: rgba(6, 78, 59, 0.1); }
    .border-emerald-800\\/30 { border-color: rgba(6, 95, 70, 0.3); }
    .bg-amber-900\\/20 { background-color: rgba(120, 53, 15, 0.2); }
    .border-amber-800\\/30 { border-color: rgba(146, 64, 14, 0.3); }
    .bg-red-900\\/20 { background-color: rgba(127, 29, 29, 0.2); }
    .border-red-800\\/30 { border-color: rgba(153, 27, 27, 0.3); }
    .bg-dark-800\\/50 { background-color: rgba(30, 41, 59, 0.5); }
    .h-3 { height: 0.75rem; }
    .rounded-full { border-radius: 9999px; }
    .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
    .pr-12 { padding-right: 3rem; }
    .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
    .flex-shrink-0 { flex-shrink: 0; }
    .mt-0\\.5 { margin-top: 0.125rem; }
`;
document.head.appendChild(style);

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    PasswordChecker.init();
});
