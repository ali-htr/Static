<script lang="ts">
    import { setContext, onMount } from "svelte";
    import { writable, type Writable } from "svelte/store";

    export let defaultIndex = 0;
    export let orientation: "horizontal" | "vertical" = "horizontal";
    export let direction: "ltr" | "rtl" = "ltr";

    // Customization via classes
    export let wrapperClass = "";
    export let tabListClass = "";
    export let tabClass = "";
    export let activeClass = "text-blue-600 border-blue-600";
    export let inactiveClass =
        "text-gray-600 border-transparent hover:text-gray-800 hover:border-gray-300";
    export let panelClass = "p-4";

    const activeTab: Writable<number> = writable(defaultIndex);
    const tabs: Writable<any[]> = writable([]);

    // Context for children (Tab.svelte)
    setContext("tabs", {
        activeTab,
        tabs,
        tabClass,
        activeClass,
        inactiveClass,
        panelClass,
        orientation,
        direction,
    });

    let tabsArray: any[] = [];
    tabs.subscribe((v) => (tabsArray = v));

    // Clamp active tab to available tabs
    onMount(() => {
        activeTab.update((i) => Math.min(i, tabsArray.length - 1));
    });

    // Handle keyboard navigation
    function handleKey(e: KeyboardEvent, index: number) {
        let nextIndex = index;

        if (orientation === "horizontal") {
            if (e.key === "ArrowRight") {
                nextIndex = direction === "ltr" ? index + 1 : index - 1;
            } else if (e.key === "ArrowLeft") {
                nextIndex = direction === "ltr" ? index - 1 : index + 1;
            }
        } else if (orientation === "vertical") {
            if (e.key === "ArrowDown") nextIndex = index + 1;
            if (e.key === "ArrowUp") nextIndex = index - 1;
        }

        if (e.key === "Home") nextIndex = 0;
        if (e.key === "End") nextIndex = tabsArray.length - 1;

        if (nextIndex !== index) {
            e.preventDefault();
            if (nextIndex < 0) nextIndex = tabsArray.length - 1;
            if (nextIndex >= tabsArray.length) nextIndex = 0;
            activeTab.set(nextIndex);
            document.getElementById(`tab-${nextIndex}`)?.focus();
        }
    }
</script>

<div class={`w-full flex flex-col ${wrapperClass}`}>
    <!-- Tab List -->
    <div
        class={`flex ${
            orientation === "vertical" ? "flex-col" : "flex-row"
        } ${tabListClass}`}
        role="tablist"
        aria-orientation={orientation}
    >
        {#each tabsArray as tab, i}
            <button
                id={`tab-${i}`}
                role="tab"
                aria-selected={tab.isActive}
                aria-controls={`panel-${i}`}
                tabindex={tab.isActive ? "0" : "-1"}
                on:click={() => activeTab.set(i)}
                on:keydown={(e) => handleKey(e, i)}
                disabled={tab.disabled}
                class={`px-4 py-2 border-b-2 font-medium focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${tabClass} ${
                    tab.isActive ? activeClass : inactiveClass
                }`}
            >
                {#if tab.iconBefore}
                    <svelte:component
                        this={tab.iconBefore}
                        class="inline-block w-4 h-4 mr-2"
                    />
                {/if}
                {tab.label}
                {#if tab.iconAfter}
                    <svelte:component
                        this={tab.iconAfter}
                        class="inline-block w-4 h-4 ml-2"
                    />
                {/if}
            </button>
        {/each}
    </div>

    <!-- Panels -->
    <div>
        <slot />
    </div>
</div>
