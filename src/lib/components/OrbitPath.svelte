<script lang="ts">
    import { T } from "@threlte/core";
    import { BufferGeometry, Vector3, CatmullRomCurve3 } from "three";
    import { getEarthOrbitPosition } from "../astronomy";

    export let year: number = 2025;

    let geometry = new BufferGeometry();

    // Calculate orbit path for the year
    $: {
        const pts: Vector3[] = [];
        // Sample every 5 days to get a smooth curve
        for (let d = 0; d <= 365; d += 5) {
            const date = new Date(year, 0, d); // Jan 1st + d days
            const pos = getEarthOrbitPosition(date);
            // Mapping: Astro Z -> Three Y (Up), Astro X -> Three X, Astro Y -> Three -Z
            pts.push(new Vector3(pos.x, pos.z, -pos.y).multiplyScalar(10));
        }

        if (pts.length > 0) {
            // Close the loop (approx)
            pts.push(pts[0]);

            const curve = new CatmullRomCurve3(pts);
            geometry = new BufferGeometry().setFromPoints(curve.getPoints(100));
        }
    }
</script>

<T.Line>
    {#key geometry}
        <!-- Re-render geometry when it changes -->
        <T.BufferGeometry {...geometry} />
    {/key}
    <T.LineBasicMaterial color="white" opacity={0.8} transparent />
</T.Line>
