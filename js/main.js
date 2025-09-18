document.addEventListener('DOMContentLoaded', () => {

    // --- Load Header and Footer ---
    const loadHTML = (selector, url) => {
        const target = document.querySelector(selector);
        // If no placeholder exists on the page (header/footer were inlined),
        // skip fetching but ensure header-related initialization still runs.
        if (!target) {
            if (selector === '#header-placeholder') {
                // initialize in next tick so DOM is ready
                setTimeout(() => initializeHeaderControls(), 0);
            }
            return;
        }

        fetch(url)
            .then(response => response.text())
            .then(data => {
                target.innerHTML = data;
                if (selector === '#header-placeholder') {
                    initializeHeaderControls();
                }
            })
            .catch(error => console.error(`Error loading ${url}:`, error));
    };

    loadHTML('#header-placeholder', '_header.html');
    loadHTML('#footer-placeholder', '_footer.html');

    // --- Active Nav Link ---
    const setActiveLink = () => {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        // Select links in both desktop nav and slider nav
        const navLinks = document.querySelectorAll('.desktop-nav nav a, .slider-content nav a');
        navLinks.forEach(link => {
            const linkPage = link.getAttribute('href').split('/').pop() || 'index.html';
            if (linkPage === currentPage) {
                link.classList.add('active');
            }
        });
    };
    
    // --- NEW: Off-Canvas Navigation Slider Logic ---
    const initializeNavSlider = () => {
        const slider = document.getElementById('nav-slider');
        const overlay = document.getElementById('nav-overlay');
        const openBtn = document.getElementById('menu-toggle');
        const closeBtn = document.getElementById('close-nav-button');
        
        if (!slider || !overlay || !openBtn || !closeBtn) return;
        
        // Clone desktop nav and controls into the slider for mobile
        const desktopNav = document.querySelector('.desktop-nav nav');
        const desktopControls = document.querySelector('.desktop-nav .controls');
        const sliderContent = document.querySelector('.slider-content');
        
        if (desktopNav && desktopControls && sliderContent) {
            sliderContent.innerHTML = ''; // Clear any existing content
            sliderContent.appendChild(desktopNav.cloneNode(true));
            sliderContent.appendChild(desktopControls.cloneNode(true));
        }

        const openNav = () => {
            slider.classList.add('open');
            overlay.classList.add('show');
            document.body.classList.add('nav-open');
        };

        const closeNav = () => {
            slider.classList.remove('open');
            overlay.classList.remove('show');
            document.body.classList.remove('nav-open');
        };

        openBtn.addEventListener('click', openNav);
        closeBtn.addEventListener('click', closeNav);
        overlay.addEventListener('click', closeNav);

        // Close slider when a navigation link is clicked
        slider.addEventListener('click', (e) => {
            if (e.target.tagName === 'A') {
                closeNav();
            }
        });
    };

    // --- Role Switch Logic ---
    const handleRoleSwitch = () => {
        const body = document.body;
        
        const setRole = (role) => {
            if (role === 'student') {
                body.classList.add('role-student');
                body.classList.remove('role-candidate');
            } else {
                body.classList.add('role-candidate');
                body.classList.remove('role-student');
            }
            localStorage.setItem('userRole', role);
            updateRoleToggles(role);
        };
        
        const updateRoleToggles = (role) => {
            // Update both desktop and mobile toggles
            const roleToggles = document.querySelectorAll('#role-toggle');
            roleToggles.forEach(toggle => {
                toggle.checked = (role === 'student');
            });
        };

        document.body.addEventListener('change', (e) => {
            if (e.target && e.target.id === 'role-toggle') {
                setRole(e.target.checked ? 'student' : 'candidate');
            }
        });

        const currentRole = localStorage.getItem('userRole') || 'candidate';
        setRole(currentRole);
    };
    
    // --- Cart Count Update ---
    const updateCartCount = () => {
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        // Update both desktop and mobile cart icons
        const cartCountEls = document.querySelectorAll('#cart-count');
        cartCountEls.forEach(el => {
            if (el) el.textContent = cart.length;
        });
    };
    
    // --- Instruction Modal Logic ---
    const initializeInstructionModal = () => {
        const modal = document.getElementById('instruction-modal');
        const btn = document.getElementById('instruction-button');
        const span = document.querySelector('.modal .close-button');

        if (!modal || !btn || !span) return;

        btn.onclick = () => {
            modal.classList.add('show');
        }
        span.onclick = () => {
            modal.classList.remove('show');
        }
        window.onclick = (event) => {
            if (event.target == modal) {
                modal.classList.remove('show');
            }
        }
    };

    // --- Initialize All Header-Dependent Scripts ---
    const initializeHeaderControls = () => {
        initializeNavSlider();
        handleRoleSwitch();
        updateCartCount();
        setActiveLink();
    };
    
    // --- Initialize Non-Header Scripts ---
    initializeInstructionModal();
});

