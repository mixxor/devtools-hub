/**
 * Klaro Consent Management Configuration
 * https://kiprotect.com/klaro
 */
var klaroConfig = {
    privacyPolicy: '/datenschutz',
    apps: [{
        name: 'google-analytics',
        title: 'Google Analytics',
        purposes: ['analytics'],
        cookies: [/^_ga/, /^_gid/, /^_gat/],
        callback: function(consent, app) {
            if (consent) {
                // Initialize GA here
                gtag('consent', 'update', {
                    'analytics_storage': 'granted'
                });
            }
        }
    }]
};
