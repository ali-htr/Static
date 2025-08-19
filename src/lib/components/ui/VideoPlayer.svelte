<script lang="ts">
    import { createEventDispatcher, onMount } from "svelte";
    import type { SvelteComponent } from "svelte";
    import { X, Play } from "lucide-svelte";

    // ======= Public props (API) =======
    export let source: string; // Video URL or file path
    export let platform: "auto" | "youtube" | "vimeo" | "dailymotion" | "self" =
        "self";

    // Playback options
    export let autoplay: boolean = false;
    export let mute: boolean = false;
    export let loop: boolean = false;
    export let controls: boolean = true;
    export let startTime: number = 0; // seconds
    export let endTime: number | null = null; // seconds or null

    // Loading/Privacy
    export let lazy: boolean = false; // show cover + load only on click
    export let privacy: boolean = false; // YouTube/Vimeo privacy mode

    // Cover (thumbnail) overlay
    export let coverImage: string | null = null; // shown when lazy or lightbox
    export let coverResolution: "thumb" | "full" | "custom" = "thumb"; // reserved for your pipeline

    // Play icon (customizable)
    export let playIcon: typeof SvelteComponent | any = Play;
    export let iconSize: string = "64px";
    export let iconColor: string = "white";
    export let iconShadow: string = "drop-shadow-md";

    // Lightbox popup
    export let lightbox: boolean = false;

    // Appearance
    export let aspectRatio: string = "16/9"; // CSS aspect-ratio
    export let filters: string = ""; // Tailwind filters classes
    export let controlsColor: string = ""; // Hex like "#ff0000" (used where supported)

    // Provider-specific options (e.g. YouTube modestBranding, Vimeo title/byline/portrait)
    export let platformOptions: Record<string, any> = {};

    // ======= Internal state =======
    const dispatch = createEventDispatcher();
    let showLightbox = false; // visible popup
    let revealed = false; // was lazy video revealed inline by user click?
    let computedPlatform: "youtube" | "vimeo" | "dailymotion" | "self" = "self";
    let iframeSrc = ""; // embed URL for iframe-based providers
    let videoEl: HTMLVideoElement | null = null;

    // ======= Helpers: platform detection + ID extraction =======
    function detectPlatform(
        url: string,
    ): "youtube" | "vimeo" | "dailymotion" | "self" {
        const u = url.toLowerCase();
        if (u.includes("youtube.com") || u.includes("youtu.be"))
            return "youtube";
        if (u.includes("vimeo.com")) return "vimeo";
        if (u.includes("dailymotion.com") || u.includes("dai.ly"))
            return "dailymotion";
        // very naive self-host guess (extensions)
        if (/\.(mp4|webm|ogg|m3u8|mov)(\?|#|$)/i.test(u)) return "self";
        return "self";
    }

    function extractYouTubeId(url: string): string | null {
        // Handles: watch?v=, youtu.be/, embed/, shorts/
        const re =
            /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;
        const m = url.match(re);
        if (m?.[1]) return m[1];
        // fallback for "v=" query
        const q = /[?&]v=([A-Za-z0-9_-]{11})/.exec(url);
        return q?.[1] ?? null;
    }

    function extractVimeoId(url: string): string | null {
        // Handles: vimeo.com/12345678 or vimeo.com/video/12345678
        const re = /vimeo\.com\/(?:video\/)?(\d+)/;
        return url.match(re)?.[1] ?? null;
    }

    function extractDailymotionId(url: string): string | null {
        // Handles: dailymotion.com/video/x7u5xph or dai.ly/x7u5xph
        const m1 = /dailymotion\.com\/video\/([A-Za-z0-9]+)/.exec(url);
        if (m1?.[1]) return m1[1];
        const m2 = /dai\.ly\/([A-Za-z0-9]+)/.exec(url);
        return m2?.[1] ?? null;
    }

    function stripHash(hex: string): string {
        // Vimeo expects hex without '#', Dailymotion ui-highlight expects hex string
        return hex?.startsWith("#") ? hex.slice(1) : hex;
    }

    // ======= Build embed URL for iframe providers =======
    function buildEmbedUrl(
        plat: "youtube" | "vimeo" | "dailymotion",
        url: string,
        opts: {
            shouldAutoplay: boolean;
            mute: boolean;
            loop: boolean;
            controls: boolean;
            start?: number;
            end?: number | null;
            privacy?: boolean;
            controlsColor?: string; // hex
            platformOptions?: Record<string, any>;
        },
    ): string {
        const {
            shouldAutoplay,
            mute,
            loop,
            controls,
            start = 0,
            end = null,
            privacy,
            controlsColor,
            platformOptions,
        } = opts;

        if (plat === "youtube") {
            const id = extractYouTubeId(url) ?? url; // fallback if provided raw ID
            const base = privacy
                ? `https://www.youtube-nocookie.com/embed/${id}`
                : `https://www.youtube.com/embed/${id}`;
            const q: string[] = [];
            if (start > 0) q.push(`start=${Math.floor(start)}`);
            if (end && end > start) q.push(`end=${Math.floor(end)}`);
            if (shouldAutoplay) q.push("autoplay=1");
            if (mute) q.push("mute=1");
            if (!controls) q.push("controls=0");
            if (loop) {
                q.push("loop=1");
                q.push(`playlist=${id}`); // required by YouTube for loop
            }
            if (platformOptions?.modestBranding) q.push("modestbranding=1");
            if (platformOptions?.rel === false) q.push("rel=0"); // related videos limited to same channel
            return `${base}?${q.join("&")}`;
        }

        if (plat === "vimeo") {
            const id = extractVimeoId(url) ?? url; // fallback if raw ID
            const base = `https://player.vimeo.com/video/${id}`;
            const q: string[] = [];
            if (shouldAutoplay) q.push("autoplay=1");
            if (mute) q.push("muted=1");
            if (loop) q.push("loop=1");
            if (controls === false) q.push("controls=0");
            if (platformOptions?.title === false) q.push("title=0");
            if (platformOptions?.byline === false) q.push("byline=0");
            if (platformOptions?.portrait === false) q.push("portrait=0");
            if (privacy) q.push("dnt=1"); // Vimeo Do-Not-Track
            if (controlsColor)
                q.push(`color=${encodeURIComponent(stripHash(controlsColor))}`);
            // Vimeo uses hash for t=... -> ensure after query
            const query = q.length ? `?${q.join("&")}` : "";
            const hash = start > 0 ? `#t=${Math.floor(start)}s` : "";
            return `${base}${query}${hash}`;
        }

        // Dailymotion
        const id = extractDailymotionId(url) ?? url; // fallback if raw ID
        const base = `https://www.dailymotion.com/embed/video/${id}`;
        const q: string[] = [];
        if (shouldAutoplay) q.push("autoplay=1");
        if (mute) q.push("mute=1");
        if (loop) q.push("loop=1");
        if (controls === false) q.push("controls=0");
        if (typeof start === "number" && start > 0)
            q.push(`start=${Math.floor(start)}`);
        // Optional polish (some params may change over time)
        if (controlsColor)
            q.push(
                `ui-highlight=${encodeURIComponent(stripHash(controlsColor))}`,
            );
        if (platformOptions?.uiLogo === false) q.push("ui-logo=0");
        if (platformOptions?.queueAutoplayNext === false)
            q.push("queue-autoplay-next=0");
        return `${base}?${q.join("&")}`;
    }

    // ======= Derived state =======
    // If platform is "auto", detect from source once mounted / reactive
    $: computedPlatform =
        platform === "auto" ? detectPlatform(source) : (platform as any);

    // If user clicked play (lazy), we want autoplay regardless of initial prop
    let userInitiated = false;
    $: shouldAutoplay = autoplay || userInitiated;

    // Keep iframeSrc in sync with props/state for iframe providers
    $: {
        if (computedPlatform !== "self") {
            iframeSrc = buildEmbedUrl(computedPlatform as any, source, {
                shouldAutoplay,
                mute,
                loop,
                controls,
                start: startTime,
                end: endTime,
                privacy,
                controlsColor,
                platformOptions,
            });
        } else {
            iframeSrc = "";
        }
    }

    // ======= Interaction handlers =======
    function canClickToPlay(): boolean {
        // Click-to-play if:
        // - lazy mode (for inline reveal), or
        // - lightbox mode (always open popup)
        return !!(lightbox || lazy);
    }

    function onActivate() {
        // Triggered by click or keyboard
        userInitiated = true;
        if (lightbox) {
            showLightbox = true;
            dispatch("openlightbox");
        } else if (lazy) {
            revealed = true; // reveal inline player
            dispatch("reveal");
        }
    }

    function onKeydown(e: KeyboardEvent) {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onActivate();
        }
    }

    // Hook up basic media events for self-hosted to re-emit outside
    function bindSelfHostedEvents(el: HTMLVideoElement | null) {
        videoEl = el;
        if (!videoEl) return;
        const onPlay = () => dispatch("play");
        const onPause = () => dispatch("pause");
        const onEnded = () => dispatch("ended");
        videoEl.addEventListener("play", onPlay);
        videoEl.addEventListener("pause", onPause);
        videoEl.addEventListener("ended", onEnded);

        // Clean up
        const cleanup = () => {
            videoEl?.removeEventListener("play", onPlay);
            videoEl?.removeEventListener("pause", onPause);
            videoEl?.removeEventListener("ended", onEnded);
        };
        // ensure cleanup if component is destroyed
        onMount(() => cleanup);
    }
</script>

<!--
  Container:
  - Click/keyboard activates only when lazy or lightbox are enabled.
  - aspect-ratio ensures sizing without CLS.
-->
<div
    class={`relative w-full ${canClickToPlay() ? "cursor-pointer" : ""}`}
    style={`aspect-ratio: ${aspectRatio};`}
    role={canClickToPlay() ? "button" : undefined}
    tabindex={canClickToPlay() ? 0 : undefined}
    aria-label={canClickToPlay() ? "Play video" : undefined}
    on:click={canClickToPlay() ? onActivate : undefined}
    on:keydown={canClickToPlay() ? onKeydown : undefined}
>
    {#if coverImage && (lazy || lightbox) && !revealed && !showLightbox}
        <!-- Cover image + play icon (only before reveal or popup) -->
        <img
            src={coverImage}
            alt="Video cover"
            class="absolute inset-0 w-full h-full object-cover"
            draggable="false"
        />
        <div class="absolute inset-0 flex items-center justify-center">
            <svelte:component
                this={playIcon}
                class={iconShadow}
                style={`width:${iconSize};height:${iconSize};color:${iconColor};`}
                aria-hidden="true"
            />
        </div>
    {/if}

    {#if (!lazy || revealed) && !lightbox}
        {#if computedPlatform === "self"}
            <!-- Self-hosted video (native <video/>) -->
            <video
                bind:this={videoEl}
                src={source}
                autoplay={shouldAutoplay}
                muted={mute}
                {loop}
                {controls}
                playsinline
                poster={coverImage ?? undefined}
                class={`w-full h-full object-cover ${filters}`}
                style={`aspect-ratio: ${aspectRatio};`}
                on:loadeddata={() => bindSelfHostedEvents(videoEl)}
            />
        {:else}
            <!-- Iframe-based providers -->
            <iframe
                src={iframeSrc}
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowfullscreen
                class={`w-full h-full ${filters}`}
                style={`aspect-ratio: ${aspectRatio};`}
                frameborder="0"
                title="Embedded video player"
            />
        {/if}
    {/if}
</div>

<!-- Lightbox modal -->
{#if showLightbox}
    <div
        class="fixed inset-0 bg-black/80 flex items-center justify-center z-50"
    >
        <button
            class="absolute top-4 right-4 text-white"
            on:click={() => {
                showLightbox = false;
                dispatch("closelightbox");
            }}
            aria-label="Close video"
        >
            <X class="w-6 h-6" />
        </button>

        <div class="w-11/12 max-w-4xl">
            {#if computedPlatform === "self"}
                <video
                    src={source}
                    autoplay
                    controls
                    {loop}
                    muted={mute}
                    playsinline
                    poster={coverImage ?? undefined}
                    class="w-full h-auto"
                />
            {:else}
                <iframe
                    src={buildEmbedUrl(computedPlatform, source, {
                        shouldAutoplay: true, // force autoplay in lightbox
                        mute,
                        loop,
                        controls,
                        start: startTime,
                        end: endTime,
                        privacy,
                        controlsColor,
                        platformOptions,
                    })}
                    allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                    allowfullscreen
                    class="w-full h-[70vh]"
                    frameborder="0"
                    title="Embedded video player (lightbox)"
                />
            {/if}
        </div>
    </div>
{/if}
