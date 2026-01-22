/**
 * Smart Classroom Tutorial System
 * Provides interactive onboarding for first-time users
 * Focuses on Candidate/Student role switcher
 * Optimized for Mobile Devices
 */

class Tutorial {
    constructor() {
        this.currentStep = 0;
        this.hasSeenTutorial = localStorage.getItem('scl_tutorial_completed') === 'true';
        this.isMobile = window.innerWidth <= 900; // Match CSS breakpoint

        // Handle resize to update mobile state
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth <= 900;
        });

        // Tutorial steps configuration
        this.steps = [
            {
                target: '.logo',
                title: 'Welcome to Smart Classroom!',
                text: 'Let me show you around. This quick tutorial will help you navigate our platform effectively.',
                icon: '👋',
                position: 'bottom',
                highlight: true
            },
            {
                target: this.isMobile ? '#menu-toggle' : 'nav',
                title: 'Navigation Menu',
                text: this.isMobile
                    ? 'Tap the menu icon to access all pages including Subjects, Simulators, and Products.'
                    : 'Use this navigation bar to explore different sections like Subjects, Simulators, and Products.',
                icon: '🧭',
                position: 'bottom',
                highlight: true
            },
            {
                target: this.isMobile ? '.slider-content .role-switch' : '.desktop-nav .role-switch',
                title: '⭐ Important: Role Switcher',
                text: 'This is the MOST IMPORTANT feature! Toggle between "Candidate" (admission prep) and "Student" (university courses) to see different content.',
                icon: '🎯',
                position: 'bottom',
                highlight: true,
                highlightText: 'Many users miss this! Always check your role before browsing.',
                mobileAction: 'openMenu' // Special action for mobile
            },
            {
                target: this.isMobile ? '.slider-content #role-toggle' : '.desktop-nav #role-toggle',
                title: 'How to Switch Roles',
                text: this.isMobile
                    ? 'Tap this toggle to switch between Candidate and Student modes. Try it now!'
                    : 'Click this toggle to switch between Candidate and Student modes. Give it a try!',
                icon: '🔄',
                position: 'bottom',
                highlight: true,
                highlightText: 'Switch your role based on what you need to study!',
                mobileAction: 'keepMenuOpen'
            },
            {
                target: 'nav a[href="subjects.html"]',
                fallbackTarget: '.slider-content nav a[href="subjects.html"]',
                title: 'Subjects Section',
                text: 'Different subjects appear based on your role. Candidates see admission topics, Students see university courses.',
                icon: '📚',
                position: 'bottom',
                highlight: true,
                mobileAction: 'keepMenuOpen'
            },
            {
                target: 'nav a[href="simulators.html"]',
                fallbackTarget: '.slider-content nav a[href="simulators.html"]',
                title: 'Interactive Simulators',
                text: 'Explore physics, chemistry, and math simulators to understand concepts visually.',
                icon: '🔬',
                position: 'bottom',
                highlight: true,
                mobileAction: 'keepMenuOpen'
            },
            {
                target: '.instruction-button, #instruction-button',
                title: 'Need Help?',
                text: 'Click here anytime to see detailed instructions about using the website.',
                icon: '❓',
                position: 'left',
                highlight: true,
                optional: true,
                mobileAction: 'closeMenu' // Ensure menu is closed
            }
        ];

        this.init();
    }

    init() {
        if (this.hasSeenTutorial) return;

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.showWelcome());
        } else {
            setTimeout(() => this.showWelcome(), 500);
        }
    }

    showWelcome() {
        this.createOverlay();

        const welcome = document.createElement('div');
        welcome.className = 'tutorial-welcome';
        welcome.innerHTML = `
            <div class="tutorial-welcome-icon">
                <i class="fas fa-graduation-cap"></i>
            </div>
            <h2>Welcome to Smart Classroom! 🎓</h2>
            <p>We're a non-profit educational platform helping students with free resources. Let us give you a quick tour to get started!</p>
            <p style="color: #4A90E2; font-weight: 600;">⏱️ Takes only 30 seconds</p>
            <div class="tutorial-welcome-buttons">
                <button class="tutorial-btn tutorial-btn-skip" onclick="tutorial.skipTutorial()">
                    Skip Tour
                </button>
                <button class="tutorial-btn tutorial-btn-next" onclick="tutorial.startTutorial()">
                    <i class="fas fa-play"></i> Start Tour
                </button>
            </div>
        `;

        document.body.appendChild(welcome);
    }

    createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'tutorial-overlay';
        overlay.id = 'tutorial-overlay';
        document.body.appendChild(overlay);
    }

    startTutorial() {
        const welcome = document.querySelector('.tutorial-welcome');
        if (welcome) {
            welcome.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => welcome.remove(), 300);
        }

        const overlay = document.getElementById('tutorial-overlay');
        overlay.classList.add('active');

        this.showStep(0);
    }

    async showStep(stepIndex) {
        this.currentStep = stepIndex;
        const step = this.steps[stepIndex];

        // Clean up previous step
        this.clearStep();

        // Handle Mobile Menu Actions
        if (this.isMobile) {
            await this.handleMobileActions(step.mobileAction);
        }

        // Find Target
        let target = this.findTarget(step);

        // Retry mechanism for dynamic content (like mobile menu items)
        if (!target && this.isMobile && (step.mobileAction === 'openMenu' || step.mobileAction === 'keepMenuOpen')) {
            await new Promise(r => setTimeout(r, 500)); // Wait a bit more for menu
            target = this.findTarget(step);
        }

        if (!target) {
            console.warn(`Tutorial target not found: ${step.target}`);
            if (step.optional) {
                // If optional and targeting the instruction button which might be hidden by menu
                if (stepIndex < this.steps.length - 1) {
                    this.showStep(stepIndex + 1);
                } else {
                    this.completeTutorial();
                }
            } else {
                // Skip non-optional missing steps
                if (stepIndex < this.steps.length - 1) {
                    this.showStep(stepIndex + 1);
                } else {
                    this.completeTutorial();
                }
            }
            return;
        }

        // Scroll logic - optimized for mobile
        const scrollOptions = { behavior: 'smooth', block: 'center', inline: 'center' };
        target.scrollIntoView(scrollOptions);

        setTimeout(() => {
            if (step.highlight) this.createSpotlight(target);
            this.createTooltip(target, step, stepIndex);
        }, 400);
    }

    findTarget(step) {
        let targets = document.querySelectorAll(step.target);
        // If multiple targets (e.g. ID used twice due to cloning), find visible one
        for (let t of targets) {
            if (t.offsetParent !== null) return t;
        }

        // Try fallback if primary not found
        if (step.fallbackTarget) {
            targets = document.querySelectorAll(step.fallbackTarget);
            for (let t of targets) {
                if (t.offsetParent !== null) return t;
            }
        }
        return null; // Not found
    }

    async handleMobileActions(action) {
        const slider = document.getElementById('nav-slider');
        const overlay = document.getElementById('nav-overlay');
        const openBtn = document.getElementById('menu-toggle');
        const closeBtn = document.getElementById('close-nav-button');

        if (!slider || !openBtn) return;

        const isOpen = slider.classList.contains('open');

        if (action === 'openMenu' || action === 'keepMenuOpen') {
            if (!isOpen) {
                openBtn.click();
                await new Promise(r => setTimeout(r, 300)); // Wait for slide animation
            }
        } else if (action === 'closeMenu') {
            if (isOpen && closeBtn) {
                closeBtn.click();
                await new Promise(r => setTimeout(r, 300));
            } else if (isOpen) {
                // Fallback if close button not found
                overlay.click();
                await new Promise(r => setTimeout(r, 300));
            }
        }
    }

    createSpotlight(target) {
        const rect = target.getBoundingClientRect();
        const spotlight = document.createElement('div');
        spotlight.className = 'tutorial-spotlight';

        // Add padding based on element type
        const padding = target.tagName === 'A' || target.tagName === 'BUTTON' ? 10 : 15;

        spotlight.style.top = `${rect.top + window.scrollY - padding}px`;
        spotlight.style.left = `${rect.left + window.scrollX - padding}px`;
        spotlight.style.width = `${rect.width + (padding * 2)}px`;
        spotlight.style.height = `${rect.height + (padding * 2)}px`;
        document.body.appendChild(spotlight);
    }

    createTooltip(target, step, stepIndex) {
        const tooltip = document.createElement('div');
        tooltip.className = 'tutorial-tooltip';
        tooltip.id = 'tutorial-tooltip';

        const progressDots = this.steps.filter(s => !s.optional).map((_, i) =>
            `<div class="progress-dot ${i === stepIndex ? 'active' : ''}"></div>`
        ).join('');

        tooltip.innerHTML = `
            <div class="tutorial-header">
                <div class="tutorial-icon">${step.icon}</div>
                <h3 class="tutorial-title">${step.title}</h3>
            </div>
            <div class="tutorial-content">
                <p class="tutorial-text">${step.text}</p>
                ${step.highlightText ? `<div class="tutorial-highlight">💡 ${step.highlightText}</div>` : ''}
            </div>
            <div class="tutorial-progress">${progressDots}</div>
            <div class="tutorial-buttons">
                <button class="tutorial-btn tutorial-btn-skip" onclick="tutorial.skipTutorial()">
                    Skip
                </button>
                <div style="display: flex; gap: 10px;">
                    <button class="tutorial-btn tutorial-btn-prev" 
                            onclick="tutorial.prevStep()" 
                            ${stepIndex === 0 ? 'disabled' : ''}>
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button class="tutorial-btn ${stepIndex === this.steps.length - 1 ? 'tutorial-btn-finish' : 'tutorial-btn-next'}" 
                            onclick="tutorial.nextStep()">
                        ${stepIndex === this.steps.length - 1
                ? '<i class="fas fa-check"></i> Finish'
                : 'Next <i class="fas fa-arrow-right"></i>'}
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(tooltip);
        this.positionTooltip(tooltip, target, step.position);
    }

    positionTooltip(tooltip, target, position) {
        const rect = target.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();
        const scrollY = window.scrollY;
        const scrollX = window.scrollX;
        const padding = 20;

        let top, left;

        if (this.isMobile) {
            // Mobile: Always at bottom/center for best visibility
            // Unless element is very low, then put at top
            if (rect.bottom > window.innerHeight - 300) {
                top = rect.top + scrollY - tooltipRect.height - padding;
                tooltip.classList.add('arrow-bottom');
            } else {
                top = rect.bottom + scrollY + padding;
                tooltip.classList.add('arrow-top');
            }
            // Center horizontally
            left = scrollX + (window.innerWidth - tooltipRect.width) / 2;
        } else {
            // Desktop positioning logic
            switch (position) {
                case 'bottom':
                    top = rect.bottom + scrollY + padding;
                    left = rect.left + scrollX + (rect.width - tooltipRect.width) / 2;
                    tooltip.classList.add('arrow-top');
                    break;
                case 'top':
                    top = rect.top + scrollY - tooltipRect.height - padding;
                    left = rect.left + scrollX + (rect.width - tooltipRect.width) / 2;
                    tooltip.classList.add('arrow-bottom');
                    break;
                case 'left':
                    top = rect.top + scrollY + (rect.height - tooltipRect.height) / 2;
                    left = rect.left + scrollX - tooltipRect.width - padding;
                    tooltip.classList.add('arrow-right');
                    break;
                case 'right': // Default or fallback
                default:
                    top = rect.top + scrollY + (rect.height - tooltipRect.height) / 2;
                    left = rect.right + scrollX + padding;
                    tooltip.classList.add('arrow-left');
                    break;
            }
        }

        // Boundary Checks
        const safeMargin = 10;
        const maxLeft = window.innerWidth - tooltipRect.width - safeMargin + scrollX;
        const maxTop = window.innerHeight - tooltipRect.height - safeMargin + scrollY;

        left = Math.max(safeMargin + scrollX, Math.min(left, maxLeft));
        top = Math.max(safeMargin + scrollY, Math.min(top, maxTop));

        tooltip.style.top = `${top}px`;
        tooltip.style.left = `${left}px`;
    }

    clearStep() {
        const spotlight = document.querySelector('.tutorial-spotlight');
        if (spotlight) spotlight.remove();

        const tooltip = document.getElementById('tutorial-tooltip');
        if (tooltip) tooltip.remove();
    }

    nextStep() {
        if (this.currentStep < this.steps.length - 1) {
            this.showStep(this.currentStep + 1);
        } else {
            this.completeTutorial();
        }
    }

    prevStep() {
        if (this.currentStep > 0) {
            this.showStep(this.currentStep - 1);
        }
    }

    skipTutorial() {
        this.completeTutorial();
        // Also ensure menu is closed if it was open
        if (this.isMobile) this.handleMobileActions('closeMenu');
    }

    completeTutorial() {
        this.clearStep();

        // Close menu if open on mobile
        if (this.isMobile) this.handleMobileActions('closeMenu');

        const overlay = document.getElementById('tutorial-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => overlay.remove(), 300);
        }

        const welcome = document.querySelector('.tutorial-welcome');
        if (welcome) welcome.remove();

        localStorage.setItem('scl_tutorial_completed', 'true');
        this.showCompletionMessage();
    }

    showCompletionMessage() {
        const message = document.createElement('div');
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #4A90E2, #50E3C2);
            color: white;
            padding: 30px 40px;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            z-index: 10002;
            text-align: center;
            animation: scaleIn 0.3s ease;
            width: 80%;
            max-width: 400px;
        `;
        message.innerHTML = `
            <i class="fas fa-check-circle" style="font-size: 50px; margin-bottom: 15px;"></i>
            <h3 style="margin: 0 0 10px 0; font-size: 1.5rem;">You're All Set! 🎉</h3>
            <p style="margin: 0; opacity: 0.9;">Happy learning with Smart Classroom!</p>
        `;

        document.body.appendChild(message);

        setTimeout(() => {
            message.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => message.remove(), 300);
        }, 2500);
    }

    static resetTutorial() {
        localStorage.removeItem('scl_tutorial_completed');
        location.reload();
    }
}

let tutorial;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        tutorial = new Tutorial();
    });
} else {
    tutorial = new Tutorial();
}

if (!document.getElementById('tutorial-animations')) {
    const style = document.createElement('style');
    style.id = 'tutorial-animations';
    style.textContent = `
        @keyframes fadeOut {
            from { opacity: 1; transform: scale(1); }
            to { opacity: 0; transform: scale(0.9); }
        }
    `;
    document.head.appendChild(style);
}
