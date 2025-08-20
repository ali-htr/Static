<script lang="ts">
    import { onMount, onDestroy, createEventDispatcher } from "svelte";
    import type { Slide } from "./slider-types";

    // Data
    export let items: Slide[] = [];
    export let startIndex: number = 0;

    // Behavior
    export let autoplay = false;
    export let interval = 4000;
    export let pauseOnHover = true;
    export let loop = true;
    export let speed = 500;
    export let slidesPerView = 1;
    export let spacing = "1rem";
    export let showArrows = true;
    export let showDots = true;
    export let keyboard = true;

    // Responsive
    export let breakpoints: Array<{
        maxWidth: number;
        slidesPerView?: number;
        spacing?: string;
    }> = [];

    // === Customizations ===

    // Typography
    export let titleClass = "";
    export let descriptionClass = "";
    export let buttonClass = "";
    export let fontFamily = "inherit";
    export let letterSpacing = "normal";

    // Navigation
    export let arrowClass = "";
    export let arrowPosition = "inside"; // 'inside' | 'outside' | 'custom'
    export let arrowShape = "rounded-full"; // tailwind shape
    export let arrowSize = "w-8 h-8";
    export let arrowColor = "bg-white/80 hover:bg-white";

    // Pagination
    export let dotsContainerClass = "";
    export let dotClass = "";
    export let dotActiveClass = "bg-blue-600";
    export let paginationType: "dots" | "lines" | "numbers" = "dots";
    export let paginationPosition = "bottom"; // 'bottom' | 'top' | 'custom'

    // Tailwind class overrides
    export let wrapperClass = "";
    export let trackClass = "";
    export let slideClass = "";

    // Internal state
    let current = Math.max(0, startIndex | 0);
    let timer: ReturnType<typeof setInterval> | null = null;
    let containerEl: HTMLElement | null = null;
    let isHovering = false;

    // Derived responsive values
    let effSlidesPerView = slidesPerView;
    let effSpacing = spacing;

    // Events
    const dispatch = createEventDispatcher<{
        change: { index: number };
        next: { index: number };
        prev: { index: number };
    }>();

    // --- Helpers ---
    function applyBreakpoints() {
        const w = typeof window !== "undefined" ? window.innerWidth : 99999;
        let spv = slidesPerView;
        let sp = spacing;

        const rule = breakpoints
            .slice()
            .sort((a, b) => a.maxWidth - b.maxWidth)
            .find((r) => w <= r.maxWidth);

        if (rule) {
            if (typeof rule.slidesPerView === "number")
                spv = rule.slidesPerView;
            if (typeof rule.spacing === "string") sp = rule.spacing;
        }
        effSlidesPerView = Math.max(1, spv | 0);
        effSpacing = sp;
    }

    function clampIndex(i: number) {
        if (loop) return (i + items.length) % items.length;
        return Math.max(0, Math.min(i, items.length - 1));
    }

    function next() {
        const target =
            current < items.length - effSlidesPerView
                ? current + 1
                : loop
                  ? (current + 1) % items.length
                  : current;
        if (target !== current) {
            current = target;
            dispatch("next", { index: current });
            dispatch("change", { index: current });
        }
    }

    function prev() {
        const atStart = current <= 0;
        const target = atStart ? (loop ? items.length - 1 : 0) : current - 1;
        if (target !== current) {
            current = target;
            dispatch("prev", { index: current });
            dispatch("change", { index: current });
        }
    }

    function goTo(i: number) {
        const target = clampIndex(i);
        if (target !== current) {
            current = target;
            dispatch("change", { index: current });
        }
    }

    // --- Autoplay ---
    function startAutoplay() {
        stopAutoplay();
        if (autoplay) {
            timer = setInterval(
                () => {
                    if (pauseOnHover && isHovering) return;
                    next();
                },
                Math.max(1000, interval),
            );
        }
    }
    function stopAutoplay() {
        if (timer) {
            clearInterval(timer);
            timer = null;
        }
    }

    // Hover
    function onEnter() {
        isHovering = true;
    }
    function onLeave() {
        isHovering = false;
    }

    // Keyboard navigation
    function onKeydown(e: KeyboardEvent) {
        if (!keyboard) return;
        if (e.key === "ArrowRight") {
            e.preventDefault();
            next();
        } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            prev();
        }
    }

    // Swipe
    let pointerDown = false;
    let startX = 0;
    let deltaX = 0;
    const SWIPE_THRESHOLD = 40;

    function onPointerDown(e: PointerEvent) {
        pointerDown = true;
        startX = e.clientX;
        deltaX = 0;
        (e.currentTarget as HTMLElement)?.setPointerCapture?.(e.pointerId);
    }
    function onPointerMove(e: PointerEvent) {
        if (!pointerDown) return;
        deltaX = e.clientX - startX;
    }
    function onPointerUp() {
        if (!pointerDown) return;
        pointerDown = false;
        if (Math.abs(deltaX) > SWIPE_THRESHOLD) {
            if (deltaX < 0) next();
            else prev();
        }
        deltaX = 0;
    }

    // Lifecycle
    onMount(() => {
        applyBreakpoints();
        startAutoplay();
        const onResize = () => applyBreakpoints();
        window.addEventListener("resize", onResize);
        onDestroy(() => window.removeEventListener("resize", onResize));
    });

    // Reactivity
    $: applyBreakpoints();
    $: startAutoplay();
    $: current = clampIndex(current);
