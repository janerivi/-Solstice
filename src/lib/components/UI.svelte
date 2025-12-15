<script lang="ts">
  import {
    currentDate,
    isPlaying,
    timeSpeed,
    observerLocation,
    observerName,
    viewMode,
    cameraMode,
  } from "../stores";
  import { getSunTimes, getSeasons } from "../astronomy";
  import SkyView from "./SkyView.svelte";
  import CitySearch from "./CitySearch.svelte";

  // Format date for display
  $: formattedDate = $currentDate.toLocaleString();
  $: sunTimes = getSunTimes($currentDate, $observerLocation);
  // Timeline Logic
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Year boundaries
  $: yearStart = new Date($currentDate.getFullYear(), 0, 1).getTime();
  // Exact start of next year for full coverage
  $: yearEnd = new Date($currentDate.getFullYear() + 1, 0, 1).getTime();
  $: totalYearMs = yearEnd - yearStart;

  function getMonthPosition(monthIndex: number) {
    const start = new Date($currentDate.getFullYear(), monthIndex, 1).getTime();
    return ((start - yearStart) / totalYearMs) * 100;
  }

  function getEventPercent(date: Date) {
    return ((date.getTime() - yearStart) / totalYearMs) * 100;
  }
  $: seasons = getSeasons($currentDate.getFullYear());

  // Generate ticks for every day
  // We calculated this reactively to year
  $: dayTicks = (() => {
    const year = $currentDate.getFullYear();
    const ticks = [];
    const start = new Date(year, 0, 1).getTime();
    const end = new Date(year + 1, 0, 1).getTime();
    const total = end - start;

    let d = new Date(year, 0, 1);
    while (d.getFullYear() === year) {
      const pos = ((d.getTime() - start) / total) * 100;
      // Tick type: 0=normal, 1=month-start (handled by div but we can add minor emphasis)
      ticks.push(pos);
      d.setDate(d.getDate() + 1);
    }
    return ticks;
  })();

  function togglePlay() {
    isPlaying.update((v) => !v);
  }

  function handleDateChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const d = new Date(target.value);
    if (!isNaN(d.getTime())) {
      currentDate.set(d);
    }
  }
</script>

