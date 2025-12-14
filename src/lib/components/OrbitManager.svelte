<script lang="ts">
    import { useTask } from "@threlte/core";
    import { currentDate, isPlaying, timeSpeed } from "../stores";

    // Animation Loop
    useTask((delta) => {
        if ($isPlaying) {
            const speed = $timeSpeed; // days per second
            const date = $currentDate;
            // Add delta (seconds) * speed (days/sec) to date
            const newDate = new Date(
                date.getTime() + delta * speed * 24 * 60 * 60 * 1000,
            );
            currentDate.set(newDate);
        }
    });
</script>
