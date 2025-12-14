<script lang="ts">
    import { T, useTask, useThrelte } from "@threlte/core";
    import { Text } from "@threlte/extras";
    import { Group, Quaternion } from "three";

    // Props to pass through to Text
    export let text: string;
    export let position: [number, number, number] | undefined = undefined;
    export let color: string = "white";
    export let fontSize: number = 1;
    export let anchorX: "center" | "left" | "right" = "center";
    export let anchorY:
        | "top"
        | "top-baseline"
        | "middle"
        | "bottom-baseline"
        | "bottom" = "middle";

    const { camera } = useThrelte();
    let group: Group;

    useTask(() => {
        if (group && $camera) {
            group.quaternion.copy($camera.quaternion);
        }
    });
</script>

<T.Group bind:ref={group} {position}>
    <Text {text} {color} {fontSize} {anchorX} {anchorY} position={[0, 0, 0]} />
</T.Group>