<div class="ui-container">
  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="header">
      <h1>Solstice</h1>
      <div class="status">
        <p class="date-display">{formattedDate}</p>
      </div>
    </div>

    <!-- ... rest of sidebar content ... -->
    <div class="controls-section">
      <h3>Controls</h3>
      <div class="control-group">
        <button class="play-btn" on:click={togglePlay}>
          {$isPlaying ? "Pause" : "Play"}
        </button>
      </div>

      <div class="control-group">
        <label>
          Speed (days/s):
          <div class="speed-row">
            <input
              type="range"
              min="0.01"
              max="100"
              step="0.01"
              bind:value={$timeSpeed}
            />
            <input
              type="number"
              class="speed-number"
              min="0.01"
              max="100"
              step="0.01"
              bind:value={$timeSpeed}
            />
          </div>
        </label>
      </div>

      <div class="control-group">
        <label>
          Date/Time
          <input
            type="datetime-local"
            value={$currentDate.toISOString().slice(0, 16)}
            on:input={handleDateChange}
          />
        </label>
      </div>

      <div class="control-group">
        <label>
          Search Location:
          <CitySearch />
        </label>
      </div>

      <div class="control-group coords">
        <label
          >Lat <input
            type="number"
            bind:value={$observerLocation.lat}
            on:input={() => observerName.set(null)}
          /></label
        >
        <label
          >Lon <input
            type="number"
            bind:value={$observerLocation.lon}
            on:input={() => observerName.set(null)}
          /></label
        >
      </div>
    </div>

    <div class="info-section">
      <h3>{new Date().getFullYear()} Events</h3>
      <ul class="event-list">
        <li>
          <div
            class="event-header clickable"
            on:click={() => currentDate.set(seasons.marchEquinox.date)}
            tabindex="0"
            role="button"
            on:keydown={(e) =>
              e.key === "Enter" && currentDate.set(seasons.marchEquinox.date)}
          >
            <strong>Mar Eq:</strong>
            {seasons.marchEquinox.date.toLocaleString()}
          </div>
          <div class="event-body">
            <div class="cities-box">
              {#each seasons.marchEquinox.closestCities as city}
                <button
                  class="city-link"
                  on:click={() => {
                    observerLocation.set({ lat: city.lat, lon: city.lon });
                    observerName.set(city.name);
                  }}
                  title="Jump to {city.name}"
                >
                  {city.name}
                </button>
              {/each}
            </div>
            <div class="data-box">
              <div class="data-row">
                Orbit: {seasons.marchEquinox.longitude.toFixed(1)}°
              </div>
              <div class="data-row">
                Noon: {seasons.marchEquinox.subSolarLongitude.toFixed(1)}°
              </div>
            </div>
          </div>
        </li>
        <li>
          <div
            class="event-header clickable"
            on:click={() => currentDate.set(seasons.juneSolstice.date)}
            tabindex="0"
            role="button"
            on:keydown={(e) =>
              e.key === "Enter" && currentDate.set(seasons.juneSolstice.date)}
          >
            <strong>Jun Sol:</strong>
            {seasons.juneSolstice.date.toLocaleString()}
          </div>
          <div class="event-body">
            <div class="cities-box">
              {#each seasons.juneSolstice.closestCities as city}
                <button
                  class="city-link"
                  on:click={() => {
                    observerLocation.set({ lat: city.lat, lon: city.lon });
                    observerName.set(city.name);
                  }}
                  title="Jump to {city.name}"
                >
                  {city.name}
                </button>
              {/each}
            </div>
            <div class="data-box">
              <div class="data-row">
                Orbit: {seasons.juneSolstice.longitude.toFixed(1)}°
              </div>
              <div class="data-row">
                Noon: {seasons.juneSolstice.subSolarLongitude.toFixed(1)}°
              </div>
            </div>
          </div>
        </li>
        <li>
          <div
            class="event-header clickable"
            on:click={() => currentDate.set(seasons.sepEquinox.date)}
            tabindex="0"
            role="button"
            on:keydown={(e) =>
              e.key === "Enter" && currentDate.set(seasons.sepEquinox.date)}
          >
            <strong>Sep Eq:</strong>
            {seasons.sepEquinox.date.toLocaleString()}
          </div>
          <div class="event-body">
            <div class="cities-box">
              {#each seasons.sepEquinox.closestCities as city}
                <button
                  class="city-link"
                  on:click={() => {
                    observerLocation.set({ lat: city.lat, lon: city.lon });
                    observerName.set(city.name);
                  }}
                  title="Jump to {city.name}"
                >
                  {city.name}
                </button>
              {/each}
            </div>
            <div class="data-box">
              <div class="data-row">
                Orbit: {seasons.sepEquinox.longitude.toFixed(1)}°
              </div>
              <div class="data-row">
                Noon: {seasons.sepEquinox.subSolarLongitude.toFixed(1)}°
              </div>
            </div>
          </div>
        </li>
        <li>
          <div
            class="event-header clickable"
            on:click={() => currentDate.set(seasons.decSolstice.date)}
            tabindex="0"
            role="button"
            on:keydown={(e) =>
              e.key === "Enter" && currentDate.set(seasons.decSolstice.date)}
          >
            <strong>Dec Sol:</strong>
            {seasons.decSolstice.date.toLocaleString()}
          </div>
          <div class="event-body">
            <div class="cities-box">
              {#each seasons.decSolstice.closestCities as city}
                <button
                  class="city-link"
                  on:click={() => {
                    observerLocation.set({ lat: city.lat, lon: city.lon });
                    observerName.set(city.name);
                  }}
                  title="Jump to {city.name}"
                >
                  {city.name}
                </button>
              {/each}
            </div>
            <div class="data-box">
              <div class="data-row">
                Orbit: {seasons.decSolstice.longitude.toFixed(1)}°
              </div>
              <div class="data-row">
                Noon: {seasons.decSolstice.subSolarLongitude.toFixed(1)}°
              </div>
            </div>
          </div>
        </li>
      </ul>
    </div>
    <div class="control-group">
      <label>
        Projection:
        <div class="toggle-group">
          <button
            class:active={$cameraMode === "orthographic"}
            on:click={() => cameraMode.set("orthographic")}
          >
            Ortho
          </button>
          <button
            class:active={$cameraMode === "perspective"}
            on:click={() => cameraMode.set("perspective")}
          >
            Persp
          </button>
        </div>
      </label>
    </div>
  </aside>

  <!-- Main View Area (3D Scene Slot) -->
  <main class="main-view">
    <slot />
  </main>

  <!-- Timeline (Top Bar) -->
  <header class="timeline-bar">
    <div class="timeline-track">
      <!-- SVG Ticks for Precision -->
      <svg class="ticks-svg" width="100%" height="100%">
        {#each dayTicks as tick}
          <line
            x1="{tick}%"
            y1="60%"
            x2="{tick}%"
            y2="100%"
            stroke="rgba(255,255,255,0.15)"
            stroke-width="1"
          />
        {/each}
      </svg>

      <!-- Month Labels and Ticks -->
      {#each months as month, i}
        <div class="month-label" style="left: {getMonthPosition(i)}%">
          {month}
        </div>
        <div class="month-tick" style="left: {getMonthPosition(i)}%"></div>
      {/each}

      <!-- Colored Event Markers -->
      <div
        class="event-marker"
        style="left: {getEventPercent(
          seasons.marchEquinox.date,
        )}%; background: #00BCD4;"
        title="March Equinox"
      ></div>

      <div
        class="event-marker"
        style="left: {getEventPercent(
          seasons.juneSolstice.date,
        )}%; background: #FF5722;"
        title="June Solstice"
      ></div>

      <div
        class="event-marker"
        style="left: {getEventPercent(
          seasons.sepEquinox.date,
        )}%; background: #00BCD4;"
        title="September Equinox"
      ></div>

      <div
        class="event-marker"
        style="left: {getEventPercent(
          seasons.decSolstice.date,
        )}%; background: #FF5722;"
        title="December Solstice"
      ></div>

      <div
        class="timeline-handle"
        style="left: {getEventPercent($currentDate)}%"
      ></div>

      <input
        type="range"
        class="timeline-slider interactive"
        min={yearStart}
        max={yearEnd}
        value={$currentDate.getTime()}
        step="any"
        on:input={(e) => {
          const ts = parseFloat(e.currentTarget.value);
          currentDate.set(new Date(ts));
        }}
      />
    </div>
  </header>

  <!-- Bottom Bar with Sky View -->
  <footer class="bottom-bar">
    <div class="sky-view-wrapper">
      <SkyView />
    </div>
  </footer>
