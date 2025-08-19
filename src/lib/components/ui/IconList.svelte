<script>
    export let items = [];
    export let showDivider = false;
    export let dividerStyle = "solid";
    export let dividerWeight = "1px";
    export let dividerColor = "#ddd";
    export let dividerWidth = "100%";
    export let layout = "vertical"; // vertical | horizontal
    export let align = "center"; // start | center | end
    export let spacing = "10px";
</script>

<div class="w-full">
    <ul
        class={`flex ${layout === "horizontal" ? "flex-row flex-wrap" : "flex-col"} items-${align} p-0 m-0 list-none`}
        style="gap: {spacing};"
    >
        {#each items as { id, text, icon, link }, index}
            <li class="flex items-center gap-2" key={id}>
                {#if link}
                    <a
                        href={link.href}
                        target={link.target}
                        rel={link.rel}
                        class="flex items-center gap-2 no-underline transition-colors hover:text-blue-500"
                    >
                        {#if typeof icon === "function"}
                            <svelte:component this={icon} class="w-5 h-5" />
                        {:else if icon?.source === "svg"}
                            {@html icon.value}
                        {:else if icon?.source === "font"}
                            <i class={icon.value}></i>
                        {:else if icon?.source === "url"}
                            <img src={icon.value} alt="icon" class="w-4 h-4" />
                        {/if}
                        <span class="text-gray-800 ml-2">{text}</span>
                    </a>
                {:else}
                    <div class="flex items-center gap-2">
                        {#if typeof icon === "function"}
                            <svelte:component this={icon} class="w-5 h-5" />
                        {:else if icon?.source === "svg"}
                            {@html icon.value}
                        {:else if icon?.source === "font"}
                            <i class={icon.value}></i>
                        {:else if icon?.source === "url"}
                            <img src={icon.value} alt="icon" class="w-4 h-4" />
                        {/if}
                        <span class="text-gray-800 ml-2">{text}</span>
                    </div>
                {/if}

                {#if showDivider && index !== items.length - 1}
                    <div
                        class={layout === "horizontal"
                            ? "h-full ml-2"
                            : "w-full mt-2"}
                        style={layout === "horizontal"
                            ? `border-left: ${dividerWeight} ${dividerStyle} ${dividerColor}; height: ${dividerWidth};`
                            : `border-top: ${dividerWeight} ${dividerStyle} ${dividerColor}; width: ${dividerWidth};`}
                    ></div>
                {/if}
            </li>
        {/each}
    </ul>
</div>
