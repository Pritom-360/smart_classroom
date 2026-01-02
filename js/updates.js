document.addEventListener('DOMContentLoaded', () => {
    const updatesGrid = document.getElementById('updates-grid');
    const filterButtons = document.querySelectorAll('.filter-btn');

    let allUpdates = [];

    // Fetch updates data
    fetch('data/updates.json')
        .then(response => response.json())
        .then(data => {
            allUpdates = data;
            renderUpdates(allUpdates);
        })
        .catch(error => console.error('Error loading updates:', error));

    function renderUpdates(updates) {
        if (!updatesGrid) return;

        updatesGrid.innerHTML = '';

        if (updates.length === 0) {
            updatesGrid.innerHTML = '<p class="no-results">No updates found in this category.</p>';
            return;
        }

        updates.forEach((update, index) => {
            const card = document.createElement('div');
            card.className = 'update-card reveal';
            card.style.animationDelay = `${index * 0.1}s`;

            const badgeClass = `badge-${update.type}`;
            const iconClass = update.type === 'appreciation' ? 'fa-heart' :
                update.type === 'contribution' ? 'fa-hand-holding-heart' : 'fa-bullhorn';

            card.innerHTML = `
                <div class="update-image-wrapper">
                    <span class="update-badge ${badgeClass}">${update.type}</span>
                    <img src="${update.image}" alt="${update.title}" onerror="this.src='https://placehold.co/600x400/2563eb/white?text=${update.type.toUpperCase()}'">
                </div>
                <div class="update-content">
                    <div class="update-date">
                        <i class="far fa-calendar-alt"></i>
                        ${formatDate(update.date)}
                    </div>
                    <h3 class="update-title">${update.title}</h3>
                    <p class="update-description">${update.description}</p>
                    <div class="update-footer">
                        <div class="update-author">
                            <i class="fas fa-user-circle"></i>
                            ${update.author}
                        </div>
                        <i class="fas ${iconClass}" style="color: var(--text-muted); opacity: 0.5;"></i>
                    </div>
                </div>
            `;

            updatesGrid.appendChild(card);
        });

        // Initialize scroll animations for new elements
        if (typeof handleScrollAnimations === 'function') {
            handleScrollAnimations();
        }
    }

    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    // Filter functionality
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const filter = btn.getAttribute('data-filter');
            if (filter === 'all') {
                renderUpdates(allUpdates);
            } else {
                const filtered = allUpdates.filter(u => u.type === filter);
                renderUpdates(filtered);
            }
        });
    });
});
