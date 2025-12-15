<script lang="ts">
    import { Canvas } from "@threlte/core";
    import { T } from "@threlte/core";
    import { OrbitControls } from "@threlte/extras";

    import Sun from "./Sun.svelte";
    import Earth from "./Earth.svelte";
    import OrbitPath from "./OrbitPath.svelte";
    import OrbitManager from "./OrbitManager.svelte";
    import OrbitMarkers from "./OrbitMarkers.svelte";
    import InteractivitySetup from "./InteractivitySetup.svelte";
    import Skybox from "./Skybox.svelte";
    import { getEarthOrbitPosition } from "../astronomy";
    // Stores used for reactivity
    import { currentDate, cameraMode } from "../stores";
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

```html
<div class="scene-container">
    <Canvas shadows>
        <InteractivitySetup />
        {#if $cameraMode === "perspective"}
            <!-- Rotated 90 degrees: viewing from X axis [40, 20, 0] instead of Z [0, 20, 40] -->
            <T.PerspectiveCamera
                makeDefault
                position={[40, 20, 0]}
                fov={45}
                far={2000}
            >
                <OrbitControls enableDamping />
            </T.PerspectiveCamera>
        {:else}
            <!-- Increased zoom to 35 for tighter default view -->
            <T.OrthographicCamera
                makeDefault
                position={[40, 20, 0]}
                zoom={35}
                near={-1000}
                far={2000}
            >
                <OrbitControls enableDamping />
            </T.OrthographicCamera>
        {/if}

        <!-- <T.AmbientLight intensity={0.1} /> -->

        <OrbitManager />
        <Sun earthPosition={earthPos} />
        <OrbitPath year={$currentDate.getFullYear()} />
        <OrbitMarkers year={$currentDate.getFullYear()} />
        <Earth x={earthPos.x} y={earthPos.y} z={earthPos.z} />

        <Skybox />
    </Canvas>
</div>

<style>
    .scene-container {
        width: 100%;
        height: 100%; /* Fill parent */
        background-color: #050505;
        overflow: hidden; /* Prevent spill */
    }
</style>
