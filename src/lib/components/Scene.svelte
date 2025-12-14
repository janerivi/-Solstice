<script lang="ts">
    import { Canvas } from "@threlte/core";
    import { T } from "@threlte/core";
    import { OrbitControls } from "@threlte/extras";
    import { get } from "svelte/store";
    import Sun from "./Sun.svelte";
    import Earth from "./Earth.svelte";
    import OrbitPath from "./OrbitPath.svelte";
    import OrbitManager from "./OrbitManager.svelte";
    import OrbitMarkers from "./OrbitMarkers.svelte";
    import { getEarthOrbitPosition } from "../astronomy";
    // Stores used for reactivity
    import { currentDate } from "../stores";
    import type { Vector3D } from "../astronomy";

    let earthPos: Vector3D = { x: 0, y: 0, z: 0 };

    // Reactive Update for Earth Position
    $: {
        const rawPos = getEarthOrbitPosition($currentDate);
        // Mapping: Astro Z -> Three Y, Astro X -> Three X, Astro Y -> Three -Z
        // Scale: 10
        earthPos = {
            x: rawPos.x * 10,
            y: rawPos.z * 10,
            z: -rawPos.y * 10,
        };
    }
</script>

```
<div class="scene-container">
    <Canvas shadows>
        <T.PerspectiveCamera makeDefault position={[0, 20, 40]} fov={45}>
            <OrbitControls enableDamping />
        </T.PerspectiveCamera>

        <T.AmbientLight intensity={0.1} />

        <!-- Logic -->
        <OrbitManager />

        <!-- Universe Background (Stars) could be added here -->

        <!-- Components -->
        <Sun />

        <!-- Pass dynamic year -->
        <OrbitPath year={$currentDate.getFullYear()} />
        <OrbitMarkers year={$currentDate.getFullYear()} />

        <Earth x={earthPos.x} y={earthPos.y} z={earthPos.z} />

        <!-- Helpers -->
        <T.GridHelper args={[100, 100, 0x222222, 0x111111]} />
    </Canvas>
</div>

<style>
    .scene-container {
        width: 100%;
        height: 100vh;
        background-color: #050505;
    }
</style>
