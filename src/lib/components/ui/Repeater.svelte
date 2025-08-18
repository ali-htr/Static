<!-- Repeater.svelte -->
<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { ChevronLeft, ChevronRight } from "lucide-svelte";

  interface RepeaterItem {
    id?: string | number;
    value?: string;
    children?: string;
    [key: string]: any;
  }

  // Props
  export let component: any;
  export let items: RepeaterItem[] = [];
  export let componentProps: Record<string, any> = {};
  export let display: "grid" | "flex" = "flex";
  export let gridCols: number = 3;
  export let hideNavigation: boolean = true;
  export let containerClass: string = "";
  export let direction: "ltr" | "rtl" = "ltr";

  let scrollContainer: HTMLElement;

  // Drag/inertia state
  let isDragging = false;
  let startX = 0;
  let scrollLeft = 0;
  let velocityX = 0;
  let animationFrameId: number | null = null;

  // Button states
  let canPrev = false;
  let canNext = false;

  // --- Detect RTL scroll behavior (SSR-safe) ---
  type RtlType = "negative" | "default" | "reverse";
  let rtlType: RtlType = "default";

  function detectRtlScrollType(): RtlType {
    if (typeof document === "undefined") return "default";
    const outer = document.createElement("div");
    outer.style.width = "50px";
    outer.style.height = "50px";
    outer.style.overflow = "scroll";
    outer.style.direction = "rtl";
    outer.style.visibility = "hidden";
    outer.style.position = "absolute";
    outer.style.top = "-9999px";

    const inner = document.createElement("div");
    inner.style.width = "100px";
    inner.style.height = "100px";

    outer.appendChild(inner);
    document.body.appendChild(outer);

    outer.scrollLeft = 1;
    if (outer.scrollLeft === 0) {
      // WebKit/Blink: "negative" (start = 0, left = negative)
      document.body.removeChild(outer);
      return "negative";
    }
    outer.scrollLeft = 0;
    if (outer.scrollLeft === 0) {
      // Firefox: "default" (start = max, left = 0)
      document.body.removeChild(outer);
      return "default";
    }
    // Old IE: "reverse"
    document.body.removeChild(outer);
    return "reverse";
  }

  // --- Normalize scroll position across browsers ---
  function getLogicalPos(el: HTMLElement, dir: "ltr" | "rtl") {
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    const raw = el.scrollLeft;

    if (dir === "rtl") {
      // We want: pos = 0 at visual start (right), pos = max at end (left)
      switch (rtlType) {
        case "negative":
          // Start 0, left is negative
          return { pos: -raw, max };
        case "reverse":
          // Start 0, increases to the left
          return { pos: raw, max };
        case "default":
        default:
          // Start raw = max, end raw = 0
          return { pos: max - raw, max };
      }
    }
    // LTR: natural
    return { pos: raw, max };
  }

  const updateCanScroll = () => {
    if (!scrollContainer) {
      canPrev = false;
      canNext = false;
      return;
    }
    const { pos, max } = getLogicalPos(scrollContainer, direction);
    const EPS = 1; // tolerance for rounding
    canPrev = pos > EPS;
    canNext = pos < max - EPS;
  };

  const handleScroll = () => updateCanScroll();

  const scrollPrevious = () => {
    if (!scrollContainer) return;
    const scrollAmount = scrollContainer.clientWidth * 0.8;

    if (direction === "rtl") {
      // RTL: previous = move right
      scrollContainer.scrollBy({ left: scrollAmount, behavior: "smooth" });
    } else {
      // LTR: previous = move left
      scrollContainer.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    }
  };

  const scrollNext = () => {
    if (!scrollContainer) return;
    const scrollAmount = scrollContainer.clientWidth * 0.8;

    if (direction === "rtl") {
      // RTL: next = move left
      scrollContainer.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    } else {
      // LTR: next = move right
      scrollContainer.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const inertiaLoop = () => {
    if (!scrollContainer) return;

    // Use the native property; normalization is only for button state logic.
    scrollContainer.scrollLeft += velocityX;
    velocityX *= 0.95;
    updateCanScroll();

    if (Math.abs(velocityX) > 0.5) {
      animationFrameId = requestAnimationFrame(inertiaLoop);
    } else {
      scrollContainer.style.scrollBehavior = "smooth";
      scrollContainer.classList.add("snap-x", "snap-mandatory");
      scrollContainer.style.cursor = "grab";
      scrollContainer.style.userSelect = "auto";
      animationFrameId = null;
    }
  };

  const startDrag = (e: MouseEvent | TouchEvent) => {
    if (!scrollContainer) return;

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    isDragging = true;

    const pageX = e instanceof MouseEvent ? e.pageX : e.touches[0].pageX;
    startX = pageX - scrollContainer.offsetLeft;
    scrollLeft = scrollContainer.scrollLeft;
    velocityX = 0;

    scrollContainer.style.scrollBehavior = "auto";
    scrollContainer.classList.remove("snap-x", "snap-mandatory");
    scrollContainer.style.cursor = "grabbing";
    scrollContainer.style.userSelect = "none";
  };

  const onDrag = (e: MouseEvent | TouchEvent) => {
    if (!isDragging || !scrollContainer) return;
    e.preventDefault();

    const pageX = e instanceof MouseEvent ? e.pageX : e.touches[0].pageX;
    const currentX = pageX - scrollContainer.offsetLeft;

    const walk = (startX - currentX) * 0.8;
    const newScrollLeft = scrollLeft + walk;

    velocityX = newScrollLeft - scrollContainer.scrollLeft;
    scrollContainer.scrollLeft = newScrollLeft;
    updateCanScroll();
  };

  const stopDrag = () => {
    if (!isDragging || !scrollContainer) return;
    isDragging = false;
    inertiaLoop();
  };

  let resizeObs: ResizeObserver | null = null;

  onMount(() => {
    // Detect RTL type once (important for first render states)
    rtlType = detectRtlScrollType();

    if (scrollContainer && display === "flex") {
      scrollContainer.style.cursor = "grab";
    }

    updateCanScroll();

    const onResize = () => updateCanScroll();
    window.addEventListener("resize", onResize);

    // Keep states fresh when content size changes (images/fonts, etc.)
    if ("ResizeObserver" in window && scrollContainer) {
      resizeObs = new ResizeObserver(() => updateCanScroll());
      resizeObs.observe(scrollContainer);
    }

    return () => {
      window.removeEventListener("resize", onResize);
      if (resizeObs) {
        resizeObs.disconnect();
        resizeObs = null;
      }
    };
  });

  onDestroy(() => {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  });

  // reactive refresh when inputs change
  $: items, direction, updateCanScroll();
</script>

<div class="relative" dir={direction}>
  {#if display === "flex" && !hideNavigation}
    <div
      class="flex justify-between items-center absolute top-1/2 -translate-y-1/2 w-full pointer-events-none z-10"
    >
      {#if direction === "rtl"}
        <!-- RTL: Previous (move right) shows ChevronRight -->
        <button
          on:click={scrollPrevious}
          disabled={!canPrev}
          class="pointer-events-auto txs-w-40 txs-h-40 bg-white/80 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Scroll previous"
        >
          <ChevronRight class="txs-w-20 txs-h-20 text-primary" />
        </button>
        <!-- RTL: Next (move left) shows ChevronLeft -->
        <button
          on:click={scrollNext}
          disabled={!canNext}
          class="pointer-events-auto txs-w-40 txs-h-40 bg-white/80 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Scroll next"
        >
          <ChevronLeft class="txs-w-20 txs-h-20 text-primary" />
        </button>
      {:else}
        <!-- LTR: Previous (move left) -->
        <button
          on:click={scrollPrevious}
          disabled={!canPrev}
          class="pointer-events-auto txs-w-40 txs-h-40 bg-white/80 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Scroll previous"
        >
          <ChevronLeft class="txs-w-20 txs-h-20 text-primary" />
        </button>
        <!-- LTR: Next (move right) -->
        <button
          on:click={scrollNext}
          disabled={!canNext}
          class="pointer-events-auto txs-w-40 txs-h-40 bg-white/80 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Scroll next"
        >
          <ChevronRight class="txs-w-20 txs-h-20 text-primary" />
        </button>
      {/if}
    </div>
  {/if}

  <!-- Scroll Container -->
  <div
    bind:this={scrollContainer}
    class={`${
      display === "grid"
        ? "grid txs-mt-8"
        : "flex txs-mt-8 overflow-x-hidden txs-gap-4 scrollbar-hide snap-x snap-mandatory"
    } ${display === "grid" ? `txs-grid-cols-${gridCols}` : ""} ${containerClass}`}
    style={display === "grid"
      ? `grid-template-columns: repeat(${gridCols}, minmax(0, 1fr));`
      : "scroll-behavior: smooth;"}
    on:mousedown={startDrag}
    on:mousemove={onDrag}
    on:mouseup={stopDrag}
    on:mouseleave={stopDrag}
    on:touchstart={startDrag}
    on:touchmove={onDrag}
    on:touchend={stopDrag}
    on:scroll={handleScroll}
  >
    {#each items as item, idx (item.id ?? idx)}
      <svelte:component
        this={component}
        {...item}
        {...componentProps}
        class={display === "flex" ? "flex-shrink-0 snap-start" : ""}
      />
    {/each}
  </div>
</div>

<style>
  .scrollbar-hide {
    -ms-overflow-style: none; /* Internet Explorer 10+ */
    scrollbar-width: none; /* Firefox */
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none; /* Safari and Chrome */
  }
</style>
