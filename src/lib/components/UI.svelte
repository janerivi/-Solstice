<script lang="ts">
  import {
    currentDate,
    isPlaying,
    timeSpeed,
    observerLocation,
    viewMode,
  } from "../stores";
  import { getSunTimes, getSeasons } from "../astronomy";
  import SkyView from "./SkyView.svelte";

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

    <div class="controls-section">
      <h3>Controls</h3>
      <div class="control-group">
        <button class="play-btn" on:click={togglePlay}>
          {$isPlaying ? "Pause" : "Play"}
        </button>
      </div>

      <!-- Old Year Progress Slider Removed -->

      <div class="control-group">
        <label>
          Speed: {$timeSpeed.toFixed(2)} days/s
          <input
            type="range"
            min="0.01"
            max="100"
            step="0.01"
            bind:value={$timeSpeed}
          />
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
          Location Preset:
          <select
            on:change={(e) => {
              const val = e.currentTarget.value;
              if (val) {
                const [lat, lon] = val.split(",").map(parseFloat);
                observerLocation.set({ lat, lon });
              }
            }}
          >
            <option value="">Select a city...</option>
            <optgroup label="Custom">
              <option value="59.216011,11.014277">Begby, Norway</option>
            </optgroup>
            <optgroup label="Major Cities">
              <option value="51.5074,-0.1278">London, UK</option>
              <option value="40.7128,-74.0060">New York, USA</option>
              <option value="35.6762,139.6503">Tokyo, Japan</option>
              <option value="-33.8688,151.2093">Sydney, Australia</option>
              <option value="48.8566,2.3522">Paris, France</option>
            </optgroup>
            <optgroup label="Extremes">
              <option value="78.2232,15.6267">Longyearbyen (North)</option>
              <option value="-54.8019,-68.3030">Ushuaia (South)</option>
              <option value="0.0,0.0">Equator / Prime Meridian</option>
            </optgroup>
          </select>
        </label>
      </div>

      <div class="control-group coords">
        <label
          >Lat <input type="number" bind:value={$observerLocation.lat} /></label
        >
        <label
          >Lon <input type="number" bind:value={$observerLocation.lon} /></label
        >
      </div>
    </div>

    <div class="info-section">
      <h3>{new Date().getFullYear()} Events</h3>
      <ul>
        <li>
          <strong>Mar Eq:</strong>
          {seasons.marchEquinox.date.toLocaleString()} <br />
          <span class="detail"
            >Lon: {seasons.marchEquinox.longitude.toFixed(5)}°</span
          >
        </li>
        <li>
          <strong>Jun Sol:</strong>
          {seasons.juneSolstice.date.toLocaleString()} <br />
          <span class="detail"
            >Lon: {seasons.juneSolstice.longitude.toFixed(5)}°</span
          >
        </li>
        <li>
          <strong>Sep Eq:</strong>
          {seasons.sepEquinox.date.toLocaleString()} <br />
          <span class="detail"
            >Lon: {seasons.sepEquinox.longitude.toFixed(5)}°</span
          >
        </li>
        <li>
          <strong>Dec Sol:</strong>
          {seasons.decSolstice.date.toLocaleString()} <br />
          <span class="detail"
            >Lon: {seasons.decSolstice.longitude.toFixed(5)}°</span
          >
        </li>
      </ul>
    </div>
  </aside>

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
      <!-- Solstices: #FF5722, Equinoxes: #00BCD4 -->
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

      <!-- Interactive Slider Overlay -->
      <!-- We use a custom handle div for visual precision (matching ticks), 
           and an invisible range input for interaction -->

      <!-- Custom Handle -->
      <div
        class="timeline-handle"
        style="left: {getEventPercent($currentDate)}%"
      ></div>

      <!-- Invisible Interaction Layer -->
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
    pointer-events: none;
    display: grid;
    grid-template-columns: 300px 1fr;
    grid-template-rows: 80px 1fr 250px;
    grid-template-areas:
      "sidebar timeline"
      "sidebar main"
      "sidebar footer";
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

  input,
  button,
  select {
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
  .detail {
    font-size: 0.85em;
    color: #888;
    margin-left: 5px;
  }
</style>
