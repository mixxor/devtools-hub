/**
 * Klaro Consent Management Configuration
 * https://klaro.org/
 */
var klaroConfig = {
    version: 1,
    elementID: 'klaro',
    storageMethod: 'localStorage',
    storageName: 'klaro',
    mustConsent: false,
    acceptAll: true,
    hideDeclineAll: false,
    hideLearnMore: false,
    noticeAsModal: false,
    disablePoweredBy: true,
    privacyPolicy: '/datenschutz.html',

    translations: {
        de: {
            consentModal: {
                title: 'Datenschutz-Einstellungen',
                description: 'Hier kannst du einstellen, welche Dienste auf dieser Website verwendet werden dürfen.'
            },
            consentNotice: {
                description: 'Wir nutzen Cookies und Analytics, um diese Website zu verbessern. {purposes}',
                learnMore: 'Mehr erfahren'
            },
            purposes: {
                analytics: 'Analyse'
            },
            ok: 'Akzeptieren',
            decline: 'Ablehnen',
            acceptAll: 'Alle akzeptieren',
            declineAll: 'Alle ablehnen'
        },
        en: {
            consentModal: {
                title: 'Privacy Settings',
                description: 'Here you can configure which services may be used on this website.'
            },
            consentNotice: {
                description: 'We use cookies and analytics to improve this website. {purposes}',
                learnMore: 'Learn more'
            },
            purposes: {
                analytics: 'Analytics'
            },
            ok: 'Accept',
            decline: 'Decline',
            acceptAll: 'Accept all',
            declineAll: 'Decline all'
        }
    },

    services: [
        {
            name: 'google-analytics',
            title: 'Google Analytics',
            purposes: ['analytics'],
            cookies: [
                /^_ga/,
                /^_gid/,
                /^_gat/,
                /^__utm/
            ],
            required: false,
            optOut: false,
            default: false,
            onAccept: function() {
                // Grant consent and load GA
                if (typeof gtag === 'function') {
                    gtag('consent', 'update', {
                        'analytics_storage': 'granted'
                    });
                }
            },
            onDecline: function() {
                // Ensure consent is denied
                if (typeof gtag === 'function') {
                    gtag('consent', 'update', {
                        'analytics_storage': 'denied'
                    });
                }
            }
        }
    ]
};