</script>

<div
    bind:this={containerEl}
    class={`relative overflow-hidden ${wrapperClass}`}
    role="region"
    aria-roledescription="carousel"
    aria-label="Carousel"
    on:mouseenter={onEnter}
    on:mouseleave={onLeave}
    on:keydown={onKeydown}
    tabindex="0"
>
    <!-- Track -->
    <div
        class={`flex will-change-transform select-none ${trackClass}`}
        on:pointerdown={onPointerDown}
        on:pointermove={onPointerMove}
        on:pointerup={onPointerUp}
        on:pointercancel={onPointerUp}
        style={`gap:${effSpacing}; transform: translateX(-${current * (100 / effSlidesPerView)}%); transition: transform ${speed}ms ease;`}
        aria-live="polite"
    >
        {#each items as item, i (item.id)}
            <div
                class={`flex-shrink-0 w-full ${slideClass}`}
                style={`flex-basis: calc(100% / ${effSlidesPerView}); font-family:${fontFamily}; letter-spacing:${letterSpacing};`}
                role="group"
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${items.length}`}
            >
                <div class="relative w-full h-full">
                    {#if item.background?.type === "image" && item.background?.imageUrl}
                        <div
                            class="absolute inset-0"
                            style={`background-image:url('${item.background.imageUrl}'); background-position:${item.background.position || "center center"}; background-size:${item.background.size || "cover"};`}
                        />
                    {:else if item.background?.type === "color" && item.background?.color}
                        <div
                            class="absolute inset-0"
                            style={`background:${item.background.color};`}
                        />
                    {/if}

                    {#if item.background?.overlayColor}
                        <div
                            class="absolute inset-0"
                            style={`background:${item.background.overlayColor}; opacity:${item.background.overlayOpacity ?? 0.4};`}
                        />
                    {/if}

                    <!-- Content -->
                    <div
                        class="relative w-full h-full flex flex-col items-center justify-center text-center px-6"
                    >
                        <h2 class={`text-2xl font-bold ${titleClass}`}>
                            {item.title}
                        </h2>
                        <p class={`mt-2 text-gray-600 ${descriptionClass}`}>
                            {item.description}
                        </p>
                        {#if item.button}
                            <a
                                href={item.button.link}
                                class={`mt-4 inline-block ${buttonClass}`}
                            >
                                {item.button.text}
                            </a>
                        {/if}
                    </div>
                </div>
            </div>
        {/each}
    </div>

    <!-- Arrows -->
    {#if showArrows}
        <button
            type="button"
            class={`absolute ${arrowPosition === "inside" ? "left-2" : "left-[-3rem]"} top-1/2 -translate-y-1/2 ${arrowColor} p-2 ${arrowShape} shadow outline-none focus:ring ${arrowSize} ${arrowClass}`}
            aria-label="Previous slide"
            on:click={prev}
        >
            <slot name="prev"><span>&lsaquo;</span></slot>
        </button>

        <button
            type="button"
            class={`absolute ${arrowPosition === "inside" ? "right-2" : "right-[-3rem]"} top-1/2 -translate-y-1/2 ${arrowColor} p-2 ${arrowShape} shadow outline-none focus:ring ${arrowSize} ${arrowClass}`}
            aria-label="Next slide"
            on:click={next}
        >
            <slot name="next"><span>&rsaquo;</span></slot>
        </button>
    {/if}

    <!-- Pagination -->
    {#if showDots && items.length > 1}
        <div
            class={`absolute ${paginationPosition === "bottom" ? "bottom-2" : "top-2"} left-1/2 -translate-x-1/2 flex items-center gap-2 ${dotsContainerClass}`}
        >
            {#each items as _, i}
                {#if paginationType === "dots"}
                    <button
                        type="button"
                        class={`w-3 h-3 rounded-full bg-gray-400/70 hover:bg-gray-500 transition ${dotClass} ${i === current ? dotActiveClass : ""}`}
                        aria-label={`Go to slide ${i + 1}`}
                        aria-current={i === current ? "true" : "false"}
                        on:click={() => goTo(i)}
                    />
                {:else if paginationType === "lines"}
                    <div
                        class={`h-1 w-6 bg-gray-400/70 ${dotClass} ${i === current ? dotActiveClass : ""}`}
                        on:click={() => goTo(i)}
                    />
                {:else if paginationType === "numbers"}
                    <button
                        type="button"
                        class={`px-2 py-1 text-sm bg-gray-200 rounded ${dotClass} ${i === current ? dotActiveClass : ""}`}
                        on:click={() => goTo(i)}
                    >
                        {i + 1}
                    </button>
                {/if}
            {/each}
        </div>
    {/if}
</div>
