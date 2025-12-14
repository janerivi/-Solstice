<script lang="ts">
  import Scene from "./lib/components/Scene.svelte";
  import UI from "./lib/components/UI.svelte";
</script>

<main>
  <UI>
    <Scene />
  </UI>
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    overflow: hidden;
    background-color: #000;
  }
</style>
