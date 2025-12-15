<script lang="ts">
    import { T } from "@threlte/core";
    import { Vector3, BufferGeometry, LineBasicMaterial } from "three";
    import { getSeasons, getApsis, getEarthOrbitPosition } from "../astronomy";

    export let year: number = 2025;

    // We want to draw lines from Sun (0,0,0) to Earth Position at specific dates.

    $: seasons = getSeasons(year);
    $: apsis = getApsis(year);

    function getLineGeometry(date: Date) {
        if (!date) return new BufferGeometry();
        const pos = getEarthOrbitPosition(date);
        // Mapping: Z->Y, X->X, Y->-Z. Scale 10.
        const p = new Vector3(pos.x, pos.z, -pos.y).multiplyScalar(10);
        return new BufferGeometry().setFromPoints([new Vector3(0, 0, 0), p]);
    }

    $: marEqGeo = getLineGeometry(seasons.marchEquinox.date);
    $: junSolGeo = getLineGeometry(seasons.juneSolstice.date);
    $: sepEqGeo = getLineGeometry(seasons.sepEquinox.date);
    $: decSolGeo = getLineGeometry(seasons.decSolstice.date);

    $: perihGeo = getLineGeometry(apsis.perihelion);
    $: aphGeo = getLineGeometry(apsis.aphelion);
    // Helper to calculate distance in AU
    function getDistance(date: Date) {
        const d = getEarthOrbitPosition(date);
        return Math.sqrt(d.x * d.x + d.y * d.y + d.z * d.z); // This is in AU based on astronomy.ts
    }

    $: marDist = getDistance(seasons.marchEquinox.date);
    $: junDist = getDistance(seasons.juneSolstice.date);
    $: sepDist = getDistance(seasons.sepEquinox.date);
    $: decDist = getDistance(seasons.decSolstice.date);

    $: perihDist = getDistance(apsis.perihelion);
    $: aphDist = getDistance(apsis.aphelion);

    import BillboardText from "./BillboardText.svelte";
    import { currentDate } from "../stores";

    // Helper: Calculate oscillation factor based on time proximity
    // ...
    function getOscillation(targetDate: Date, current: Date) {
        const diff = Math.abs(current.getTime() - targetDate.getTime());
        const window = 12 * 60 * 60 * 1000; // 12 hours

        if (diff > window) return { width: 1, colorScalar: 1, scale: 1 };

        // Linear interpolation from edge (0) to center (1)
        const proximity = Math.pow(1 - diff / window, 2);

        return {
            width: 1 + proximity * 5, // 1 to 6
            colorScalar: 1 + proximity * 1, // 1x to 2x brightness (conceptually)
            scale: 1 + proximity * 0.5, // Text/Marker scale
        };
    }

    $: marOsc = getOscillation(seasons.marchEquinox.date, $currentDate);
    $: junOsc = getOscillation(seasons.juneSolstice.date, $currentDate);
    $: sepOsc = getOscillation(seasons.sepEquinox.date, $currentDate);
    $: decOsc = getOscillation(seasons.decSolstice.date, $currentDate);
</script>

