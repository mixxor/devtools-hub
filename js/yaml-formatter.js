/**
 * YAML Formatter & Linter - codeutils.de
 * Validate, format, and beautify YAML with syntax error detection
 */

const YamlFormatter = {
    // Configuration
    options: {
        indent: 2,
        lineWidth: 80,
        sortKeys: false,
        flowLevel: -1
    },

    // Example YAML snippets
    examples: {
        'kubernetes': `apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
  labels:
    app: nginx
spec:
  replicas: 3
  selector:
    matchLabels:
      app: nginx
  template:
    metadata:
      labels:
        app: nginx
    spec:
      containers:
        - name: nginx
          image: nginx:1.21
          ports:
            - containerPort: 80
          resources:
            limits:
              cpu: "500m"
              memory: "128Mi"
            requests:
              cpu: "250m"
              memory: "64Mi"`,

        'docker-compose': `version: "3.9"
services:
  web:
    build: .
    ports:
      - "8080:80"
    volumes:
      - ./app:/app
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgres://db:5432/app
    depends_on:
      - db
      - redis

  db:
    image: postgres:14
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: app
      POSTGRES_USER: user
      POSTGRES_PASSWORD: secret

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:`,

        'github-actions': `name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: \${{ matrix.node-version }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to production
        run: echo "Deploying..."`,

        'invalid': `name: Invalid YAML Example
version: 1.0.0
  broken_indent: this line has wrong indentation
items:
  - item1
  - item2
    nested: wrong
duplicateKey: first
duplicateKey: second
tabs:	using tabs instead of spaces`
    },

    /**
     * Initialize the formatter
     */
    init() {
        this.setupEventListeners();
        this.loadOptions();
        if (typeof CodeUtils !== 'undefined') {
            CodeUtils.init();
        }
    },

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Format button
        document.getElementById('format-btn').addEventListener('click', () => {
            this.formatYaml();
        });

        // Minify button
        document.getElementById('minify-btn').addEventListener('click', () => {
            this.minifyYaml();
        });

        // Enter key in input (Ctrl+Enter to format)
        document.getElementById('yaml-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.formatYaml();
            }
        });

        // Live validation on input
        document.getElementById('yaml-input').addEventListener('input', () => {
            this.debounceValidate();
        });

        // Indentation buttons
        document.querySelectorAll('.indent-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.indent-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.options.indent = parseInt(btn.dataset.indent, 10);
                // Re-format if there's content
                if (document.getElementById('yaml-input').value.trim()) {
                    this.formatYaml();
                }
            });
        });

        // Line width buttons
        document.querySelectorAll('.linewidth-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.linewidth-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.options.lineWidth = parseInt(btn.dataset.linewidth, 10);
                // Re-format if there's content
                if (document.getElementById('yaml-input').value.trim()) {
                    this.formatYaml();
                }
            });
        });

        // Sort keys checkbox
        document.getElementById('sort-keys').addEventListener('change', (e) => {
            this.options.sortKeys = e.target.checked;
            // Re-format if there's content
            if (document.getElementById('yaml-input').value.trim()) {
                this.formatYaml();
            }
        });

        // Flow level checkbox
        document.getElementById('flow-level').addEventListener('change', (e) => {
            this.options.flowLevel = e.target.checked ? 2 : -1;
            // Re-format if there's content
            if (document.getElementById('yaml-input').value.trim()) {
                this.formatYaml();
            }
        });

        // Example buttons (both old and compact style)
        document.querySelectorAll('.example-btn, .example-btn-compact').forEach(btn => {
            btn.addEventListener('click', () => {
                const example = this.examples[btn.dataset.example];
                if (example) {
                    document.getElementById('yaml-input').value = example;
                    this.formatYaml();
                }
            });
        });

        // Copy button
        document.getElementById('copy-btn').addEventListener('click', () => {
            this.copyOutput();
        });

        // Clear button
        document.getElementById('clear-btn').addEventListener('click', () => {
            this.clearAll();
        });
    },

    /**
     * Load saved options from localStorage
     */
    loadOptions() {
        try {
            const saved = localStorage.getItem('yamlFormatterOptions');
            if (saved) {
                const parsed = JSON.parse(saved);
                Object.assign(this.options, parsed);
                this.applyOptions();
            }
        } catch (e) {
            // Ignore localStorage errors
        }
    },

    /**
     * Apply saved options to UI
     */
    applyOptions() {
        // Set active indent button
        document.querySelectorAll('.indent-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.indent, 10) === this.options.indent);
        });

        // Set active line width button
        document.querySelectorAll('.linewidth-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.linewidth, 10) === this.options.lineWidth);
        });

        // Set checkboxes
        document.getElementById('sort-keys').checked = this.options.sortKeys;
        document.getElementById('flow-level').checked = this.options.flowLevel > 0;
    },

    /**
     * Debounced validation
     */
    debounceValidate() {
        if (this.validateTimeout) {
            clearTimeout(this.validateTimeout);
        }
        this.validateTimeout = setTimeout(() => {
            this.validateOnly();
        }, 300);
    },

    /**
     * Validate without formatting
     */
    validateOnly() {
        const input = document.getElementById('yaml-input').value;
        if (!input.trim()) {
            this.showValidationStatus('neutral', 'Enter YAML to validate');
            return;
        }

        try {
            jsyaml.load(input);
            this.showValidationStatus('valid', 'Valid YAML syntax');
        } catch (e) {
            this.showValidationStatus('invalid', 'Invalid YAML syntax');
        }
    },

    /**
     * Format YAML
     */
    formatYaml() {
        const input = document.getElementById('yaml-input').value;
        const outputEl = document.getElementById('yaml-output');
        const placeholderEl = document.getElementById('output-placeholder');

        if (!input.trim()) {
            this.showValidationStatus('neutral', 'Enter YAML to validate');
            placeholderEl.classList.remove('hidden');
            outputEl.classList.add('hidden');
            document.getElementById('error-card').classList.add('hidden');
            return;
        }

        try {
            // Parse the YAML
            const parsed = jsyaml.load(input);

            // Sort keys if enabled
            const dataToFormat = this.options.sortKeys ? this.sortObjectKeys(parsed) : parsed;

            // Format with options
            const formatted = jsyaml.dump(dataToFormat, {
                indent: this.options.indent,
                lineWidth: this.options.lineWidth === -1 ? -1 : this.options.lineWidth,
                flowLevel: this.options.flowLevel,
                noRefs: true,
                sortKeys: false // We handle sorting ourselves for nested support
            });

            // Display output
            outputEl.value = formatted;
            outputEl.classList.remove('hidden');
            placeholderEl.classList.add('hidden');

            // Show success status
            this.showValidationStatus('valid', 'Valid YAML - Formatted successfully');

            // Hide error card
            document.getElementById('error-card').classList.add('hidden');

            // Calculate and show statistics
            this.showStatistics(input, parsed);

        } catch (e) {
            this.handleError(e);
        }
    },

    /**
     * Minify YAML (single line where possible)
     */
    minifyYaml() {
        const input = document.getElementById('yaml-input').value;
        const outputEl = document.getElementById('yaml-output');
        const placeholderEl = document.getElementById('output-placeholder');

        if (!input.trim()) {
            return;
        }

        try {
            const parsed = jsyaml.load(input);

            // Minify using flow style
            const minified = jsyaml.dump(parsed, {
                flowLevel: 0,
                lineWidth: -1,
                noRefs: true
            });

            outputEl.value = minified.trim();
            outputEl.classList.remove('hidden');
            placeholderEl.classList.add('hidden');

            this.showValidationStatus('valid', 'Valid YAML - Minified successfully');
            document.getElementById('error-card').classList.add('hidden');
            this.showStatistics(input, parsed);

        } catch (e) {
            this.handleError(e);
        }
    },

    /**
     * Sort object keys recursively
     */
    sortObjectKeys(obj) {
        if (Array.isArray(obj)) {
            return obj.map(item => this.sortObjectKeys(item));
        }
        if (obj !== null && typeof obj === 'object') {
            const sorted = {};
            Object.keys(obj).sort().forEach(key => {
                sorted[key] = this.sortObjectKeys(obj[key]);
            });
            return sorted;
        }
        return obj;
    },

    /**
     * Handle parsing errors
     */
    handleError(error) {
        const outputEl = document.getElementById('yaml-output');
        const placeholderEl = document.getElementById('output-placeholder');
        const errorCard = document.getElementById('error-card');
        const errorDetails = document.getElementById('error-details');

        // Show error status
        this.showValidationStatus('invalid', 'Invalid YAML syntax');

        // Show error details
        errorCard.classList.remove('hidden');

        // Parse error message for details
        const errorInfo = this.parseErrorMessage(error);
        errorDetails.innerHTML = `
            <div class="bg-red-900/20 border border-red-800 rounded-lg p-4">
                <div class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div class="flex-1">
                        <p class="text-red-400 font-medium">${errorInfo.message}</p>
                        ${errorInfo.line ? `<p class="text-dark-400 text-sm mt-1">Line ${errorInfo.line}${errorInfo.column ? `, Column ${errorInfo.column}` : ''}</p>` : ''}
                        ${errorInfo.context ? `<pre class="mt-2 text-xs text-dark-500 bg-dark-950 p-2 rounded overflow-x-auto"><code>${this.escapeHtml(errorInfo.context)}</code></pre>` : ''}
                    </div>
                </div>
            </div>
        `;

        // Hide output
        outputEl.classList.add('hidden');
        placeholderEl.classList.remove('hidden');
    },

    /**
     * Parse error message to extract line/column info
     */
    parseErrorMessage(error) {
        const message = error.message || String(error);
        const result = {
            message: message,
            line: null,
            column: null,
            context: null
        };

        // Try to extract line number from js-yaml error format
        const lineMatch = message.match(/at line (\d+)/i);
        if (lineMatch) {
            result.line = parseInt(lineMatch[1], 10);
        }

        const columnMatch = message.match(/column (\d+)/i);
        if (columnMatch) {
            result.column = parseInt(columnMatch[1], 10);
        }

        // Extract the problematic snippet if available
        const snippetMatch = message.match(/:\n([\s\S]*?)(\n\^|$)/);
        if (snippetMatch) {
            result.context = snippetMatch[1].trim();
        }

        // Clean up the main message
        result.message = message.split('\n')[0].replace(/^YAMLException:\s*/i, '');

        return result;
    },

    /**
     * Show validation status
     */
    showValidationStatus(status, message) {
        const statusEl = document.getElementById('validation-status');

        const icons = {
            valid: `<svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>`,
            invalid: `<svg class="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>`,
            neutral: `<svg class="w-4 h-4 text-dark-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>`
        };

        const colors = {
            valid: 'bg-emerald-900/30 text-emerald-400',
            invalid: 'bg-red-900/30 text-red-400',
            neutral: 'bg-dark-900 text-dark-400'
        };

        // Shorter messages for compact display
        const shortMessages = {
            'Enter YAML to validate': 'Enter YAML',
            'Valid YAML syntax': 'Valid',
            'Invalid YAML syntax': 'Invalid',
            'Valid YAML - Formatted successfully': 'Valid',
            'Valid YAML - Minified successfully': 'Valid'
        };

        const displayMessage = shortMessages[message] || message;
        statusEl.innerHTML = `${icons[status]}<span class="font-medium">${displayMessage}</span>`;
        statusEl.className = `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${colors[status]}`;
    },

    /**
     * Show statistics about the YAML
     */
    showStatistics(input, parsed) {
        const lines = input.split('\n').length;
        const chars = input.length;
        const keys = this.countKeys(parsed);
        const depth = this.getMaxDepth(parsed);

        document.getElementById('stat-lines').textContent = lines.toLocaleString();
        document.getElementById('stat-chars').textContent = chars.toLocaleString();
        document.getElementById('stat-keys').textContent = keys.toLocaleString();
        document.getElementById('stat-depth').textContent = depth;
    },

    /**
     * Count total keys in object
     */
    countKeys(obj, count = 0) {
        if (Array.isArray(obj)) {
            return obj.reduce((acc, item) => this.countKeys(item, acc), count);
        }
        if (obj !== null && typeof obj === 'object') {
            const keys = Object.keys(obj);
            count += keys.length;
            for (const key of keys) {
                count = this.countKeys(obj[key], count);
            }
        }
        return count;
    },

    /**
     * Get maximum nesting depth
     */
    getMaxDepth(obj, depth = 0) {
        if (Array.isArray(obj)) {
            if (obj.length === 0) return depth;
            return Math.max(...obj.map(item => this.getMaxDepth(item, depth + 1)));
        }
        if (obj !== null && typeof obj === 'object') {
            const keys = Object.keys(obj);
            if (keys.length === 0) return depth;
            return Math.max(...keys.map(key => this.getMaxDepth(obj[key], depth + 1)));
        }
        return depth;
    },

    /**
     * Copy output to clipboard
     */
    copyOutput() {
        const output = document.getElementById('yaml-output').value;
        if (!output) return;

        if (typeof CodeUtils !== 'undefined') {
            CodeUtils.copyToClipboard(output, document.getElementById('copy-btn'));
        } else {
            navigator.clipboard.writeText(output).then(() => {
                const btn = document.getElementById('copy-btn');
                const originalText = btn.innerHTML;
                btn.innerHTML = `
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span>Copied!</span>
                `;
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.classList.remove('copied');
                }, 2000);
            });
        }
    },

    /**
     * Clear all inputs and outputs
     */
    clearAll() {
        document.getElementById('yaml-input').value = '';
        document.getElementById('yaml-output').value = '';
        document.getElementById('yaml-output').classList.add('hidden');
        document.getElementById('output-placeholder').classList.remove('hidden');
        document.getElementById('error-card').classList.add('hidden');
        // Reset statistics to 0
        document.getElementById('stat-lines').textContent = '0';
        document.getElementById('stat-chars').textContent = '0';
        document.getElementById('stat-keys').textContent = '0';
        document.getElementById('stat-depth').textContent = '0';
        this.showValidationStatus('neutral', 'Enter YAML to validate');
    },

    /**
     * Escape HTML special characters
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// Add styles for buttons
const style = document.createElement('style');
style.textContent = `
    .indent-btn,
    .linewidth-btn {
        background: #0f172a;
        color: #94a3b8;
        padding: 0.375rem 0.75rem;
        border-radius: 0.375rem;
        font-size: 0.75rem;
        border: 1px solid #334155;
        cursor: pointer;
        transition: all 0.15s;
    }

    .indent-btn:hover,
    .linewidth-btn:hover {
        background: #1e293b;
        border-color: #475569;
    }

    .indent-btn.active,
    .linewidth-btn.active {
        background: #064e3b;
        border-color: #10b981;
        color: #10b981;
    }

    .example-btn {
        background: #0f172a;
        padding: 0.75rem 1rem;
        border-radius: 0.5rem;
        border: 1px solid #334155;
        cursor: pointer;
        transition: all 0.15s;
    }

    .example-btn:hover {
        background: #1e293b;
        border-color: #10b981;
    }

    .example-btn-compact {
        background: #0f172a;
        padding: 0.5rem 0.75rem;
        border-radius: 0.375rem;
        border: 1px solid #334155;
        cursor: pointer;
        transition: all 0.15s;
        font-size: 0.75rem;
        text-align: center;
    }

    .example-btn-compact:hover {
        background: #1e293b;
        border-color: #10b981;
    }

    #yaml-input,
    #yaml-output {
        width: 100%;
        font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace;
        tab-size: 2;
    }

    #copy-btn {
        display: flex;
        align-items: center;
        gap: 0.375rem;
        padding: 0.375rem 0.75rem;
        background: #1e293b;
        border: 1px solid #334155;
        border-radius: 0.375rem;
        color: #94a3b8;
        font-size: 0.75rem;
        cursor: pointer;
        transition: all 0.15s;
    }

    #copy-btn:hover {
        background: #334155;
        color: #e2e8f0;
    }

    #copy-btn.copied {
        background: #064e3b;
        border-color: #10b981;
        color: #10b981;
    }
`;
document.head.appendChild(style);

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    YamlFormatter.init();
});
