document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('simulators-grid');
    const searchInput = document.getElementById('simulator-search');
    let p5Instances = [];
    let matterEngines = [];

    // --- Sketch Definitions (Legacy/Local Demos) ---
    // These are kept for the "Interactive Demos" aspect but we prioritize external high-quality sims now.

    const bouncingBallSketchFactory = (width, height) => (p) => {
        let x, y, xspeed = 4, yspeed = 3, r = 25;
        p.setup = () => {
            p.createCanvas(width, height);
            x = p.width / 2; y = p.height / 2;
            p.noStroke();
        };
        p.draw = () => {
            p.background(30); // Darker background for contrast
            p.fill('#50E3C2');
            p.ellipse(x, y, r * 2);
            x += xspeed; y += yspeed;
            if (x > p.width - r || x < r) xspeed *= -1;
            if (y > p.height - r || y < r) yspeed *= -1;
        };
        p.windowResized = () => {
            // Fullscreen resize handling is done via logic below, but nice to listen here too
        };
    };

    const gravitySketchFactory = (width, height) => (p) => {
        let particles = [];
        p.setup = () => {
            p.createCanvas(width, height);
            for (let i = 0; i < 50; i++) particles.push({ pos: p.createVector(p.random(width), p.random(height)), vel: p5.Vector.random2D() });
            p.noStroke();
        };
        p.draw = () => {
            p.background(30, 50);
            let attractor = p.createVector(p.mouseX, p.mouseY);
            particles.forEach(pt => {
                let force = p5.Vector.sub(attractor, pt.pos);
                force.setMag(0.2);
                pt.vel.add(force);
                pt.pos.add(pt.vel);
                p.fill('#fce38a');
                p.ellipse(pt.pos.x, pt.pos.y, 4);
            });
        };
    };

    // --- Simulation Registry ---
    const allSimulators = [
        // --- Physics ---
        {
            id: 'projectile-motion',
            title: 'Projectile Motion',
            tags: ['physics', 'mechanics', 'motion', 'gravity'],
            category: 'Physics',
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion_en.html'
        },
        {
            id: 'forces-and-motion',
            title: 'Forces and Motion',
            tags: ['physics', 'newton', 'force', 'mechanics'],
            category: 'Physics',
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_en.html'
        },
        {
            id: 'circuit-construction',
            title: 'Circuit Construction Kit',
            tags: ['physics', 'electricity', 'circuits', 'electronics'],
            category: 'Physics',
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_en.html'
        },
        {
            id: 'gravity-and-orbits',
            title: 'Gravity and Orbits',
            tags: ['physics', 'space', 'gravity', 'astronomy'],
            category: 'Physics',
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/gravity-and-orbits/latest/gravity-and-orbits_en.html'
        },
        {
            id: 'wave-interference',
            title: 'Wave Interference',
            tags: ['physics', 'waves', 'sound', 'light'],
            category: 'Physics',
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/wave-interference/latest/wave-interference_en.html'
        },

        // --- Chemistry ---
        {
            id: 'build-an-atom',
            title: 'Build an Atom',
            tags: ['chemistry', 'atom', 'proton', 'electron'],
            category: 'Chemistry',
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_en.html'
        },
        {
            id: 'ph-scale',
            title: 'pH Scale',
            tags: ['chemistry', 'acid', 'base', 'liquid'],
            category: 'Chemistry',
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/ph-scale/latest/ph-scale_en.html'
        },
        {
            id: 'states-of-matter',
            title: 'States of Matter',
            tags: ['chemistry', 'physics', 'heat', 'thermodynamics'],
            category: 'Chemistry',
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/states-of-matter/latest/states-of-matter_en.html'
        },

        // --- Mathematics ---
        {
            id: 'graphing-slope',
            title: 'Graphing Slope-Intercept',
            tags: ['math', 'algebra', 'graph', 'slope'],
            category: 'Mathematics',
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/graphing-slope-intercept/latest/graphing-slope-intercept_en.html'
        },
        {
            id: 'quadrilaterals',
            title: 'Quadrilaterals',
            tags: ['math', 'geometry', 'shapes'],
            category: 'Mathematics',
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/quadrilaterals/latest/quadrilaterals_en.html'
        },

        // --- Interactive Demos ---
        {
            id: 'bouncing-ball',
            title: 'Simple Motion Demo (p5.js)',
            tags: ['demo', 'coding', 'motion'],
            category: 'Interactive Demos',
            type: 'p5',
            factory: bouncingBallSketchFactory
        },
        {
            id: 'gravity-particles',
            title: 'Particle Attraction (p5.js)',
            tags: ['demo', 'coding', 'gravity'],
            category: 'Interactive Demos',
            type: 'p5',
            factory: gravitySketchFactory
        }
    ];

    const clearInstances = () => {
        // Cleanup p5 instances
        p5Instances.forEach(p => p.remove());
        p5Instances = [];

        // Cleanup Matter engines (if we had them active)
        matterEngines.forEach(instance => {
            if (typeof Matter !== 'undefined') {
                Matter.Render.stop(instance.render);
                Matter.Runner.stop(instance.runner);
                Matter.World.clear(instance.engine.world);
                Matter.Engine.clear(instance.engine);
                instance.render.canvas.remove();
            }
        });
        matterEngines = [];
    };

    const toggleFullscreen = (containerId, p5Instance) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!document.fullscreenElement) {
            // Enter Fullscreen
            container.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
                // Fallback could go here, but native is supported in all modern browsers.
            });

            if (p5Instance) {
                // Wait slightly for transition
                setTimeout(() => p5Instance.resizeCanvas(window.innerWidth, window.innerHeight), 100);
            }
        } else {
            // Exit Fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    // Listen for fullscreen changes to handle cleanup (resize p5, show/hide buttons)
    document.addEventListener('fullscreenchange', () => {
        const fullscreenElement = document.fullscreenElement;

        // If we just exited fullscreen, reset p5 instances
        if (!fullscreenElement) {
            p5Instances.forEach(p => {
                const container = p.canvas.parentElement;
                if (container) p.resizeCanvas(container.clientWidth, container.clientHeight);
            });
        }
    });

    // Expose this globally so inline HTML handlers can find it (or we attach dynamically)
    window.toggleFullscreen = toggleFullscreen;
    window.exitFullscreen = (containerId) => toggleFullscreen(containerId, null); // Wrapper for close button

    const renderSimulators = (simsToRender) => {
        clearInstances();
        grid.innerHTML = '';
        grid.style.display = 'block';

        if (simsToRender.length === 0) {
            grid.innerHTML = '<p class="info-text">No simulators found matching your search.</p>';
            return;
        }

        // Group by Category
        const categories = {};
        simsToRender.forEach(sim => {
            if (!categories[sim.category]) categories[sim.category] = [];
            categories[sim.category].push(sim);
        });

        // Render each category
        Object.keys(categories).forEach(categoryName => {
            const section = document.createElement('div');
            section.className = 'category-section';

            const title = document.createElement('h3');
            title.className = 'category-title';
            title.textContent = categoryName;
            section.appendChild(title);

            const gridContainer = document.createElement('div');
            gridContainer.className = 'simulators-grid';

            categories[categoryName].forEach(sim => {
                const card = document.createElement('div');
                card.className = 'simulator-card';
                const containerId = `${sim.id}-container`;

                // Build card content with Header and Fullscreen Button
                card.innerHTML = `
                    <h4>
                        ${sim.title}
                        <button class="fullscreen-btn" onclick="toggleFullscreen('${containerId}')" title="Toggle Fullscreen">
                            <i class="fas fa-expand"></i>
                        </button>
                    </h4>
                    <div id="${containerId}" class="sim-container loading">
                        <button class="close-fs-btn" onclick="exitFullscreen('${containerId}')"><i class="fas fa-times"></i> Close</button>
                        <!-- Content injected here -->
                    </div>
                `;
                gridContainer.appendChild(card);
            });

            section.appendChild(gridContainer);
            grid.appendChild(section);
        });

        // After DOM insertion, initialize scripts and attach logic
        Object.keys(categories).forEach(cat => {
            categories[cat].forEach(sim => {
                const containerId = `${sim.id}-container`;
                const container = document.getElementById(containerId);
                if (!container) return;

                let p5Instance = null;

                if (sim.type === 'iframe') {
                    const iframe = document.createElement('iframe');
                    iframe.src = sim.src;
                    iframe.setAttribute('allowfullscreen', '');
                    iframe.setAttribute('scrolling', 'no');
                    iframe.onload = () => container.classList.remove('loading');
                    container.appendChild(iframe);
                }
                else if (sim.type === 'p5' && typeof p5 !== 'undefined') {
                    container.classList.remove('loading');
                    const sketch = sim.factory(container.clientWidth, container.clientHeight);
                    p5Instance = new p5(sketch, container);
                    p5Instances.push(p5Instance);
                }
                else {
                    container.innerHTML = '<p style="color:white; padding:20px;">Preview not available.</p>';
                }

                // Update click handler to include p5Instance if relevant
                const fsBtn = container.parentElement.querySelector('.fullscreen-btn');
                if (fsBtn && p5Instance) {
                    fsBtn.onclick = () => toggleFullscreen(containerId, p5Instance);
                }
            });
        });
    };

    // Initial Render
    renderSimulators(allSimulators);

    // Search Logic
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const filteredSims = allSimulators.filter(sim =>
            sim.title.toLowerCase().includes(searchTerm) ||
            sim.tags.some(tag => tag.includes(searchTerm)) ||
            sim.category.toLowerCase().includes(searchTerm)
        );
        renderSimulators(filteredSims);
    });

    // Escape key to close fullscreen (Native already handles ESC to exit context, we just need to handle cleanup in 'fullscreenchange')
    // We don't need manual Escape listener for native fullscreen.
});