<script lang="ts">
    import { T, useLoader } from "@threlte/core";
    import { MathUtils, TextureLoader } from "three";
    import { WGS84, getObliquity } from "../astronomy";

    export let x = 0;
    export let y = 0;
    export let z = 0;

    const texture = useLoader(TextureLoader).load("/earth_texture.png");

    const obliquityRad = MathUtils.degToRad(getObliquity());

    // WGS84 Scale: Flattening factor. Three.js spheres are 1 radius.
    // We scale Y axis (polar).
    // WGS84 flattening f = (a-b)/a. b = a(1-f).
    const scaleY = 1 - WGS84.flattening;
</script>

<T.Group position={[x, y, z]}>
    <!-- Axial Tilt: Earth is tilted relative to the orbital plane (Ecliptic).
         If we assume the scene world coordinates are Ecliptic coordinates (Z up? or Y up?),
         we need to rotate the Earth. 
         Usually in Astronomy, Z is North Ecliptic Pole. Earth travels in XY plane.
         But in Three.js, Y is usually up.
         Let's assume standard Three.js: Y is up (Ecliptic Pole). XZ is orbital plane.
         So we tilt the Earth's axis (Y) away from vertical by obliquity.
         Which direction? Toward/Away from Sun depends on season.
         Actually, the axis points to a fixed point in space (Polaris).
         The position of Earth changes, but rotation of Earth stays fixed in global space (roughly, ignoring precession).
         So we apply a fixed rotation to the Earth Group.
    -->
    {#if $texture}
        <!-- 
            In the new Ecliptic coordinate system:
            The Scene Y axis is the Ecliptic North Pole.
            The Orbit lies in the XZ plane.
            The Earth's Axis (North Celestial Pole) is tilted by ~23.4 degrees relative to the Ecliptic Pole.
            This tilt is in the plane defined by Solstices (approx YZ plane of J2000? No).
            Actually, the tilt is a rotation around the Vernal Equinox (X axis).
            So we rotate the Earth mesh around X by the obliquity.
        -->
        <T.Group rotation.x={obliquityRad} rotation.y={0}>
            <T.Mesh receiveShadow castShadow>
                <T.SphereGeometry args={[1, 64, 64]} />
                <T.MeshStandardMaterial
                    map={$texture}
                    metalness={0.1}
                    roughness={0.7}
                />
            </T.Mesh>

            <!-- Axis Visualizer (Pole) -->
            <T.Mesh position={[0, 1.2, 0]}>
                <T.CylinderGeometry args={[0.02, 0.02, 2.4]} />
                <T.MeshBasicMaterial color="white" />
            </T.Mesh>
        </T.Group>
    {/if}
</T.Group>
