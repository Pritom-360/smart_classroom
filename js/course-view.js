document.addEventListener('DOMContentLoaded', () => {
    const courseDetails = document.getElementById('course-details');
    const materialsContainer = document.getElementById('materials-container');
    const breadcrumbCurrent = document.getElementById('breadcrumb-current');

    // 1. Get Course ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const courseId = urlParams.get('id');

    if (!courseId) {
        courseDetails.innerHTML = '<p class="error-text">No course ID provided. Please select a course from the subjects page.</p>';
        return;
    }

    // 2. Fetch Data based on User Role
    const userRole = localStorage.getItem('userRole') || 'candidate';
    const dataUrl = (userRole === 'student') ? 'data/subjects_students.json' : 'data/subjects_candidates.json';

    console.log(`Fetching Layer 3 data from ${dataUrl} for course: ${courseId}`);

    fetch(dataUrl)
        .then(response => response.json())
        .then(data => {
            console.log('Data fetched successfully:', data);
            const courses = (userRole === 'student') ? data.students : data.candidates;
            const course = courses.find(c => (c.courseCode === courseId || c.code === courseId));

            if (!course) {
                console.warn(`Course ${courseId} not found in the data.`);
                courseDetails.innerHTML = `<p class="error-text">Course ${courseId} not found for your current role (${userRole}).</p>`;
                return;
            }

            console.log('Rendering details for course:', course.title);
            renderCourse(course);
        })
        .catch(error => {
            console.error('Error fetching course data:', error);
            courseDetails.innerHTML = '<p class="error-text">Unable to load course data. Please try again later.</p>';
        });

    function renderCourse(course) {
        // Update Metadata and Breadcrumb
        const courseCode = course.courseCode || course.code;
        const pageTitle = `${courseCode} Study Materials & Notes - Smart Classroom`;
        const pageDesc = `Detailed study materials for ${courseCode}: ${course.title}. Includes lecture notes, PDFs, and video tutorials.`;
        
        document.title = pageTitle;
        const metaDesc = document.getElementById('meta-description');
        if (metaDesc) metaDesc.setAttribute('content', pageDesc);
        
        breadcrumbCurrent.textContent = course.title;

        // Render Header Details
        courseDetails.innerHTML = `
            <div class="course-header">
                <span class="course-code-badge">${course.courseCode || course.code}</span>
                <h1 class="course-title gradient-text">${course.title}</h1>
                <div class="course-long-description">
                    ${course.longDescription || "This course covers essential topics designed to build a strong foundation in " + course.subject + ". Explore the materials below to master the curriculum."}
                </div>
            </div>
        `;

        // Render Materials
        if (!course.materials || course.materials.length === 0) {
            materialsContainer.innerHTML = '<p class="info-text">No materials available for this course yet. Check back soon!</p>';
            return;
        }

        let materialsHTML = '<ul class="material-list">';
        course.materials.forEach(material => {
            let icon = 'fas fa-file';
            let label = material.title || 'Resource';
            
            // Determine icon based on type
            if (material.type === 'youtube' || material.type === 'youtube_playlist') icon = 'fab fa-youtube';
            else if (material.type === 'pdf') icon = 'fas fa-file-pdf';
            else if (material.type === 'link') icon = 'fas fa-external-link-alt';
            else if (material.type === 'text') icon = 'fas fa-info-circle';

            // Handle Video Thumbnails
            if (material.type === 'youtube' || material.type === 'youtube_playlist') {
                const pid = material.youtubePlaylistId || '';
                let videoIdForThumb = '';
                if (pid.includes('&list=')) videoIdForThumb = pid.split('&list=')[0];
                else if (pid.includes('?list=')) videoIdForThumb = pid.split('?list=')[0];

                const isComingSoon = !pid || pid.trim() === '';

                if (isComingSoon) {
                    materialsHTML += `
                        <li class="video-item">
                            <div class="youtube-thumbnail coming-soon">
                                <div class="thumbnail-placeholder">
                                    <div class="coming-soon-badge"><i class="fas fa-clock"></i> Coming Soon</div>
                                    <p class="course-title-elegant">${course.title}</p>
                                </div>
                            </div>
                            <span class="material-title">${label}</span>
                        </li>`;
                } else {
                    materialsHTML += `
                        <li class="video-item">
                            <div class="youtube-thumbnail" data-playlist-id="${pid}">
                                <img src="https://img.youtube.com/vi/${videoIdForThumb}/maxresdefault.jpg" 
                                     onerror="this.src='https://img.youtube.com/vi/${videoIdForThumb}/mqdefault.jpg'" alt="Video Thumbnail">
                                <div class="play-overlay">
                                    <div class="play-button"><i class="fas fa-play"></i></div>
                                    <p class="click-text">Click to Play</p>
                                </div>
                            </div>
                            <span class="material-title">${label}</span>
                        </li>`;
                }
            } else {
                // Handle Links/PDFs via Buffer Page for AdSense
                let url = material.url || '#';
                if (url !== '#') {
                    // Redirect through buffer page
                    url = `download-buffer.html?url=${encodeURIComponent(url)}`;
                }
                
                materialsHTML += `
                    <li>
                        <a href="${url}">
                            <i class="${icon}"></i>
                            <span>${label}</span>
                        </a>
                    </li>`;
            }
        });
        materialsHTML += '</ul>';
        materialsContainer.innerHTML = materialsHTML;

        // Initialize Video Players
        initVideoPlayers();
    }

    function initVideoPlayers() {
        const thumbnails = document.querySelectorAll('.youtube-thumbnail:not(.coming-soon)');
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', () => {
                const playlistId = thumb.dataset.playlistId;
                const iframe = document.createElement('iframe');
                iframe.width = "100%";
                iframe.height = "100%";
                iframe.src = `https://www.youtube.com/embed/videoseries?list=${playlistId}&autoplay=1`;
                iframe.title = "YouTube video player";
                iframe.frameBorder = "0";
                iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
                iframe.allowFullscreen = true;
                
                // Replace content
                thumb.innerHTML = '';
                thumb.appendChild(iframe);
                thumb.classList.add('playing');
            });
        });
    }
});
