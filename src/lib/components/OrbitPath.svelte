<script lang="ts">
    import { T } from "@threlte/core";
    import { BufferGeometry, Vector3, CatmullRomCurve3 } from "three";
    import { getEarthOrbitPosition } from "../astronomy";

    export let year: number = 2025;

    // Use a stable instance to prevent flickering/unmounting
    const geometry = new BufferGeometry();

    // Calculate orbit path for the year
    $: {
        const pts: Vector3[] = [];
        // Sample every 5 days to get a smooth curve
        // We use 366 to cover leap years safely and ensure closure
        for (let d = 0; d <= 366; d += 5) {
            const date = new Date(year, 0, d); // Jan 1st + d days
            const pos = getEarthOrbitPosition(date);
            // Mapping: Astro Z -> Three Y (Up), Astro X -> Three X, Astro Y -> Three -Z
            pts.push(new Vector3(pos.x, pos.z, -pos.y).multiplyScalar(10));
        }

        if (pts.length > 0) {
            // Close the loop (approx)
            pts.push(pts[0]);

            const curve = new CatmullRomCurve3(pts);
            const points = curve.getPoints(100);
            geometry.setFromPoints(points);
            // Hint that an update occurred (though setFromPoints usually handles this)
            // geometry.attributes.position.needsUpdate = true;
        }
    }
</script>

<T.Line {geometry}>
    <T.LineBasicMaterial
        color="white"
        opacity={0.3}
        transparent
        linewidth={1}
    />
</T.Line>
