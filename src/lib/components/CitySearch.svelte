<script lang="ts">
    import { observerLocation, observerName } from "../stores";

    let query = "";
    let results: any[] = [];
    let showDropdown = false;
    let timer: any;

    // Debounced search
    async function search() {
        if (query.length < 2) {
            // Allow shorter queries like "Ny"
            results = [];
            return;
        }

        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=en&format=json`;

        try {
            const res = await fetch(url);
            const data = await res.json();
            results = data.results || [];
            showDropdown = true;
        } catch (err) {
            console.error("Geocoding failed", err);
        }
    }

    // Click outside handler
    function clickOutside(node: Node) {
        const handleClick = (event: MouseEvent) => {
            if (
                node &&
                !node.contains(event.target as Node) &&
                !event.defaultPrevented
            ) {
                showDropdown = false;
            }
        };
        document.addEventListener("click", handleClick, true);
        return {
            destroy() {
                document.removeEventListener("click", handleClick, true);
            },
        };
    }

    function handleInput() {
        clearTimeout(timer);
        timer = setTimeout(search, 300);
    }

    function selectCity(city: any) {
        observerLocation.set({ lat: city.latitude, lon: city.longitude });
        observerName.set(city.name);
        query = `${city.name}, ${city.country_code.toUpperCase()}`;
        showDropdown = false;
        results = []; // Clear results to prevent reopening on accidental focus
    }
</script>

<div class="city-search" use:clickOutside>
    <input
        type="text"
        placeholder="Search for a city..."
        bind:value={query}
        on:input={handleInput}
        on:focus={() => {
            if (results.length > 0) showDropdown = true;
        }}
    />

    {#if showDropdown && results.length > 0}
        <ul class="dropdown">
            {#each results as city}
                <li>
                    <button type="button" on:click={() => selectCity(city)}>
                        <span class="city-name">{city.name}</span>
                        <span class="city-detail">
                            {city.admin1 ? city.admin1 + ", " : ""}
                            {city.country_code}
                        </span>
                    </button>
                </li>
            {/each}
        </ul>
    {/if}
</div>

<style>
    .city-search {
        position: relative;
        width: 100%;
    }

    input {
        width: 100%;
        padding: 8px;
        border-radius: 4px;
        border: 1px solid #444;
        background: #222;
        color: white;
        box-sizing: border-box; /* Important for padding */
    }
    input:focus {
        outline: none;
        border-color: #ff9800;
    }

    .dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        width: 100%;
        background: #1a1a1a;
        border: 1px solid #444;
        border-radius: 4px;
        margin-top: 4px;
        padding: 0;
        list-style: none;
        z-index: 100;
        max-height: 200px;
        overflow-y: auto;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.5);
    }

    li {
        border-bottom: 1px solid #333;
    }
    li:last-child {
        border-bottom: none;
    }

    button {
        width: 100%;
        text-align: left;
        background: transparent;
        border: none;
        color: #eee;
        padding: 8px 12px;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    button:hover {
        background: #333;
    }

    .city-name {
        font-weight: bold;
    }
    .city-detail {
        font-size: 0.8em;
        color: #888;
        text-transform: uppercase;
    }
</style>
