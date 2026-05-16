document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('course-list-container');
    const subjectTitle = document.getElementById('subject-title');

    // 1. Get Subject from URL
    const urlParams = new URLSearchParams(window.location.search);
    const selectedSubject = urlParams.get('subject');

    if (!selectedSubject) {
        container.innerHTML = '<p class="error-text">No subject selected. Please go back to the subjects page.</p>';
        return;
    }

    // Dynamic SEO
    const newTitle = `${selectedSubject} Study Materials & Courses - Smart Classroom`;
    const newDesc = `Access the best study materials, lecture notes, and video tutorials for ${selectedSubject}. Free resources for university students and candidates.`;
    
    document.title = newTitle;
    const metaDesc = document.getElementById('meta-description');
    if (metaDesc) metaDesc.setAttribute('content', newDesc);

    subjectTitle.textContent = selectedSubject + ' Courses';

    // 2. Fetch and Filter Data
    const userRole = localStorage.getItem('userRole') || 'candidate';
    const dataUrl = (userRole === 'student') ? 'data/subjects_students.json' : 'data/subjects_candidates.json';

    console.log(`Fetching Layer 2 data from ${dataUrl} for subject: ${selectedSubject}`);

    fetch(dataUrl)
        .then(r => r.json())
        .then(data => {
            console.log('Data fetched successfully:', data);
            const allCourses = (userRole === 'student') ? data.students : data.candidates;
            
            // Filter courses by subject
            const filteredCourses = allCourses.filter(c => c.subject === selectedSubject);
            console.log(`Found ${filteredCourses.length} courses for subject: ${selectedSubject}`);

            if (filteredCourses.length === 0) {
                container.innerHTML = '<p class="info-text">No courses found for this subject under your current role.</p>';
                return;
            }

            renderCourses(filteredCourses);
        })
        .catch(err => {
            console.error(err);
            container.innerHTML = '<p class="error-text">Error loading courses.</p>';
        });

    function renderCourses(courses) {
        container.innerHTML = '';
        
        courses.forEach((course, index) => {
            // Inject an ad spot every 4 courses for high visibility
            if (index > 0 && index % 4 === 0) {
                const adRow = document.createElement('div');
                adRow.className = 'ad-row';
                adRow.innerHTML = `
                    <div style="background: var(--bg-surface); border: 1px dashed var(--border-color); padding: 1rem; text-align: center; border-radius: var(--radius-md);">
                        <span style="font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase;">Advertisement</span>
                        <div style="min-height: 90px; display: flex; align-items: center; justify-content: center;">
                            <p style="color: var(--text-muted);">AdSense In-Feed Ad</p>
                        </div>
                    </div>
                `;
                container.appendChild(adRow);
            }

            const card = document.createElement('div');
            card.className = 'course-card';
            card.innerHTML = `
                <h4>
                    <a href="course.html?id=${course.code || course.courseCode}" class="course-link">
                        <span class="course-id">${course.code || course.courseCode}</span>
                        <span class="course-title-text">${course.title}</span>
                        <i class="fas fa-arrow-right"></i>
                    </a>
                </h4>
                <p style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-muted); line-height: 1.4;">
                    ${course.longDescription ? course.longDescription.substring(0, 120) + '...' : 'Explore detailed materials, lecture notes, and video tutorials for this course.'}
                </p>
            `;
            container.appendChild(card);
        });
    }
});
