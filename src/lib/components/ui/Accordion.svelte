<script>
    import { ChevronDown } from "lucide-svelte";

    // داده‌ها
    export let items = [];
    export let accordion = true;
    export let defaultOpen = [];
    export let transitionSpeed = 300;
    export let titleTag = "h3"; // برای SEO

    // کلاس‌ها
    export let containerClass = "";
    export let itemClass = "";
    export let headerClass = "";
    export let titleClass = "";
    export let iconClass = "";
    export let contentClass = "";
    export let contentInnerClass = "";

    // آیکون‌ها
    export let icon = ChevronDown;
    export let iconActive = ChevronDown;

    export let iconPosition = "right"; // left | right
    export let iconRotation = 90; // درجه چرخش آیکون هنگام باز شدن

    let openItems = new Set(defaultOpen);

    const toggleItem = (id) => {
        if (accordion) {
            openItems = new Set(openItems.has(id) ? [] : [id]);
        } else {
            if (openItems.has(id)) {
                openItems.delete(id);
                openItems = new Set(openItems);
            } else {
                openItems.add(id);
                openItems = new Set(openItems);
            }
        }
    };

    const handleKeydown = (e, id) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            toggleItem(id);
        }
    };
</script>

<div class={`accordion-container ${containerClass}`}>
    {#each items as item (item.id)}
        <div
            class={`accordion-item ${itemClass}`}
            style="transition: all {transitionSpeed}ms ease;"
        >
            <!-- Header -->
            <div
                class={`accordion-header ${headerClass}`}
                role="button"
                aria-expanded={openItems.has(item.id)}
                aria-controls={`content-${item.id}`}
                id={`header-${item.id}`}
                tabindex="0"
                on:click={() => toggleItem(item.id)}
                on:keydown={(e) => handleKeydown(e, item.id)}
            >
                {#if iconPosition === "left"}
                    <span
                        class={`accordion-icon-left ${iconClass}`}
                        style="transition: transform {transitionSpeed}ms ease;"
                    >
                        {#if openItems.has(item.id)}
                            <svelte:component
                                this={iconActive}
                                style="transform: rotate({iconRotation}deg);"
                            />
                        {:else}
                            <svelte:component this={icon} />
                        {/if}
                    </span>
                {/if}

                <svelte:element
                    this={titleTag}
                    class={`accordion-title ${titleClass}`}
                >
                    {item.title}
                </svelte:element>

                {#if iconPosition === "right"}
                    <span
                        class={`accordion-icon-right ${iconClass}`}
                        style="transition: transform {transitionSpeed}ms ease;"
                    >
                        {#if openItems.has(item.id)}
                            <svelte:component
                                this={iconActive}
                                style="transform: rotate({iconRotation}deg);"
                            />
                        {:else}
                            <svelte:component this={icon} />
                        {/if}
                    </span>
                {/if}
            </div>

            <!-- Content -->
            <div
                id={`content-${item.id}`}
                class={`accordion-content ${contentClass}`}
                role="region"
                aria-labelledby={`header-${item.id}`}
                hidden={!openItems.has(item.id)}
                style="transition: max-height {transitionSpeed}ms ease; overflow: hidden;"
            >
                {#if openItems.has(item.id)}
                    <div
                        class={`accordion-content-inner ${contentInnerClass}`}
                        style="transition: opacity {transitionSpeed}ms ease;"
                        use:fade={{ duration: transitionSpeed }}
                    >
                        {@html item.content}
                    </div>
                {/if}
            </div>
        </div>
    {/each}
</div>