<T.Group>
    <!-- Solstices (Orange/Red) -->
    <!-- June -->
    <T.Line geometry={junSolGeo}>
        <T.LineBasicMaterial color="#FF5722" linewidth={junOsc.width} />
    </T.Line>
    {#if junOsc.width > 1.5}
        <T.Mesh
            position={[
                junSolGeo.getAttribute("position").getX(1),
                0,
                junSolGeo.getAttribute("position").getZ(1),
            ]}
        >
            <T.SphereGeometry args={[0.05 * junOsc.width, 16, 16]} />
            <T.MeshBasicMaterial color="#FF5722" transparent opacity={0.5} />
        </T.Mesh>
    {/if}
    <BillboardText
        text={`Summer Solstice\n${junDist.toFixed(3)} AU`}
        position={[
            junSolGeo.getAttribute("position").getX(1),
            2,
            junSolGeo.getAttribute("position").getZ(1),
        ]}
        color="#FF5722"
        fontSize={0.4 * junOsc.scale}
        anchorX="center"
        anchorY="bottom"
        on:click={() => currentDate.set(seasons.juneSolstice.date)}
    />

    <!-- December -->
    <T.Line geometry={decSolGeo}>
        <T.LineBasicMaterial color="#FF5722" linewidth={decOsc.width} />
    </T.Line>
    {#if decOsc.width > 1.5}
        <T.Mesh
            position={[
                decSolGeo.getAttribute("position").getX(1),
                0,
                decSolGeo.getAttribute("position").getZ(1),
            ]}
        >
            <T.SphereGeometry args={[0.05 * decOsc.width, 16, 16]} />
            <T.MeshBasicMaterial color="#FF5722" transparent opacity={0.5} />
        </T.Mesh>
    {/if}
    <BillboardText
        text={`Winter Solstice\n${decDist.toFixed(3)} AU`}
        position={[
            decSolGeo.getAttribute("position").getX(1),
            2,
            decSolGeo.getAttribute("position").getZ(1),
        ]}
        color="#FF5722"
        fontSize={0.4 * decOsc.scale}
        anchorX="center"
        anchorY="bottom"
        on:click={() => currentDate.set(seasons.decSolstice.date)}
    />

    <!-- Equinoxes (Green/Teal) -->
    <!-- March -->
    <T.Line geometry={marEqGeo}>
        <T.LineBasicMaterial color="#00BCD4" linewidth={marOsc.width} />
    </T.Line>
    {#if marOsc.width > 1.5}
        <T.Mesh
            position={[
                marEqGeo.getAttribute("position").getX(1),
                0,
                marEqGeo.getAttribute("position").getZ(1),
            ]}
        >
            <T.SphereGeometry args={[0.05 * marOsc.width, 16, 16]} />
            <T.MeshBasicMaterial color="#00BCD4" transparent opacity={0.5} />
        </T.Mesh>
    {/if}
    <BillboardText
        text={`Spring Equinox\n${marDist.toFixed(3)} AU`}
        position={[
            marEqGeo.getAttribute("position").getX(1),
            2,
            marEqGeo.getAttribute("position").getZ(1),
        ]}
        color="#00BCD4"
        fontSize={0.4 * marOsc.scale}
        anchorX="center"
        anchorY="bottom"
        on:click={() => currentDate.set(seasons.marchEquinox.date)}
    />

    <!-- September -->
    <T.Line geometry={sepEqGeo}>
        <T.LineBasicMaterial color="#00BCD4" linewidth={sepOsc.width} />
    </T.Line>
    {#if sepOsc.width > 1.5}
        <T.Mesh
            position={[
                sepEqGeo.getAttribute("position").getX(1),
                0,
                sepEqGeo.getAttribute("position").getZ(1),
            ]}
        >
            <T.SphereGeometry args={[0.05 * sepOsc.width, 16, 16]} />
            <T.MeshBasicMaterial color="#00BCD4" transparent opacity={0.5} />
        </T.Mesh>
    {/if}
    <BillboardText
        text={`Autumn Equinox\n${sepDist.toFixed(3)} AU`}
        position={[
            sepEqGeo.getAttribute("position").getX(1),
            2,
            sepEqGeo.getAttribute("position").getZ(1),
        ]}
        color="#00BCD4"
        fontSize={0.4 * sepOsc.scale}
        anchorX="center"
        anchorY="bottom"
        on:click={() => currentDate.set(seasons.sepEquinox.date)}
    />

    <!-- Perihelion/Aphelion -->
    <T.Line geometry={perihGeo}>
        <T.LineDashedMaterial
            color="white"
            dashSize={0.5}
            gapSize={0.2}
            scale={1}
        />
    </T.Line>
    <BillboardText
        text={`Perihelion (Min)\n${perihDist.toFixed(4)} AU`}
        position={[
            perihGeo.getAttribute("position").getX(1),
            -1,
            perihGeo.getAttribute("position").getZ(1),
        ]}
        color="white"
        fontSize={0.3}
        anchorX="center"
        anchorY="top"
        on:click={() => currentDate.set(apsis.perihelion)}
    />
    <T.Line geometry={aphGeo}>
        <T.LineDashedMaterial
            color="white"
            dashSize={0.5}
            gapSize={0.2}
            scale={1}
        />
    </T.Line>
    <BillboardText
        text={`Aphelion (Max)\n${aphDist.toFixed(4)} AU`}
        position={[
            aphGeo.getAttribute("position").getX(1),
            -1,
            aphGeo.getAttribute("position").getZ(1),
        ]}
        color="white"
        fontSize={0.3}
        anchorX="center"
        anchorY="top"
        on:click={() => currentDate.set(apsis.aphelion)}
    />
</T.Group>
