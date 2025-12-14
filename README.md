I want to create an interactive visualization and simulation (using perhaps webgl with three.js) of the earths orbit, its axial tilt and where in the orbit the sommer and winter solstices occur.

User should be able to set the year, month, day and time and see where the earth is in its orbit and where the sun is in the sky.

It should be possible to put in any latitude or longitude and get numerical information on sunrise and sunset at any given time  as well as a visualization of the suns position in the sky in a seperate smaller view in the UI addition to it orbital position in the larger visualization view.

For visual clarity the size of the sun and the earth in the visualization does not need to be 1:1 and proportional, but the sun shuold still appear significantly larger without making the earth look so small that its hard to see it. there should be some visualization of how the sun light up the earth in the orbital view.

Implementation details. 

please use typescript, three.js and the succint font end framework svelte. For three.js see if there are any componentized wrappers for svelte that makes it the code more readable and maintainable.

Make all the calculations based on true orbitals, axial tilts and precession of the earths orbit with accurate ellipsoidal eccentricities and orbital inclinations. Use also the wgs84 ellipsoid for the earths shape.