document.addEventListener('DOMContentLoaded', () => {
    // Check if required libraries are available on the window object
    if (typeof p5 === 'undefined' || typeof Matter === 'undefined') {
        console.error('Simulator libraries (p5.js or Matter.js) failed to load.');
        const grid = document.getElementById('simulators-grid');
        if (grid) grid.innerHTML = '<p class="error-text">Could not load interactive simulators. Please check your internet connection and try refreshing the page.</p>';
        return;
    }

    const grid = document.getElementById('simulators-grid');
    const searchInput = document.getElementById('simulator-search');
    let p5Instances = [];
    let matterEngines = [];

    // --- Sketch Definitions (as Function Factories) ---
    // This pattern allows us to pass dimensions directly and reliably.

    const bouncingBallSketchFactory = (width, height) => (p) => {
        let x, y, xspeed = 4, yspeed = 3, r = 25;
        p.setup = () => {
            p.createCanvas(width, height);
            x = p.width / 2; y = p.height / 2;
            p.noStroke();
        };
        p.draw = () => {
            p.background(0);
            p.fill('#50E3C2'); // Use accent color from CSS
            p.ellipse(x, y, r * 2);
            x += xspeed; y += yspeed;
            if (x > p.width - r || x < r) xspeed *= -1;
            if (y > p.height - r || y < r) yspeed *= -1;
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
            p.background(0, 50);
            let attractor = p.createVector(p.mouseX, p.mouseY);
            particles.forEach(pt => {
                let force = p5.Vector.sub(attractor, pt.pos);
                force.setMag(0.2);
                pt.vel.add(force);
                pt.pos.add(pt.vel);
                p.fill('#fce38a'); // Gold color for particles
                p.ellipse(pt.pos.x, pt.pos.y, 4);
            });
        };
    };
    
    const pendulumSketch = (container) => {
        const { Engine, Render, Runner, World, Bodies, Constraint, Mouse, MouseConstraint } = Matter;
        const engine = Engine.create({ gravity: { y: 1 } });
        const render = Render.create({ element: container, engine: engine, options: { width: container.clientWidth, height: container.clientHeight, wireframes: false, background: '#000000' }});
        const runner = Runner.create();
        
        let pendulum = Bodies.circle(container.clientWidth / 2 + 80, 200, 30, { restitution: 0.9, friction: 0, render: { fillStyle: '#4A90E2' } });
        World.add(engine.world, [
            pendulum,
            Constraint.create({ pointA: { x: container.clientWidth / 2, y: 50 }, bodyB: pendulum, stiffness: 0.1, render: { strokeStyle: '#E2E8F0' } })
        ]);
        
        let mouse = Mouse.create(render.canvas);
        let mouseConstraint = MouseConstraint.create(engine, { mouse: mouse, constraint: { stiffness: 0.2, render: { visible: false } } });
        World.add(engine.world, mouseConstraint);
        
        Render.run(render);
        Runner.run(runner, engine);
        
        return { engine, render, runner };
    };

    const allSimulators = [
        { id: 'bouncing-ball', title: 'Bouncing Ball', tags: ['p5.js', 'physics', 'motion'], type: 'p5', factory: bouncingBallSketchFactory },
        { id: 'gravity-attractor', title: 'Gravity Attractor', tags: ['p5.js', 'physics', 'gravity', 'force'], type: 'p5', factory: gravitySketchFactory },
        { id: 'pendulum', title: 'Pendulum Simulation', tags: ['matter.js', 'physics', 'pendulum', 'constraint'], type: 'matter', factory: pendulumSketch }
    ];

    const clearInstances = () => {
        p5Instances.forEach(p => p.remove());
        p5Instances = [];
        matterEngines.forEach(instance => {
            Matter.Render.stop(instance.render);
            Matter.Runner.stop(instance.runner);
            Matter.World.clear(instance.engine.world);
            Matter.Engine.clear(instance.engine);
            instance.render.canvas.remove();
        });
        matterEngines = [];
    };

    const renderSimulators = (simsToRender) => {
        clearInstances();
        grid.innerHTML = '';
        
        if (simsToRender.length === 0) {
            grid.innerHTML = '<p class="info-text">No simulators found matching your search.</p>';
            return;
        }

        simsToRender.forEach(sim => {
            const card = document.createElement('div');
            card.className = 'card simulator-card';
            const containerId = `${sim.id}-container`;
            card.innerHTML = `<h4>${sim.title}</h4><div id="${containerId}" class="sim-container"></div>`;
            grid.appendChild(card);
            
            // We need to wait for the card to be in the DOM to get its dimensions
            const container = document.getElementById(containerId);
            if (container) {
                if (sim.type === 'p5') {
                    const sketch = sim.factory(container.clientWidth, container.clientHeight);
                    p5Instances.push(new p5(sketch, container));
                } else if (sim.type === 'matter') {
                    matterEngines.push(sim.factory(container));
                }
            }
        });
    };

    renderSimulators(allSimulators);

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const filteredSims = allSimulators.filter(sim => 
            sim.title.toLowerCase().includes(searchTerm) ||
            sim.tags.some(tag => tag.includes(searchTerm))
        );
        renderSimulators(filteredSims);
    });
});