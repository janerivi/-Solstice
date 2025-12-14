# Solstice Application

I have implemented the interactive Earth orbit visualization using Svelte, Threlte (Three.js), and `astronomy-engine`.

## Features

### 1. Accurate Orbital Visualization
The main 3D view shows the Earth orbiting the Sun.
- **True Orbitals**: Positions are calculated using VSOP87/J2000 algorithms via `astronomy-engine`.
- **Axial Tilt**: Earth is tilted ~23.4°, visually demonstrating why seasons occur.
- **Scale**: The Sun is scaled up (5x Earth radius) for visibility, preserving the orbital scale (1 AU = 10 units).
- **Textures**: High-quality Earth and Sun textures generated for the project.
- **Orbital Markers**: 3D labels for Summer/Winter Solstices, Spring/Autumn Equinoxes, Perihelion, and Aphelion, with precise distances.

### 2. Local Sky View
A secondary 2D view shows the Sun's position in the sky for a selected location on Earth.
- **Time-Based X-Axis**: The horizon view now plots Altitude vs. Time (00:00 - 24:00), providing a clear 24-hour visualization of the sun's path.
- **Local Time**: Displays "Mean Local Time" based on the observer's longitude, allowing users to see sunrise/sunset times relevant to the selected location.
- **Dynamic Scaling**: The Y-axis (Altitude) dynamically scales to fit the sun's maximum height for the day, ensuring optimal visibility at any latitude.
- **Day/Night Cycle**: Background changes based on Sun altitude.

### 3. Interactive Controls
- **Time Travel**: Change the year, month, day, and time to see past or future states.
- **Animation**: Play/Pause orbital movement with variable speed control.
- **Location**: Set Latitude/Longitude to accurately calculate local sunrise/sunset and sky position.
- **Info Panel**: Displays current Sunrise/Sunset times and Solstice/Equinox dates for the year.
- **Draggable Windows**: The Sky View and Controls panels are draggable for a customizable layout.

## How to Run

1. `npm install`
2. `npm run dev`
3. Open browser to the local URL (usually `http://localhost:5173`)

## Architecture
- `src/lib/astronomy.ts`: Core logic wrapping `astronomy-engine` for celestial calculations.
- `src/lib/components/Scene.svelte`: Main 3D scene using Threlte.
- `src/lib/components/SkyView.svelte`: 2D SVG sky plot with local mean time logic.
- `src/lib/stores.ts`: Global reactive state for Time and Location.

---

# Original Application Specification

*The following is the original requirement specification for this project:*

I want to create an interactive visualization and simulation (using perhaps webgl with three.js) of the earths orbit, its axial tilt and where in the orbit the sommer and winter solstices occur.

User should be able to set the year, month, day and time and see where the earth is in its orbit and where the sun is in the sky.

It should be possible to put in any latitude or longitude and get numerical information on sunrise and sunset at any given time as well as a visualization of the suns position in the sky in a seperate smaller view in the UI addition to it orbital position in the larger visualization view.

For visual clarity the size of the sun and the earth in the visualization does not need to be 1:1 and proportional, but the sun shuold still appear significantly larger without making the earth look so small that its hard to see it. there should be some visualization of how the sun light up the earth in the orbital view.

### Implementation details.

please use typescript, three.js and the succint font end framework svelte. For three.js see if there are any componentized wrappers for svelte that makes it the code more readable and maintainable.

Make all the calculations based on true orbitals, axial tilts and precession of the earths orbit with accurate ellipsoidal eccentricities and orbital inclinations. Use also the wgs84 ellipsoid for the earths shape.