<script>
    import { onMount } from "svelte";

    // Props (same as defineProps in Vue)
    export let bgImg = "";
    export let mainText = "";
    export let subText = "";
    export let showBtn = false;
    export let btnText = "Click me";
    export let btnLink = "#";
    export let bannerLink = "";
    export let containerClasses = "";
    export let mainTextClasses = "";
    export let subTextClasses = "";
    export let btnClasses = "";
    export let mainTag = false;

    let bannerContainerRef;

    // lifecycle (same as onMounted in Vue)
    onMount(() => {
        setTimeout(() => {
            bannerContainerRef?.classList.add("is-visible");
        }, 50);
        window.console.log("Props:", {
            bgImg,
            mainText,
            subText,
            showBtn,
            btnText,
            btnLink,
            bannerLink,
            containerClasses,
            mainTextClasses,
            subTextClasses,
            btnClasses,
            mainTag,
        });
    });

    // same logic as computed in Vue
    $: bannerTag = !showBtn && bannerLink ? "a" : "div";

    function resolveImagePath(path) {
        if (!path) return "";
        if (path.startsWith("~/")) {
            return path.replace("~/", "");
        }
        if (path.startsWith("/assets/")) {
            return path.substring(1);
        }
        return path;
    }

    $: bannerStyle = bgImg
        ? {
              backgroundImage: `url('${resolveImagePath(bgImg)}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
          }
        : {};
</script>

<svelte:element
    this={bannerTag}
    href={!showBtn && bannerLink ? bannerLink : null}
    bind:this={bannerContainerRef}
    class="banner-container relative overflow-hidden {containerClasses}"
    style={bannerStyle}
>
    {#if mainText}
        <svelte:element
            this={mainTag ? "h1" : "h3"}
            class="opacity-0 translate-y-5 transition-all duration-500 ease-in-out
             [.is-visible_&]:opacity-100 [.is-visible_&]:translate-y-0 {mainTextClasses}"
            style="transition-delay: 0.2s"
        >
            {mainText}
        </svelte:element>
    {/if}

    {#if subText}
        <p
            class="opacity-0 translate-y-5 transition-all duration-500 ease-in-out
             [.is-visible_&]:opacity-100 [.is-visible_&]:translate-y-0 {subTextClasses}"
            style="transition-delay: 0.4s"
        >
            {subText}
        </p>
    {/if}

    {#if showBtn}
        <a
            class="flex opacity-0 translate-y-5 transition-all duration-500 ease-in-out
             [.is-visible_&]:opacity-100 [.is-visible_&]:translate-y-0 {btnClasses}"
            href={btnLink}
        >
            {btnText}
        </a>
    {/if}
</svelte:element>

<style>
    /* keep same place as <style> in Vue file */
</style>
