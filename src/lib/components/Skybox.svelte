<script lang="ts">
    import { T, useLoader } from "@threlte/core";
    import {
        TextureLoader,
        BackSide,
        MeshBasicMaterial,
        SphereGeometry,
        ClampToEdgeWrapping,
    } from "three";

    import { cameraMode } from "../stores";

    const skyTexture = useLoader(TextureLoader).load("/milky_way.jpg");

    // Explicitly disable repeating in case it was cached from previous HMR
    $: if ($skyTexture) {
        $skyTexture.wrapS = ClampToEdgeWrapping;
        $skyTexture.wrapT = ClampToEdgeWrapping;
        $skyTexture.repeat.set(1, 1);
        $skyTexture.needsUpdate = true;
    }

    let scale = 1;
    $: if ($cameraMode === "orthographic") {
        // Shrink sphere to increase texture density on screen
        // Camera is at dist ~45, so radius 25 ensures we are inside
        scale = 0.08; // 500 * 0.05 = 25
    } else {
        scale = 1; // 500
    }
</script>

{#if $skyTexture}
    <T.Mesh {scale}>
        <T.SphereGeometry args={[500, 60, 40]} />
        <T.MeshBasicMaterial
            map={$skyTexture}
            side={BackSide}
            color="#444444"
        />
    </T.Mesh>
{/if}
