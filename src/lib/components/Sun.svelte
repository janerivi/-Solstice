<script lang="ts">
    import { T, useLoader } from "@threlte/core";
    import { TextureLoader, Object3D } from "three";

    const texture = useLoader(TextureLoader).load("/sun_texture.png");
    export let earthPosition = { x: 0, y: 0, z: 0 };

    let target: Object3D;
</script>

<T.Group>
    <!-- Sun Mesh (Only render when texture is ready) -->
    {#if $texture}
        <T.Mesh castShadow={false} receiveShadow={false}>
            <T.SphereGeometry args={[1.5, 64, 64]} />
            <T.MeshBasicMaterial
                map={$texture}
                color="white"
                toneMapped={false}
            />
        </T.Mesh>
    {/if}

    <!-- Light Target (The Earth) -->
    <!-- We must add this to the scene so the light can track it -->
    <T.Object3D
        position={[earthPosition.x, earthPosition.y, earthPosition.z]}
        bind:ref={target}
    />

    <!-- Light Source -->
    {#if target}
        <T.DirectionalLight position={[0, 0, 0]} intensity={8} {target} />
    {/if}
</T.Group>
