document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('jobs-container');
    const searchInput = document.getElementById('job-search');
    let allJobs = [];

    const renderJobs = (jobs) => {
        if (jobs.length === 0) {
            // Check if a search was performed to show the correct message
            const hasSearchTerm = searchInput.value.trim().length > 0;
            container.innerHTML = hasSearchTerm 
                ? '<p class="info-text">No jobs found matching your search.</p>'
                : '<p class="info-text">No job openings at the moment. Please check back later.</p>';
            return;
        }

        container.innerHTML = jobs.map(job => `
            <div class="card job-card">
                <div class="job-card-header">
                    <h4>${job.title}</h4>
                </div>
                <div class="job-card-details">
                    <div class="job-detail-item">
                        <i class="fas fa-building"></i>
                        <span>${job.company}</span>
                    </div>
                    <div class="job-detail-item">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${job.location}</span>
                    </div>
                </div>
                <a href="${job.apply_link}" target="_blank" class="btn btn-primary">Apply Now <i class="fas fa-arrow-right"></i></a>
            </div>
        `).join('');
    };

    fetch('data/jobs.json')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            allJobs = data.jobs;
            renderJobs(allJobs);
        })
        .catch(error => {
            container.innerHTML = '<p class="error-text">Could not load job opportunities. Please try again later.</p>';
            console.error('Error fetching jobs:', error);
        });

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredJobs = allJobs.filter(job => 
            job.title.toLowerCase().includes(searchTerm) ||
            job.company.toLowerCase().includes(searchTerm) ||
            job.location.toLowerCase().includes(searchTerm)
        );
        renderJobs(filteredJobs);
    });
});