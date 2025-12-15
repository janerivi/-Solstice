<script lang="ts">
    import { T, useLoader } from "@threlte/core";
    import { TextureLoader } from "three";

    const texture = useLoader(TextureLoader).load("/sun_texture.png");
</script>

{#if $texture}
    <T.Group>
        <!-- Sun Mesh -->
        <T.Mesh>
            <T.SphereGeometry args={[1.5, 64, 64]} />
            <T.MeshStandardMaterial
                map={$texture}
                emissiveMap={$texture}
                emissive="white"
                emissiveIntensity={1}
                color="white"
            />
        </T.Mesh>

        <!-- Light Source -->
        <T.PointLight intensity={2} distance={0} decay={0} castShadow />
        <T.AmbientLight intensity={0.1} />
    </T.Group>
{/if}
