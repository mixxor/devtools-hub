// Tools Configuration
const tools = [
    {
        name: "Base64 Decoder/Encoder",
        url: "https://www.base64decoder.de",
        description: "Encode and decode Base64 strings instantly",
        screenshot: "/images/screenshots/base64decoder.svg",
        icon: "B64",
        active: true
    },
    {
        name: "JSON Formatter",
        url: "https://www.jsonformat.de",
        description: "Format, validate and beautify JSON data",
        screenshot: "/images/screenshots/jsonformat.svg",
        icon: "{ }",
        active: true
    },
    {
        name: "URL Encoder/Decoder",
        url: "#",
        description: "Encode and decode URLs",
        screenshot: null,
        icon: "%",
        active: false
    },
    {
        name: "UUID Generator",
        url: "#",
        description: "Generate random UUIDs",
        screenshot: null,
        icon: "#",
        active: false
    },
    {
        name: "Timestamp Converter",
        url: "/timestamp-converter.html",
        description: "Convert between Unix timestamps and human-readable dates",
        screenshot: "/images/screenshots/timestamp.svg",
        icon: "T",
        active: true
    },
    {
        name: "CIDR Calculator",
        url: "/cidr-calculator.html",
        description: "Calculate IP ranges, subnet masks, and network information",
        screenshot: "/images/screenshots/cidr.svg",
        icon: "CIDR",
        active: true
    }
];

// Render active tools
function renderActiveTools() {
    const gallery = document.getElementById('tools-gallery');
    const activeTools = tools.filter(tool => tool.active);

    gallery.innerHTML = activeTools.map(tool => `
        <article class="tool-card">
            <div class="screenshot-container">
                ${tool.screenshot
                    ? `<img src="${tool.screenshot}" alt="${tool.name} screenshot" width="800" height="450" loading="lazy">`
                    : `<div class="screenshot-placeholder">${tool.icon}</div>`
                }
            </div>
            <div class="tool-card-content">
                <h2 class="text-lg font-semibold text-white mb-1">
                    <a href="${tool.url}" target="_blank" rel="noopener noreferrer" class="tool-link">${tool.name}</a>
                </h2>
                <p class="text-dark-400 text-sm mb-4">${tool.description}</p>
                <span class="open-tool-btn">
                    Open Tool
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                </span>
            </div>
        </article>
    `).join('');
}

// Render coming soon tools
function renderComingSoonTools() {
    const gallery = document.getElementById('coming-soon-gallery');
    const comingSoonTools = tools.filter(tool => !tool.active);

    gallery.innerHTML = comingSoonTools.map(tool => `
        <div class="coming-soon-card">
            <div class="coming-soon-icon">${tool.icon}</div>
            <div class="coming-soon-name">${tool.name}</div>
        </div>
    `).join('');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderActiveTools();
    renderComingSoonTools();
});
