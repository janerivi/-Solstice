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
  $: seasons = getSeasons($currentDate.getFullYear());

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

      <div class="control-group">
        <label>
          Year Progress
          <input
            type="range"
            min={new Date($currentDate.getFullYear(), 0, 1).getTime()}
            max={new Date($currentDate.getFullYear(), 11, 31, 23, 59).getTime()}
            value={$currentDate.getTime()}
            on:input={(e) => {
              const ts = parseInt(e.currentTarget.value);
              currentDate.set(new Date(ts));
            }}
            step="3600000"
          />
        </label>
      </div>

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
        <li>Mar Eq: {seasons.marchEquinox.date.toLocaleDateString()}</li>
        <li>Jun Sol: {seasons.juneSolstice.date.toLocaleDateString()}</li>
        <li>Sep Eq: {seasons.sepEquinox.date.toLocaleDateString()}</li>
        <li>Dec Sol: {seasons.decSolstice.date.toLocaleDateString()}</li>
      </ul>
    </div>
  </aside>

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
    grid-template-rows: 1fr 250px;
    grid-template-areas:
      "sidebar main"
      "sidebar footer";
  }

  .sidebar {
    grid-area: sidebar;
    background: rgba(10, 10, 15, 0.85);
    backdrop-filter: blur(15px);
    padding: 20px;
    border-right: 1px solid rgba(255, 255, 255, 0.1);
    pointer-events: auto;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 30px;
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
    margin-bottom: 5px;
  }
</style>
