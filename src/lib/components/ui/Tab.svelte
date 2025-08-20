<script lang="ts">
    import { getContext } from "svelte";
    import { derived } from "svelte/store";

    export let index: number;
    export let label: string;
    export let iconBefore: typeof import("svelte").SvelteComponent | null =
        null;
    export let iconAfter: typeof import("svelte").SvelteComponent | null = null;

    const { activeTab, tabs, panelClass, orientation, direction } =
        getContext("tabs");

    const isActive = derived(activeTab, ($active) => $active === index);

    function handleKey(e: KeyboardEvent, i: number, total: number) {
        const key = e.key;
        const inc =
            direction === "rtl" && orientation === "horizontal" ? -1 : 1;

        if (key === "ArrowRight") {
            e.preventDefault();
            activeTab.update((v) => (v + inc + total) % total);
        } else if (key === "ArrowLeft") {
            e.preventDefault();
            activeTab.update((v) => (v - inc + total) % total);
        } else if (key === "Home") {
            e.preventDefault();
            activeTab.set(0);
        } else if (key === "End") {
            e.preventDefault();
            activeTab.set(total - 1);
        }
    }

    // Register tab with parent
    $: tabs.update((arr) => {
        arr[index] = {
            label,
            iconBefore,
            iconAfter,
            isActive: $isActive,
            handleKey,
        };
        return arr;
    });
</script>

{#if $isActive}
    <div
        id={`panel-${index}`}
        role="tabpanel"
        aria-labelledby={`tab-${index}`}
        tabindex="0"
        class={`${panelClass}`}
    >
        <slot />
    </div>
{/if}
