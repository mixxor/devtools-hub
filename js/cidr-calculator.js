/**
 * CIDR Calculator - UI Logic
 * Uses CIDRUtils from common.js for calculations
 */

(function() {
    'use strict';

    // DOM Elements
    const elements = {
        // CIDR Input
        cidrInput: document.getElementById('cidr-input'),
        calculateBtn: document.getElementById('calculate-btn'),
        cidrError: document.getElementById('cidr-error'),

        // Results
        resultsPlaceholder: document.getElementById('results-placeholder'),
        resultsContent: document.getElementById('results-content'),
        resultNetwork: document.getElementById('result-network'),
        resultBroadcast: document.getElementById('result-broadcast'),
        resultMask: document.getElementById('result-mask'),
        resultWildcard: document.getElementById('result-wildcard'),
        resultTotal: document.getElementById('result-total'),
        resultUsable: document.getElementById('result-usable'),
        resultFirst: document.getElementById('result-first'),
        resultLast: document.getElementById('result-last'),
        resultClass: document.getElementById('result-class'),
        resultType: document.getElementById('result-type'),
        resultBinary: document.getElementById('result-binary'),

        // IP Range Card
        ipRangeCard: document.getElementById('ip-range-card'),
        ipList: document.getElementById('ip-list'),
        ipListNote: document.getElementById('ip-list-note'),

        // Range to CIDR
        startIp: document.getElementById('start-ip'),
        endIp: document.getElementById('end-ip'),
        rangeToCidrBtn: document.getElementById('range-to-cidr-btn'),
        rangeError: document.getElementById('range-error'),
        rangeResult: document.getElementById('range-result'),
        rangeCidrs: document.getElementById('range-cidrs'),

        // IP Check
        checkIp: document.getElementById('check-ip'),
        checkCidr: document.getElementById('check-cidr'),
        checkIpBtn: document.getElementById('check-ip-btn'),
        checkResult: document.getElementById('check-result'),

        // Buttons
        copyIpsBtn: document.getElementById('copy-ips-btn'),
        clearBtn: document.getElementById('clear-btn'),

        // Table
        subnetTable: document.getElementById('subnet-table')
    };

    // Current calculation result
    let currentResult = null;
    let currentIpList = [];

    /**
     * Initialize the calculator
     */
    function init() {
        setupEventListeners();
        populateSubnetTable();

        // Check URL for initial value
        const urlParams = new URLSearchParams(window.location.search);
        const cidr = urlParams.get('cidr');
        if (cidr) {
            elements.cidrInput.value = cidr;
            calculate();
        }
    }

    /**
     * Setup all event listeners
     */
    function setupEventListeners() {
        // Main calculation
        elements.calculateBtn.addEventListener('click', calculate);
        elements.cidrInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') calculate();
        });

        // Live validation
        elements.cidrInput.addEventListener('input', () => {
            hideError(elements.cidrError);
            elements.cidrInput.classList.remove('input-error');
        });

        // Prefix buttons
        document.querySelectorAll('.prefix-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const prefix = btn.dataset.prefix;
                const currentValue = elements.cidrInput.value.trim();

                if (currentValue) {
                    // Extract IP part
                    const ip = currentValue.split('/')[0];
                    if (CIDRUtils.isValidIp(ip)) {
                        elements.cidrInput.value = `${ip}/${prefix}`;
                        calculate();
                    }
                } else {
                    // Use default IP
                    elements.cidrInput.value = `10.0.0.0/${prefix}`;
                    calculate();
                }
            });
        });

        // Range to CIDR
        elements.rangeToCidrBtn.addEventListener('click', convertRangeToCidr);

        // IP Check
        elements.checkIpBtn.addEventListener('click', checkIpInRange);

        // Copy buttons
        elements.copyIpsBtn.addEventListener('click', copyIpList);

        // Individual copy buttons
        document.querySelectorAll('.result-copy-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const targetId = btn.dataset.copyTarget;
                const targetElement = document.getElementById(targetId);
                if (targetElement && targetElement.textContent) {
                    await copyToClipboardWithFeedback(targetElement.textContent, btn);
                }
            });
        });

        // Clear button
        elements.clearBtn.addEventListener('click', clearAll);
    }

    /**
     * Copy text to clipboard with visual feedback on button
     */
    async function copyToClipboardWithFeedback(text, button) {
        try {
            await navigator.clipboard.writeText(text);
            button.classList.add('copied');
            setTimeout(() => button.classList.remove('copied'), 1500);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    }

    /**
     * Calculate CIDR and display results
     */
    function calculate() {
        const cidr = elements.cidrInput.value.trim();

        if (!cidr) {
            showError(elements.cidrError, 'Please enter a CIDR notation');
            elements.cidrInput.classList.add('input-error');
            return;
        }

        if (!CIDRUtils.isValidCidr(cidr)) {
            showError(elements.cidrError, 'Invalid CIDR format. Use format like 192.168.1.0/24');
            elements.cidrInput.classList.add('input-error');
            return;
        }

        hideError(elements.cidrError);
        elements.cidrInput.classList.remove('input-error');

        // Calculate
        currentResult = CIDRUtils.calculateCidr(cidr);
        displayResults(currentResult);

        // Update URL
        const url = new URL(window.location);
        url.searchParams.set('cidr', cidr);
        window.history.replaceState({}, '', url);
    }

    /**
     * Display calculation results
     */
    function displayResults(result) {
        // Show results, hide placeholder
        elements.resultsPlaceholder.classList.add('hidden');
        elements.resultsContent.classList.remove('hidden');

        // Populate results
        elements.resultNetwork.textContent = result.networkAddress;
        elements.resultBroadcast.textContent = result.broadcastAddress;
        elements.resultMask.textContent = result.subnetMask;
        elements.resultWildcard.textContent = result.wildcardMask;
        elements.resultTotal.textContent = CodeUtils.formatNumber(result.totalHosts);
        elements.resultUsable.textContent = CodeUtils.formatNumber(result.usableHosts);
        elements.resultFirst.textContent = result.firstUsableIp;
        elements.resultLast.textContent = result.lastUsableIp;
        elements.resultClass.textContent = `Class ${result.ipClass}`;
        elements.resultType.textContent = result.isPrivate ? 'Private' : 'Public';
        elements.resultBinary.textContent = result.binaryMask;

        // Generate IP list (limit to 256 for performance)
        generateIpList(result);
    }

    /**
     * Generate list of IPs in range
     */
    function generateIpList(result) {
        const maxDisplay = 256;
        const ipRange = CIDRUtils.getIpRange(result.networkInt, result.broadcastInt, maxDisplay);

        currentIpList = ipRange.ips;

        // Show IP range card
        elements.ipRangeCard.classList.remove('hidden');

        // Populate list
        elements.ipList.innerHTML = ipRange.ips.map((ip, index) => {
            let label = '';
            if (index === 0 && result.prefixLength < 31) {
                label = '<span class="text-dark-500 ml-2">(Network)</span>';
            } else if (index === ipRange.ips.length - 1 && !ipRange.truncated && result.prefixLength < 31) {
                label = '<span class="text-dark-500 ml-2">(Broadcast)</span>';
            }
            return `<div class="text-dark-300">${ip}${label}</div>`;
        }).join('');

        // Note about truncation
        if (ipRange.truncated) {
            elements.ipListNote.textContent = `Showing first ${maxDisplay} of ${CodeUtils.formatNumber(ipRange.total)} addresses`;
            elements.ipListNote.classList.remove('hidden');
        } else {
            elements.ipListNote.classList.add('hidden');
        }
    }

    /**
     * Convert IP range to CIDR(s)
     */
    function convertRangeToCidr() {
        const startIp = elements.startIp.value.trim();
        const endIp = elements.endIp.value.trim();

        hideError(elements.rangeError);

        if (!startIp || !endIp) {
            showError(elements.rangeError, 'Please enter both start and end IP addresses');
            return;
        }

        if (!CIDRUtils.isValidIp(startIp)) {
            showError(elements.rangeError, 'Invalid start IP address');
            return;
        }

        if (!CIDRUtils.isValidIp(endIp)) {
            showError(elements.rangeError, 'Invalid end IP address');
            return;
        }

        const startInt = CIDRUtils.ipToInt(startIp);
        const endInt = CIDRUtils.ipToInt(endIp);

        if (startInt > endInt) {
            showError(elements.rangeError, 'Start IP must be less than or equal to end IP');
            return;
        }

        const cidrs = CIDRUtils.rangeToCidr(startIp, endIp);

        // Display results
        elements.rangeResult.classList.remove('hidden');
        elements.rangeCidrs.innerHTML = cidrs.map(cidr =>
            `<div class="cursor-pointer hover:text-emerald-300" onclick="document.getElementById('cidr-input').value='${cidr}';document.getElementById('calculate-btn').click();">${cidr}</div>`
        ).join('');
    }

    /**
     * Check if IP is in CIDR range
     */
    function checkIpInRange() {
        const ip = elements.checkIp.value.trim();
        const cidr = elements.checkCidr.value.trim();

        elements.checkResult.classList.remove('hidden');
        elements.checkResult.classList.remove('bg-emerald-900/30', 'text-emerald-400', 'bg-red-900/30', 'text-red-400');

        if (!ip || !cidr) {
            elements.checkResult.textContent = 'Please enter both IP and CIDR';
            elements.checkResult.classList.add('bg-dark-800', 'text-dark-400');
            return;
        }

        if (!CIDRUtils.isValidIp(ip)) {
            elements.checkResult.textContent = 'Invalid IP address';
            elements.checkResult.classList.add('bg-red-900/30', 'text-red-400');
            return;
        }

        if (!CIDRUtils.isValidCidr(cidr)) {
            elements.checkResult.textContent = 'Invalid CIDR notation';
            elements.checkResult.classList.add('bg-red-900/30', 'text-red-400');
            return;
        }

        const isInRange = CIDRUtils.isIpInCidr(ip, cidr);

        if (isInRange) {
            elements.checkResult.innerHTML = `<span class="font-bold">${ip}</span> is <span class="text-emerald-300">within</span> ${cidr}`;
            elements.checkResult.classList.add('bg-emerald-900/30', 'text-emerald-400');
        } else {
            elements.checkResult.innerHTML = `<span class="font-bold">${ip}</span> is <span class="text-red-300">not within</span> ${cidr}`;
            elements.checkResult.classList.add('bg-red-900/30', 'text-red-400');
        }
    }

    /**
     * Copy IP list to clipboard
     */
    async function copyIpList() {
        if (currentIpList.length === 0) return;

        const text = currentIpList.join('\n');
        await CodeUtils.copyToClipboard(text, elements.copyIpsBtn);
    }

    /**
     * Clear all inputs and results
     */
    function clearAll() {
        elements.cidrInput.value = '';
        elements.startIp.value = '';
        elements.endIp.value = '';
        elements.checkIp.value = '';
        elements.checkCidr.value = '';

        elements.resultsPlaceholder.classList.remove('hidden');
        elements.resultsContent.classList.add('hidden');
        elements.ipRangeCard.classList.add('hidden');
        elements.rangeResult.classList.add('hidden');
        elements.checkResult.classList.add('hidden');

        hideError(elements.cidrError);
        hideError(elements.rangeError);

        currentResult = null;
        currentIpList = [];

        // Clear URL param
        const url = new URL(window.location);
        url.searchParams.delete('cidr');
        window.history.replaceState({}, '', url);
    }

    /**
     * Populate subnet reference table
     */
    function populateSubnetTable() {
        const subnets = [
            { prefix: 8, mask: '255.0.0.0', hosts: '16,777,214' },
            { prefix: 16, mask: '255.255.0.0', hosts: '65,534' },
            { prefix: 24, mask: '255.255.255.0', hosts: '254' },
            { prefix: 25, mask: '255.255.255.128', hosts: '126' },
            { prefix: 26, mask: '255.255.255.192', hosts: '62' },
            { prefix: 27, mask: '255.255.255.224', hosts: '30' },
            { prefix: 28, mask: '255.255.255.240', hosts: '14' },
            { prefix: 29, mask: '255.255.255.248', hosts: '6' },
            { prefix: 30, mask: '255.255.255.252', hosts: '2' },
            { prefix: 32, mask: '255.255.255.255', hosts: '1' }
        ];

        elements.subnetTable.innerHTML = subnets.map(s => `
            <tr class="border-t border-dark-800">
                <td class="py-2 text-emerald-400">/${s.prefix}</td>
                <td class="py-2 font-mono text-xs">${s.mask}</td>
                <td class="py-2">${s.hosts}</td>
            </tr>
        `).join('');
    }

    /**
     * Show error message
     */
    function showError(element, message) {
        element.textContent = message;
        element.classList.remove('hidden');
    }

    /**
     * Hide error message
     */
    function hideError(element) {
        element.classList.add('hidden');
    }

    // Initialize when DOM is ready
    document.addEventListener('DOMContentLoaded', init);
})();
