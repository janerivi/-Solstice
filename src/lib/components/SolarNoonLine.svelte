<script lang="ts">
    import { T } from "@threlte/core";
    import { CatmullRomCurve3, Vector3, DoubleSide } from "three";
    import { getSeasons, getSubSolarLongitude } from "../astronomy";
    import { currentDate } from "../stores";
    import { MathUtils } from "three";

    // Create the semi-circle geometry (Meridian arc from North to South)
    // Radius 1.01 to float clearly above Earth surface (radius 1)
    const radius = 1.01;
    const points = [];
    for (let i = 0; i <= 32; i++) {
        const lat = MathUtils.degToRad(90 - (i / 32) * 180); // 90 to -90
        // Longitude 0 (Prime Meridian local to the rotated group)
        // x = r * cos(lat) * sin(0) = 0
        // y = r * sin(lat)
        // z = r * cos(lat) * cos(0) = r * cos(lat)
        // In Three.js: Y is up.
        // Lat moves from +Y (North) to -Y (South).
        // We want the line to point at +X (Vernal Equinox) when Rotation is 0.
        // x = r * cos(lat)
        // y = r * sin(lat)
        // z = 0
        const x = radius * Math.cos(lat);
        const y = radius * Math.sin(lat);
        points.push(new Vector3(x, y, 0));
    }
    const curve = new CatmullRomCurve3(points);

    // Logic for visibility
    $: seasons = getSeasons($currentDate.getFullYear());
    $: subSolarLon = getSubSolarLongitude($currentDate);

    // Calculate proximity and opacity
    function getOpacity(date: Date, events: any) {
        const dates = [
            events.marchEquinox.date,
            events.juneSolstice.date,
            events.sepEquinox.date,
            events.decSolstice.date,
        ];

        // Find closest event
        let minDiff = Infinity;
        for (const d of dates) {
            const diff = Math.abs(date.getTime() - d.getTime());
            if (diff < minDiff) minDiff = diff;
        }

        const window = 12 * 60 * 60 * 1000; // 12 hours
        if (minDiff > window) return 0;

        // Linear fade: 1 at 0 diff, 0 at 12h diff
        // Or squared for smoothness
        const t = 1 - minDiff / window;
        return Math.max(0, t); // Simple linear fade
    }

    $: opacity = getOpacity($currentDate, seasons);
    $: visible = opacity > 0.01;
    $: rotationY = MathUtils.degToRad(subSolarLon);
</script>

{#if visible}
    <T.Group rotation.y={rotationY}>
        <T.Mesh>
            <T.TubeGeometry args={[curve, 32, 0.005, 8, false]} />
            <T.MeshBasicMaterial
                color="#FFFF00"
                transparent
                {opacity}
                side={DoubleSide}
            />
        </T.Mesh>
    </T.Group>
{/if}
