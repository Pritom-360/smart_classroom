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




    // *** ADD THIS NEW FUNCTION ***
    const initializeInstructionModal = () => {
        const modal = document.getElementById('instruction-modal');
        const btn = document.getElementById('instruction-button');
        const span = document.getElementsByClassName('close-button')[0];

        if (!modal || !btn || !span) return;

        btn.onclick = function () {
            modal.style.display = 'flex'; // Use flex to center content
            setTimeout(() => modal.classList.add('show'), 10); // For transition
        }

        span.onclick = function () {
            modal.classList.remove('show');
            setTimeout(() => modal.style.display = 'none', 300); // Wait for transition to finish
        }

        window.onclick = function (event) {
            if (event.target == modal) {
                modal.classList.remove('show');
                setTimeout(() => modal.style.display = 'none', 300);
            }
        }
    };

    initializeInstructionModal(); // Call the new function to set up the modal

    // Load subjects metadata and the separated materials files in parallel,
    // then attach materials to their matching course by course code.
    // Load all data
    Promise.all([
        fetch('data/subjects.json').then(r => r.json()),
        fetch('data/subjects_students.json').then(r => r.json()).catch(() => ({ students: [] })),
        fetch('data/subjects_candidates.json').then(r => r.json()).catch(() => ({ candidates: [] })),
    ])
        .then(([subjectsData, studentsData, candidatesData]) => {

            // 1. Prepare Data Sets
            const studentCourses = studentsData.students || [];
            const candidateCourses = candidatesData.candidates || [];

            // 2. Helper to build the renderable structure from the self-contained lists
            const buildStructure = (roleCourses) => {
                const grouped = {};

                roleCourses.forEach(roleCourse => {
                    // Use the subject and title directly from the role file
                    // Fallback to defaults if missing (though they should be there now)
                    const subjectName = roleCourse.subject || 'Other Subjects';
                    const title = roleCourse.title || roleCourse.courseCode;

                    if (!grouped[subjectName]) {
                        grouped[subjectName] = { name: subjectName, courses: [] };
                    }

                    grouped[subjectName].courses.push({
                        code: roleCourse.courseCode,
                        title: title,
                        materials: roleCourse.materials || []
                    });
                });

                // Convert object to array
                return Object.values(grouped);
            };

            // 3. Store pre-built structures
            const studentStructure = buildStructure(studentCourses);
            const candidateStructure = buildStructure(candidateCourses);

            // 5. Override renderSubjects to select the correct structure
            // We modify the global renderSubjects to take the full set but pick based on role
            // actually, let's just update the global variable and let render handle it?
            // No, simpler: We save these independent structures.

            allSubjectsData = {
                student: studentStructure,
                candidate: candidateStructure
            };

            // Redefine render function to use the new data shape
            const renderCurrentRole = () => {
                const userRole = localStorage.getItem('userRole') || 'candidate';
                const dataToRender = (userRole === 'student') ? allSubjectsData.student : allSubjectsData.candidate;

                // We need to re-use the render logic. 
                // The existing renderSubjects expects an array of subjects.
                // But it tries to access 'studentMaterials' etc. 
                // We need to update renderSubjects to be simpler now that data is normalized.
                renderNormalizedSubjects(dataToRender);
            };

            // New Render Function for Normalized Data
            const renderNormalizedSubjects = (subjects) => {
                if (!subjects || subjects.length === 0) {
                    container.innerHTML = '<p class="info-text">No courses available for your selected role.</p>';
                    return;
                }
                container.innerHTML = '';

                subjects.forEach(subject => {
                    const subjectSection = document.createElement('section');
                    subjectSection.className = 'subject-section';

                    let coursesHTML = '';
                    subject.courses.forEach(course => {
                        let materialsHTML = '<ul class="material-list">';
                        // Data is already normalized as 'materials'
                        if (course.materials && course.materials.length > 0) {
                            course.materials.forEach(material => {
                                switch (material.type) {
                                    case 'youtube':
                                    case 'youtube_playlist':
                                        {
                                            const pid = material.youtubePlaylistId || '';
                                            let videoIdForThumb = '';
                                            
                                            if (pid.includes('&list=')) {
                                                videoIdForThumb = pid.split('&list=')[0];
                                            } else if (pid.includes('?list=')) {
                                                videoIdForThumb = pid.split('?list=')[0];
                                            }
                                            
                                            let thumbnailHTML = '';
                                            let isComingSoon = !pid || pid.trim() === '';
                                            
                                            if (isComingSoon) {
                                                // Coming Soon - Elegant placeholder
                                                thumbnailHTML = `
                                                    <div class="youtube-thumbnail coming-soon" data-playlist-id="${pid}">
                                                        <div class="thumbnail-placeholder">
                                                            <div class="coming-soon-badge">
                                                                <i class="fas fa-clock"></i>
                                                                <span>Coming Soon</span>
                                                            </div>
                                                            <p class="course-title-elegant">${course.title}</p>
                                                        </div>
                                                    </div>`;
                                            } else {
                                                // Regular YouTube thumbnail - Elegant design
                                                thumbnailHTML = `
                                                    <div class="youtube-thumbnail" data-playlist-id="${pid}">
                                                        <img src="https://img.youtube.com/vi/${videoIdForThumb}/maxresdefault.jpg" 
                                                             alt="${material.title || ''}"
                                                             onerror="this.src='https://img.youtube.com/vi/${videoIdForThumb}/mqdefault.jpg'">
                                                        <div class="play-overlay">
                                                            <div class="play-button">
                                                                <i class="fas fa-play"></i>
                                                            </div>
                                                            <div class="overlay-text">
                                                                <p class="click-text">Click to Watch</p>
                                                                <p class="course-title-display">${course.title}</p>
                                                            </div>
                                                        </div>
                                                    </div>`;
                                            }
                                            
                                            const titleSpan = material.title ? `<span class="material-title">${material.title}</span>` : '';
                                            materialsHTML += `
                                                <li>
                                                    <i class="fab fa-youtube"></i>
                                                    ${thumbnailHTML}
                                                    ${titleSpan}
                                                </li>`;
                                        }
                                        break;
                                    case 'pdf':
                                        materialsHTML += `
                                    <li>
                                        <a href="${material.url}" target="_blank">
                                            <i class="fas fa-file-pdf"></i>
                                            <span>${material.title}</span>
                                        </a>
                                    </li>`;
                                        break;
                                    case 'link':
                                        materialsHTML += `
                                    <li>
                                        <a href="${material.url}" target="_blank">
                                            <i class="fas fa-external-link-alt"></i>
                                            <span>${material.title}</span>
                                        </a>
                                    </li>`;
                                        break;
                                    case 'image':
                                        materialsHTML += `
                                    <li>
                                        <a href="${material.url}" target="_blank">
                                            <i class="fas fa-image"></i>
                                            <span>${material.title}</span>
                                        </a>
                                    </li>`;
                                        break;
                                    case 'video':
                                        materialsHTML += `
                                    <li>
                                        <a href="${material.url}" target="_blank">
                                            <i class="fas fa-video"></i>
                                            <span>${material.title}</span>
                                        </a>
                                    </li>`;
                                        break;
                                    case 'audio':
                                        materialsHTML += `
                                    <li>
                                        <a href="${material.url}" target="_blank">
                                            <i class="fas fa-headphones"></i>
                                            <span>${material.title}</span>
                                        </a>
                                    </li>`;
                                        break;
                                    case 'site':
                                        materialsHTML += `
                                    <li>
                                        <a href="${material.url}" target="_blank">
                                            <i class="fas fa-globe"></i>
                                            <span>${material.title}</span>
                                        </a>
                                    </li>`;
                                        break;
                                    case 'document':
                                        materialsHTML += `
                                    <li>
                                        <a href="${material.url}" target="_blank">
                                            <i class="fas fa-file-alt"></i>
                                            <span>${material.title}</span>
                                        </a>
                                    </li>`;
                                        break;
                                    case 'notes':
                                        materialsHTML += `
                                    <li>
                                        <a href="${material.url}" target="_blank">
                                            <i class="fas fa-sticky-note"></i>
                                            <span>${material.title}</span>
                                        </a>
                                    </li>`;
                                        break;
                                    case 'slides':
                                        materialsHTML += `
                                    <li>
                                        <a href="${material.url}" target="_blank">
                                            <i class="fas fa-chalkboard"></i>
                                            <span>${material.title}</span>
                                        </a>
                                    </li>`;
                                        break;
                                    case 'flashcards':
                                        materialsHTML += `
                                    <li>
                                        <a href="${material.url}" target="_blank">
                                            <i class="fas fa-clone"></i>
                                            <span>${material.title}</span>
                                        </a>
                                    </li>`;
                                        break;
                                    case 'website':
                                        materialsHTML += `
                                    <li>
                                        <a href="${material.url}" target="_blank">
                                            <i class="fas fa-sitemap"></i>
                                            <span>${material.title}</span>
                                        </a>
                                    </li>`;
                                        break;
                                    case 'resource':
                                        materialsHTML += `
                                    <li>
                                        <a href="${material.url}" target="_blank">
                                            <i class="fas fa-book"></i>
                                            <span>${material.title}</span>
                                        </a>
                                    </li>`;
                                        break;
                                    case 'facebook-video':
                                        materialsHTML += `
                                    <li>
                                        <a href="${material.url}" target="_blank">
                                            <i class="fab fa-facebook"></i>
                                            <span>${material.title}</span>
                                        </a>
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
                            materialsHTML += '<li><p class="info-text">No materials available.</p></li>';
                        }
                        materialsHTML += '</ul>';
                        coursesHTML += `
                        <div class="course-card">
                            <h4>${course.code}: ${course.title}</h4>
                            ${materialsHTML}
                        </div>`;
                    });
                    subjectSection.innerHTML = `<h3>${subject.name}</h3>` + coursesHTML;
                    container.appendChild(subjectSection);
                });
                
                // Re-bind events
                document.querySelectorAll('.youtube-thumbnail').forEach(thumb => {
                    if (!thumb.classList.contains('coming-soon')) {
                        thumb.addEventListener('click', () => createYouTubePlayer(thumb, thumb.dataset.playlistId));
                    } else {
                        // Coming soon - show alert
                        thumb.addEventListener('click', () => {
                            alert('🎬 Video is coming soon! Stay tuned for updates.');
                        });
                        thumb.style.cursor = 'not-allowed';
                    }
                });
            }

            // Expose render function for search
            window.renderFinal = renderNormalizedSubjects;
            window.allDataFinal = allSubjectsData;

            renderCurrentRole();

            // Listen for role changes
            window.addEventListener('roleChanged', renderCurrentRole);

        })
        .catch(error => {
            container.innerHTML = '<p class="error-text">Error loading data.</p>';
            console.error(error);
        });

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();

        // 1. Get current role and data
        const userRole = localStorage.getItem('userRole') || 'candidate';
        // Check if allSubjectsData is the new structure (object) or empty
        const currentData = (userRole === 'student') ? allSubjectsData.student : allSubjectsData.candidate;

        if (!currentData) return; // Data not ready

        if (!searchTerm) {
            window.renderFinal(currentData);
            return;
        }

        const filteredData = currentData.map(subject => {
            // Deep copy not strictly necessary if we just filter courses, but safer to avoid mutating master list structure in some implementations, 
            // though map returns new array, the objects inside are ref. 
            // We'll just map and filter carefully.

            // Check if subject name matches
            const subjectMatch = subject.name.toLowerCase().includes(searchTerm);

            // Filter courses
            const filteredCourses = subject.courses.filter(course =>
                subjectMatch || // If subject matches, keep all courses? Or still filter? usually search refines. Let's say if subject matches, we show all? Or just those matching? 
                // Let's standardise: Show courses that match OR if subject name matches, show all courses? 
                // Previous logic: `if (subject.name...includes) return subject` (all courses).
                // Let's stick to that.

                (subject.name.toLowerCase().includes(searchTerm)) ||
                (course.title.toLowerCase().includes(searchTerm)) ||
                (course.code.toLowerCase().includes(searchTerm))
            );

            // If subject matched, we might have filteredCourses equal to all. 
            // But actually the previous logic was: if subject matches, return WHOLE subject.
            // If not, filter courses.

            if (subject.name.toLowerCase().includes(searchTerm)) {
                return subject;
            }

            if (filteredCourses.length > 0) {
                return { ...subject, courses: filteredCourses };
            }
            return null;
        }).filter(s => s !== null);

        window.renderFinal(filteredData);
    });
});

