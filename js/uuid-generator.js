/**
 * UUID Generator - codeutils.de
 * Generate random UUIDs, validate, and convert between formats
 */

const UUIDGenerator = {
    // Current format selection
    currentFormat: 'lowercase',

    // Current UUID being displayed
    currentUUID: null,

    /**
     * Initialize the generator
     */
    init() {
        this.setupEventListeners();
        this.generateUUID();
        CodeUtils.init();
    },

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Generate button
        document.getElementById('generate-btn').addEventListener('click', () => {
            this.generateUUID();
        });

        // Copy single UUID
        document.getElementById('copy-uuid-btn').addEventListener('click', () => {
            const uuid = document.getElementById('generated-uuid').value;
            if (uuid) {
                CodeUtils.copyToClipboard(uuid, document.getElementById('copy-uuid-btn'));
            }
        });

        // Format buttons
        document.querySelectorAll('.format-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentFormat = btn.dataset.format;
                if (this.currentUUID) {
                    this.displayFormattedUUID(this.currentUUID);
                }
            });
        });

        // Bulk generate
        document.getElementById('bulk-generate-btn').addEventListener('click', () => {
            this.bulkGenerate();
        });

        document.getElementById('bulk-count').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.bulkGenerate();
            }
        });

        // Copy bulk
        document.getElementById('copy-bulk-btn').addEventListener('click', () => {
            const output = document.getElementById('bulk-output').value;
            if (output) {
                CodeUtils.copyToClipboard(output, document.getElementById('copy-bulk-btn'));
            }
        });

        // Validate
        document.getElementById('validate-btn').addEventListener('click', () => {
            this.validateUUID();
        });

        document.getElementById('validate-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.validateUUID();
            }
        });

        // Clear button
        document.getElementById('clear-btn').addEventListener('click', () => {
            this.clearAll();
        });

        // Copy buttons for details
        document.querySelectorAll('.result-copy-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const targetId = btn.dataset.copyTarget;
                const targetElement = document.getElementById(targetId);
                if (targetElement && targetElement.textContent) {
                    await this.copyToClipboardWithFeedback(targetElement.textContent, btn);
                }
            });
        });
    },

    /**
     * Copy text to clipboard with visual feedback on button
     */
    async copyToClipboardWithFeedback(text, button) {
        try {
            await navigator.clipboard.writeText(text);
            button.classList.add('copied');
            setTimeout(() => button.classList.remove('copied'), 1500);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    },

    /**
     * Generate a new UUID v4
     * @returns {string} UUID in standard format (lowercase with hyphens)
     */
    createUUIDv4() {
        // Use crypto.getRandomValues for cryptographically secure random numbers
        const bytes = new Uint8Array(16);
        crypto.getRandomValues(bytes);

        // Set version (4) in bits 12-15 of time_hi_and_version
        bytes[6] = (bytes[6] & 0x0f) | 0x40;

        // Set variant (RFC 4122) in bits 6-7 of clock_seq_hi_and_reserved
        bytes[8] = (bytes[8] & 0x3f) | 0x80;

        // Convert to hex string
        const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');

        // Format as UUID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
        return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
    },

    /**
     * Format UUID according to current format setting
     * @param {string} uuid - UUID in standard format
     * @returns {string} Formatted UUID
     */
    formatUUID(uuid) {
        const normalized = uuid.toLowerCase();

        switch (this.currentFormat) {
            case 'uppercase':
                return normalized.toUpperCase();
            case 'no-hyphens':
                return normalized.replace(/-/g, '');
            case 'braces':
                return `{${normalized.toUpperCase()}}`;
            case 'lowercase':
            default:
                return normalized;
        }
    },

    /**
     * Generate and display a new UUID
     */
    generateUUID() {
        this.currentUUID = this.createUUIDv4();
        this.displayFormattedUUID(this.currentUUID);
        this.showDetails(this.currentUUID);
    },

    /**
     * Display the formatted UUID
     * @param {string} uuid - UUID in standard format
     */
    displayFormattedUUID(uuid) {
        const formatted = this.formatUUID(uuid);
        document.getElementById('generated-uuid').value = formatted;
    },

    /**
     * Bulk generate UUIDs
     */
    bulkGenerate() {
        const countInput = document.getElementById('bulk-count');
        let count = parseInt(countInput.value, 10);

        // Validate count
        if (isNaN(count) || count < 1) {
            count = 1;
            countInput.value = 1;
        } else if (count > 1000) {
            count = 1000;
            countInput.value = 1000;
        }

        // Generate UUIDs
        const uuids = [];
        for (let i = 0; i < count; i++) {
            const uuid = this.createUUIDv4();
            uuids.push(this.formatUUID(uuid));
        }

        // Display results
        document.getElementById('bulk-result').classList.remove('hidden');
        document.getElementById('bulk-output').value = uuids.join('\n');
    },

    /**
     * Validate a UUID
     */
    validateUUID() {
        const input = document.getElementById('validate-input').value.trim();
        const resultEl = document.getElementById('validate-result');

        resultEl.classList.remove('hidden');
        resultEl.classList.remove('bg-emerald-900/30', 'text-emerald-400', 'bg-red-900/30', 'text-red-400', 'bg-dark-800', 'text-dark-400');

        if (!input) {
            resultEl.textContent = 'Please enter a UUID to validate';
            resultEl.classList.add('bg-dark-800', 'text-dark-400');
            return;
        }

        const validation = this.isValidUUID(input);

        if (validation.valid) {
            resultEl.innerHTML = `<span class="text-emerald-300">Valid UUID</span> (Version ${validation.version})`;
            resultEl.classList.add('bg-emerald-900/30', 'text-emerald-400');

            // Show details for valid UUID
            this.currentUUID = validation.normalized;
            this.showDetails(validation.normalized);
        } else {
            resultEl.innerHTML = `<span class="text-red-300">Invalid UUID</span> - ${validation.reason}`;
            resultEl.classList.add('bg-red-900/30', 'text-red-400');
        }
    },

    /**
     * Check if a string is a valid UUID
     * @param {string} str - String to validate
     * @returns {Object} Validation result
     */
    isValidUUID(str) {
        // Remove braces and urn prefix if present
        let normalized = str.trim();

        // Handle URN format
        if (normalized.toLowerCase().startsWith('urn:uuid:')) {
            normalized = normalized.slice(9);
        }

        // Handle braces
        if (normalized.startsWith('{') && normalized.endsWith('}')) {
            normalized = normalized.slice(1, -1);
        }

        // Add hyphens if missing
        if (normalized.length === 32 && !normalized.includes('-')) {
            normalized = `${normalized.slice(0, 8)}-${normalized.slice(8, 12)}-${normalized.slice(12, 16)}-${normalized.slice(16, 20)}-${normalized.slice(20)}`;
        }

        normalized = normalized.toLowerCase();

        // Check format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
        if (!uuidRegex.test(normalized)) {
            return { valid: false, reason: 'Invalid format' };
        }

        // Extract version (13th character)
        const version = normalized.charAt(14);
        if (!['1', '2', '3', '4', '5', '6', '7', '8'].includes(version)) {
            return { valid: false, reason: 'Invalid version' };
        }

        // Check variant (17th character should be 8, 9, a, or b for RFC 4122)
        const variant = normalized.charAt(19);
        const isRFC4122 = ['8', '9', 'a', 'b'].includes(variant);

        return {
            valid: true,
            normalized: normalized,
            version: version,
            variant: isRFC4122 ? 'RFC 4122' : 'Other'
        };
    },

    /**
     * Show UUID details panel
     * @param {string} uuid - UUID to analyze
     */
    showDetails(uuid) {
        document.getElementById('details-placeholder').classList.add('hidden');
        document.getElementById('details-content').classList.remove('hidden');

        const normalized = uuid.toLowerCase();

        // Display various formats
        document.getElementById('detail-lowercase').textContent = normalized;
        document.getElementById('detail-uppercase').textContent = normalized.toUpperCase();
        document.getElementById('detail-nohyphens').textContent = normalized.replace(/-/g, '');
        document.getElementById('detail-braces').textContent = `{${normalized.toUpperCase()}}`;
        document.getElementById('detail-urn').textContent = `urn:uuid:${normalized}`;

        // Extract version and variant
        const version = normalized.charAt(14);
        const variantChar = normalized.charAt(19);

        let versionDesc;
        switch (version) {
            case '1': versionDesc = '1 (Timestamp + MAC)'; break;
            case '2': versionDesc = '2 (DCE Security)'; break;
            case '3': versionDesc = '3 (MD5 Hash)'; break;
            case '4': versionDesc = '4 (Random)'; break;
            case '5': versionDesc = '5 (SHA-1 Hash)'; break;
            case '6': versionDesc = '6 (Reordered Time)'; break;
            case '7': versionDesc = '7 (Unix Timestamp)'; break;
            case '8': versionDesc = '8 (Custom)'; break;
            default: versionDesc = 'Unknown';
        }

        let variantDesc;
        if (['8', '9', 'a', 'b'].includes(variantChar)) {
            variantDesc = 'RFC 4122';
        } else if (['c', 'd'].includes(variantChar)) {
            variantDesc = 'Microsoft';
        } else if (['0', '1', '2', '3', '4', '5', '6', '7'].includes(variantChar)) {
            variantDesc = 'NCS (reserved)';
        } else {
            variantDesc = 'Future (reserved)';
        }

        document.getElementById('detail-version').textContent = versionDesc;
        document.getElementById('detail-variant').textContent = variantDesc;
    },

    /**
     * Clear all inputs and results
     */
    clearAll() {
        document.getElementById('generated-uuid').value = '';
        document.getElementById('validate-input').value = '';
        document.getElementById('validate-result').classList.add('hidden');
        document.getElementById('bulk-result').classList.add('hidden');
        document.getElementById('bulk-output').value = '';

        document.getElementById('details-placeholder').classList.remove('hidden');
        document.getElementById('details-content').classList.add('hidden');

        this.currentUUID = null;
    }
};

// Add styles for format buttons
const style = document.createElement('style');
style.textContent = `
    .format-btn {
        background: #0f172a;
        color: #94a3b8;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        border: 1px solid #334155;
        cursor: pointer;
        transition: all 0.15s;
    }

    .format-btn:hover {
        background: #1e293b;
        border-color: #475569;
    }

    .format-btn.active {
        background: #10b981;
        color: #020617;
        border-color: #10b981;
    }

    .result-copy-btn.copied svg {
        stroke: #10b981;
    }
`;
document.head.appendChild(style);

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    UUIDGenerator.init();
});
