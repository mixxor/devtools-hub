/**
 * Password Generator - codeutils.de
 * Generate secure passwords, memorable passphrases, and PINs
 */

const PasswordGenerator = {
    // Current mode
    currentMode: 'password',

    // Current password
    currentPassword: '',

    // History (session only)
    history: [],
    maxHistoryItems: 5,

    // Clipboard auto-clear timer
    clipboardTimer: null,

    // Character sets
    CHAR_SETS: {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '!@#$%^&*()_+-=[]{}|;:\'",.<>?/'
    },

    // Characters to exclude for various options
    SIMILAR_CHARS: 'iIlL1oO0',
    AMBIGUOUS_CHARS: '0O1lI|',

    // Common PINs to avoid
    COMMON_PINS: [
        '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',
        '1234', '2345', '3456', '4567', '5678', '6789', '7890', '0123',
        '4321', '5432', '6543', '7654', '8765', '9876', '0987', '3210',
        '1212', '2121', '1010', '0101', '2020', '1122', '2211', '1313',
        '1984', '2000', '2001', '2010', '2020', '2468', '1357', '8520',
        '0852', '1478', '2580', '0000', '9999', '6969', '1004'
    ],

    // Common passwords (top ~100 for quick check)
    COMMON_PASSWORDS: [
        'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', 'letmein',
        'dragon', '111111', 'baseball', 'iloveyou', 'trustno1', 'sunshine', 'master',
        'welcome', 'shadow', 'ashley', 'football', 'jesus', 'michael', 'ninja',
        'mustang', 'password1', '123456789', 'adobe123', 'admin', '1234567890',
        'photoshop', '1234', '12345', 'princess', 'azerty', '000000', 'access',
        '696969', 'batman', 'superman', 'qwertyuiop', 'login', 'passw0rd',
        'starwars', '654321', 'qazwsx', 'whatever', 'donald', 'charlie', 'lovely'
    ],

    // EFF Diceware wordlist (loaded from file)
    wordlist: null,
    wordlistLoaded: false,

    /**
     * Initialize the generator
     */
    async init() {
        this.loadSettings();
        this.setupEventListeners();
        await this.loadWordlist();
        this.generatePassword();
        if (typeof CodeUtils !== 'undefined') {
            CodeUtils.init();
        }
    },

    /**
     * Load EFF wordlist from JSON file
     */
    async loadWordlist() {
        try {
            const response = await fetch('/data/wordlist.json');
            if (!response.ok) {
                throw new Error('Failed to load wordlist');
            }
            const data = await response.json();
            this.wordlist = data.words;
            this.wordlistLoaded = true;
        } catch (error) {
            console.error('Error loading wordlist:', error);
            // Fallback to a minimal wordlist if fetch fails
            this.wordlist = [
                'apple', 'banana', 'cherry', 'dragon', 'eagle', 'falcon', 'grape', 'horse',
                'igloo', 'jungle', 'kayak', 'lemon', 'mango', 'ninja', 'ocean', 'piano',
                'queen', 'robot', 'storm', 'tiger', 'umbrella', 'violin', 'winter', 'yellow'
            ];
            this.wordlistLoaded = true;
        }
    },

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Mode tabs
        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchMode(tab.dataset.mode));
        });

        // Regenerate buttons (main and icon)
        document.getElementById('regenerate-btn').addEventListener('click', () => this.generatePassword());
        document.getElementById('regenerate-icon-btn').addEventListener('click', () => this.generatePassword());

        // Copy button
        document.getElementById('copy-btn').addEventListener('click', () => this.copyPassword());

        // Password mode options
        document.getElementById('password-length').addEventListener('input', (e) => {
            document.getElementById('length-value').textContent = e.target.value;
            this.generatePassword();
        });

        ['include-uppercase', 'include-lowercase', 'include-numbers', 'include-symbols'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.generatePassword());
        });

        // Advanced options toggle
        document.getElementById('advanced-toggle').addEventListener('click', () => {
            const options = document.getElementById('advanced-options');
            const chevron = document.getElementById('advanced-chevron');
            const isHidden = options.classList.contains('hidden');
            options.classList.toggle('hidden');
            chevron.style.transform = isHidden ? 'rotate(180deg)' : '';
            document.getElementById('advanced-toggle').setAttribute('aria-expanded', isHidden);
        });

        // Advanced option checkboxes
        ['easy-to-read', 'easy-to-say', 'exclude-similar', 'begin-with-letter'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.generatePassword());
        });

        // Min numbers/symbols
        ['min-numbers', 'min-symbols'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.generatePassword());
        });

        // Custom exclusions
        document.getElementById('exclude-chars').addEventListener('input',
            this.debounce(() => this.generatePassword(), 300));

        // Passphrase options
        document.getElementById('word-count').addEventListener('input', (e) => {
            document.getElementById('word-count-value').textContent = e.target.value;
            this.generatePassword();
        });

        document.querySelectorAll('.separator-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.separator-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                document.getElementById('custom-separator').value = '';
                this.generatePassword();
            });
        });

        document.getElementById('custom-separator').addEventListener('input', (e) => {
            if (e.target.value) {
                document.querySelectorAll('.separator-btn').forEach(b => b.classList.remove('active'));
            }
            this.generatePassword();
        });

        ['capitalize-words', 'uppercase-words', 'include-number-passphrase', 'include-symbol-passphrase'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.generatePassword());
        });

        // PIN options
        document.getElementById('pin-length').addEventListener('input', (e) => {
            document.getElementById('pin-length-value').textContent = e.target.value;
            this.generatePassword();
        });

        ['avoid-repeating', 'avoid-sequential', 'avoid-common-pins'].forEach(id => {
            document.getElementById(id).addEventListener('change', () => this.generatePassword());
        });

        // Bulk generation
        document.getElementById('generate-bulk-btn').addEventListener('click', () => this.generateBulk());
        document.getElementById('copy-bulk-btn').addEventListener('click', () => this.copyBulk());
        document.getElementById('download-txt-btn').addEventListener('click', () => this.downloadBulk('txt'));
        document.getElementById('download-csv-btn').addEventListener('click', () => this.downloadBulk('csv'));

        // History
        document.getElementById('clear-history-btn').addEventListener('click', () => this.clearHistory());

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.generatePassword();
            }
        });
    },

    /**
     * Switch between modes
     */
    switchMode(mode) {
        this.currentMode = mode;

        // Update tabs
        document.querySelectorAll('.mode-tab').forEach(tab => {
            const isActive = tab.dataset.mode === mode;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive);
        });

        // Show/hide options
        document.getElementById('password-options').classList.toggle('hidden', mode !== 'password');
        document.getElementById('passphrase-options').classList.toggle('hidden', mode !== 'passphrase');
        document.getElementById('pin-options').classList.toggle('hidden', mode !== 'pin');

        this.generatePassword();
        this.saveSettings();
    },

    /**
     * Generate password based on current mode
     */
    generatePassword() {
        switch (this.currentMode) {
            case 'password':
                this.currentPassword = this.generateRandomPassword();
                break;
            case 'passphrase':
                this.currentPassword = this.generatePassphrase();
                break;
            case 'pin':
                this.currentPassword = this.generatePIN();
                break;
        }

        this.displayPassword(this.currentPassword);
        this.analyzeStrength(this.currentPassword);
        this.addToHistory(this.currentPassword);
    },

    /**
     * Generate random password
     */
    generateRandomPassword() {
        const length = parseInt(document.getElementById('password-length').value);
        const includeUppercase = document.getElementById('include-uppercase').checked;
        const includeLowercase = document.getElementById('include-lowercase').checked;
        const includeNumbers = document.getElementById('include-numbers').checked;
        const includeSymbols = document.getElementById('include-symbols').checked;
        const easyToRead = document.getElementById('easy-to-read').checked;
        const easyToSay = document.getElementById('easy-to-say').checked;
        const excludeSimilar = document.getElementById('exclude-similar').checked;
        const beginWithLetter = document.getElementById('begin-with-letter').checked;
        const minNumbers = parseInt(document.getElementById('min-numbers').value) || 0;
        const minSymbols = parseInt(document.getElementById('min-symbols').value) || 0;
        const customExclusions = document.getElementById('exclude-chars').value;

        // Build character set
        let charset = '';
        let uppercaseChars = this.CHAR_SETS.uppercase;
        let lowercaseChars = this.CHAR_SETS.lowercase;
        let numberChars = this.CHAR_SETS.numbers;
        let symbolChars = this.CHAR_SETS.symbols;

        // Apply exclusions
        const exclusions = new Set(customExclusions.split(''));
        if (easyToRead) {
            this.AMBIGUOUS_CHARS.split('').forEach(c => exclusions.add(c));
        }
        if (excludeSimilar) {
            this.SIMILAR_CHARS.split('').forEach(c => exclusions.add(c));
        }

        const filterChars = (chars) => chars.split('').filter(c => !exclusions.has(c)).join('');

        uppercaseChars = filterChars(uppercaseChars);
        lowercaseChars = filterChars(lowercaseChars);
        numberChars = filterChars(numberChars);
        symbolChars = filterChars(symbolChars);

        // Easy to say: letters only
        if (easyToSay) {
            if (includeUppercase) charset += uppercaseChars;
            if (includeLowercase) charset += lowercaseChars;
        } else {
            if (includeUppercase) charset += uppercaseChars;
            if (includeLowercase) charset += lowercaseChars;
            if (includeNumbers) charset += numberChars;
            if (includeSymbols) charset += symbolChars;
        }

        if (charset.length === 0) {
            charset = lowercaseChars || 'abcdefghijklmnopqrstuvwxyz';
        }

        // Generate password
        let password = '';
        const requiredChars = [];

        // Ensure minimum numbers
        if (!easyToSay && includeNumbers && minNumbers > 0 && numberChars.length > 0) {
            for (let i = 0; i < minNumbers; i++) {
                requiredChars.push(numberChars[this.getSecureRandomInt(numberChars.length)]);
            }
        }

        // Ensure minimum symbols
        if (!easyToSay && includeSymbols && minSymbols > 0 && symbolChars.length > 0) {
            for (let i = 0; i < minSymbols; i++) {
                requiredChars.push(symbolChars[this.getSecureRandomInt(symbolChars.length)]);
            }
        }

        // Fill remaining length
        const remainingLength = length - requiredChars.length;
        for (let i = 0; i < remainingLength; i++) {
            password += charset[this.getSecureRandomInt(charset.length)];
        }

        // Shuffle in required characters
        if (requiredChars.length > 0) {
            const passwordArray = password.split('');
            requiredChars.forEach(char => {
                const pos = this.getSecureRandomInt(passwordArray.length + 1);
                passwordArray.splice(pos, 0, char);
            });
            password = passwordArray.join('');
        }

        // Begin with letter if required
        if (beginWithLetter) {
            const letters = (uppercaseChars + lowercaseChars) || 'abcdefghijklmnopqrstuvwxyz';
            if (letters.length > 0 && !/^[a-zA-Z]/.test(password)) {
                const firstLetter = letters[this.getSecureRandomInt(letters.length)];
                password = firstLetter + password.slice(1);
            }
        }

        return password.slice(0, length);
    },

    /**
     * Generate passphrase
     */
    generatePassphrase() {
        if (!this.wordlistLoaded || !this.wordlist) {
            return 'Loading wordlist...';
        }

        const wordCount = parseInt(document.getElementById('word-count').value);
        const capitalize = document.getElementById('capitalize-words').checked;
        const uppercase = document.getElementById('uppercase-words').checked;
        const includeNumber = document.getElementById('include-number-passphrase').checked;
        const includeSymbol = document.getElementById('include-symbol-passphrase').checked;

        // Get separator
        let separator = '-';
        const customSep = document.getElementById('custom-separator').value;
        if (customSep) {
            separator = customSep;
        } else {
            const activeSepBtn = document.querySelector('.separator-btn.active');
            if (activeSepBtn) {
                separator = activeSepBtn.dataset.separator;
            }
        }

        // Select random words
        const words = [];
        for (let i = 0; i < wordCount; i++) {
            const index = this.getSecureRandomInt(this.wordlist.length);
            let word = this.wordlist[index];

            if (uppercase) {
                word = word.toUpperCase();
            } else if (capitalize) {
                word = word.charAt(0).toUpperCase() + word.slice(1);
            }

            words.push(word);
        }

        // Add number if requested
        if (includeNumber) {
            const num = this.getSecureRandomInt(1000);
            const pos = this.getSecureRandomInt(words.length + 1);
            words.splice(pos, 0, num.toString());
        }

        // Add symbol if requested
        if (includeSymbol) {
            const symbols = '!@#$%^&*';
            const sym = symbols[this.getSecureRandomInt(symbols.length)];
            const pos = this.getSecureRandomInt(words.length + 1);
            words.splice(pos, 0, sym);
        }

        return words.join(separator);
    },

    /**
     * Generate PIN
     */
    generatePIN() {
        const length = parseInt(document.getElementById('pin-length').value);
        const avoidRepeating = document.getElementById('avoid-repeating').checked;
        const avoidSequential = document.getElementById('avoid-sequential').checked;
        const avoidCommon = document.getElementById('avoid-common-pins').checked;

        let pin = '';
        let attempts = 0;
        const maxAttempts = 100;

        while (attempts < maxAttempts) {
            pin = '';
            for (let i = 0; i < length; i++) {
                pin += this.getSecureRandomInt(10).toString();
            }

            let isValid = true;

            // Check for repeating digits (like 1111)
            if (avoidRepeating && /(.)\1{2,}/.test(pin)) {
                isValid = false;
            }

            // Check for sequential digits
            if (avoidSequential && isValid) {
                for (let i = 0; i < pin.length - 2; i++) {
                    const d1 = parseInt(pin[i]);
                    const d2 = parseInt(pin[i + 1]);
                    const d3 = parseInt(pin[i + 2]);
                    if ((d2 === d1 + 1 && d3 === d2 + 1) || (d2 === d1 - 1 && d3 === d2 - 1)) {
                        isValid = false;
                        break;
                    }
                }
            }

            // Check against common PINs
            if (avoidCommon && isValid && this.COMMON_PINS.includes(pin)) {
                isValid = false;
            }

            if (isValid) {
                return pin;
            }

            attempts++;
        }

        return pin; // Return last attempt if we couldn't find a valid one
    },

    /**
     * Get cryptographically secure random integer
     */
    getSecureRandomInt(max) {
        const array = new Uint32Array(1);
        crypto.getRandomValues(array);
        return array[0] % max;
    },

    /**
     * Display password (always with character highlighting)
     */
    displayPassword(password) {
        const textEl = document.getElementById('password-text');

        // Always highlight character types
        textEl.innerHTML = password.split('').map(char => {
            let className = '';
            if (/[A-Z]/.test(char)) className = 'char-uppercase';
            else if (/[a-z]/.test(char)) className = 'char-lowercase';
            else if (/[0-9]/.test(char)) className = 'char-number';
            else className = 'char-symbol';
            return `<span class="${className}">${this.escapeHtml(char)}</span>`;
        }).join('');
    },

    /**
     * Analyze password strength using zxcvbn
     */
    analyzeStrength(password) {
        // Check if zxcvbn is available
        let result;
        if (typeof zxcvbn !== 'undefined') {
            result = zxcvbn(password);
        } else if (typeof zxcvbnts !== 'undefined') {
            result = zxcvbnts.zxcvbn(password);
        } else {
            // Fallback to simple analysis
            result = this.simpleStrengthAnalysis(password);
        }

        this.updateStrengthDisplay(result);
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

        const entropy = Math.log2(Math.pow(charsetSize, length));

        let score = 0;
        if (entropy >= 28) score = 1;
        if (entropy >= 36) score = 2;
        if (entropy >= 60) score = 3;
        if (entropy >= 80) score = 4;

        // Simple crack time estimation
        const guessesPerSecond = 10e9; // 10 billion (fast offline attack)
        const guesses = Math.pow(charsetSize, length);
        const seconds = guesses / guessesPerSecond;

        return {
            score: score,
            guesses: guesses,
            guessesLog10: Math.log10(guesses),
            crackTimesDisplay: {
                offlineFastHashing1e10PerSecond: this.formatCrackTime(seconds)
            },
            feedback: {
                warning: '',
                suggestions: []
            }
        };
    },

    /**
     * Format crack time
     */
    formatCrackTime(seconds) {
        if (seconds < 1) return 'instant';
        if (seconds < 60) return `${Math.round(seconds)} seconds`;
        if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
        if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
        if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
        if (seconds < 31536000 * 100) return `${Math.round(seconds / 31536000)} years`;
        return 'centuries';
    },

    /**
     * Update strength display
     */
    updateStrengthDisplay(result) {
        const score = result.score;
        const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
        const colors = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#22c55e'];
        const widths = ['20%', '40%', '60%', '80%', '100%'];

        document.getElementById('strength-label').textContent = labels[score];
        document.getElementById('strength-label').style.color = colors[score];

        const bar = document.getElementById('strength-bar');
        bar.style.width = widths[score];
        bar.style.backgroundColor = colors[score];

        // Entropy (handle both camelCase and snake_case from different zxcvbn versions)
        const guessesLog10 = result.guessesLog10 ?? result.guesses_log10 ?? 0;
        const entropy = Math.round(guessesLog10 * 3.32); // Convert log10 to bits
        document.getElementById('entropy-display').textContent = `~${entropy} bits`;

        // Crack time
        const crackTime = result.crackTimesDisplay?.offlineFastHashing1e10PerSecond ||
                         result.crack_times_display?.offline_fast_hashing_1e10_per_second ||
                         'unknown';
        document.getElementById('crack-time-display').textContent = `Crack time: ${crackTime}`;

        // Warnings (skip for PIN mode as zxcvbn warnings aren't relevant for PINs)
        const warningsEl = document.getElementById('strength-warnings');
        if (result.feedback?.warning && this.currentMode !== 'pin') {
            warningsEl.textContent = result.feedback.warning;
            warningsEl.classList.remove('hidden');
        } else {
            warningsEl.textContent = '';
            warningsEl.classList.add('hidden');
        }
    },

    /**
     * Copy password to clipboard
     */
    async copyPassword() {
        try {
            await navigator.clipboard.writeText(this.currentPassword);

            const feedbackEl = document.getElementById('copy-feedback');
            const countdownEl = document.getElementById('copy-countdown');
            const autoClearTime = 30; // Always 30 seconds

            // Clear any existing timer
            if (this.clipboardTimer) {
                clearInterval(this.clipboardTimer);
            }

            feedbackEl.style.opacity = '1';
            let remaining = autoClearTime;
            countdownEl.textContent = remaining;

            this.clipboardTimer = setInterval(() => {
                remaining--;
                countdownEl.textContent = remaining;

                if (remaining <= 0) {
                    clearInterval(this.clipboardTimer);
                    navigator.clipboard.writeText('');
                    feedbackEl.style.opacity = '0';
                }
            }, 1000);

            // Visual feedback on button
            const btn = document.getElementById('copy-btn');
            btn.classList.add('copied');
            setTimeout(() => btn.classList.remove('copied'), 1500);

        } catch (err) {
            console.error('Failed to copy:', err);
        }
    },

    /**
     * Generate bulk passwords
     */
    generateBulk() {
        const count = Math.min(50, Math.max(1, parseInt(document.getElementById('bulk-count').value) || 10));
        const passwords = [];

        for (let i = 0; i < count; i++) {
            switch (this.currentMode) {
                case 'password':
                    passwords.push(this.generateRandomPassword());
                    break;
                case 'passphrase':
                    passwords.push(this.generatePassphrase());
                    break;
                case 'pin':
                    passwords.push(this.generatePIN());
                    break;
            }
        }

        document.getElementById('bulk-result').classList.remove('hidden');
        document.getElementById('bulk-output').value = passwords.join('\n');
    },

    /**
     * Copy bulk passwords
     */
    async copyBulk() {
        const output = document.getElementById('bulk-output').value;
        if (output) {
            await navigator.clipboard.writeText(output);
            const btn = document.getElementById('copy-bulk-btn');
            const original = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => btn.textContent = original, 1500);
        }
    },

    /**
     * Download bulk passwords
     */
    downloadBulk(format) {
        const output = document.getElementById('bulk-output').value;
        if (!output) return;

        let content, filename, type;

        if (format === 'csv') {
            content = 'Password\n' + output.split('\n').map(p => `"${p}"`).join('\n');
            filename = 'passwords.csv';
            type = 'text/csv';
        } else {
            content = output;
            filename = 'passwords.txt';
            type = 'text/plain';
        }

        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Add password to history
     */
    addToHistory(password) {
        // Don't add duplicates
        if (this.history.length > 0 && this.history[0] === password) {
            return;
        }

        this.history.unshift(password);
        if (this.history.length > this.maxHistoryItems) {
            this.history.pop();
        }

        this.renderHistory();
    },

    /**
     * Render history list
     */
    renderHistory() {
        const listEl = document.getElementById('history-list');

        if (this.history.length === 0) {
            listEl.innerHTML = '<p class="text-sm text-dark-500 text-center py-4">No passwords generated yet</p>';
            return;
        }

        listEl.innerHTML = this.history.map((pw, index) => `
            <div class="history-item flex items-center justify-between gap-2 p-2 bg-dark-800/50 rounded text-sm">
                <span class="font-mono text-xs truncate flex-1" title="${this.escapeHtml(pw)}">${this.escapeHtml(pw)}</span>
                <button class="history-copy-btn text-dark-400 hover:text-emerald-400 transition-colors flex-shrink-0" data-index="${index}" title="Copy">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                    </svg>
                </button>
            </div>
        `).join('');

        // Add copy listeners
        listEl.querySelectorAll('.history-copy-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const index = parseInt(btn.dataset.index);
                await navigator.clipboard.writeText(this.history[index]);
                btn.innerHTML = '<svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
                setTimeout(() => {
                    btn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>';
                }, 1500);
            });
        });
    },

    /**
     * Clear history
     */
    clearHistory() {
        this.history = [];
        this.renderHistory();
    },

    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('passwordGeneratorSettings');
            if (saved) {
                const settings = JSON.parse(saved);

                if (settings.mode) {
                    this.currentMode = settings.mode;
                    this.switchMode(settings.mode);
                }

                if (settings.passwordLength) {
                    document.getElementById('password-length').value = settings.passwordLength;
                    document.getElementById('length-value').textContent = settings.passwordLength;
                }

                if (settings.wordCount) {
                    document.getElementById('word-count').value = settings.wordCount;
                    document.getElementById('word-count-value').textContent = settings.wordCount;
                }

                if (settings.pinLength) {
                    document.getElementById('pin-length').value = settings.pinLength;
                    document.getElementById('pin-length-value').textContent = settings.pinLength;
                }
            }
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
    },

    /**
     * Save settings to localStorage
     */
    saveSettings() {
        try {
            const settings = {
                mode: this.currentMode,
                passwordLength: document.getElementById('password-length').value,
                wordCount: document.getElementById('word-count').value,
                pinLength: document.getElementById('pin-length').value
            };
            localStorage.setItem('passwordGeneratorSettings', JSON.stringify(settings));
        } catch (e) {
            console.error('Failed to save settings:', e);
        }
    },

    /**
     * Reset settings to defaults
     */
    resetSettings() {
        localStorage.removeItem('passwordGeneratorSettings');

        document.getElementById('password-length').value = 16;
        document.getElementById('length-value').textContent = '16';
        document.getElementById('word-count').value = 4;
        document.getElementById('word-count-value').textContent = '4';
        document.getElementById('pin-length').value = 6;
        document.getElementById('pin-length-value').textContent = '6';

        ['include-uppercase', 'include-lowercase', 'include-numbers', 'include-symbols'].forEach(id => {
            document.getElementById(id).checked = true;
        });

        this.switchMode('password');
        this.generatePassword();
    },

    /**
     * Escape HTML
     */
    escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
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

    /* Missing Tailwind utilities */
    .break-all { word-break: break-all; }
    .min-h-\\[60px\\] { min-height: 60px; }
    .min-h-\\[80px\\] { min-height: 80px; }
    .h-48 { height: 12rem; }
    .h-5 { height: 1.25rem; }
    .overflow-y-auto { overflow-y: auto; }
    .pr-24 { padding-right: 6rem; }
    .max-w-md { max-width: 28rem; }
    .max-w-lg { max-width: 32rem; }
    .border-4 { border-width: 4px; }
    .border-gray-200 { border-color: #e5e7eb; }
    .text-gray-800 { color: #1f2937; }
    .text-gray-500 { color: #6b7280; }
    .p-6 { padding: 1.5rem; }
    .cursor-pointer { cursor: pointer; }
    .flex-col { flex-direction: column; }
    .flex-1 { flex: 1 1 0%; }
    .flex-shrink-0 { flex-shrink: 0; }
    .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .-translate-y-1\\/2 { transform: translateY(-50%); }
    .transition-opacity { transition-property: opacity; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
    .opacity-0 { opacity: 0; }
    .top-1\\/2 { top: 50%; }
    .right-2 { right: 0.5rem; }
    .inset-0 { inset: 0; }
    .z-50 { z-index: 50; }
    .max-w-sm { max-width: 24rem; }
    .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
    .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
    .text-amber-400 { color: #fbbf24; }
    .text-red-400 { color: #f87171; }
    .bg-emerald-900\\/10 { background-color: rgba(6, 78, 59, 0.1); }
    .border-emerald-800\\/30 { border-color: rgba(6, 95, 70, 0.3); }
    .bg-dark-800\\/50 { background-color: rgba(30, 41, 59, 0.5); }
    .bg-dark-950\\/80 { background-color: rgba(2, 6, 23, 0.8); }
    .rounded-full { border-radius: 9999px; }
    .h-2 { height: 0.5rem; }
    .accent-emerald-500 { accent-color: #10b981; }
    .gap-1 { gap: 0.25rem; }
    .rounded { border-radius: 0.25rem; }
    .focus\\:ring-emerald-500:focus { --tw-ring-color: #10b981; }
    .fixed { position: fixed; }
    .absolute { position: absolute; }

    .mode-tab {
        display: flex;
        align-items: center;
        padding: 0.75rem 1rem;
        font-size: 0.875rem;
        color: #94a3b8;
        border-bottom: 2px solid transparent;
        cursor: pointer;
        transition: all 0.15s;
        background: none;
        border-top: none;
        border-left: none;
        border-right: none;
    }

    .mode-tab:hover {
        color: #e2e8f0;
    }

    .mode-tab.active {
        color: #10b981;
        border-bottom-color: #10b981;
    }

    .char-type-toggle {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.75rem;
        background: #0f172a;
        border: 1px solid #334155;
        border-radius: 0.5rem;
        cursor: pointer;
        font-size: 0.875rem;
        color: #94a3b8;
        transition: all 0.15s;
    }

    .char-type-toggle:hover {
        border-color: #475569;
    }

    .char-type-toggle input:checked + span {
        color: #10b981;
    }

    .char-type-toggle input {
        accent-color: #10b981;
    }

    .separator-btn {
        background: #0f172a;
        color: #94a3b8;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        border: 1px solid #334155;
        cursor: pointer;
        transition: all 0.15s;
    }

    .separator-btn:hover {
        background: #1e293b;
        border-color: #475569;
    }

    .separator-btn.active {
        background: #10b981;
        color: #020617;
        border-color: #10b981;
    }

    .tool-btn-icon {
        padding: 0.5rem;
        color: #94a3b8;
        background: transparent;
        border: none;
        border-radius: 0.375rem;
        cursor: pointer;
        transition: all 0.15s;
    }

    .tool-btn-icon:hover {
        color: #e2e8f0;
        background: #1e293b;
    }

    .tool-btn-icon.copied svg {
        stroke: #10b981;
    }

    .char-uppercase { color: #60a5fa; }
    .char-lowercase { color: #a78bfa; }
    .char-number { color: #f472b6; }
    .char-symbol { color: #fbbf24; }

    .history-item {
        transition: all 0.15s;
    }

    .history-item:hover {
        background: #1e293b;
    }

    input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        height: 8px;
        background: #1e293b;
        border-radius: 4px;
        outline: none;
    }

    input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #10b981;
        cursor: pointer;
        transition: all 0.15s;
    }

    input[type="range"]::-webkit-slider-thumb:hover {
        transform: scale(1.1);
    }

    input[type="range"]::-moz-range-thumb {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #10b981;
        cursor: pointer;
        border: none;
    }
`;
document.head.appendChild(style);

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    PasswordGenerator.init();
});
