<script lang="ts">
    import { createEventDispatcher } from "svelte";

    // Main content
    export let text: string | null = null; // optional text
    export let link: string | null = null; // if provided -> <a>, else <button>
    export let target: "_self" | "_blank" = "_self";
    export let rel: string | null = null;
    export let id: string | null = null;

    // Icon support
    export let icon: any = null; // svelte component (e.g. from lucide-svelte)
    export let iconPosition: "left" | "right" = "left";
    export let iconSpacing: string = "0.5rem"; // gap between icon & text

    // Class controls (full Tailwind flexibility)
    export let containerClass: string = "";
    export let buttonClass: string = "";
    export let textClass: string = "";
    export let iconClass: string = "";

    const dispatch = createEventDispatcher();

    function handleClick(event: MouseEvent) {
        dispatch("click", event);
    }
</script>

<div class={containerClass}>
    {#if link}
        <!-- Render as <a> -->
        <a
            {id}
            href={link}
            {target}
            {rel}
            class={buttonClass}
            on:click={handleClick}
        >
            {#if icon && iconPosition === "left"}
                <span
                    class={iconClass}
                    style={`margin-right:${text || $$slots.default ? iconSpacing : 0}`}
                >
                    <svelte:component this={icon} />
                </span>
            {/if}

            {#if text}
                <span class={textClass}>{text}</span>
            {/if}

            <slot />

            {#if icon && iconPosition === "right"}
                <span
                    class={iconClass}
                    style={`margin-left:${text || $$slots.default ? iconSpacing : 0}`}
                >
                    <svelte:component this={icon} />
                </span>
            {/if}
        </a>
    {:else}
        <!-- Render as <button> -->
        <button {id} class={buttonClass} on:click={handleClick}>
            {#if icon && iconPosition === "left"}
                <span
                    class={iconClass}
                    style={`margin-right:${text || $$slots.default ? iconSpacing : 0}`}
                >
                    <svelte:component this={icon} />
                </span>
            {/if}

            {#if text}
                <span class={textClass}>{text}</span>
            {/if}

            <slot />

            {#if icon && iconPosition === "right"}
                <span
                    class={iconClass}
                    style={`margin-left:${text || $$slots.default ? iconSpacing : 0}`}
                >
                    <svelte:component this={icon} />
                </span>
            {/if}
        </button>
    {/if}
</div>
