// Category definitions with display order
const categories = [
    { id: 'encoding', name: 'Encoding & Formatting' },
    { id: 'security', name: 'Security' },
    { id: 'devops', name: 'DevOps & Infrastructure' }
];

// Tools Configuration
const tools = [
    // Encoding & Formatting
    {
        name: "Base64 Decoder/Encoder",
        url: "https://www.base64decoder.de",
        description: "Encode and decode Base64 strings instantly",
        screenshot: "/images/screenshots/base64decoder.svg",
        icon: "B64",
        category: "encoding",
        active: true
    },
    {
        name: "JSON Formatter",
        url: "https://www.jsonformat.de",
        description: "Format, validate and beautify JSON data",
        screenshot: "/images/screenshots/jsonformat.svg",
        icon: "{ }",
        category: "encoding",
        active: true
    },
    {
        name: "YAML Formatter & Linter",
        url: "/yaml-formatter.html",
        description: "Validate, format, and beautify YAML with syntax error detection",
        screenshot: "/images/screenshots/yaml.svg",
        icon: "YAML",
        category: "encoding",
        active: true
    },
    {
        name: "URL Encoder/Decoder",
        url: "#",
        description: "Encode and decode URLs",
        screenshot: null,
        icon: "%",
        category: "encoding",
        active: false
    },
    // Security
    {
        name: "Password Generator",
        url: "/password-generator.html",
        description: "Generate secure passwords, memorable passphrases, and PINs",
        screenshot: "/images/screenshots/password.svg",
        icon: "***",
        category: "security",
        active: true
    },
    {
        name: "Password Strength Checker",
        url: "/password-checker.html",
        description: "Analyze password strength with entropy estimation and crack time",
        screenshot: "/images/screenshots/password-checker.svg",
        icon: "✓",
        category: "security",
        active: true
    },
    // DevOps & Infrastructure
    {
        name: "UUID Generator",
        url: "/uuid-generator.html",
        description: "Generate random UUIDs, validate, and convert between formats",
        screenshot: "/images/screenshots/uuid.svg",
        icon: "#",
        category: "devops",
        active: true
    },
    {
        name: "Timestamp Converter",
        url: "/timestamp-converter.html",
        description: "Convert between Unix timestamps and human-readable dates",
        screenshot: "/images/screenshots/timestamp.svg",
        icon: "T",
        category: "devops",
        active: true
    },
    {
        name: "Cron Expression Tester",
        url: "/cron-tester.html",
        description: "Validate cron expressions and preview upcoming execution times",
        screenshot: "/images/screenshots/cron.svg",
        icon: "*/5",
        category: "devops",
        active: true
    },
    {
        name: "CIDR Calculator",
        url: "/cidr-calculator.html",
        description: "Calculate IP ranges, subnet masks, and network information",
        screenshot: "/images/screenshots/cidr.svg",
        icon: "CIDR",
        category: "devops",
        active: true
    }
];

// Tools are now rendered in HTML directly for better SEO and no-JS support
// This JS file is kept for the coming soon section and future enhancements

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
    renderComingSoonTools();
});
