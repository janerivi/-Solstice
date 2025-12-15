<script lang="ts">
    import { T, useLoader } from "@threlte/core";
    import { TextureLoader, Object3D } from "three";

    const texture = useLoader(TextureLoader).load("/sun_texture.png");
    export let earthPosition = { x: 0, y: 0, z: 0 };

    let target: Object3D;
</script>

<T.Group>
    <!-- Sun Mesh -->
    <T.Mesh castShadow={false} receiveShadow={false}>
        <T.SphereGeometry args={[1.5, 64, 64]} />
        <T.MeshStandardMaterial
            map={$texture || null}
            emissiveMap={$texture || null}
            emissive="white"
            emissiveIntensity={1}
            color="white"
        />
    </T.Mesh>

    <!-- Light Target (The Earth) -->
    <!-- We must add this to the scene so the light can track it -->
    <T.Object3D
        position={[earthPosition.x, earthPosition.y, earthPosition.z]}
        bind:ref={target}
    />

    <!-- Light Source -->
    {#if target}
        <T.DirectionalLight position={[0, 0, 0]} intensity={5} {target} />
    {/if}

    <!-- Faint ambient to prove scene exists, but Directional should dominate -->
    <T.AmbientLight intensity={0.05} />
</T.Group>
