/**
 * Site Navigation
 * Handles desktop dropdown and mobile menu functionality
 */

(function() {
    'use strict';

    // DOM Elements
    const mobileMenuTrigger = document.getElementById('nav-mobile-trigger');
    const mobileMenu = document.getElementById('nav-mobile-menu');
    const desktopDropdown = document.getElementById('nav-dropdown');
    const dropdownTrigger = document.getElementById('nav-dropdown-trigger');
    const dropdownMenu = document.getElementById('nav-dropdown-menu');

    // Mobile Menu Toggle
    if (mobileMenuTrigger && mobileMenu) {
        mobileMenuTrigger.addEventListener('click', function() {
            const isOpen = this.getAttribute('aria-expanded') === 'true';

            this.setAttribute('aria-expanded', !isOpen);
            mobileMenu.classList.toggle('open', !isOpen);
            document.body.classList.toggle('nav-open', !isOpen);
        });

        // Close mobile menu when clicking a link
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function() {
                mobileMenuTrigger.setAttribute('aria-expanded', 'false');
                mobileMenu.classList.remove('open');
                document.body.classList.remove('nav-open');
            });
        });
    }

    // Desktop Dropdown Toggle
    if (desktopDropdown && dropdownTrigger) {
        dropdownTrigger.addEventListener('click', function(e) {
            e.stopPropagation();
            const isOpen = this.getAttribute('aria-expanded') === 'true';

            this.setAttribute('aria-expanded', !isOpen);
            desktopDropdown.classList.toggle('open', !isOpen);
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!desktopDropdown.contains(e.target)) {
                dropdownTrigger.setAttribute('aria-expanded', 'false');
                desktopDropdown.classList.remove('open');
            }
        });

        // Close dropdown when pressing Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                dropdownTrigger.setAttribute('aria-expanded', 'false');
                desktopDropdown.classList.remove('open');

                // Also close mobile menu
                if (mobileMenuTrigger && mobileMenu) {
                    mobileMenuTrigger.setAttribute('aria-expanded', 'false');
                    mobileMenu.classList.remove('open');
                    document.body.classList.remove('nav-open');
                }
            }
        });
    }

    // Mark current page as active
    const currentPath = window.location.pathname;
    document.querySelectorAll('.nav-dropdown-item, .nav-mobile-item').forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });
})();
