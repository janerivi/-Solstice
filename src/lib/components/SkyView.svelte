<script lang="ts">
    import { currentDate, observerLocation, observerName } from "../stores";
    import { getSunPosition, getSunTimes } from "../astronomy";
    import { MAJOR_CITIES } from "../cities";
    import {
        formatLocalTime,
        getLocalMinutesFromMidnight,
        getLocalMidnightDate,
        getTimeZone,
    } from "../time";

    $: sunPos = getSunPosition($currentDate, $observerLocation);
    $: sunTimes = getSunTimes($currentDate, $observerLocation);

    // Calculate Azimuth for Sunrise and Sunset markers
    $: riseAz = sunTimes.sunrise
        ? getSunPosition(sunTimes.sunrise, $observerLocation).azimuth
        : null;
    $: setAz = sunTimes.sunset
        ? getSunPosition(sunTimes.sunset, $observerLocation).azimuth
        : null;

    $: selectedCity = MAJOR_CITIES.find(
        (c) =>
            Math.abs(c.lat - $observerLocation.lat) < 0.01 &&
            Math.abs(c.lon - $observerLocation.lon) < 0.01,
    );

    $: displayCityName =
        $observerName || (selectedCity ? selectedCity.name : null);

    $: timeZoneId = getTimeZone($observerLocation.lat, $observerLocation.lon);

    $: locationLabel = displayCityName
        ? `${displayCityName} (${$observerLocation.lat.toFixed(2)}°, ${$observerLocation.lon.toFixed(2)}°) [${timeZoneId}]`
        : `${$observerLocation.lat.toFixed(2)}°, ${$observerLocation.lon.toFixed(2)}° [${timeZoneId}]`;

    // Background interpolation
    $: dayIntensity = Math.min(
        Math.max(0, sunPos.altitude / (dayMaxAlt || 45)),
        1,
    );

    // Plot parameters
    const padding = { top: 20, right: 30, bottom: 30, left: 40 };

    let clientWidth = 300;
    let clientHeight = 150;
    // Scales
    // X-Axis: Time (0 to 24 hours in minutes) -> 0 to clientWidth
    $: scaleX = (minutes: number) =>
        padding.left +
        (minutes / (24 * 60)) * (clientWidth - padding.left - padding.right);

    // Generate Path Data and find Max/Min Altitude for the day
    let pathD = "";
    let maxAltPoint = { x: 0, y: 0, alt: -Infinity, az: 0, time: "" };
    let dayMaxAlt = 45; // Default safe max
    let dayMinAlt = -15; // Default safe min

    // --- REPLACED LOCAL TIME FUNCTIONS WITH IMPORTS ---

    $: {
        // Determine the start of the day relative to the observer's Time Zone
        // to ensure we plot 00:00 to 24:00 LOCAL time.
        const startOfDay = getLocalMidnightDate(
            $currentDate,
            $observerLocation.lat,
            $observerLocation.lon,
        );

        pathD = "";

        let currentMaxAlt = -90;
        let currentMinAlt = 90;

        // Iterate through day in 15 min intervals
        for (let m = 0; m <= 24 * 60; m += 15) {
            const time = new Date(startOfDay.getTime() + m * 60000);
            const pos = getSunPosition(time, $observerLocation);

            // Track Max/Min Alt for Auto-Scale
            if (pos.altitude > currentMaxAlt) currentMaxAlt = pos.altitude;
            if (pos.altitude < currentMinAlt) currentMinAlt = pos.altitude;
        }

        // dynamic range with some padding
        dayMaxAlt = Math.max(currentMaxAlt + 10, 20); // At least show up to 20 deg
        dayMinAlt = Math.min(currentMinAlt - 10, -25); // At least down to -25 for labels

        // Update scales
        // (Scales are updated reactively below via local vars)
    }

    // Scales updated to use dynamic dayMaxAlt/dayMinAlt
    $: minAlt = dayMinAlt;
    $: maxAlt = dayMaxAlt;

    $: scaleY = (deg: number) =>
        clientHeight -
        padding.bottom -
        ((deg - minAlt) / (maxAlt - minAlt)) *
            (clientHeight - padding.top - padding.bottom);

    // Sun X is now based on current time minutes
    $: sunX = scaleX(
        getLocalMinutesFromMidnight(
            $currentDate,
            $observerLocation.lat,
            $observerLocation.lon,
        ),
    );
    $: sunY = scaleY(sunPos.altitude);

    $: riseX = sunTimes.sunrise
        ? scaleX(
              getLocalMinutesFromMidnight(
                  sunTimes.sunrise,
                  $observerLocation.lat,
                  $observerLocation.lon,
              ),
          )
        : null;
    $: setX = sunTimes.sunset
        ? scaleX(
              getLocalMinutesFromMidnight(
                  sunTimes.sunset,
                  $observerLocation.lat,
                  $observerLocation.lon,
              ),
          )
        : null;

    $: horizonY = scaleY(0);

    // Re-calc Path and Markers with new scales
    $: {
        const startOfDay = getLocalMidnightDate(
            $currentDate,
            $observerLocation.lat,
            $observerLocation.lon,
        );

        pathD = "";
        let segmentStart = true;

        for (let m = 0; m <= 24 * 60; m += 15) {
            const time = new Date(startOfDay.getTime() + m * 60000);
            const pos = getSunPosition(time, $observerLocation);

            const x = scaleX(m); // X is Time (minutes)
            const y = scaleY(pos.altitude);

            if (segmentStart) {
                pathD += `M ${x} ${y}`;
                segmentStart = false;
            } else {
                pathD += ` L ${x} ${y}`;
            }
        }

        if (sunTimes.solarNoon) {
            const time = sunTimes.solarNoon;
            const pos = getSunPosition(time, $observerLocation);
            const x = scaleX(
                getLocalMinutesFromMidnight(
                    time,
                    $observerLocation.lat,
                    $observerLocation.lon,
                ),
            );
            const y = scaleY(pos.altitude);

            maxAltPoint = {
                x,
                y,
                alt: pos.altitude,
                az: pos.azimuth,
                time: formatLocalTime(
                    time,
                    $observerLocation.lat,
                    $observerLocation.lon,
                    true,
                ),
            };
        }
    }
