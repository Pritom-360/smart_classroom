/**
 * Smart Classroom - Interactive Simulators Engine
 * Comprehensive database of PhET, GeoGebra, Concord Consortium, and Custom HTML5 Simulators.
 */

document.addEventListener('DOMContentLoaded', () => {
    const grid = document.getElementById('simulators-grid');
    const searchInput = document.getElementById('simulator-search');
    const searchClearBtn = document.getElementById('search-clear-btn');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    const showingCountEl = document.getElementById('showing-count');
    const totalCountEl = document.getElementById('total-count');
    const categoryPillsContainer = document.getElementById('category-pills');
    const sourcePillsContainer = document.getElementById('source-pills');

    let p5Instances = [];
    let currentCategory = 'all';
    let currentSource = 'all';
    let currentSearchTerm = '';

    // --- Custom Canvas Demos (p5.js) ---
    const bouncingBallSketchFactory = (width, height) => (p) => {
        let x, y, xspeed = 4, yspeed = 3, r = 25;
        p.setup = () => {
            p.createCanvas(width, height);
            x = p.width / 2;
            y = p.height / 2;
            p.noStroke();
        };
        p.draw = () => {
            p.background(15, 23, 42);
            p.fill(99, 102, 241);
            p.ellipse(x, y, r * 2);
            p.fill(244, 63, 94);
            p.ellipse(x - 6, y - 6, 8);
            x += xspeed;
            y += yspeed;
            if (x > p.width - r || x < r) xspeed *= -1;
            if (y > p.height - r || y < r) yspeed *= -1;
        };
    };

    const gravitySketchFactory = (width, height) => (p) => {
        let particles = [];
        p.setup = () => {
            p.createCanvas(width, height);
            for (let i = 0; i < 60; i++) {
                particles.push({
                    pos: p.createVector(p.random(width), p.random(height)),
                    vel: p5.Vector.random2D().mult(1.5),
                    color: [p.random(100, 255), p.random(150, 255), 255]
                });
            }
            p.noStroke();
        };
        p.draw = () => {
            p.background(15, 23, 42, 60);
            let attractor = p.createVector(p.mouseX || width / 2, p.mouseY || height / 2);
            particles.forEach(pt => {
                let force = p5.Vector.sub(attractor, pt.pos);
                let d = force.mag();
                if (d > 5 && d < 400) {
                    force.setMag(0.35);
                    pt.vel.add(force);
                    pt.vel.limit(5);
                }
                pt.pos.add(pt.vel);
                if (pt.pos.x < 0) pt.pos.x = p.width;
                if (pt.pos.x > p.width) pt.pos.x = 0;
                if (pt.pos.y < 0) pt.pos.y = p.height;
                if (pt.pos.y > p.height) pt.pos.y = 0;

                p.fill(pt.color[0], pt.color[1], pt.color[2]);
                p.ellipse(pt.pos.x, pt.pos.y, 5);
            });
        };
    };

    const waveSketchFactory = (width, height) => (p) => {
        let angle = 0;
        p.setup = () => {
            p.createCanvas(width, height);
        };
        p.draw = () => {
            p.background(15, 23, 42);
            p.stroke(56, 189, 248);
            p.strokeWeight(3);
            p.noFill();
            p.beginShape();
            for (let x = 0; x < p.width; x += 6) {
                let y = p.height / 2 + p.sin(angle + x * 0.03) * 45 + p.sin(angle * 1.5 + x * 0.015) * 20;
                p.vertex(x, y);
            }
            p.endShape();
            angle += 0.05;
        };
    };

    // --- Master Simulation Database ---
    const allSimulators = [
        // ==========================================
        // PHYSICS (PhET, GeoGebra, Concord, Custom)
        // ==========================================
        {
            id: 'blackbody-spectrum',
            title: 'Blackbody Spectrum',
            category: 'Physics',
            source: 'PhET',
            description: 'Investigate how the blackbody radiation spectrum of the sun, light bulbs, and stars changes with temperature. View Planck distribution curves.',
            tags: ['black body', 'radiation', 'thermodynamics', 'planck', 'optics', 'temperature', 'quantum', 'sun', 'stars', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/blackbody-spectrum/latest/blackbody-spectrum_all.html'
        },
        {
            id: 'energy-skate-park',
            title: 'Energy Skate Park',
            category: 'Physics',
            source: 'PhET',
            description: 'Learn about conservation of energy with a skater dude! Build tracks, ramps, and jumps to see kinetic energy, potential energy, and friction.',
            tags: ['energy', 'kinetic', 'potential', 'conservation', 'friction', 'gravity', 'mechanics', 'skate', 'track', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/energy-skate-park/latest/energy-skate-park_all.html'
        },
        {
            id: 'energy-skate-park-basics',
            title: 'Energy Skate Park: Basics',
            category: 'Physics',
            source: 'PhET',
            description: 'Explore kinetic, potential, and thermal energy on simple skateboard tracks with visual pie and bar charts.',
            tags: ['energy', 'mechanics', 'basics', 'work', 'motion', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/energy-skate-park-basics/latest/energy-skate-park-basics_all.html'
        },
        {
            id: 'circuit-construction-dc',
            title: 'Circuit Construction Kit: DC',
            category: 'Physics',
            source: 'PhET',
            description: 'Build circuits with batteries, resistors, light bulbs, fuses, and switches. Measure voltage and current with realistic multimeters.',
            tags: ['circuit', 'dc', 'electricity', 'current', 'voltage', 'resistor', 'battery', 'electronics', 'ohm', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc/latest/circuit-construction-kit-dc_all.html'
        },
        {
            id: 'circuit-construction-dc-virtual-lab',
            title: 'Circuit Construction: DC Virtual Lab',
            category: 'Physics',
            source: 'PhET',
            description: 'Virtual lab version of DC Circuit Construction for open inquiry, internal resistance testing, and non-ideal components.',
            tags: ['circuit', 'virtual lab', 'electricity', 'dc', 'resistor', 'multimeter', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-dc-virtual-lab/latest/circuit-construction-kit-dc-virtual-lab_all.html'
        },
        {
            id: 'circuit-construction-ac',
            title: 'Circuit Construction Kit: AC',
            category: 'Physics',
            source: 'PhET',
            description: 'Explore alternating current (AC) and direct current (DC) circuits with inductors, capacitors, AC voltage sources, and real-time oscilloscopes.',
            tags: ['circuit', 'ac', 'alternating current', 'inductor', 'capacitor', 'frequency', 'oscilloscope', 'electronics', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-ac/latest/circuit-construction-kit-ac_all.html'
        },
        {
            id: 'circuit-construction-ac-virtual-lab',
            title: 'Circuit Construction: AC Virtual Lab',
            category: 'Physics',
            source: 'PhET',
            description: 'Advanced AC virtual laboratory for RLC resonant circuits, phase shifts, and impedance analysis.',
            tags: ['circuit', 'ac', 'rlc', 'resonance', 'impedance', 'virtual lab', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/circuit-construction-kit-ac-virtual-lab/latest/circuit-construction-kit-ac-virtual-lab_all.html'
        },
        {
            id: 'ohms-law',
            title: "Ohm's Law",
            category: 'Physics',
            source: 'PhET',
            description: 'See how the equation V = I * R relates to a simple circuit. Adjust the voltage and resistance, and see the current change according to Ohm’s law.',
            tags: ['ohms law', 'voltage', 'current', 'resistance', 'electricity', 'circuits', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/ohms-law/latest/ohms-law_all.html'
        },
        {
            id: 'coulombs-law',
            title: "Coulomb's Law",
            category: 'Physics',
            source: 'PhET',
            description: 'Visualize the electrostatic force that two charges exert on each other. Observe how the force changes with distance and charge magnitude.',
            tags: ['coulomb', 'electrostatics', 'charge', 'electric force', 'vectors', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/coulombs-law/latest/coulombs-law_all.html'
        },
        {
            id: 'charges-and-fields',
            title: 'Charges and Fields',
            category: 'Physics',
            source: 'PhET',
            description: 'Move point charges around the playing field and view the electric field, voltages, equipotential lines, and field vectors in real time.',
            tags: ['charges', 'electric field', 'equipotential', 'voltage', 'electrostatics', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/charges-and-fields/latest/charges-and-fields_all.html'
        },
        {
            id: 'balloons-and-static-electricity',
            title: 'Balloons & Static Electricity',
            category: 'Physics',
            source: 'PhET',
            description: 'Rub a balloon on a sweater to transfer electrons. Explore static charging, attraction, repulsion, and polarization against a wall.',
            tags: ['static electricity', 'balloons', 'electrons', 'charge', 'polarization', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/balloons-and-static-electricity/latest/balloons-and-static-electricity_all.html'
        },
        {
            id: 'john-travoltage',
            title: 'John Travoltage',
            category: 'Physics',
            source: 'PhET',
            description: 'Make John Travoltage drag his foot across the carpet to build up static charge and discharge sparks into a metal doorknob.',
            tags: ['static', 'electrons', 'discharge', 'sparks', 'grounding', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/john-travoltage/latest/john-travoltage_all.html'
        },
        {
            id: 'faradays-law',
            title: "Faraday's Law",
            category: 'Physics',
            source: 'PhET',
            description: 'Move a bar magnet through a coil of wire to produce an electric current and light up a bulb. Explore electromagnetic induction.',
            tags: ['faraday', 'electromagnetic induction', 'magnetic field', 'coil', 'voltage', 'magnetism', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/faradays-law/latest/faradays-law_all.html'
        },
        {
            id: 'faradays-electromagnetic-lab',
            title: "Faraday's Electromagnetic Lab",
            category: 'Physics',
            source: 'PhET',
            description: 'Comprehensive electromagnetic suite: bar magnets, electromagnets, transformers, and AC/DC power generators.',
            tags: ['faraday', 'electromagnet', 'transformer', 'generator', 'compass', 'induction', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/faradays-electromagnetic-lab/latest/faradays-electromagnetic-lab_all.html'
        },
        {
            id: 'generator',
            title: 'Electric Generator',
            category: 'Physics',
            source: 'PhET',
            description: 'Convert mechanical kinetic energy from flowing water into electricity using rotating magnets inside wire coils.',
            tags: ['generator', 'hydro', 'electricity', 'induction', 'magnetism', 'energy', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/generator/latest/generator_all.html'
        },
        {
            id: 'magnet-and-compass',
            title: 'Magnet and Compass',
            category: 'Physics',
            source: 'PhET',
            description: 'Explore the magnetic field surrounding a permanent bar magnet with a needle compass and field meter.',
            tags: ['magnet', 'compass', 'magnetic field', 'poles', 'earth', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/magnet-and-compass/latest/magnet-and-compass_all.html'
        },
        {
            id: 'magnets-and-electromagnets',
            title: 'Magnets & Electromagnets',
            category: 'Physics',
            source: 'PhET',
            description: 'Compare permanent magnets with electromagnets. Alter battery voltage, number of wire loops, and observe field changes.',
            tags: ['electromagnet', 'magnet', 'coils', 'magnetic field', 'dc', 'ac', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/magnets-and-electromagnets/latest/magnets-and-electromagnets_all.html'
        },
        {
            id: 'capacitor-lab-basics',
            title: 'Capacitor Lab: Basics',
            category: 'Physics',
            source: 'PhET',
            description: 'Explore how capacitance depends on plate separation and area. Connect to a battery and light bulb to store and discharge energy.',
            tags: ['capacitor', 'capacitance', 'stored energy', 'electric field', 'plates', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/capacitor-lab-basics/latest/capacitor-lab-basics_all.html'
        },
        {
            id: 'resistance-in-a-wire',
            title: 'Resistance in a Wire',
            category: 'Physics',
            source: 'PhET',
            description: 'Change the resistivity, length, and cross-sectional area of a wire to see how they impact total electrical resistance (R = ρL/A).',
            tags: ['resistance', 'resistivity', 'wire', 'ohms law', 'conductivity', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/resistance-in-a-wire/latest/resistance-in-a-wire_all.html'
        },
        {
            id: 'projectile-motion',
            title: 'Projectile Motion',
            category: 'Physics',
            source: 'PhET',
            description: 'Blast cars, cannonballs, golf balls, and humans out of a cannon! Set angle, initial speed, air resistance, and measure trajectory.',
            tags: ['projectile', 'kinematics', 'trajectory', 'gravity', 'velocity', 'air resistance', 'cannon', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/projectile-motion/latest/projectile-motion_all.html'
        },
        {
            id: 'projectile-data-lab',
            title: 'Projectile Data Lab',
            category: 'Physics',
            source: 'PhET',
            description: 'Collect, graph, and analyze experimental kinematic data for projectile trajectories under various gravitational fields.',
            tags: ['projectile', 'data', 'graph', 'kinematics', 'mechanics', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/projectile-data-lab/latest/projectile-data-lab_all.html'
        },
        {
            id: 'forces-and-motion-basics',
            title: 'Forces & Motion: Basics',
            category: 'Physics',
            source: 'PhET',
            description: 'Explore Newton’s laws of motion. Tug of war, net force, acceleration, friction, and mass interactions on smooth and rough surfaces.',
            tags: ['forces', 'newton', 'motion', 'friction', 'acceleration', 'mass', 'mechanics', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/forces-and-motion-basics/latest/forces-and-motion-basics_all.html'
        },
        {
            id: 'friction',
            title: 'Friction at Atomic Scale',
            category: 'Physics',
            source: 'PhET',
            description: 'Rub two chemistry books together and observe how atomic friction generates thermal energy and increases temperature.',
            tags: ['friction', 'heat', 'thermodynamics', 'atomic', 'temperature', 'energy', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/friction/latest/friction_all.html'
        },
        {
            id: 'hookes-law',
            title: "Hooke's Law",
            category: 'Physics',
            source: 'PhET',
            description: 'Stretch and compress springs to explore relationships between spring constant, displacement, applied force, and elastic potential energy.',
            tags: ['hookes law', 'spring', 'elasticity', 'force', 'potential energy', 'harmonic', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/hookes-law/latest/hookes-law_all.html'
        },
        {
            id: 'masses-and-springs',
            title: 'Masses & Springs',
            category: 'Physics',
            source: 'PhET',
            description: 'Hang masses from springs and adjust spring stiffness, damping, and gravity (Earth, Moon, Jupiter, Planet X). Measure period & oscillations.',
            tags: ['springs', 'harmonic motion', 'oscillations', 'period', 'damping', 'gravity', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/masses-and-springs/latest/masses-and-springs_all.html'
        },
        {
            id: 'masses-and-springs-basics',
            title: 'Masses & Springs: Basics',
            category: 'Physics',
            source: 'PhET',
            description: 'Introductory spring lab with simple weights, stretch rulers, and real-time energy graphs.',
            tags: ['springs', 'basics', 'weights', 'energy', 'mechanics', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/masses-and-springs-basics/latest/masses-and-springs-basics_all.html'
        },
        {
            id: 'pendulum-lab',
            title: 'Pendulum Lab',
            category: 'Physics',
            source: 'PhET',
            description: 'Play with one or two pendulums and discover how the period depends on the length of string, bob mass, angle, and gravity strength.',
            tags: ['pendulum', 'simple harmonic motion', 'period', 'gravity', 'kinetic energy', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/pendulum-lab/latest/pendulum-lab_all.html'
        },
        {
            id: 'balancing-act',
            title: 'Balancing Act',
            category: 'Physics',
            source: 'PhET',
            description: 'Balance a seesaw with different objects and people. Discover torque, center of mass, and mechanical equilibrium with a balance game.',
            tags: ['balance', 'seesaw', 'torque', 'equilibrium', 'lever', 'mass', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/balancing-act/latest/balancing-act_all.html'
        },
        {
            id: 'gravity-and-orbits',
            title: 'Gravity and Orbits',
            category: 'Physics',
            source: 'PhET',
            description: 'Move the Sun, Earth, Moon, and space station to see how gravity controls orbital velocities, elliptical paths, and planetary revolutions.',
            tags: ['gravity', 'orbits', 'astronomy', 'space', 'solar system', 'moon', 'satellite', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/gravity-and-orbits/latest/gravity-and-orbits_all.html'
        },
        {
            id: 'gravity-force-lab',
            title: 'Gravity Force Lab',
            category: 'Physics',
            source: 'PhET',
            description: 'Visualize Newton’s Universal Law of Gravitation (F = G*m1*m2/r^2). Adjust masses and distances to see gravitational forces.',
            tags: ['gravity', 'newton', 'gravitation', 'mass', 'inverse square', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/gravity-force-lab/latest/gravity-force-lab_all.html'
        },
        {
            id: 'gravity-force-lab-basics',
            title: 'Gravity Force Lab: Basics',
            category: 'Physics',
            source: 'PhET',
            description: 'Intuitive introduction to gravitational attraction between everyday spheres and astronomical bodies.',
            tags: ['gravity', 'force', 'mass', 'basics', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/gravity-force-lab-basics/latest/gravity-force-lab-basics_all.html'
        },
        {
            id: 'keplers-laws',
            title: "Kepler's Laws",
            category: 'Physics',
            source: 'PhET',
            description: 'Explore Johannes Kepler’s three laws of planetary motion: elliptical orbits, equal areas in equal times, and orbital period squares.',
            tags: ['kepler', 'planetary motion', 'astronomy', 'orbits', 'ellipse', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/keplers-laws/latest/keplers-laws_all.html'
        },
        {
            id: 'my-solar-system',
            title: 'My Solar System',
            category: 'Physics',
            source: 'PhET',
            description: 'Build your own custom celestial orbital system! Simulate multi-body gravitational interactions, slingshots, and binary stars.',
            tags: ['solar system', 'celestial', 'n-body', 'gravity', 'stars', 'planets', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/my-solar-system/latest/my-solar-system_all.html'
        },
        {
            id: 'collision-lab',
            title: 'Collision Lab (Momentum)',
            category: 'Physics',
            source: 'PhET',
            description: 'Investigate simple collisions in 1D and 2D. Alter masses, velocities, and elasticity to observe conservation of momentum and kinetic energy.',
            tags: ['collision', 'momentum', 'elastic', 'inelastic', 'vectors', 'mechanics', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/collision-lab/latest/collision-lab_all.html'
        },
        {
            id: 'torque',
            title: 'Torque & Rotational Motion',
            category: 'Physics',
            source: 'PhET',
            description: 'Investigate how torque causes an object to rotate. Discover the relationship between angular acceleration, moment of inertia, and angular momentum.',
            tags: ['torque', 'rotation', 'angular momentum', 'inertia', 'mechanics', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/torque/latest/torque_all.html'
        },
        {
            id: 'vector-addition',
            title: 'Vector Addition',
            category: 'Physics',
            source: 'PhET',
            description: 'Drag vectors on a 2D grid, compute resultant vectors, view cartesian components (X, Y) and polar coordinates (magnitude & angle).',
            tags: ['vectors', 'resultant', 'addition', 'trigonometry', 'components', 'math', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/vector-addition/latest/vector-addition_all.html'
        },
        {
            id: 'vector-addition-equations',
            title: 'Vector Addition: Equations',
            category: 'Physics',
            source: 'PhET',
            description: 'Solve vector linear combination equations like aA + bB = C graphically and algebraically with real-time numeric readouts.',
            tags: ['vectors', 'equations', 'linear algebra', 'math', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/vector-addition-equations/latest/vector-addition-equations_all.html'
        },
        {
            id: 'density',
            title: 'Density Lab',
            category: 'Physics',
            source: 'PhET',
            description: 'Drop custom blocks into a pool of water to see who sinks and who floats! Calculate density = mass / volume with fluid displacement.',
            tags: ['density', 'mass', 'volume', 'buoyancy', 'floating', 'displacement', 'physics', 'chemistry'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/density/latest/density_all.html'
        },
        {
            id: 'buoyancy',
            title: 'Buoyancy & Archimedes Principle',
            category: 'Physics',
            source: 'PhET',
            description: 'Experiment with Archimedes principle. Calculate buoyant force, displaced fluid mass, and gravitational forces acting on submerged bodies.',
            tags: ['buoyancy', 'archimedes', 'fluids', 'floating', 'displacement', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/buoyancy/latest/buoyancy_all.html'
        },
        {
            id: 'buoyancy-basics',
            title: 'Buoyancy: Basics',
            category: 'Physics',
            source: 'PhET',
            description: 'Introductory buoyancy simulation with wooden, brick, and aluminum blocks in fluid tanks.',
            tags: ['buoyancy', 'basics', 'fluids', 'water', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/buoyancy-basics/latest/buoyancy-basics_all.html'
        },
        {
            id: 'under-pressure',
            title: 'Under Pressure (Fluid Statics)',
            category: 'Physics',
            source: 'PhET',
            description: 'Explore fluid pressure under water and in the atmosphere. See how pressure changes as a function of depth, fluid density, and shape of pool.',
            tags: ['pressure', 'fluid', 'hydrostatic', 'barometer', 'depth', 'atmosphere', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/under-pressure/latest/under-pressure_all.html'
        },
        {
            id: 'fluid-pressure-and-flow',
            title: 'Fluid Pressure & Flow (Bernoulli)',
            category: 'Physics',
            source: 'PhET',
            description: 'Explore Bernoulli’s equation and continuity principle. Pump fluid through constricted pipes, measure flow speed, and water towers.',
            tags: ['fluid', 'bernoulli', 'flow', 'continuity', 'pipes', 'pressure', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/fluid-pressure-and-flow/latest/fluid-pressure-and-flow_all.html'
        },
        {
            id: 'gas-properties',
            title: 'Gas Properties & Ideal Gas Law',
            category: 'Physics',
            source: 'PhET',
            description: 'Pump gas molecules into a box and see what happens as you change the volume, add or remove heat, change gravity, and observe PV = nRT.',
            tags: ['gas', 'ideal gas', 'pressure', 'temperature', 'volume', 'thermodynamics', 'physics', 'chemistry'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/gas-properties/latest/gas-properties_all.html'
        },
        {
            id: 'gases-intro',
            title: 'Gases: Introduction',
            category: 'Physics',
            source: 'PhET',
            description: 'Introductory gas kinetic theory lab with particle counts, pressure gauges, and thermometers.',
            tags: ['gas', 'intro', 'kinetic theory', 'temperature', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/gases-intro/latest/gases-intro_all.html'
        },
        {
            id: 'wave-on-a-string',
            title: 'Wave on a String',
            category: 'Physics',
            source: 'PhET',
            description: 'Wiggle the end of a string to generate transverse waves. Adjust amplitude, frequency, tension, damping, and fixed vs free ends.',
            tags: ['waves', 'string', 'frequency', 'amplitude', 'wavelength', 'transverse', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/wave-on-a-string/latest/wave-on-a-string_all.html'
        },
        {
            id: 'wave-interference',
            title: 'Wave Interference',
            category: 'Physics',
            source: 'PhET',
            description: 'Make waves with a dripping faucet, audio speaker, or laser! Explore double-slit interference, diffraction, and wave superposition.',
            tags: ['wave', 'interference', 'diffraction', 'double slit', 'light', 'sound', 'optics', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/wave-interference/latest/wave-interference_all.html'
        },
        {
            id: 'waves-intro',
            title: 'Waves: Introduction',
            category: 'Physics',
            source: 'PhET',
            description: 'Interactive introduction to water ripples, sound waves, and light beams. Measure wave speed and wavelength with virtual tools.',
            tags: ['waves', 'sound', 'light', 'water', 'wavelength', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/waves-intro/latest/waves-intro_all.html'
        },
        {
            id: 'sound-waves',
            title: 'Sound Waves Lab',
            category: 'Physics',
            source: 'PhET',
            description: 'Visualize air pressure waves produced by a speaker. Listen to tone frequencies, observe interference, and measure the speed of sound.',
            tags: ['sound', 'acoustics', 'frequency', 'pitch', 'waves', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/sound-waves/latest/sound-waves_all.html'
        },
        {
            id: 'fourier-making-waves',
            title: 'Fourier: Making Waves',
            category: 'Physics',
            source: 'PhET',
            description: 'Learn how any complex periodic waveform can be constructed from a sum of pure sine harmonics via Fourier Series analysis.',
            tags: ['fourier', 'harmonics', 'sine', 'synthesis', 'sound', 'signal', 'math', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/fourier-making-waves/latest/fourier-making-waves_all.html'
        },
        {
            id: 'geometric-optics',
            title: 'Geometric Optics',
            category: 'Physics',
            source: 'PhET',
            description: 'How does a lens form an image? Look at light rays passing through convex and concave lenses and mirrors to locate real and virtual images.',
            tags: ['optics', 'lens', 'mirror', 'focal length', 'refraction', 'light', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/geometric-optics/latest/geometric-optics_all.html'
        },
        {
            id: 'geometric-optics-basics',
            title: 'Geometric Optics: Basics',
            category: 'Physics',
            source: 'PhET',
            description: 'Simple ray diagram builder for lenses and mirrors with focal point draggable controls.',
            tags: ['optics', 'lens', 'ray tracing', 'basics', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/geometric-optics-basics/latest/geometric-optics-basics_all.html'
        },
        {
            id: 'bending-light',
            title: 'Bending Light (Snell’s Law & Prisms)',
            category: 'Physics',
            source: 'PhET',
            description: 'Explore refraction, reflection, total internal reflection, and rainbow dispersion of light passing between air, water, and glass prisms.',
            tags: ['light', 'refraction', 'snell', 'reflection', 'prism', 'dispersion', 'optics', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/bending-light/latest/bending-light_all.html'
        },
        {
            id: 'color-vision',
            title: 'Color Vision & RGB Mixing',
            category: 'Physics',
            source: 'PhET',
            description: 'Mix red, green, and blue light to create any color of the rainbow. Explore color filters and photoreceptor cones in the human eye.',
            tags: ['color', 'rgb', 'light', 'vision', 'optics', 'biology', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/color-vision/latest/color-vision_all.html'
        },
        {
            id: 'rutherford-scattering',
            title: 'Rutherford Scattering',
            category: 'Physics',
            source: 'PhET',
            description: 'Shoot alpha particles at atoms to discover the atomic nucleus! Compare the Plum Pudding model with Rutherford’s nuclear atom model.',
            tags: ['rutherford', 'atomic', 'nucleus', 'alpha particle', 'scattering', 'quantum', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/rutherford-scattering/latest/rutherford-scattering_all.html'
        },
        {
            id: 'energy-forms-and-changes',
            title: 'Energy Forms and Changes',
            category: 'Physics',
            source: 'PhET',
            description: 'Explore how energy transforms between mechanical, thermal, electrical, and light forms. Build custom energy generation systems.',
            tags: ['energy', 'thermal', 'mechanical', 'transformation', 'solar', 'wind', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/energy-forms-and-changes/latest/energy-forms-and-changes_all.html'
        },
        {
            id: 'normal-modes',
            title: 'Normal Modes & Coupled Oscillators',
            category: 'Physics',
            source: 'PhET',
            description: 'Discover normal modes of vibration for coupled masses on springs and continuous elastic strings.',
            tags: ['normal modes', 'oscillations', 'eigenmode', 'resonance', 'harmonics', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/normal-modes/latest/normal-modes_all.html'
        },
        {
            id: 'concord-spring-mass',
            title: 'Molecular Spring-Mass Interaction',
            category: 'Physics',
            source: 'Concord',
            description: 'Concord Consortium interactive physics simulation model for spring-mass oscillators and force fields.',
            tags: ['concord', 'spring', 'mass', 'molecular dynamics', 'mechanics', 'physics'],
            type: 'iframe',
            src: 'https://lab.concord.org/embeddable.html#interactives/interactions/springMassInteraction.json'
        },
        {
            id: 'concord-light-matter',
            title: 'Light & Matter Photon Absorption',
            category: 'Physics',
            source: 'Concord',
            description: 'Explore how sunlight and infrared light photons interact with greenhouse gas molecules and matter.',
            tags: ['concord', 'light', 'photons', 'absorption', 'quantum', 'physics', 'earth science'],
            type: 'iframe',
            src: 'https://lab.concord.org/embeddable.html#interactives/sam/light-matter/1-sunlight-and-light-bulbs.json'
        },

        // ==========================================
        // CHEMISTRY (PhET & Concord Consortium)
        // ==========================================
        {
            id: 'build-an-atom',
            title: 'Build an Atom',
            category: 'Chemistry',
            source: 'PhET',
            description: 'Build atoms from scratch with protons, neutrons, and electrons. Test mass number, electric charge, elemental symbols, and isotopes.',
            tags: ['atom', 'protons', 'neutrons', 'electrons', 'periodic table', 'elements', 'chemistry'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/build-an-atom/latest/build-an-atom_all.html'
        },
        {
            id: 'build-a-molecule',
            title: 'Build a Molecule',
            category: 'Chemistry',
            source: 'PhET',
            description: 'Assemble atoms into 3D molecules like H2O, CO2, and CH4. Collect molecules in kits to view structural formulas.',
            tags: ['molecule', 'bonds', 'formula', 'water', 'methane', 'chemistry'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/build-a-molecule/latest/build-a-molecule_all.html'
        },
        {
            id: 'molecule-shapes',
            title: 'Molecule Shapes (VSEPR Theory)',
            category: 'Chemistry',
            source: 'PhET',
            description: 'Explore 3D molecular geometries and electron domain geometry using VSEPR theory. Rotate molecules to see bond angles.',
            tags: ['molecule', 'vsepr', 'geometry', 'bond angles', 'tetrahedral', 'trigonal', 'chemistry'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/molecule-shapes/latest/molecule-shapes_all.html'
        },
        {
            id: 'molecule-shapes-basics',
            title: 'Molecule Shapes: Basics',
            category: 'Chemistry',
            source: 'PhET',
            description: 'Introductory 3D shape visualizer for simple diatomic, linear, bent, and planar molecules.',
            tags: ['molecule', 'shapes', 'basics', 'vsepr', 'chemistry'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/molecule-shapes-basics/latest/molecule-shapes-basics_all.html'
        },
        {
            id: 'molecule-polarity',
            title: 'Molecule Polarity',
            category: 'Chemistry',
            source: 'PhET',
            description: 'Change atom electronegativity to see bond dipoles and net dipole moment. Place molecules in an electric field to observe rotation.',
            tags: ['polarity', 'electronegativity', 'dipole', 'bonds', 'electric field', 'chemistry'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/molecule-polarity/latest/molecule-polarity_all.html'
        },
        {
            id: 'molecules-and-light',
            title: 'Molecules and Light',
            category: 'Chemistry',
            source: 'PhET',
            description: 'Shine microwave, infrared, visible, and ultraviolet light on atmospheric molecules (CO2, H2O, N2, O3) to observe stretching, rotating, and dissociation.',
            tags: ['molecules', 'light', 'photons', 'infrared', 'greenhouse', 'chemistry', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/molecules-and-light/latest/molecules-and-light_all.html'
        },
        {
            id: 'isotopes-and-atomic-mass',
            title: 'Isotopes and Atomic Mass',
            category: 'Chemistry',
            source: 'PhET',
            description: 'Determine how isotopic abundance determines the average atomic mass of chemical elements found on the periodic table.',
            tags: ['isotopes', 'atomic mass', 'abundance', 'neutrons', 'periodic table', 'chemistry'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/isotopes-and-atomic-mass/latest/isotopes-and-atomic-mass_all.html'
        },
        {
            id: 'atomic-interactions',
            title: 'Atomic Interactions (Lennard-Jones)',
            category: 'Chemistry',
            source: 'PhET',
            description: 'Explore the Lennard-Jones potential energy curve between noble gas atoms (Neon, Argon, Helium). Find balance between attraction and repulsion.',
            tags: ['lennard jones', 'potential', 'van der waals', 'noble gas', 'atomic', 'chemistry', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/atomic-interactions/latest/atomic-interactions_all.html'
        },
        {
            id: 'states-of-matter',
            title: 'States of Matter',
            category: 'Chemistry',
            source: 'PhET',
            description: 'Watch atoms and molecules form solids, liquids, and gases. Heat, cool, and compress atoms while viewing pressure-temperature phase diagrams.',
            tags: ['states of matter', 'solid', 'liquid', 'gas', 'phase diagram', 'temperature', 'chemistry', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/states-of-matter/latest/states-of-matter_all.html'
        },
        {
            id: 'states-of-matter-basics',
            title: 'States of Matter: Basics',
            category: 'Chemistry',
            source: 'PhET',
            description: 'Basic particle view of heating and freezing water, oxygen, and neon in a sealed container.',
            tags: ['states of matter', 'particles', 'heating', 'cooling', 'chemistry'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/states-of-matter-basics/latest/states-of-matter-basics_all.html'
        },
        {
            id: 'balancing-chemical-equations',
            title: 'Balancing Chemical Equations',
            category: 'Chemistry',
            source: 'PhET',
            description: 'Balance synthesis, decomposition, and combustion chemical equations with visual atom counters and interactive challenge games.',
            tags: ['balancing', 'chemical equations', 'stoichiometry', 'reactions', 'conservation of mass', 'chemistry'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/balancing-chemical-equations/latest/balancing-chemical-equations_all.html'
        },
        {
            id: 'reactants-products-and-leftovers',
            title: 'Reactants, Products & Leftovers',
            category: 'Chemistry',
            source: 'PhET',
            description: 'Understand limiting reactants and excess reagents by making sandwiches and synthesizing ammonia, water, and methane.',
            tags: ['stoichiometry', 'limiting reactant', 'reactions', 'products', 'yield', 'chemistry'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/reactants-products-and-leftovers/latest/reactants-products-and-leftovers_all.html'
        },
        {
            id: 'molarity',
            title: 'Molarity Lab',
            category: 'Chemistry',
            source: 'PhET',
            description: 'Calculate solution concentration (Molarity = moles of solute / liters of solution). Add solute, evaporate water, and observe saturation.',
            tags: ['molarity', 'concentration', 'solute', 'solvent', 'saturation', 'solution', 'chemistry'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/molarity/latest/molarity_all.html'
        },
        {
            id: 'concentration',
            title: 'Concentration Lab',
            category: 'Chemistry',
            source: 'PhET',
            description: 'Measure concentration with a conductivity and colorimeter probe for various salts, drink mixes, and chemical solutions.',
            tags: ['concentration', 'solution', 'dissolution', 'salts', 'colorimeter', 'chemistry'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/concentration/latest/concentration_all.html'
        },
        {
            id: 'beers-law-lab',
            title: "Beer's Law Lab (Spectrophotometry)",
            category: 'Chemistry',
            source: 'PhET',
            description: 'Shine light through colored solutions to explore Beer-Lambert law (A = εbc). Measure transmittance and absorbance across wavelengths.',
            tags: ['beers law', 'absorbance', 'transmittance', 'spectroscopy', 'concentration', 'optics', 'chemistry'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/beers-law-lab/latest/beers-law-lab_all.html'
        },
        {
            id: 'ph-scale',
            title: 'pH Scale Lab',
            category: 'Chemistry',
            source: 'PhET',
            description: 'Test the pH of everyday liquids like coffee, saliva, battery acid, and spit. Compare hydroxide and hydronium ion concentrations.',
            tags: ['ph', 'acid', 'base', 'neutral', 'hydronium', 'hydroxide', 'chemistry'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/ph-scale/latest/ph-scale_all.html'
        },
        {
            id: 'ph-scale-basics',
            title: 'pH Scale: Basics',
            category: 'Chemistry',
            source: 'PhET',
            description: 'Introductory pH scale lab for testing sour vs bitter liquids with litmus and digital pH probe meters.',
            tags: ['ph', 'acid', 'base', 'basics', 'chemistry'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/ph-scale-basics/latest/ph-scale-basics_all.html'
        },
        {
            id: 'acid-base-solutions',
            title: 'Acid-Base Solutions',
            category: 'Chemistry',
            source: 'PhET',
            description: 'Examine strong vs weak acids and bases. Visualize equilibrium concentrations, conductivity, and conjugate pairs.',
            tags: ['acid', 'base', 'equilibrium', 'dissociation', 'ka', 'kb', 'conductivity', 'chemistry'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/acid-base-solutions/latest/acid-base-solutions_all.html'
        },
        {
            id: 'diffusion',
            title: 'Diffusion Lab',
            category: 'Chemistry',
            source: 'PhET',
            description: 'Observe how gas particles diffuse across a permeable barrier based on molecular mass, temperature, and concentration gradients.',
            tags: ['diffusion', 'entropy', 'kinetic theory', 'osmosis', 'chemistry', 'biology'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/diffusion/latest/diffusion_all.html'
        },
        {
            id: 'concord-oil-water',
            title: 'Oil & Water Molecular Dynamics',
            category: 'Chemistry',
            source: 'Concord',
            description: 'Concord Consortium molecular simulation showing hydrophobic vs hydrophilic interactions and phase separation.',
            tags: ['concord', 'hydrophobic', 'hydrophilic', 'oil', 'water', 'intermolecular', 'chemistry'],
            type: 'iframe',
            src: 'https://lab.concord.org/embeddable.html#interactives/samples/1-oil-and-water-shake.json'
        },
        {
            id: 'concord-gas-laws',
            title: 'Gas Laws & Particle Collisions',
            category: 'Chemistry',
            source: 'Concord',
            description: 'Interactive Concord Consortium model simulating gas pressure and molecular velocity distributions.',
            tags: ['concord', 'gas laws', 'pressure', 'kinetic theory', 'chemistry'],
            type: 'iframe',
            src: 'https://lab.concord.org/embeddable.html#interactives/sam/gas-laws/1-intro-gas-properties.json'
        },
        {
            id: 'concord-phase-change',
            title: 'Solids, Liquids & Gases Phase Lab',
            category: 'Chemistry',
            source: 'Concord',
            description: 'Detailed atomic scale simulation of thermal vibrations and intermolecular bonding during phase transitions.',
            tags: ['concord', 'phase change', 'solid', 'liquid', 'gas', 'bonding', 'chemistry'],
            type: 'iframe',
            src: 'https://lab.concord.org/embeddable.html#interactives/sam/phase-change/1-solids-liquids-gases.json'
        },

        // ==========================================
        // MATHEMATICS (PhET & GeoGebra)
        // ==========================================
        {
            id: 'graphing-slope-intercept',
            title: 'Graphing Slope-Intercept (y = mx + b)',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Explore the slope-intercept form of a line. Change slope m and y-intercept b to graph linear equations in real time.',
            tags: ['slope', 'linear', 'graph', 'intercept', 'algebra', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/graphing-slope-intercept/latest/graphing-slope-intercept_all.html'
        },
        {
            id: 'graphing-lines',
            title: 'Graphing Lines (Slope, Point-Slope)',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Master standard form, point-slope form, and slope-intercept form with interactive line challenges and graphing games.',
            tags: ['graphing', 'lines', 'slope', 'algebra', 'coordinate', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/graphing-lines/latest/graphing-lines_all.html'
        },
        {
            id: 'graphing-quadratics',
            title: 'Graphing Quadratics (Parabolas)',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Discover how coefficients a, b, and c alter the vertex, roots, axis of symmetry, and focus of parabolic quadratic curves.',
            tags: ['quadratics', 'parabola', 'vertex', 'roots', 'algebra', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/graphing-quadratics/latest/graphing-quadratics_all.html'
        },
        {
            id: 'calculus-grapher',
            title: 'Calculus Grapher (Derivatives & Integrals)',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Explore the relationship between a function f(x), its derivative f’(x), and its integral ∫f(x)dx graphically.',
            tags: ['calculus', 'derivative', 'integral', 'tangent', 'area under curve', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/calculus-grapher/latest/calculus-grapher_all.html'
        },
        {
            id: 'trig-tour',
            title: 'Trig Tour (Unit Circle & Trigonometry)',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Explore angles, sine, cosine, tangent, radians, and degrees around the interactive unit circle coordinate plane.',
            tags: ['trigonometry', 'unit circle', 'sine', 'cosine', 'tangent', 'radians', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/trig-tour/latest/trig-tour_all.html'
        },
        {
            id: 'function-builder',
            title: 'Function Builder',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Build mathematical function machines by combining operations (+, -, *, ÷, ^2). Track input-output tables and mystery rules.',
            tags: ['function', 'algebra', 'input', 'output', 'mapping', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/function-builder/latest/function-builder_all.html'
        },
        {
            id: 'function-builder-basics',
            title: 'Function Builder: Basics',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Visual introduction to function tables and geometric transformations for introductory algebra.',
            tags: ['function', 'basics', 'rules', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/function-builder-basics/latest/function-builder-basics_all.html'
        },
        {
            id: 'curve-fitting',
            title: 'Curve Fitting & Interpolation',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Place data points on a coordinate plane and fit polynomial, linear, quadratic, and cubic curves to find best-fit equations.',
            tags: ['curve fitting', 'regression', 'polynomial', 'data', 'statistics', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/curve-fitting/latest/curve-fitting_all.html'
        },
        {
            id: 'least-squares-regression',
            title: 'Least-Squares Regression',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Understand linear regression analysis, correlation coefficient (r and r^2), and residuals using visual least-squares squares.',
            tags: ['regression', 'least squares', 'residuals', 'correlation', 'statistics', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/least-squares-regression/latest/least-squares-regression_all.html'
        },
        {
            id: 'area-builder',
            title: 'Area Builder & Perimeter',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Create custom geometric shapes on a grid and calculate total area and perimeter with interactive shape puzzles.',
            tags: ['area', 'perimeter', 'geometry', 'grid', 'shapes', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/area-builder/latest/area-builder_all.html'
        },
        {
            id: 'area-model-algebra',
            title: 'Area Model Algebra (Factoring)',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Use the visual area model to multiply binomials, factor polynomials, and expand algebraic expressions.',
            tags: ['area model', 'factoring', 'polynomials', 'algebra', 'binomial', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/area-model-algebra/latest/area-model-algebra_all.html'
        },
        {
            id: 'area-model-decimals',
            title: 'Area Model Decimals',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Multiply and partition decimal numbers using proportional 2D rectangular area representations.',
            tags: ['decimals', 'multiplication', 'area model', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/area-model-decimals/latest/area-model-decimals_all.html'
        },
        {
            id: 'area-model-introduction',
            title: 'Area Model Introduction',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Explore the partial products method for whole number multiplication using geometric area grids.',
            tags: ['multiplication', 'area model', 'arithmetic', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/area-model-introduction/latest/area-model-introduction_all.html'
        },
        {
            id: 'area-model-multiplication',
            title: 'Area Model Multiplication',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Multiply multi-digit numbers with interactive visual area boxes and partial sum tracking.',
            tags: ['multiplication', 'area', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/area-model-multiplication/latest/area-model-multiplication_all.html'
        },
        {
            id: 'fractions-intro',
            title: 'Fractions: Introduction',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Build fractions with pizza slices, cylinders, and geometric bars. Connect numerators and denominators to real quantities.',
            tags: ['fractions', 'numerator', 'denominator', 'visual', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/fractions-intro/latest/fractions-intro_all.html'
        },
        {
            id: 'fractions-equality',
            title: 'Fractions: Equality & Equivalence',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Find equivalent fractions across different shapes, number lines, and mathematical expressions.',
            tags: ['fractions', 'equivalent', 'equality', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/fractions-equality/latest/fractions-equality_all.html'
        },
        {
            id: 'fractions-mixed-numbers',
            title: 'Fractions: Mixed Numbers',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Build improper fractions and convert them to mixed numbers using interactive pie charts and pattern blocks.',
            tags: ['fractions', 'mixed numbers', 'improper fractions', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/fractions-mixed-numbers/latest/fractions-mixed-numbers_all.html'
        },
        {
            id: 'fraction-matcher',
            title: 'Fraction Matcher Game',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Match equivalent fractions and numeric values across multiple fun progressive difficulty levels.',
            tags: ['fractions', 'game', 'matching', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/fraction-matcher/latest/fraction-matcher_all.html'
        },
        {
            id: 'fraction-comparison',
            title: 'Fraction Comparison',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Compare fractions with common numerators, common denominators, and benchmark values like 1/2.',
            tags: ['fractions', 'comparison', 'greater than', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/fraction-comparison/latest/fraction-comparison_all.html'
        },
        {
            id: 'ratio-and-proportion',
            title: 'Ratio and Proportion',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Explore ratios by mixing colors, painting apples, and scaling recipes with dynamic ratio bars.',
            tags: ['ratios', 'proportions', 'scaling', 'fractions', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/ratio-and-proportion/latest/ratio-and-proportion_all.html'
        },
        {
            id: 'proportion-playground',
            title: 'Proportion Playground',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Investigate direct proportions, scaling factors, and unit multipliers using billiard balls and painted patterns.',
            tags: ['proportions', 'rates', 'scaling', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/proportion-playground/latest/proportion-playground_all.html'
        },
        {
            id: 'unit-rates',
            title: 'Unit Rates Lab',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Find unit prices at the grocery store, calculate speed rates, and graph constant rate-of-change lines.',
            tags: ['unit rate', 'slope', 'cost', 'speed', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/unit-rates/latest/unit-rates_all.html'
        },
        {
            id: 'equality-explorer',
            title: 'Equality Explorer (Algebra Balance)',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Solve equations using an interactive balance scale. Add, subtract, multiply, and divide both sides equally.',
            tags: ['algebra', 'equations', 'balance', 'solving', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/equality-explorer/latest/equality-explorer_all.html'
        },
        {
            id: 'equality-explorer-basics',
            title: 'Equality Explorer: Basics',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Introductory balance scale lab with shapes and coins to build intuition for algebraic equality.',
            tags: ['equality', 'balance', 'basics', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/equality-explorer-basics/latest/equality-explorer-basics_all.html'
        },
        {
            id: 'equality-explorer-two-variables',
            title: 'Equality Explorer: Systems of Equations',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Solve systems of linear equations with two variables (X and Y) using multi-scale balancing methods.',
            tags: ['systems of equations', 'algebra', 'variables', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/equality-explorer-two-variables/latest/equality-explorer-two-variables_all.html'
        },
        {
            id: 'expression-exchange',
            title: 'Expression Exchange (Algebra)',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Build and simplify algebraic expressions with positive and negative variable tiles and constant blocks.',
            tags: ['algebra', 'expressions', 'simplifying', 'variables', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/expression-exchange/latest/expression-exchange_all.html'
        },
        {
            id: 'plinko-probability',
            title: 'Plinko Probability (Binomial & Gaussian)',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Drop balls through a peg board to generate binomial and normal Gaussian bell curve distributions in real time.',
            tags: ['probability', 'statistics', 'normal distribution', 'bell curve', 'binomial', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/plinko-probability/latest/plinko-probability_all.html'
        },
        {
            id: 'mean-share-and-balance',
            title: 'Mean: Share and Balance',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Discover the arithmetic mean as a fair share and balance point on a seesaw fulcrum.',
            tags: ['mean', 'average', 'statistics', 'balance', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/mean-share-and-balance/latest/mean-share-and-balance_all.html'
        },
        {
            id: 'center-and-variability',
            title: 'Center and Variability (Stats)',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Explore mean, median, interquartile range (IQR), and standard deviation with interactive dot plots and box plots.',
            tags: ['statistics', 'median', 'mean', 'box plot', 'variance', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/center-and-variability/latest/center-and-variability_all.html'
        },
        {
            id: 'quadrilaterals',
            title: 'Quadrilaterals Geometry Lab',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Drag vertices and side lengths to explore squares, rectangles, parallelograms, rhombuses, and kites.',
            tags: ['geometry', 'quadrilateral', 'parallelogram', 'rhombus', 'angles', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/quadrilaterals/latest/quadrilaterals_all.html'
        },
        {
            id: 'arithmetic',
            title: 'Arithmetic Practice Lab',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Develop mental math, multiplication, division, and factoring skills with timed visual challenges.',
            tags: ['arithmetic', 'multiplication', 'division', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/arithmetic/latest/arithmetic_all.html'
        },
        {
            id: 'make-a-ten',
            title: 'Make a Ten Math Lab',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Master place value, tens frames, and mental addition strategies by grouping numbers to make tens.',
            tags: ['place value', 'addition', 'ten frame', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/make-a-ten/latest/make-a-ten_all.html'
        },
        {
            id: 'number-line-operations',
            title: 'Number Line: Operations',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Visualize addition and subtraction of positive and negative integers along a dynamic number line.',
            tags: ['number line', 'integers', 'addition', 'subtraction', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/number-line-operations/latest/number-line-operations_all.html'
        },
        {
            id: 'number-line-integers',
            title: 'Number Line: Integers',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Compare integer values, absolute values, elevations, and bank balances above and below zero.',
            tags: ['integers', 'absolute value', 'number line', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/number-line-integers/latest/number-line-integers_all.html'
        },
        {
            id: 'number-line-distance',
            title: 'Number Line: Distance',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Explore the geometric definition of distance between points on a number line as |a - b|.',
            tags: ['distance', 'absolute value', 'number line', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/number-line-distance/latest/number-line-distance_all.html'
        },
        {
            id: 'number-play',
            title: 'Number Play',
            category: 'Mathematics',
            source: 'PhET',
            description: 'Count, tally, and order objects using ten frames and interactive number tracks.',
            tags: ['counting', 'numbers', 'math'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/number-play/latest/number-play_all.html'
        },
        {
            id: 'geogebra-3d-grapher',
            title: 'GeoGebra 3D Function Grapher',
            category: 'Mathematics',
            source: 'GeoGebra',
            description: 'Plot 3D mathematical surfaces, multivariable functions z = f(x, y), vectors, and geometric solids in full 3D.',
            tags: ['geogebra', '3d', 'multivariable', 'surfaces', 'calculus', 'math'],
            type: 'iframe',
            src: 'https://www.geogebra.org/3d?lang=en'
        },
        {
            id: 'geogebra-geometry',
            title: 'GeoGebra Dynamic Geometry',
            category: 'Mathematics',
            source: 'GeoGebra',
            description: 'Interactive Euclidean geometry suite: construct circles, perpendicular bisectors, polygons, and dynamic angle proofs.',
            tags: ['geogebra', 'geometry', 'euclidean', 'proofs', 'constructions', 'math'],
            type: 'iframe',
            src: 'https://www.geogebra.org/geometry?lang=en'
        },
        {
            id: 'geogebra-graphing-calc',
            title: 'GeoGebra Graphing Calculator',
            category: 'Mathematics',
            source: 'GeoGebra',
            description: 'Full-featured graphing calculator with polar equations, parametric curves, tangents, asymptotes, and tables.',
            tags: ['geogebra', 'graphing', 'calculator', 'functions', 'math'],
            type: 'iframe',
            src: 'https://www.geogebra.org/graphing?lang=en'
        },
        {
            id: 'geogebra-cas',
            title: 'GeoGebra CAS Computer Algebra',
            category: 'Mathematics',
            source: 'GeoGebra',
            description: 'Computer Algebra System for symbolic derivatives, integrals, matrix operations, and exact algebraic equation solving.',
            tags: ['geogebra', 'cas', 'symbolic', 'calculus', 'algebra', 'math'],
            type: 'iframe',
            src: 'https://www.geogebra.org/cas?lang=en'
        },
        {
            id: 'geogebra-scientific',
            title: 'GeoGebra Scientific Suite',
            category: 'Mathematics',
            source: 'GeoGebra',
            description: 'Scientific calculator for trigonometric, logarithmic, combinatorial, and exponential computations.',
            tags: ['geogebra', 'scientific', 'calculator', 'math'],
            type: 'iframe',
            src: 'https://www.geogebra.org/scientific?lang=en'
        },

        // ==========================================
        // BIOLOGY (PhET)
        // ==========================================
        {
            id: 'natural-selection',
            title: 'Natural Selection (Bunnies)',
            category: 'Biology',
            source: 'PhET',
            description: 'Explore evolutionary adaptation with bunnies! Introduce mutations (fur color, tooth length), predators (wolves), and climate changes.',
            tags: ['natural selection', 'evolution', 'mutation', 'genetics', 'adaptation', 'wolves', 'biology'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/natural-selection/latest/natural-selection_all.html'
        },
        {
            id: 'gene-expression-essentials',
            title: 'Gene Expression Essentials',
            category: 'Biology',
            source: 'PhET',
            description: 'Transcribe DNA into mRNA and translate mRNA into functional proteins! Control transcription factors and gene expression levels.',
            tags: ['genetics', 'gene expression', 'dna', 'mrna', 'transcription', 'translation', 'protein', 'biology'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/gene-expression-essentials/latest/gene-expression-essentials_all.html'
        },
        {
            id: 'neuron',
            title: 'Neuron Action Potential',
            category: 'Biology',
            source: 'PhET',
            description: 'Stimulate a nerve cell and watch ions (Na+, K+) flow through voltage-gated membrane channels during an action potential pulse.',
            tags: ['neuron', 'action potential', 'neuroscience', 'sodium', 'potassium', 'membrane', 'biology'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/neuron/latest/neuron_all.html'
        },

        // ==========================================
        // EARTH SCIENCE (PhET)
        // ==========================================
        {
            id: 'greenhouse-effect',
            title: 'The Greenhouse Effect',
            category: 'Earth Science',
            source: 'PhET',
            description: 'How do greenhouse gases affect global climate? Explore the concentration of CO2, CH4, and water vapor over historical epochs.',
            tags: ['greenhouse effect', 'climate', 'global warming', 'co2', 'atmosphere', 'earth science', 'physics'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/greenhouse-effect/latest/greenhouse-effect_all.html'
        },
        {
            id: 'plate-tectonics',
            title: 'Plate Tectonics',
            category: 'Earth Science',
            source: 'PhET',
            description: 'Explore the theory of plate tectonics: continental drift, subduction zones, oceanic trenches, volcanoes, and crustal density.',
            tags: ['plate tectonics', 'geology', 'crust', 'volcanoes', 'earthquakes', 'continental drift', 'earth science'],
            type: 'iframe',
            src: 'https://phet.colorado.edu/sims/html/plate-tectonics/latest/plate-tectonics_all.html'
        },

        // ==========================================
        // INTERACTIVE DEMOS (p5.js Custom Demos)
        // ==========================================
        {
            id: 'bouncing-ball-demo',
            title: 'Bouncing Ball Kinematics (p5.js)',
            category: 'Interactive Demos',
            source: 'Custom',
            description: 'Interactive 2D physics demonstration of velocity vectors, boundary collisions, and restitution.',
            tags: ['demo', 'coding', 'p5', 'javascript', 'kinematics', 'canvas'],
            type: 'p5',
            factory: bouncingBallSketchFactory
        },
        {
            id: 'particle-gravity-demo',
            title: 'Particle Attraction Gravitational Field',
            category: 'Interactive Demos',
            source: 'Custom',
            description: 'Live interactive n-particle simulation gravitating towards cursor attractor with fluid velocity dampening.',
            tags: ['demo', 'gravity', 'particles', 'attractor', 'physics', 'p5'],
            type: 'p5',
            factory: gravitySketchFactory
        },
        {
            id: 'wave-superposition-demo',
            title: 'Wave Harmonic Superposition',
            category: 'Interactive Demos',
            source: 'Custom',
            description: 'Real-time mathematical wave interference showing compound sine frequencies and wave propagation.',
            tags: ['demo', 'waves', 'harmonic', 'sine', 'superposition', 'p5'],
            type: 'p5',
            factory: waveSketchFactory
        }
    ];

    // --- Clean Up Function ---
    const clearInstances = () => {
        p5Instances.forEach(p => {
            try { p.remove(); } catch (e) {}
        });
        p5Instances = [];
    };

    // --- Update Category Badge Counts ---
    const updateCategoryCounts = () => {
        const counts = {
            all: allSimulators.length,
            Physics: allSimulators.filter(s => s.category === 'Physics').length,
            Chemistry: allSimulators.filter(s => s.category === 'Chemistry').length,
            Mathematics: allSimulators.filter(s => s.category === 'Mathematics').length,
            Biology: allSimulators.filter(s => s.category === 'Biology').length,
            'Earth Science': allSimulators.filter(s => s.category === 'Earth Science').length,
            'Interactive Demos': allSimulators.filter(s => s.category === 'Interactive Demos').length
        };

        const countAllEl = document.getElementById('count-all');
        const countPhysEl = document.getElementById('count-physics');
        const countChemEl = document.getElementById('count-chemistry');
        const countMathEl = document.getElementById('count-math');
        const countBioEl = document.getElementById('count-biology');
        const countEarthEl = document.getElementById('count-earth');
        const countDemosEl = document.getElementById('count-demos');

        if (countAllEl) countAllEl.textContent = counts.all;
        if (countPhysEl) countPhysEl.textContent = counts.Physics;
        if (countChemEl) countChemEl.textContent = counts.Chemistry;
        if (countMathEl) countMathEl.textContent = counts.Mathematics;
        if (countBioEl) countBioEl.textContent = counts.Biology;
        if (countEarthEl) countEarthEl.textContent = counts['Earth Science'];
        if (countDemosEl) countDemosEl.textContent = counts['Interactive Demos'];

        if (totalCountEl) totalCountEl.textContent = allSimulators.length;
    };

    // --- Fullscreen Handler ---
    const toggleFullscreen = (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (!document.fullscreenElement && !document.webkitFullscreenElement) {
            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.webkitRequestFullscreen) {
                container.webkitRequestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            }
        }
    };

    window.toggleFullscreen = toggleFullscreen;
    window.exitFullscreen = (containerId) => toggleFullscreen(containerId);

    // --- Subject Icon Mapping ---
    const getCategoryIcon = (category) => {
        switch (category) {
            case 'Physics': return 'fa-bolt';
            case 'Chemistry': return 'fa-flask';
            case 'Mathematics': return 'fa-square-root-alt';
            case 'Biology': return 'fa-dna';
            case 'Earth Science': return 'fa-mountain';
            case 'Interactive Demos': return 'fa-code';
            default: return 'fa-atom';
        }
    };

    // --- Render Simulators ---
    const renderSimulators = (simsToRender) => {
        clearInstances();
        grid.innerHTML = '';

        if (showingCountEl) {
            showingCountEl.textContent = `Showing ${simsToRender.length}`;
        }

        // Show/hide reset button
        const isFiltered = currentCategory !== 'all' || currentSource !== 'all' || currentSearchTerm.trim() !== '';
        if (resetFiltersBtn) {
            resetFiltersBtn.style.display = isFiltered ? 'inline-flex' : 'none';
        }

        if (simsToRender.length === 0) {
            grid.innerHTML = `
                <div class="empty-results-box">
                    <i class="fas fa-search-minus empty-icon"></i>
                    <h3>No simulators found</h3>
                    <p>We couldn't find any simulation matching "<strong>${escapeHtml(currentSearchTerm)}</strong>" in the selected filters.</p>
                    <button class="btn btn-primary" onclick="window.resetAllSimulatorFilters()">
                        <i class="fas fa-redo-alt"></i> Clear All Filters
                    </button>
                </div>
            `;
            return;
        }

        // Group by Category if viewing All, otherwise show unified cards
        const categories = {};
        simsToRender.forEach(sim => {
            if (!categories[sim.category]) categories[sim.category] = [];
            categories[sim.category].push(sim);
        });

        Object.keys(categories).forEach(categoryName => {
            const section = document.createElement('div');
            section.className = 'category-section';

            const catIcon = getCategoryIcon(categoryName);
            const sectionHeader = document.createElement('div');
            sectionHeader.className = 'category-header-wrap';
            sectionHeader.innerHTML = `
                <h3 class="category-title">
                    <i class="fas ${catIcon}"></i> ${categoryName}
                    <span class="category-count">(${categories[categoryName].length})</span>
                </h3>
            `;
            section.appendChild(sectionHeader);

            const flexGrid = document.createElement('div');
            flexGrid.className = 'simulators-flex-grid';

            categories[categoryName].forEach(sim => {
                const card = document.createElement('div');
                card.className = 'simulator-card';
                const containerId = `${sim.id}-container`;

                const directLink = sim.src ? `
                    <a href="${sim.src}" target="_blank" rel="noopener noreferrer" class="card-action-btn" title="Open in new window / full lab tab">
                        <i class="fas fa-external-link-alt"></i>
                    </a>
                ` : '';

                const sourceBadgeClass = `source-${sim.source.toLowerCase()}`;

                card.innerHTML = `
                    <div class="card-header">
                        <div class="card-header-top">
                            <span class="source-badge ${sourceBadgeClass}">${sim.source}</span>
                            <div class="card-controls">
                                ${directLink}
                                <button class="card-action-btn fullscreen-btn" onclick="toggleFullscreen('${containerId}')" title="Toggle Fullscreen Mode">
                                    <i class="fas fa-expand"></i>
                                </button>
                            </div>
                        </div>
                        <h4 class="card-title">${sim.title}</h4>
                    </div>
                    
                    <div id="${containerId}" class="sim-container loading" data-sim-id="${sim.id}">
                        <button class="close-fs-btn" onclick="exitFullscreen('${containerId}')">
                            <i class="fas fa-compress"></i> Exit Fullscreen
                        </button>
                        <div class="loading-indicator">
                            <div class="spinner-ring-small"></div>
                            <span>Loading Simulation...</span>
                        </div>
                    </div>

                    <div class="card-body">
                        <p class="card-description">${sim.description || 'Interactive simulation for exploring science and math concepts.'}</p>
                        <div class="card-tags">
                            ${sim.tags.slice(0, 4).map(t => `<span class="sim-tag">#${t}</span>`).join('')}
                        </div>
                    </div>
                `;

                flexGrid.appendChild(card);
            });

            section.appendChild(flexGrid);
            grid.appendChild(section);
        });

        // Initialize Iframes and p5 canvases with lazy loading
        initializeSimulationContainers(simsToRender);
    };

    // --- Helper to escape HTML ---
    const escapeHtml = (str) => {
        return (str || '').replace(/[&<>"']/g, m => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[m]);
    };

    // --- Initialize Containers & Lazy Load ---
    const initializeSimulationContainers = (sims) => {
        const simMap = new Map();
        sims.forEach(s => simMap.set(s.id, s));

        const containers = Array.from(document.querySelectorAll('.sim-container'));
        
        // Eagerly load the first 6 cards immediately for instantaneous user experience
        containers.slice(0, 6).forEach(container => {
            const simId = container.getAttribute('data-sim-id');
            const sim = simMap.get(simId);
            if (sim && !container.dataset.loaded) {
                container.dataset.loaded = 'true';
                loadSimulationContent(container, sim);
            }
        });

        // Use IntersectionObserver with generous rootMargin for remaining containers
        const observerOptions = {
            root: null,
            rootMargin: '400px 0px',
            threshold: 0.01
        };

        const observer = new IntersectionObserver((entries, obs) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const container = entry.target;
                    const simId = container.getAttribute('data-sim-id');
                    const sim = simMap.get(simId);

                    if (sim && !container.dataset.loaded) {
                        container.dataset.loaded = 'true';
                        loadSimulationContent(container, sim);
                    }
                    obs.unobserve(container);
                }
            });
        }, observerOptions);

        containers.slice(6).forEach(container => {
            observer.observe(container);
        });
    };

    const loadSimulationContent = (container, sim) => {
        if (sim.type === 'iframe') {
            const iframe = document.createElement('iframe');
            iframe.src = sim.src;
            iframe.allow = "fullscreen; clipboard-read; clipboard-write; autoplay";
            iframe.setAttribute('scrolling', 'no');
            iframe.setAttribute('loading', 'lazy');
            iframe.title = sim.title;

            iframe.onload = () => {
                container.classList.remove('loading');
                const loader = container.querySelector('.loading-indicator');
                if (loader) loader.style.display = 'none';
            };

            // Fallback timeout
            setTimeout(() => {
                container.classList.remove('loading');
                const loader = container.querySelector('.loading-indicator');
                if (loader) loader.style.display = 'none';
            }, 2500);

            container.appendChild(iframe);
        } else if (sim.type === 'p5' && typeof p5 !== 'undefined') {
            container.classList.remove('loading');
            const loader = container.querySelector('.loading-indicator');
            if (loader) loader.style.display = 'none';

            const sketch = sim.factory(container.clientWidth || 320, container.clientHeight || 240);
            const p5Inst = new p5(sketch, container);
            p5Instances.push(p5Inst);
        }
    };

    // --- Master Filter Function ---
    const filterAndRender = () => {
        const term = currentSearchTerm.toLowerCase().trim();

        const filtered = allSimulators.filter(sim => {
            // Category filter
            const matchesCategory = (currentCategory === 'all') || (sim.category === currentCategory);

            // Source filter
            const matchesSource = (currentSource === 'all') || (sim.source.toLowerCase() === currentSource.toLowerCase());

            // Search query filter
            const matchesSearch = !term || (
                sim.title.toLowerCase().includes(term) ||
                sim.category.toLowerCase().includes(term) ||
                sim.source.toLowerCase().includes(term) ||
                (sim.description && sim.description.toLowerCase().includes(term)) ||
                (sim.tags && sim.tags.some(tag => tag.toLowerCase().includes(term)))
            );

            return matchesCategory && matchesSource && matchesSearch;
        });

        renderSimulators(filtered);
    };

    // --- Debounce Search ---
    let searchDebounceTimeout = null;
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            currentSearchTerm = e.target.value;
            if (searchClearBtn) {
                searchClearBtn.style.display = currentSearchTerm ? 'flex' : 'none';
            }

            clearTimeout(searchDebounceTimeout);
            searchDebounceTimeout = setTimeout(() => {
                filterAndRender();
            }, 180);
        });
    }

    if (searchClearBtn) {
        searchClearBtn.addEventListener('click', () => {
            if (searchInput) {
                searchInput.value = '';
                currentSearchTerm = '';
                searchClearBtn.style.display = 'none';
                searchInput.focus();
                filterAndRender();
            }
        });
    }

    // --- Category Pill Click Handlers ---
    if (categoryPillsContainer) {
        categoryPillsContainer.addEventListener('click', (e) => {
            const pill = e.target.closest('.filter-pill');
            if (!pill) return;

            categoryPillsContainer.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');

            currentCategory = pill.getAttribute('data-category');
            filterAndRender();
        });
    }

    // --- Source Pill Click Handlers ---
    if (sourcePillsContainer) {
        sourcePillsContainer.addEventListener('click', (e) => {
            const pill = e.target.closest('.filter-pill-sm');
            if (!pill) return;

            sourcePillsContainer.querySelectorAll('.filter-pill-sm').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');

            currentSource = pill.getAttribute('data-source');
            filterAndRender();
        });
    }

    // --- Reset All Filters ---
    window.resetAllSimulatorFilters = () => {
        currentCategory = 'all';
        currentSource = 'all';
        currentSearchTerm = '';

        if (searchInput) searchInput.value = '';
        if (searchClearBtn) searchClearBtn.style.display = 'none';

        if (categoryPillsContainer) {
            categoryPillsContainer.querySelectorAll('.filter-pill').forEach(p => {
                p.classList.toggle('active', p.getAttribute('data-category') === 'all');
            });
        }

        if (sourcePillsContainer) {
            sourcePillsContainer.querySelectorAll('.filter-pill-sm').forEach(p => {
                p.classList.toggle('active', p.getAttribute('data-source') === 'all');
            });
        }

        filterAndRender();
    };

    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', window.resetAllSimulatorFilters);
    }

    // --- Initial Setup ---
    updateCategoryCounts();
    filterAndRender();
});