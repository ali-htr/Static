<!-- SearchComponent.svelte -->
<script lang="ts">
    import { createEventDispatcher, onDestroy, onMount } from "svelte";

    const dispatch = createEventDispatcher<{
        search: string;
        input: string;
        select: string;
        results: string[];
    }>();

    // ——— Main props —————————————————————————————————————————————
    export let placeholder: string = "Search...";
    export let value: string = "";
    export let debounce: number = 300;
    export let direction: "ltr" | "rtl" = "ltr";
    export let apiUrl: string = "https://jsonplaceholder.typicode.com/users";

    // Enhancements
    export let autoSearch: boolean = false;
    export let dropdownPosition: "top" | "bottom" = "bottom";
    export let shortcutKey: string = "/";

    // ——— Class props (all customizable) ————————————————
    export let wrapperClass: string = "relative w-full max-w-md";
    export let inputClass: string =
        "w-full border rounded-lg px-4 py-2 pr-24 focus:outline-none focus:ring-2 focus:ring-blue-500";
    export let buttonClass: string =
        "absolute end-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700";
    export let resultsClass: string =
        "absolute w-full bg-white shadow-lg rounded-lg p-2 z-50 max-h-60 overflow-auto";
    export let resultItemClass: string =
        "px-3 py-2 cursor-pointer rounded hover:bg-gray-100";
    export let selectedItemClass: string = "bg-gray-200";
    export let emptyClass: string = "mt-2 p-2 text-gray-500";
    export let loadingClass: string =
        "absolute end-16 top-1/2 -translate-y-1/2 text-gray-500";
    export let searchIconClass: string = "me-1";
    export let dropdownTopClass: string = "bottom-full mb-2";
    export let dropdownBottomClass: string = "mt-2";

    // ——— Icon props ————————————————————————————————————————
    export let showSearchIcon: boolean = true;
    export let searchIcon: string = "🔍";

    // ——— Internal state ————————————————————————————————————————
    let timeout: ReturnType<typeof setTimeout> | null = null;
    let results: string[] = [];
    let loading = false;
    let activeIndex = -1;

    let wrapperEl: HTMLElement;
    let inputEl: HTMLInputElement;

    // ——— Logic ————————————————————————————————————————————————
    function handleInput(e: Event) {
        const target = e.target as HTMLInputElement;
        value = target.value;
        dispatch("input", value);

        const run = () => {
            fetchSuggestions();
            if (autoSearch) dispatch("search", value);
        };

        if (debounce > 0) {
            if (timeout) clearTimeout(timeout);
            timeout = setTimeout(run, debounce);
        } else run();
    }

    async function fetchSuggestions() {
        if (!value) {
            results = [];
            return;
        }
        loading = true;
        try {
            const res = await fetch(apiUrl);
            const data = await res.json();
            results = (data as any[])
                .map((d) => d?.name ?? d?.title ?? "")
                .filter(
                    (name: string) =>
                        typeof name === "string" &&
                        name.toLowerCase().includes(value.toLowerCase()),
                )
                .slice(0, 8);
            dispatch("results", results);
        } catch (err) {
            console.error("Error fetching suggestions:", err);
            results = [];
        } finally {
            loading = false;
        }
    }

    function handleSearch() {
        dispatch("search", value);
        results = [];
        activeIndex = -1;
    }

    function selectSuggestion(item: string) {
        value = item;
        results = [];
        activeIndex = -1;
        dispatch("select", item);
    }

    function handleKeydown(e: KeyboardEvent) {
        if (results.length > 0) {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                activeIndex = (activeIndex + 1) % results.length;
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                activeIndex =
                    (activeIndex - 1 + results.length) % results.length;
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (activeIndex >= 0 && results[activeIndex]) {
                    selectSuggestion(results[activeIndex]);
                } else {
                    handleSearch();
                }
            } else if (e.key === "Escape") {
                results = [];
                activeIndex = -1;
            }
        } else if (e.key === "Enter") {
            e.preventDefault();
            handleSearch();
        }
    }

    // Click-outside to close
    function onDocClick(e: MouseEvent) {
        if (!wrapperEl?.contains(e.target as Node)) {
            results = [];
            activeIndex = -1;
        }
    }

    // Global keyboard shortcut
    function onDocKeydown(e: KeyboardEvent) {
        if (document.activeElement && e.key === shortcutKey && document.activeElement !== inputEl) {
            e.preventDefault();
            inputEl?.focus();
        }
    }

    onMount(() => {
        document.addEventListener("click", onDocClick);
        document.addEventListener("keydown", onDocKeydown);
        return () => {
            document.removeEventListener("click", onDocClick);
            document.removeEventListener("keydown", onDocKeydown);
        };
    });

    onDestroy(() => {
        if (timeout) clearTimeout(timeout);
    });

    // Expose focus() to parent
    export function focus() {
        inputEl?.focus();
    }
</script>

<!-- TEMPLATE -->
<div bind:this={wrapperEl} class={wrapperClass} dir={direction}>
    <input
        bind:this={inputEl}
        type="text"
        {placeholder}
        bind:value
        on:input={handleInput}
        on:keydown={handleKeydown}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={results.length > 0}
        aria-controls="search-results"
        class={inputClass}
    />

    <button type="button" class={buttonClass} on:click={handleSearch}>
        {#if showSearchIcon}
            <span class={searchIconClass}>{searchIcon}</span>
        {/if}
        <slot name="buttonLabel">Search</slot>
    </button>

    {#if loading}
        <div class={loadingClass}>
            <slot name="loadingIcon">⏳</slot>
        </div>
    {/if}

    {#if results.length > 0}
        <div
            id="search-results"
            class={`${resultsClass} ${dropdownPosition === "top" ? dropdownTopClass : dropdownBottomClass}`}
            role="listbox"
        >
            {#each results as item, i}
                <div
                    class={`${resultItemClass} ${i === activeIndex ? selectedItemClass : ""}`}
                    role="option"
                    aria-selected={i === activeIndex}
                    on:click={() => selectSuggestion(item)}
                >
                    <slot name="resultItem" {item}>
                        {item}
                    </slot>
                </div>
            {/each}
        </div>
    {:else if !loading && value}
        <div class={emptyClass}>
            <slot name="empty">No results found</slot>
        </div>
    {/if}
</div>
