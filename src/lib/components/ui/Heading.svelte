<script lang="ts">
    import { onMount } from "svelte";
    import type { SvelteComponent } from "svelte";

    // Props
    export let text: string;
    export let tag: string = "h2";

    export let link: string | null = null;
    export let linkTarget: string = "_self";
    export let linkRel: string = "";

    export let button: string | null = null;
    export let buttonLink: string | null = null;
    export let hideLink: boolean = false;

    // Customizable classes
    export let containerClass: string = "";
    export let textClass: string = "";
    export let buttonClass: string = "";
    export let buttonContainerClass: string = "";
    export let headingStyle: string = "";

    // Optional icon for button
    export let icon: typeof SvelteComponent | null = null;

    // Alignment
    export let alignment: "left" | "center" | "right" | "justify" = "left";
    const alignmentClasses: Record<string, string> = {
        left: "text-left",
        center: "text-center",
        right: "text-right",
        justify: "text-justify",
    };

    // Entrance animations
    export let entranceAnimation: "fade" | "slide-up" | "slide-left" | "none" =
        "fade";
    let isVisible = false;
    let headerRef: HTMLElement;

    // Animation base classes
    const baseAnimations: Record<string, string> = {
        fade: "opacity-0 transition-all duration-500 ease-in-out",
        "slide-up":
            "opacity-0 translate-y-5 transition-all duration-500 ease-in-out",
        "slide-left":
            "opacity-0 -translate-x-5 transition-all duration-500 ease-in-out",
        none: "",
    };

    // Animation visible classes
    const visibleAnimations: Record<string, string> = {
        fade: "opacity-100",
        "slide-up": "opacity-100 translate-y-0",
        "slide-left": "opacity-100 translate-x-0",
        none: "",
    };

    onMount(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    isVisible = true;
                    observer.disconnect();
                }
            },
            { threshold: 0.2 },
        );
        if (headerRef) observer.observe(headerRef);
    });
</script>

<!-- Container -->
<div
    bind:this={headerRef}
    class={`section-header flex items-center justify-between w-full ${containerClass}`}
>
    <!-- Heading -->
    <svelte:element
        this={tag}
        class={`${alignmentClasses[alignment] || ""} ${baseAnimations[entranceAnimation]} ${
            isVisible ? visibleAnimations[entranceAnimation] : ""
        } ${headingStyle}`}
    >
        {#if link}
            <a href={link} target={linkTarget} rel={linkRel} class={textClass}>
                {text}
            </a>
        {:else}
            <span class={textClass}>{text}</span>
        {/if}
    </svelte:element>

    <!-- Button -->
    {#if !hideLink && button && buttonLink}
        <div class={buttonContainerClass}>
            <a
                href={buttonLink}
                class={`flex items-center gap-2 transition-all duration-500 ease-in-out hover:text-secondary ${buttonClass}`}
            >
                {button}
                {#if icon}
                    <svelte:component this={icon} class="w-4 h-4" />
                {/if}
            </a>
        </div>
    {/if}
</div>
