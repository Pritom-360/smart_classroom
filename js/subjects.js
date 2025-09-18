document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('subjects-container');
    const searchInput = document.getElementById('subject-search');
    let allSubjectsData = [];

    const createYouTubePlayer = (element, playlistId) => {
        const iframe = document.createElement('iframe');
        iframe.width = "560";
        iframe.height = "315";
        iframe.src = `https://www.youtube.com/embed/videoseries?list=${playlistId}`;
        iframe.title = "YouTube video player";
        iframe.frameborder = "0";
        iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        iframe.allowfullscreen = true;
        element.parentNode.replaceChild(iframe, element);
    };

    const renderSubjects = (subjectsToRender) => {
        if (!subjectsToRender || subjectsToRender.length === 0) {
            container.innerHTML = '<p class="info-text">No subjects or courses found for your search term.</p>';
            return;
        }
        
        container.innerHTML = ''; // Clear previous results
        const userRole = localStorage.getItem('userRole') || 'candidate';

        subjectsToRender.forEach(subject => {
            const subjectSection = document.createElement('section');
            subjectSection.className = 'subject-section';
            
            let coursesHTML = '';
            subject.courses.forEach(course => {
                // *** CORE LOGIC CHANGE: Select materials based on role ***
                const materials = (userRole === 'student') ? course.studentMaterials : course.candidateMaterials;
                
                let materialsHTML = '<ul class="material-list">';
                
                if (materials && materials.length > 0) {
                    materials.forEach(material => {
                        switch (material.type) {
                            case 'youtube':
                                {
                                    const pid = material.youtubePlaylistId || '';
                                    const imgTag = pid ? `<img src="https://img.youtube.com/vi/${pid.split('&list=')[0]}/mqdefault.jpg" alt="${material.title || ''}">` : '';
                                    const titleSpan = material.title ? `<span>${material.title}</span>` : '';
                                    materialsHTML += `
                                    <li>
                                        <i class="fab fa-youtube"></i>
                                        <div class="youtube-thumbnail" data-playlist-id="${pid}">
                                            ${imgTag}
                                            <i class="fas fa-play play-icon"></i>
                                        </div>
                                        ${titleSpan}
                                    </li>`;
                                }
                                break;
                            case 'pdf':
                                materialsHTML += `
                                    <li>
                                        <i class="fas fa-file-pdf"></i>
                                        <a href="${material.url}" target="_blank">${material.title}</a>
                                    </li>`;
                                break;
                            case 'link':
                                materialsHTML += `
                                    <li>
                                        <i class="fas fa-external-link-alt"></i>
                                        <a href="${material.url}" target="_blank">${material.title}</a>
                                    </li>`;
                                break;
                            case 'image':
                                materialsHTML += `
                                    <li>
                                        <i class="fas fa-image"></i>
                                        <a href="${material.url}" target="_blank">${material.title}</a>
                                    </li>`;
                                break;
                            case 'video':
                                materialsHTML += `
                                    <li>
                                        <i class="fas fa-video"></i>
                                        <a href="${material.url}" target="_blank">${material.title}</a>
                                    </li>`;
                                break;
                            case 'audio':
                                materialsHTML += `
                                    <li>
                                        <i class="fas fa-headphones"></i>
                                        <a href="${material.url}" target="_blank">${material.title}</a>
                                    </li>`;
                                break;
                            case 'site':
                                materialsHTML += `
                                    <li>
                                        <i class="fas fa-globe"></i>
                                        <a href="${material.url}" target="_blank">${material.title}</a>
                                    </li>`;
                                break;
                            case 'document':
                                materialsHTML += `
                                    <li>
                                        <i class="fas fa-file-alt"></i>
                                        <a href="${material.url}" target="_blank">${material.title}</a>
                                    </li>`;
                                break;
                            case 'notes':
                                materialsHTML += `
                                    <li>
                                        <i class="fas fa-sticky-note"></i>
                                        <a href="${material.url}" target="_blank">${material.title}</a>
                                    </li>`;
                                break;
                            case 'slides':
                                materialsHTML += `
                                    <li>
                                        <i class="fas fa-chalkboard"></i>
                                        <a href="${material.url}" target="_blank">${material.title}</a>
                                    </li>`;
                                break;
                            case 'flashcards':
                                materialsHTML += `
                                    <li>
                                        <i class="fas fa-clone"></i>
                                        <a href="${material.url}" target="_blank">${material.title}</a>
                                    </li>`;
                                break;
                            case 'website':
                                materialsHTML += `
                                    <li>
                                        <i class="fas fa-sitemap"></i>
                                        <a href="${material.url}" target="_blank">${material.title}</a>
                                    </li>`;
                                break;
                            case 'resource':
                                materialsHTML += `
                                    <li>
                                        <i class="fas fa-book"></i>
                                        <a href="${material.url}" target="_blank">${material.title}</a>
                                    </li>`;
                                break;
                            case 'youtube_playlist':
                                {
                                    const pid = material.youtubePlaylistId || '';
                                    const imgTag = pid ? `<img src="https://img.youtube.com/vi/${pid.split('&list=')[0]}/mqdefault.jpg" alt="${material.title || ''}">` : '';
                                    const titleSpan = material.title ? `<span>${material.title}</span>` : '';
                                    materialsHTML += `
                                    <li>
                                        <i class="fab fa-youtube"></i>
                                        <div class="youtube-thumbnail" data-playlist-id="${pid}">
                                            ${imgTag}
                                            <i class="fas fa-play play-icon"></i>
                                        </div>
                                        ${titleSpan}
                                    </li>`;
                                }
                                break;
                            case 'facebook-video':
                                materialsHTML += `
                                    <li>
                                        <i class="fab fa-facebook"></i>
                                        <a href="${material.url}" target="_blank">${material.title}</a>
                                    </li>`;
                                break;
                            case 'text':
                                materialsHTML += `
                                    <li>
                                        <i class="fas fa-info-circle"></i>
                                        <p class="material-info-text">${material.content}</p>
                                    </li>`;
                                break;
                        }
                    });
                } else {
                    materialsHTML += '<li><p class="info-text">No materials available for this role.</p></li>';
                }

                materialsHTML += '</ul>';

                coursesHTML += `
                    <div class="course-card">
                        <h4>${course.code}: ${course.title}</h4>
                        ${materialsHTML}
                    </div>
                `;
            });

            subjectSection.innerHTML = `<h3>${subject.name}</h3>` + coursesHTML;
            container.appendChild(subjectSection);
        });

        // Re-add event listeners for lazy-loading YouTube videos
        document.querySelectorAll('.youtube-thumbnail').forEach(thumb => {
            thumb.addEventListener('click', () => {
                createYouTubePlayer(thumb, thumb.dataset.playlistId);
            });
        });
    };
      // *** ADD THIS NEW FUNCTION ***
    const initializeInstructionModal = () => {
        const modal = document.getElementById('instruction-modal');
        const btn = document.getElementById('instruction-button');
        const span = document.getElementsByClassName('close-button')[0];

        if (!modal || !btn || !span) return;

        btn.onclick = function() {
            modal.style.display = 'flex'; // Use flex to center content
            setTimeout(() => modal.classList.add('show'), 10); // For transition
        }

        span.onclick = function() {
            modal.classList.remove('show');
            setTimeout(() => modal.style.display = 'none', 300); // Wait for transition to finish
        }

        window.onclick = function(event) {
            if (event.target == modal) {
                modal.classList.remove('show');
                setTimeout(() => modal.style.display = 'none', 300);
            }
        }
    };

    initializeInstructionModal(); // Call the new function to set up the modal

    // Load subjects metadata and the separated materials files in parallel,
    // then attach materials to their matching course by course code.
    Promise.all([
        fetch('data/subjects.json').then(r => r.json()),
        fetch('data/subjects_students.json').then(r => r.json()).catch(() => ({ students: [] })),
        fetch('data/subjects_candidates.json').then(r => r.json()).catch(() => ({ candidates: [] })),
    ])
    .then(([subjectsData, studentsData, candidatesData]) => {
        const studentsMap = new Map();
        (studentsData.students || []).forEach(s => studentsMap.set(s.courseCode, s.materials || []));

        const candidatesMap = new Map();
        (candidatesData.candidates || []).forEach(c => candidatesMap.set(c.courseCode, c.materials || []));

        // Merge materials into the subject structure so existing renderSubjects works unchanged.
        allSubjectsData = (subjectsData.subjects || []).map(subject => ({
            name: subject.name,
            courses: (subject.courses || []).map(course => ({
                // preserve any existing fields on course
                ...course,
                studentMaterials: studentsMap.get(course.code) || [],
                candidateMaterials: candidatesMap.get(course.code) || []
            }))
        }));

        renderSubjects(allSubjectsData);
    })
    .catch(error => {
        container.innerHTML = '<p class="error-text">Error loading subjects. Please try again later.</p>';
        console.error('Error fetching subjects or materials:', error);
    });

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        if (!searchTerm) {
            renderSubjects(allSubjectsData);
            return;
        }

        const filteredData = JSON.parse(JSON.stringify(allSubjectsData))
            .map(subject => {
                if (subject.name.toLowerCase().includes(searchTerm)) {
                    return subject;
                }
                subject.courses = subject.courses.filter(course => 
                    course.title.toLowerCase().includes(searchTerm) ||
                    course.code.toLowerCase().includes(searchTerm)
                );
                return subject.courses.length > 0 ? subject : null;
            })
            .filter(subject => subject !== null);

        renderSubjects(filteredData);
    });
});