</div>

<style>
  .ui-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: grid;
    /* Updated column width to 360px */
    grid-template-columns: 360px 1fr;
    grid-template-rows: 80px 1fr 250px;
    grid-template-areas:
      "sidebar timeline"
      "sidebar main"
      "sidebar footer";
  }

  /* Main View Area (for Slot) */
  .main-view {
    grid-area: main;
    position: relative;
    overflow: hidden;
    /* Ensure it takes full space */
    width: 100%;
    height: 100%;
  }

  .sidebar {
    grid-area: sidebar;
    background: rgba(10, 10, 15, 0.9);
    backdrop-filter: blur(15px);
    padding: 20px;
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    pointer-events: auto;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 30px;
    z-index: 10;
  }

  .timeline-bar {
    grid-area: timeline;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(5px);
    pointer-events: auto;
    display: flex;
    align-items: center;
    padding: 0 20px;
    position: relative;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .timeline-track {
    position: relative;
    width: 100%;
    height: 50px;
    background: transparent;
  }

  .ticks-svg {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .month-label {
    position: absolute;
    top: 5px;
    font-size: 12px;
    color: #ccc;
    transform: translateX(5px); /* Offset slightly from line */
    font-weight: bold;
    pointer-events: none;
  }

  .month-tick {
    position: absolute;
    top: 25px;
    bottom: 0;
    width: 2px;
    background: rgba(255, 255, 255, 0.4);
    pointer-events: none;
  }

  .event-marker {
    position: absolute;
    top: 20px;
    bottom: 5px;
    width: 3px; /* Slightly thicker than ticks */
    transform: translateX(-1.5px); /* Center */
    pointer-events: none;
    z-index: 2;
    border-radius: 2px;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.5); /* Contrast */
  }

  .timeline-handle {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 4px;
    background: #ff9800;
    z-index: 6; /* On top of ticks/markers */
    pointer-events: none;
    transform: translateX(-50%); /* Center on the percent */
    border-radius: 2px;
    box-shadow: 0 0 5px rgba(255, 152, 0, 0.5);
  }

  .timeline-slider {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    margin: 0;
    cursor: pointer;
    z-index: 10; /* Topmost for interaction */
    opacity: 0; /* Fully transparent so we only see custom handle */
    -webkit-appearance: none;
  }

  .bottom-bar {
    grid-area: footer;
    background: rgba(10, 10, 15, 0.85);
    backdrop-filter: blur(15px);
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    pointer-events: auto;
    display: flex;
    flex-direction: column;
    padding: 10px;
  }

  .sky-view-wrapper {
    flex: 1;
    width: 100%;
    height: 100%;
  }

  h1 {
    margin: 0;
    font-weight: 300;
    letter-spacing: 2px;
    color: white;
  }
  h3 {
    margin: 0 0 10px 0;
    font-size: 0.9em;
    text-transform: uppercase;
    color: #888;
  }

  .date-display {
    font-size: 0.9em;
    color: #aaa;
    margin-top: 5px;
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-bottom: 15px;
    font-size: 0.9em;
    color: #ccc;
  }
  .control-group.coords {
    flex-direction: row;
    gap: 10px;
  }
  .speed-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .speed-number {
    width: 80px;
  }

  input,
  button {
    padding: 8px;
    border-radius: 4px;
    border: 1px solid #444;
    background: #222;
    color: white;
  }
  button.play-btn {
    background: #ff9800;
    color: black;
    border: none;
    font-weight: bold;
    cursor: pointer;
  }
  button.play-btn:hover {
    background: #ffb74d;
  }

  ul {
    padding: 0;
    list-style: none;
    margin: 0;
    font-size: 0.85em;
    color: #bbb;
  }
  li {
    margin-bottom: 10px;
    line-height: 1.4;
  }
  .event-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }

  .event-list li {
    margin-bottom: 12px;
    border-bottom: 1px solid #333;
    padding-bottom: 8px;
  }
  .event-list li:last-child {
    border-bottom: none;
  }

  .event-header {
    margin-bottom: 4px;
    font-size: 0.95em;
  }
  .event-header.clickable {
    cursor: pointer;
    color: #ffd700;
    transition: color 0.2s;
  }
  .event-header.clickable:hover {
    color: #ff9800;
    text-decoration: underline;
  }

  .event-body {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
  }

  .cities-box {
    flex: 1;
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }

  .city-link {
    background: none;
    border: 1px solid #444;
    border-radius: 3px;
    color: #ff9800;
    cursor: pointer;
    font-size: 0.75em;
    padding: 2px 6px;
    text-decoration: none;
    transition: background 0.2s;
  }
  .city-link:hover {
    background: #333;
    border-color: #666;
  }

  .data-box {
    text-align: right;
    min-width: 80px;
    font-size: 0.75em;
    color: #aaa;
    border-left: 1px solid #333;
    padding-left: 8px;
  }
</style>
