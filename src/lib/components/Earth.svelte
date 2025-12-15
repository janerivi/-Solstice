<script lang="ts">
    import { T, useLoader } from "@threlte/core";
    import { MathUtils, TextureLoader, AdditiveBlending } from "three";
    import { WGS84, getObliquity, getEarthRotation } from "../astronomy";
    import { currentDate, observerLocation } from "../stores";
    import SolarNoonLine from "./SolarNoonLine.svelte";

    export let x = 0;
    export let y = 0;
    export let z = 0;

    const texture = useLoader(TextureLoader).load("/earth_daymap.jpg");
    const bumpMap = useLoader(TextureLoader).load("/earth_topology.png");
    const specularMap = useLoader(TextureLoader).load("/earth_specular.jpg");
    const clouds = useLoader(TextureLoader).load("/earth_clouds.jpg");

    const obliquityRad = MathUtils.degToRad(getObliquity());

    // Calculate rotation based on Sidereal Time
    // Three.js Y rotation +Z is 0?
    // Earth rotates counter-clockwise viewed from North.
    $: rotationY = getEarthRotation($currentDate);
    // Clouds rotate slower: 25h period. (Earth is ~23.93h).
    // Avoid jump by using continuous time modulo period.
    // Date.getTime() is ms. 25h = 25 * 3600 * 1000 ms.
    const cloudPeriodMs = 25 * 60 * 60 * 1000;
    $: cloudRotationY =
        (($currentDate.getTime() % cloudPeriodMs) / cloudPeriodMs) *
        Math.PI *
        2;

    // Marker Position Logic

    // Marker Position Logic

    // 1. Texture Calibration Offsets (Degrees)
    // Use these to manually shift the marker if the texture map is not perfectly aligned.
    const latTextureOffset = 0.0;
    const lonTextureOffset = 0.0;

    $: latRad = MathUtils.degToRad($observerLocation.lat + latTextureOffset);
    $: lonRad = MathUtils.degToRad(
        $observerLocation.lon + 90 + lonTextureOffset,
    );

    // 2. Geodetic to Parametric Latitude Conversion (WGS84)
    // This accounts for the Earth's flattening (oblate spheroid).
    // The mesh is scaled by (1-f) in Y. To place the marker on the *surface* of this
    // flattened mesh at the correct *Geodetic* latitude, we must use the Parametric Latitude (beta).
    // Relation: tan(beta) = (1-f) * tan(geodetic_lat)

    const f = WGS84.flattening;
    const scaleY = 1 - f;

    // Calculate Parametric Latitude (beta)
    $: beta = Math.atan(scaleY * Math.tan(latRad));

    // 3. Cartesian Coordinates on Unit Sphere (using Parametric Angle)
    // When scaled by parent [1, scaleY, 1], this lands on the ellipsoid surface.
    $: markerY = Math.sin(beta);
    $: r = Math.cos(beta);
    $: markerX = r * Math.sin(lonRad);
    $: markerZ = r * Math.cos(lonRad);

    // WGS84 Scale: Flattening scale for the Earth mesh
</script>

<T.Group position={[x, y, z]}>
    <!-- Axial Tilt: Earth is tilted relative to the orbital plane (Ecliptic).
         The inner group is tilted by obliquity.
         We apply the daily rotation around the Y axis of this TILTED group.
    -->
    {#if $texture && $bumpMap && $clouds && $specularMap}
        <T.Group rotation.x={obliquityRad} rotation.y={rotationY}>
            <T.Mesh receiveShadow castShadow scale={[1, scaleY, 1]}>
                <T.SphereGeometry args={[1, 64, 64]} />
                <T.MeshStandardMaterial
                    map={$texture}
                    bumpMap={$bumpMap}
                    bumpScale={0.05}
                    roughnessMap={$bumpMap}
                    metalnessMap={$specularMap}
                    metalness={0.6}
                    roughness={4}
                />
            </T.Mesh>

            <!-- Location Marker (Child of Earth Mesh group) -->
            <T.Mesh
                scale={[1, scaleY, 1]}
                position={[markerX * 1.005, markerY * 1.005, markerZ * 1.005]}
            >
                <T.SphereGeometry args={[0.02, 16, 16]} />
                <T.MeshBasicMaterial color="red" />
            </T.Mesh>

            <!-- Axis Visualizer (Pole) -->
            <T.Mesh position={[0, 1.2, 0]}>
                <T.CylinderGeometry args={[0.02, 0.02, 2.4]} />
                <T.MeshBasicMaterial color="white" />
            </T.Mesh>

            <!-- Solar Noon Line (Visualizer for events) -->
            <SolarNoonLine />
        </T.Group>

        <!-- Cloud Layer Group - Same Tilt, Different Rotation -->
        <T.Group rotation.x={obliquityRad} rotation.y={cloudRotationY}>
            <T.Mesh scale={[1.02, 1.02 * scaleY, 1.02]}>
                <T.SphereGeometry args={[1, 64, 64]} />
                <T.MeshStandardMaterial
                    map={$clouds}
                    transparent
                    opacity={0.95}
                    blending={AdditiveBlending}
                />
            </T.Mesh>
        </T.Group>
    {/if}
</T.Group>
