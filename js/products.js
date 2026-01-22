// Products Page - Software Search Functionality with JSON Loading

let allSoftwareData = [];

document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('software-search');
    const clearBtn = document.getElementById('clear-search');
    const softwareCards = document.getElementById('software-cards');
    const softwareCount = document.getElementById('software-count');
    const noResults = document.getElementById('no-results');

    // Load software data from JSON
    loadSoftwareData();

    // Load software from JSON file
    async function loadSoftwareData() {
        try {
            // Show loading state
            if (softwareCards) {
                softwareCards.innerHTML = '<div class="loading-message"><i class="fas fa-spinner fa-spin"></i> Loading software...</div>';
            }

            const response = await fetch('data/software.json');

            if (!response.ok) {
                throw new Error('Failed to load software data');
            }

            const data = await response.json();
            allSoftwareData = data.software;

            // Render software cards
            renderSoftwareCards(allSoftwareData);

            // Initialize search functionality after rendering
            initializeSearch();

        } catch (error) {
            console.error('Error loading software data:', error);
            if (softwareCards) {
                softwareCards.innerHTML = `
                    <div class="error-message">
                        <i class="fas fa-exclamation-circle"></i>
                        <p>Failed to load software data. Please refresh the page.</p>
                    </div>
                `;
            }
        }
    }

    // Render software cards from data
    function renderSoftwareCards(softwareList) {
        if (!softwareCards) return;

        softwareCards.innerHTML = '';

        softwareList.forEach((software, index) => {
            const card = createSoftwareCard(software, index);
            softwareCards.appendChild(card);
        });

        // Update count
        updateSoftwareCount(softwareList.length);

        // Add scroll animations
        addScrollAnimations();
    }

    // Create a software card element
    function createSoftwareCard(software, index) {
        const card = document.createElement('div');
        card.className = 'product-card software-item';
        card.setAttribute('data-name', software.name.toLowerCase());
        card.setAttribute('data-category', software.category.toLowerCase());
        card.setAttribute('data-description', software.keywords.toLowerCase());
        card.setAttribute('data-id', software.id);

        card.innerHTML = `
            <div class="product-icon"><i class="${software.icon}"></i></div>
            <h4>${software.name}</h4>
            <p>${software.description}</p>
            <span class="product-tag">${software.category}</span>
            ${software.downloadLink !== '#'
                ? `<a href="${software.downloadLink}" class="product-link" target="_blank">Download <i class="fas fa-download"></i></a>`
                : `<span class="product-link">Download <i class="fas fa-download"></i></span>`
            }
        `;

        return card;
    }

    // Initialize search functionality
    function initializeSearch() {
        // Search functionality
        if (searchInput) {
            searchInput.addEventListener('input', function (e) {
                const searchTerm = e.target.value.toLowerCase().trim();

                // Show/Hide clear button
                if (searchTerm.length > 0) {
                    clearBtn.style.display = 'block';
                } else {
                    clearBtn.style.display = 'none';
                }

                filterSoftware(searchTerm);
            });
        }

        // Clear search button
        if (clearBtn) {
            clearBtn.addEventListener('click', function () {
                searchInput.value = '';
                clearBtn.style.display = 'none';
                filterSoftware('');
                searchInput.focus();
            });
        }

        // Add keyboard shortcuts
        document.addEventListener('keydown', function (e) {
            // Ctrl/Cmd + K to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                if (searchInput) {
                    searchInput.focus();
                }
            }

            // Escape to clear search
            if (e.key === 'Escape' && searchInput === document.activeElement) {
                searchInput.value = '';
                clearBtn.style.display = 'none';
                filterSoftware('');
                searchInput.blur();
            }
        });
    }

    // Filter software based on search term
    function filterSoftware(searchTerm) {
        const softwareItems = document.querySelectorAll('.software-item');
        let visibleCount = 0;

        softwareItems.forEach(item => {
            const name = item.getAttribute('data-name').toLowerCase();
            const category = item.getAttribute('data-category').toLowerCase();
            const description = item.getAttribute('data-description').toLowerCase();

            // Search in name, category, and description
            const matches = name.includes(searchTerm) ||
                category.includes(searchTerm) ||
                description.includes(searchTerm);

            if (matches) {
                item.classList.remove('hidden');
                item.style.display = '';
                visibleCount++;
            } else {
                item.classList.add('hidden');
                item.style.display = 'none';
            }
        });

        // Update count and show/hide no results message
        updateSoftwareCount(visibleCount);

        if (visibleCount === 0 && searchTerm.length > 0) {
            noResults.style.display = 'block';
        } else {
            noResults.style.display = 'none';
        }
    }

    // Update software count display
    function updateSoftwareCount(count) {
        if (!softwareCount) return;

        if (searchInput && searchInput.value.trim().length > 0) {
            softwareCount.textContent = `Found ${count} software${count !== 1 ? 's' : ''}`;
        } else {
            softwareCount.textContent = `Showing all ${count} software${count !== 1 ? 's' : ''}`;
        }
    }

    // Add scroll animations to software cards
    function addScrollAnimations() {
        const softwareItems = document.querySelectorAll('.software-item');

        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        // Observe all software items
        softwareItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateY(20px)';
            item.style.transition = `opacity 0.5s ease ${index * 0.05}s, transform 0.5s ease ${index * 0.05}s`;
            observer.observe(item);
        });
    }
});
