document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.getElementById('main-content');
    const sidebarNav = document.getElementById('sidebar-nav');
    const sidebar = document.getElementById('sidebar');
    const menuToggle = document.getElementById('menu-toggle');
    const sidebarCloseBtn = document.getElementById('sidebar-close-btn');
    const API_KEY = 'YOUR_GOOGLE_GEMINI_API_KEY'; // IMPORTANT: Replace with your actual API key

    let courseData = {};
    let activeChapterId = 'home';
    const translationCache = new Map();

    // --- API & DATA HANDLING ---

    async function getBengaliTranslation(word) {
        const cacheKey = `word_${word}`;
        if (translationCache.has(cacheKey)) {
            return translationCache.get(cacheKey);
        }
        if (!API_KEY || API_KEY === 'YOUR_GOOGLE_GEMINI_API_KEY') {
            console.warn("API Key not set. Using placeholder translation.");
            return "অনুবাদ"; // Placeholder
        }

        try {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`;
            const prompt = `Translate the English word "${word}" into Bengali. Provide only the Bengali word.`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            });

            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

            const data = await response.json();
            const translation = data.candidates[0].content.parts[0].text.trim();
            if (translation) {
                translationCache.set(cacheKey, translation);
            }
            return translation;
        } catch (error) {
            console.error("Translation API error:", error);
            return "Error";
        }
    }


    // --- UI & RENDERING ---

    function createHTMLElement(tag, className, content = '') {
        const el = document.createElement(tag);
        if (className) el.className = className;
        if (content) el.innerHTML = content;
        return el;
    }

    function renderSidebar() {
        const categories = courseData.chapters.reduce((acc, chapter) => {
            if (!acc[chapter.category]) {
                acc[chapter.category] = [];
            }
            acc[chapter.category].push(chapter);
            return acc;
        }, {});

        sidebarNav.innerHTML = ''; // Clear existing nav
        const ul = createHTMLElement('ul', 'sidebar-nav');

        for (const category in categories) {
            const li = createHTMLElement('li');
            li.innerHTML = `<div class="nav-category">${category}</div>`;
            const categoryUl = createHTMLElement('ul');
            categories[category].forEach(chapter => {
                const itemLi = createHTMLElement('li');
                const link = createHTMLElement('a', 'nav-item', chapter.title);
                link.dataset.id = chapter.id;
                if (chapter.id === activeChapterId) {
                    link.classList.add('active');
                }
                categoryUl.appendChild(itemLi).appendChild(link);
            });
            li.appendChild(categoryUl);
            ul.appendChild(li);
        }
        sidebarNav.appendChild(ul);
    }

    function renderChapter(id) {
        const chapter = courseData.chapters.find(ch => ch.id === id);
        if (!chapter) {
            mainContent.innerHTML = '<h1>Chapter not found</h1>';
            return;
        }

        activeChapterId = id;
        mainContent.innerHTML = ''; // Clear previous content
        mainContent.appendChild(createHTMLElement('h1', 'content-header', chapter.title));

        const contentDiv = createHTMLElement('div');
        contentDiv.innerHTML = chapter.content; // Use innerHTML to parse the HTML content from JSON
        mainContent.appendChild(contentDiv);
        
        // After rendering, find quizzes and exercises to make them interactive
        initializeInteractiveElements();
        updateActiveLink();
        window.scrollTo(0, 0);
    }
    
    function initializeInteractiveElements() {
        // Initialize Quizzes
        document.querySelectorAll('.quiz-container').forEach(container => {
            const quizId = container.dataset.quizId;
            const questions = courseData.quizzes[quizId];
            if (questions) {
                new Quiz(container, questions);
            }
        });

        // Initialize Exercises
        document.querySelectorAll('.exercise-toggle').forEach(el => {
            const button = el.querySelector('.toggle-button');
            const solution = el.querySelector('.solution');
            solution.style.display = 'none';
            button.addEventListener('click', () => {
                const isHidden = solution.style.display === 'none';
                solution.style.display = isHidden ? 'block' : 'none';
                button.textContent = isHidden ? 'Hide Solution' : 'Show Solution';
            });
        });

        // Initialize Translatable words
        document.querySelectorAll('.translatable').forEach(span => {
            const tooltip = createHTMLElement('span', 'tooltip', 'Loading...');
            span.appendChild(tooltip);
            
            span.addEventListener('mouseenter', async () => {
                tooltip.classList.add('visible');
                if (tooltip.textContent === 'Loading...') {
                    const word = span.textContent.replace('Loading...', '').trim();
                    const translation = await getBengaliTranslation(word);
                    tooltip.textContent = translation || 'Not found';
                }
            });

            span.addEventListener('mouseleave', () => {
                tooltip.classList.remove('visible');
            });
        });
    }
    
    // --- QUIZ CLASS ---
    
    class Quiz {
        constructor(container, questions) {
            this.container = container;
            this.questions = questions;
            this.currentQuestionIndex = 0;
            this.score = 0;
            this.selectedAnswer = null;
            this.isSubmitted = false;
            this.render();
        }

        render() {
            this.container.innerHTML = ''; // Clear container
            const question = this.questions[this.currentQuestionIndex];

            const header = createHTMLElement('h3', '', 'Test Your Knowledge');
            const questionCounter = createHTMLElement('h4', '', `Question ${this.currentQuestionIndex + 1}/${this.questions.length}`);
            const questionText = createHTMLElement('p', '', question.question);
            const optionsDiv = createHTMLElement('div');

            question.options.forEach((option, index) => {
                const button = createHTMLElement('button', 'quiz-option', option);
                button.addEventListener('click', () => this.handleAnswerSelect(index, button));
                optionsDiv.appendChild(button);
            });
            
            const submitBtn = createHTMLElement('button', 'toggle-button quiz-button', 'Submit Answer');
            submitBtn.disabled = true;
            submitBtn.addEventListener('click', () => this.handleSubmit());

            this.container.append(header, questionCounter, questionText, optionsDiv, submitBtn);
        }
        
        handleAnswerSelect(index, button) {
            if (this.isSubmitted) return;
            this.selectedAnswer = index;
            // Manage 'selected' class
            this.container.querySelectorAll('.quiz-option').forEach(btn => btn.classList.remove('selected'));
            button.classList.add('selected');
            // Enable submit button
            this.container.querySelector('.quiz-button').disabled = false;
        }

        handleSubmit() {
            if (this.selectedAnswer === null) return;
            this.isSubmitted = true;
            const question = this.questions[this.currentQuestionIndex];
            const options = this.container.querySelectorAll('.quiz-option');

            options.forEach((btn, index) => {
                btn.disabled = true;
                if (index === question.correctAnswer) {
                    btn.classList.add('correct');
                } else if (index === this.selectedAnswer) {
                    btn.classList.add('incorrect');
                }
            });

            if (this.selectedAnswer === question.correctAnswer) {
                this.score++;
            }
            
            // Show result message
            const resultDiv = createHTMLElement('div', `quiz-result ${this.selectedAnswer === question.correctAnswer ? 'correct' : 'incorrect'}`);
            resultDiv.innerHTML = `${this.selectedAnswer === question.correctAnswer ? 'Correct!' : 'Incorrect.'} ${question.explanation}`;
            this.container.appendChild(resultDiv);
            
            // Change button to Next/Finish
            const oldBtn = this.container.querySelector('.quiz-button');
            const newBtnText = this.currentQuestionIndex < this.questions.length - 1 ? 'Next Question' : 'Finish Quiz';
            const newBtn = createHTMLElement('button', 'toggle-button quiz-button', newBtnText);
            newBtn.addEventListener('click', () => this.handleNext());
            oldBtn.replaceWith(newBtn);
        }

        handleNext() {
            if (this.currentQuestionIndex < this.questions.length - 1) {
                this.currentQuestionIndex++;
                this.selectedAnswer = null;
                this.isSubmitted = false;
                this.render();
            } else {
                this.showResults();
            }
        }

        showResults() {
            this.container.innerHTML = '';
            const header = createHTMLElement('h3', '', 'Quiz Complete!');
            const scoreText = createHTMLElement('p', '', `Your final score is: <strong>${this.score} out of ${this.questions.length}</strong>`);
            const restartBtn = createHTMLElement('button', 'toggle-button quiz-button', 'Restart Quiz');
            restartBtn.addEventListener('click', () => this.handleRestart());
            this.container.append(header, scoreText, restartBtn);
        }

        handleRestart() {
            this.currentQuestionIndex = 0;
            this.score = 0;
            this.selectedAnswer = null;
            this.isSubmitted = false;
            this.render();
        }
    }


    // --- EVENT LISTENERS & INITIALIZATION ---

    function updateActiveLink() {
        document.querySelectorAll('.nav-item').forEach(link => {
            if (link.dataset.id === activeChapterId) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }

    sidebarNav.addEventListener('click', (e) => {
        if (e.target.classList.contains('nav-item')) {
            const id = e.target.dataset.id;
            renderChapter(id);
            if (window.innerWidth <= 992) {
                sidebar.classList.remove('open');
                mainContent.classList.remove('sidebar-open');
            }
        }
    });

    menuToggle.addEventListener('click', () => {
        sidebar.classList.add('open');
    });

    sidebarCloseBtn.addEventListener('click', () => {
        sidebar.classList.remove('open');
    });
    
    // Check if sidebar should be open on desktop
    function handleResize() {
        if (window.innerWidth > 992) {
            sidebar.classList.add('open');
            mainContent.classList.add('sidebar-open');
            menuToggle.style.display = 'none';
        } else {
            sidebar.classList.remove('open');
            mainContent.classList.remove('sidebar-open');
            menuToggle.style.display = 'block';
        }
    }

    async function initializeApp() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) throw new Error('Failed to load course data');
            courseData = await response.json();
            renderSidebar();
            renderChapter('home');
            handleResize(); // Set initial state based on window size
            window.addEventListener('resize', handleResize);
        } catch (error) {
            mainContent.innerHTML = `<h1>Error loading course</h1><p>${error.message}</p>`;
            console.error(error);
        }
    }

    initializeApp();
});