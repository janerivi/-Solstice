<script lang="ts">
    import { T, useLoader } from "@threlte/core";
    import { MathUtils, TextureLoader } from "three";
    import { WGS84, getObliquity, getEarthRotation } from "../astronomy";
    import { currentDate, observerLocation } from "../stores";

    export let x = 0;
    export let y = 0;
    export let z = 0;

    const texture = useLoader(TextureLoader).load("/earth_texture.png");

    const obliquityRad = MathUtils.degToRad(getObliquity());

    // Calculate rotation based on Sidereal Time
    // Three.js Y rotation +Z is 0?
    // Earth rotates counter-clockwise viewed from North.
    $: rotationY = getEarthRotation($currentDate);

    // Marker Position Logic

    // Marker Position Logic

    // Analysis strongly suggests the texture is WEB MERCATOR (not Plate Carrée).
    // Symptom: Linear Lat (Plate Carrée) is "Too North" for London (51N).
    // Explanation: Mercator stretches poles to infinity, so it "squashes" mid-latitudes
    // nearer to the equator (relative to the full square map) compared to Linear.
    // We must map Geodetic Latitude -> Mercator V -> Sphere Angle.

    $: latRad = MathUtils.degToRad($observerLocation.lat);
    $: lonRad = MathUtils.degToRad($observerLocation.lon + 90);

    // 1. Calculate Web Mercator Y (radians), clipped to standard range [-PI, PI]
    // maxLat = 85.051129 deg
    function getMercatorY(latR: number) {
        // Clamp to max lat to avoid infinity
        const maxLat = 85.05 * (Math.PI / 180);
        const l = Math.max(Math.min(latR, maxLat), -maxLat);
        return Math.log(Math.tan(Math.PI / 4 + l / 2));
    }

    $: mercatorY = getMercatorY(latRad);

    // 2. Normalize to V [0, 1] assuming square map (Range [-PI, PI])
    $: v = 0.5 + mercatorY / (2 * Math.PI);

    // 3. Map V to Sphere Angle (Theta)
    // Sphere maps V=0 to South Pole (-PI/2), V=1 to North Pole (+PI/2)
    // theta = (v - 0.5) * PI
    $: theta = (v - 0.5) * Math.PI;

    // 4. Cartesian on UNIT Sphere (using Mercator-corrected angle)
    // Note: theta is visual vertical angle from Equator (-PI/2 to PI/2)
    $: markerY = Math.sin(theta);
    $: r = Math.cos(theta);
    $: markerX = r * Math.sin(lonRad);
    $: markerZ = r * Math.cos(lonRad);

    // WGS84 Scale: Flattening factor. Three.js spheres are 1 radius.
    const f = WGS84.flattening;
    const scaleY = 1 - f;
</script>

<T.Group position={[x, y, z]}>
    <!-- Axial Tilt: Earth is tilted relative to the orbital plane (Ecliptic).
         The inner group is tilted by obliquity.
         We apply the daily rotation around the Y axis of this TILTED group.
    -->
    {#if $texture}
        <T.Group rotation.x={obliquityRad} rotation.y={rotationY}>
            <T.Mesh receiveShadow castShadow scale={[1, scaleY, 1]}>
                <T.SphereGeometry args={[1, 64, 64]} />
                <T.MeshStandardMaterial
                    map={$texture}
                    metalness={0.1}
                    roughness={0.7}
                />

                <!-- Location Marker (Child of Earth Mesh) -->
                <!-- Inherits scaleY, guaranteeing alignment with texture latitude -->
                <!-- Radius 1.005 to sit just above surface -->
                <T.Mesh
                    position={[
                        markerX * 1.005,
                        markerY * 1.005,
                        markerZ * 1.005,
                    ]}
                >
                    <T.SphereGeometry args={[0.02, 16, 16]} />
                    <T.MeshBasicMaterial color="red" />
                </T.Mesh>
            </T.Mesh>

            <!-- Axis Visualizer (Pole) -->
            <T.Mesh position={[0, 1.2, 0]}>
                <T.CylinderGeometry args={[0.02, 0.02, 2.4]} />
                <T.MeshBasicMaterial color="white" />
            </T.Mesh>
        </T.Group>
    {/if}
</T.Group>
