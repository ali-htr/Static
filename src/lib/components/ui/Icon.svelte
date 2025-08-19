<script>
    // Props
    export let icon; // string (class/svg) | Svelte component (Lucide, custom)
    export let view = "default"; // default | stacked | framed
    export let shape = "circle"; // circle | square
    export let link = ""; // optional URL wrapper
    export let alignment = "center"; // left | center | right

    // Class Props
    export let containerClass = "";
    export let wrapperClass = "";
    export let iconClass = "";
</script>

<!-- Outer Wrapper -->
<div
    class={`icon-wrapper flex items-center justify-${alignment} ${containerClass}`}
>
    {#if link}
        <a
            href={link}
            target="_blank"
            rel="noopener"
            class={`icon-link ${wrapperClass}`}
        >
            {#if typeof icon === "string"}
                <!-- If icon is a string (e.g., FontAwesome class or SVG path) -->
                {#if icon.endsWith(".svg")}
                    <img src={icon} alt="icon" class={iconClass} />
                {:else}
                    <i class={`${icon} ${iconClass}`}></i>
                {/if}
            {:else}
                <!-- If icon is a component (e.g., Lucide) -->
                <svelte:component this={icon} class={iconClass} />
            {/if}
        </a>
    {:else}
        <span class={`icon-base ${view} ${shape} ${wrapperClass}`}>
            {#if typeof icon === "string"}
                {#if icon.endsWith(".svg")}
                    <img src={icon} alt="icon" class={iconClass} />
                {:else}
                    <i class={`${icon} ${iconClass}`}></i>
                {/if}
            {:else}
                <svelte:component this={icon} class={iconClass} />
            {/if}
        </span>
    {/if}
</div>