</script>

<div class="sky-view-container" bind:clientWidth bind:clientHeight>
    <h4>Horizon View</h4>
    <div class="location-label">{locationLabel}</div>
    <svg width="100%" height="100%">
        <!-- Gradient Definition -->
        <defs>
            <linearGradient id="nightGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="#000022" />
                <stop offset="100%" stop-color="#111" />
            </linearGradient>
            <linearGradient id="dayGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stop-color="#4a90e2" />
                <stop offset="100%" stop-color="#87CEEB" />
            </linearGradient>
        </defs>

        <!-- Background Layers -->
        <!-- Night Layer (Always there, bottom) -->
        <rect
            x={padding.left}
            y={padding.top}
            width={Math.max(0, clientWidth - padding.left - padding.right)}
            height={Math.max(0, clientHeight - padding.top - padding.bottom)}
            fill="url(#nightGradient)"
            stroke="#444"
        />

        <!-- Day Layer (Fades in) -->
        <rect
            x={padding.left}
            y={padding.top}
            width={Math.max(0, clientWidth - padding.left - padding.right)}
            height={Math.max(0, clientHeight - padding.top - padding.bottom)}
            fill="url(#dayGradient)"
            opacity={dayIntensity}
        />

        <!-- Horizon Line (0 deg Alt) -->
        <line
            x1={padding.left}
            y1={horizonY}
            x2={clientWidth - padding.right}
            y2={horizonY}
            stroke="#888"
            stroke-width="1"
            stroke-dasharray="4"
        />

        <!-- Grid/Labels X (Time) -->
        {#each [0, 6, 12, 18, 24] as hr}
            <line
                x1={scaleX(hr * 60)}
                y1={clientHeight - padding.bottom}
                x2={scaleX(hr * 60)}
                y2={clientHeight - padding.bottom + 5}
                stroke="#666"
            />
            <text
                x={scaleX(hr * 60)}
                y={clientHeight - 5}
                font-size="11"
                fill="#aaa"
                text-anchor="middle"
                font-weight="bold">{hr.toString().padStart(2, "0")}:00</text
            >
        {/each}

        <!-- Labels Y (Altitude) -->
        <!-- We generate ticks every 30 degrees, ensuring 0 is included -->
        {#each [-90, -60, -30, 0, 30, 60, 90] as alt}
            {#if alt >= minAlt && alt <= maxAlt}
                <text
                    x={padding.left - 5}
                    y={scaleY(alt) + 3}
                    font-size="11"
                    fill="#aaa"
                    text-anchor="end">{alt}°</text
                >
                <line
                    x1={padding.left - 3}
                    y1={scaleY(alt)}
                    x2={padding.left}
                    y2={scaleY(alt)}
                    stroke="#666"
                />
            {/if}
        {/each}

        <!-- Sun Path Curve -->
        <path
            d={pathD}
            fill="none"
            stroke="yellow"
            stroke-width="2"
            opacity="0.6"
        />

        <!-- Max Altitude Marker -->
        {#if maxAltPoint.alt > -Infinity}
            <line
                x1={maxAltPoint.x}
                y1={maxAltPoint.y}
                x2={maxAltPoint.x}
                y2={scaleY(-10)}
                stroke="yellow"
                stroke-dasharray="2 2"
                opacity="0.6"
            />
            <text
                x={maxAltPoint.x}
                y={maxAltPoint.y - 12}
                font-size="12"
                fill="yellow"
                text-anchor="middle"
                font-weight="bold">Max: {maxAltPoint.alt.toFixed(2)}°</text
            >
            <text
                x={maxAltPoint.x}
                y={maxAltPoint.y - 2}
                font-size="11"
                fill="#ffdd00"
                text-anchor="middle">@{maxAltPoint.time}</text
            >
        {/if}

        <!-- Sunrise Marker -->
        {#if riseX !== null}
            <line
                x1={riseX}
                y1={scaleY(90)}
                x2={riseX}
                y2={scaleY(-10)}
                stroke="orange"
                stroke-dasharray="2"
                opacity="0.5"
            />
            <text
                x={riseX}
                y={scaleY(5)}
                font-size="11"
                fill="orange"
                text-anchor="middle"
                dy="-5">Rise</text
            >
            <text
                x={riseX}
                y={scaleY(0)}
                font-size="11"
                fill="orange"
                text-anchor="middle"
                dy="8"
                >{formatLocalTime(
                    sunTimes.sunrise,
                    $observerLocation.lat,
                    $observerLocation.lon,
                )}</text
            >
            <text
                x={riseX}
                y={scaleY(0)}
                font-size="10"
                fill="#aaa"
                text-anchor="middle"
                dy="20">Az: {riseAz?.toFixed(2)}°</text
            >
        {/if}

        <!-- Sunset Marker -->
        {#if setX !== null}
            <line
                x1={setX}
                y1={scaleY(90)}
                x2={setX}
                y2={scaleY(-10)}
                stroke="orange"
                stroke-dasharray="2"
                opacity="0.5"
            />
            <text
                x={setX}
                y={scaleY(5)}
                font-size="11"
                fill="orange"
                text-anchor="middle"
                dy="-5">Set</text
            >
            <text
                x={setX}
                y={scaleY(0)}
                font-size="11"
                fill="orange"
                text-anchor="middle"
                dy="8"
                >{formatLocalTime(
                    sunTimes.sunset,
                    $observerLocation.lat,
                    $observerLocation.lon,
                )}</text
            >
            <text
                x={setX}
                y={scaleY(0)}
                font-size="10"
                fill="#aaa"
                text-anchor="middle"
                dy="20">Az: {setAz?.toFixed(2)}°</text
            >
        {/if}

        <!-- Sun -->
        <circle
            cx={sunX}
            cy={sunY}
            r={sunPos.altitude > 0 ? 6 : 4}
            fill="yellow"
            stroke="orange"
            stroke-width="2"
        />
    </svg>
    <div class="info">
        <span>Az: {sunPos.azimuth.toFixed(2)}°</span>
        <span>Alt: {sunPos.altitude.toFixed(2)}°</span>
        <span style="color: yellow;"
            >Time: {formatLocalTime(
                $currentDate,
                $observerLocation.lat,
                $observerLocation.lon,
            )} (Local ({getTimeZone(
                $observerLocation.lat,
                $observerLocation.lon,
            )}))</span
        >
    </div>
</div>

<style>
    .sky-view-container {
        background: rgba(0, 0, 0, 0.7);
        backdrop-filter: blur(10px);
        text-align: center;
        color: #eee;
        font-family: "Inter", sans-serif;
        width: 100%;
        height: 100%;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
    }
    h4 {
        margin: 5px 0 2px 0;
        font-weight: 400;
        font-size: 0.9em;
    }
    .location-label {
        font-size: 0.75em;
        color: #aaa;
        margin-bottom: 5px;
    }
    svg {
        flex: 1;
        width: 100%;
    }
    .info {
        display: flex;
        justify-content: space-around;
        font-size: 0.8em;
        margin-top: 2px;
        color: #ccc;
    }
</style>
