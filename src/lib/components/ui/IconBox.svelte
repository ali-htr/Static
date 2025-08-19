<!-- IconBox.svelte -->
<script>
  export let icon = { source: "svg", value: "" }; // svg, font, url
  export let title = "";
  export let description = "";
  export let link = null; // { href, target, rel }

  export let iconPosition = "top"; // top | left | right

  // Class overrides
  export let wrapperClass = "flex flex-col items-center text-center gap-2";
  export let iconClass = "text-4xl text-blue-500";
  export let titleClass = "text-lg font-semibold text-gray-900";
  export let descriptionClass = "text-sm text-gray-600";
</script>

{#if link}
  <a href={link.href} target={link.target} rel={link.rel} class={wrapperClass}>
    <slot name="icon">
      <span class={iconClass}>
        {#if icon.source === "svg"}
          {@html icon.value}
        {:else if icon.source === "font"}
          <i class={icon.value}></i>
        {:else if icon.source === "url"}
          <img src={icon.value} alt="icon" class="w-8 h-8" />
        {/if}
      </span>
    </slot>

    <slot name="title">
      <div class={titleClass}>{title}</div>
    </slot>

    <slot name="description">
      <div class={descriptionClass}>{description}</div>
    </slot>
  </a>
{:else}
  <div
    class={
      iconPosition === "left"
        ? `flex items-center gap-3 text-left ${wrapperClass}`
        : iconPosition === "right"
        ? `flex items-center gap-3 text-right flex-row-reverse ${wrapperClass}`
        : wrapperClass
    }
  >
    <slot name="icon">
      <span class={iconClass}>
        {#if icon.source === "svg"}
          {@html icon.value}
        {:else if icon.source === "font"}
          <i class={icon.value}></i>
        {:else if icon.source === "url"}
          <img src={icon.value} alt="icon" class="w-8 h-8" />
        {/if}
      </span>
    </slot>

    <div class="flex flex-col">
      <slot name="title">
        <div class={titleClass}>{title}</div>
      </slot>
      <slot name="description">
        <div class={descriptionClass}>{description}</div>
      </slot>
    </div>
  </div>
{/if}
