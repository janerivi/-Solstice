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

    import { Text } from "@threlte/extras";
</script>

<T.Group>
    <!-- Solstices (Orange/Red) -->
    <T.Line geometry={junSolGeo}>
        <T.LineBasicMaterial color="#FF5722" />
    </T.Line>
    <Text
        text={`Summer Solstice\n${junDist.toFixed(3)} AU`}
        position={[
            junSolGeo.getAttribute("position").getX(1),
            2,
            junSolGeo.getAttribute("position").getZ(1),
        ]}
        color="#FF5722"
        fontSize={0.8}
        anchorX="center"
        anchorY="bottom"
        billboard
    />

    <T.Line geometry={decSolGeo}>
        <T.LineBasicMaterial color="#FF5722" />
    </T.Line>
    <Text
        text={`Winter Solstice\n${decDist.toFixed(3)} AU`}
        position={[
            decSolGeo.getAttribute("position").getX(1),
            2,
            decSolGeo.getAttribute("position").getZ(1),
        ]}
        color="#FF5722"
        fontSize={0.8}
        anchorX="center"
        anchorY="bottom"
        billboard
    />

    <!-- Equinoxes (Green/Teal) -->
    <T.Line geometry={marEqGeo}>
        <T.LineBasicMaterial color="#00BCD4" />
    </T.Line>
    <Text
        text={`Spring Equinox\n${marDist.toFixed(3)} AU`}
        position={[
            marEqGeo.getAttribute("position").getX(1),
            2,
            marEqGeo.getAttribute("position").getZ(1),
        ]}
        color="#00BCD4"
        fontSize={0.8}
        anchorX="center"
        anchorY="bottom"
        billboard
    />

    <T.Line geometry={sepEqGeo}>
        <T.LineBasicMaterial color="#00BCD4" />
    </T.Line>
    <Text
        text={`Autumn Equinox\n${sepDist.toFixed(3)} AU`}
        position={[
            sepEqGeo.getAttribute("position").getX(1),
            2,
            sepEqGeo.getAttribute("position").getZ(1),
        ]}
        color="#00BCD4"
        fontSize={0.8}
        anchorX="center"
        anchorY="bottom"
        billboard
    />

    <!-- Perihelion/Aphelion (Dashed White) -->
    <T.Line geometry={perihGeo}>
        <T.LineDashedMaterial
            color="white"
            dashSize={0.5}
            gapSize={0.2}
            scale={1}
        />
    </T.Line>
    <Text
        text={`Perihelion (Min)\n${perihDist.toFixed(4)} AU`}
        position={[
            perihGeo.getAttribute("position").getX(1),
            -1,
            perihGeo.getAttribute("position").getZ(1),
        ]}
        color="white"
        fontSize={0.6}
        anchorX="center"
        anchorY="top"
        billboard
    />

    <T.Line geometry={aphGeo}>
        <T.LineDashedMaterial
            color="white"
            dashSize={0.5}
            gapSize={0.2}
            scale={1}
        />
    </T.Line>
    <Text
        text={`Aphelion (Max)\n${aphDist.toFixed(4)} AU`}
        position={[
            aphGeo.getAttribute("position").getX(1),
            -1,
            aphGeo.getAttribute("position").getZ(1),
        ]}
        color="white"
        fontSize={0.6}
        anchorX="center"
        anchorY="top"
        billboard
    />
</T.Group>
