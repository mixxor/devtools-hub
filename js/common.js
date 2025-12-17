/**
 * Common utilities library for codeutils.de tool pages
 * This library provides shared functionality across all tool pages
 */

const CodeUtils = {
    // Version
    version: '1.0.0',

    // Tailwind config for inline script (to be included in tool pages)
    tailwindConfig: {
        darkMode: 'class',
        theme: {
            extend: {
                colors: {
                    dark: {
                        50: '#f8fafc',
                        100: '#f1f5f9',
                        200: '#e2e8f0',
                        300: '#cbd5e1',
                        400: '#94a3b8',
                        500: '#64748b',
                        600: '#475569',
                        700: '#334155',
                        800: '#1e293b',
                        900: '#0f172a',
                        950: '#020617'
                    }
                }
            }
        }
    },

    /**
     * Initialize the page with common functionality
     */
    init() {
        this.setupCopyButtons();
        this.setupKeyboardShortcuts();
    },

    /**
     * Copy text to clipboard and show feedback
     * @param {string} text - Text to copy
     * @param {HTMLElement} button - Button element to show feedback on
     */
    async copyToClipboard(text, button) {
        try {
            await navigator.clipboard.writeText(text);
            this.showCopyFeedback(button, true);
        } catch (err) {
            console.error('Failed to copy:', err);
            this.showCopyFeedback(button, false);
        }
    },

    /**
     * Show visual feedback on copy button
     * @param {HTMLElement} button - Button element
     * @param {boolean} success - Whether copy was successful
     */
    showCopyFeedback(button, success) {
        const originalHTML = button.innerHTML;

        if (success) {
            button.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="#10b981" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
            `;
        } else {
            button.innerHTML = `
                <svg class="w-4 h-4" fill="none" stroke="#ef4444" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            `;
        }

        setTimeout(() => {
            button.innerHTML = originalHTML;
        }, 1500);
    },

    /**
     * Setup all copy buttons on the page
     */
    setupCopyButtons() {
        document.querySelectorAll('[data-copy-target]').forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.dataset.copyTarget;
                const target = document.getElementById(targetId);
                if (target) {
                    const text = target.value || target.textContent;
                    this.copyToClipboard(text, button);
                }
            });
        });
    },

    /**
     * Setup common keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter to trigger primary action
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                const primaryBtn = document.querySelector('[data-primary-action]');
                if (primaryBtn) {
                    e.preventDefault();
                    primaryBtn.click();
                }
            }

            // Escape to clear inputs
            if (e.key === 'Escape') {
                const clearBtn = document.querySelector('[data-clear-action]');
                if (clearBtn) {
                    clearBtn.click();
                }
            }
        });
    },

    /**
     * Format a number with thousands separators
     * @param {number} num - Number to format
     * @returns {string} Formatted number
     */
    formatNumber(num) {
        return num.toLocaleString('en-US');
    },

    /**
     * Debounce function for input handlers
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} Debounced function
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {string} type - Type: 'success', 'error', 'info'
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        document.body.appendChild(toast);

        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    /**
     * Validate input is not empty
     * @param {string} value - Value to check
     * @param {HTMLElement} input - Input element for error styling
     * @returns {boolean} Whether valid
     */
    validateNotEmpty(value, input) {
        if (!value || value.trim() === '') {
            input.classList.add('input-error');
            return false;
        }
        input.classList.remove('input-error');
        return true;
    },

    /**
     * Generate page header HTML
     * @param {string} title - Tool title
     * @param {string} description - Tool description
     * @returns {string} Header HTML
     */
    generateHeader(title, description) {
        return `
            <header class="py-6 px-4 border-b border-dark-800">
                <div class="max-w-7xl mx-auto">
                    <a href="/" class="inline-flex items-center text-dark-400 hover:text-emerald-400 transition-colors text-sm mb-4">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                        </svg>
                        Back to Tools
                    </a>
                    <h1 class="text-2xl md:text-3xl font-bold text-white">${title}</h1>
                    <p class="mt-1 text-dark-400 text-sm">${description}</p>
                </div>
            </header>
        `;
    },

    /**
     * Generate page footer HTML
     * @returns {string} Footer HTML
     */
    generateFooter() {
        return `
            <footer class="border-t border-dark-800 py-6 px-4 mt-auto">
                <div class="max-w-7xl mx-auto text-center">
                    <p class="text-dark-500 text-xs">All calculations run client-side - your data stays private</p>
                    <div class="mt-2 flex justify-center gap-4 text-xs text-dark-500">
                        <a href="/" class="hover:text-dark-300 transition-colors">Home</a>
                        <span>|</span>
                        <a href="/impressum.html" class="hover:text-dark-300 transition-colors">Impressum</a>
                        <span>|</span>
                        <span>&copy; 2025 codeutils.de</span>
                    </div>
                </div>
            </footer>
        `;
    }
};

// CIDR Calculator specific utilities
const CIDRUtils = {
    /**
     * Convert IP address string to 32-bit integer
     * @param {string} ip - IP address (e.g., "192.168.1.1")
     * @returns {number} 32-bit integer representation
     */
    ipToInt(ip) {
        const parts = ip.split('.').map(Number);
        return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
    },

    /**
     * Convert 32-bit integer to IP address string
     * @param {number} int - 32-bit integer
     * @returns {string} IP address string
     */
    intToIp(int) {
        return [
            (int >>> 24) & 255,
            (int >>> 16) & 255,
            (int >>> 8) & 255,
            int & 255
        ].join('.');
    },

    /**
     * Validate IP address format
     * @param {string} ip - IP address to validate
     * @returns {boolean} Whether valid
     */
    isValidIp(ip) {
        const pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (!pattern.test(ip)) return false;

        const parts = ip.split('.').map(Number);
        return parts.every(part => part >= 0 && part <= 255);
    },

    /**
     * Validate CIDR notation
     * @param {string} cidr - CIDR notation (e.g., "192.168.1.0/24")
     * @returns {boolean} Whether valid
     */
    isValidCidr(cidr) {
        const parts = cidr.split('/');
        if (parts.length !== 2) return false;

        const [ip, prefix] = parts;
        const prefixNum = parseInt(prefix, 10);

        return this.isValidIp(ip) && prefixNum >= 0 && prefixNum <= 32;
    },

    /**
     * Calculate network information from CIDR
     * @param {string} cidr - CIDR notation
     * @returns {Object} Network information
     */
    calculateCidr(cidr) {
        const [ip, prefix] = cidr.split('/');
        const prefixNum = parseInt(prefix, 10);
        const ipInt = this.ipToInt(ip);

        // Calculate subnet mask
        const mask = prefixNum === 0 ? 0 : (~0 << (32 - prefixNum)) >>> 0;

        // Calculate network address (first IP)
        const networkInt = (ipInt & mask) >>> 0;

        // Calculate broadcast address (last IP)
        const broadcastInt = (networkInt | ~mask) >>> 0;

        // Calculate usable range
        const totalHosts = Math.pow(2, 32 - prefixNum);
        const usableHosts = prefixNum >= 31 ? totalHosts : totalHosts - 2;

        // First and last usable IPs
        let firstUsable, lastUsable;
        if (prefixNum === 32) {
            firstUsable = lastUsable = this.intToIp(networkInt);
        } else if (prefixNum === 31) {
            // Point-to-point link (RFC 3021)
            firstUsable = this.intToIp(networkInt);
            lastUsable = this.intToIp(broadcastInt);
        } else {
            firstUsable = this.intToIp(networkInt + 1);
            lastUsable = this.intToIp(broadcastInt - 1);
        }

        // Calculate wildcard mask
        const wildcardInt = (~mask) >>> 0;

        return {
            cidr: cidr,
            networkAddress: this.intToIp(networkInt),
            broadcastAddress: this.intToIp(broadcastInt),
            subnetMask: this.intToIp(mask),
            wildcardMask: this.intToIp(wildcardInt),
            prefixLength: prefixNum,
            totalHosts: totalHosts,
            usableHosts: usableHosts,
            firstUsableIp: firstUsable,
            lastUsableIp: lastUsable,
            ipClass: this.getIpClass(networkInt),
            isPrivate: this.isPrivateIp(networkInt),
            binaryMask: this.toBinaryMask(mask),
            networkInt: networkInt,
            broadcastInt: broadcastInt
        };
    },

    /**
     * Get IP address class
     * @param {number} ipInt - IP as integer
     * @returns {string} IP class (A, B, C, D, or E)
     */
    getIpClass(ipInt) {
        const firstOctet = (ipInt >>> 24) & 255;
        if (firstOctet < 128) return 'A';
        if (firstOctet < 192) return 'B';
        if (firstOctet < 224) return 'C';
        if (firstOctet < 240) return 'D (Multicast)';
        return 'E (Reserved)';
    },

    /**
     * Check if IP is in private range
     * @param {number} ipInt - IP as integer
     * @returns {boolean} Whether private
     */
    isPrivateIp(ipInt) {
        const firstOctet = (ipInt >>> 24) & 255;
        const secondOctet = (ipInt >>> 16) & 255;

        // 10.0.0.0/8
        if (firstOctet === 10) return true;

        // 172.16.0.0/12
        if (firstOctet === 172 && secondOctet >= 16 && secondOctet <= 31) return true;

        // 192.168.0.0/16
        if (firstOctet === 192 && secondOctet === 168) return true;

        return false;
    },

    /**
     * Convert mask to binary representation
     * @param {number} mask - Subnet mask as integer
     * @returns {string} Binary representation
     */
    toBinaryMask(mask) {
        const binary = (mask >>> 0).toString(2).padStart(32, '0');
        return binary.match(/.{8}/g).join('.');
    },

    /**
     * Convert IP to binary representation
     * @param {string} ip - IP address
     * @returns {string} Binary representation
     */
    ipToBinary(ip) {
        const int = this.ipToInt(ip);
        const binary = (int >>> 0).toString(2).padStart(32, '0');
        return binary.match(/.{8}/g).join('.');
    },

    /**
     * Get all IP addresses in range (limited for display)
     * @param {number} startInt - Start IP as integer
     * @param {number} endInt - End IP as integer
     * @param {number} limit - Maximum IPs to return
     * @returns {Array} Array of IP addresses
     */
    getIpRange(startInt, endInt, limit = 256) {
        const ips = [];
        const total = endInt - startInt + 1;
        const actualLimit = Math.min(total, limit);

        for (let i = 0; i < actualLimit; i++) {
            ips.push(this.intToIp(startInt + i));
        }

        return {
            ips: ips,
            total: total,
            truncated: total > limit
        };
    },

    /**
     * Parse IP range to CIDR(s)
     * @param {string} startIp - Start IP
     * @param {string} endIp - End IP
     * @returns {Array} Array of CIDR notations
     */
    rangeToCidr(startIp, endIp) {
        let start = this.ipToInt(startIp);
        const end = this.ipToInt(endIp);
        const cidrs = [];

        while (start <= end) {
            let maxSize = 32;
            while (maxSize > 0) {
                const mask = (~0 << (32 - maxSize + 1)) >>> 0;
                const maskBase = (start & mask) >>> 0;

                if (maskBase !== start) break;
                maxSize--;
            }

            const maxDiff = 32 - Math.floor(Math.log2(end - start + 1));
            maxSize = Math.max(maxSize, maxDiff);

            cidrs.push(`${this.intToIp(start)}/${maxSize}`);
            start += Math.pow(2, 32 - maxSize);
        }

        return cidrs;
    },

    /**
     * Check if an IP is within a CIDR range
     * @param {string} ip - IP to check
     * @param {string} cidr - CIDR range
     * @returns {boolean} Whether IP is in range
     */
    isIpInCidr(ip, cidr) {
        const info = this.calculateCidr(cidr);
        const ipInt = this.ipToInt(ip);
        return ipInt >= info.networkInt && ipInt <= info.broadcastInt;
    },

    /**
     * Get common CIDR prefix lengths with descriptions
     * @returns {Array} Array of prefix info objects
     */
    getCommonPrefixes() {
        return [
            { prefix: 8, hosts: 16777214, name: 'Class A' },
            { prefix: 16, hosts: 65534, name: 'Class B' },
            { prefix: 24, hosts: 254, name: 'Class C' },
            { prefix: 25, hosts: 126, name: 'Half Class C' },
            { prefix: 26, hosts: 62, name: 'Quarter Class C' },
            { prefix: 27, hosts: 30, name: '1/8 Class C' },
            { prefix: 28, hosts: 14, name: '1/16 Class C' },
            { prefix: 29, hosts: 6, name: 'Small subnet' },
            { prefix: 30, hosts: 2, name: 'Point-to-point' },
            { prefix: 31, hosts: 2, name: 'RFC 3021 P2P' },
            { prefix: 32, hosts: 1, name: 'Single host' }
        ];
    }
};

// Export for use in modules (if using ES modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CodeUtils, CIDRUtils };
}
