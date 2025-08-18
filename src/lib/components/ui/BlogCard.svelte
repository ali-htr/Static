<script>
  export let title;
  export let excerpt;
  export let category;
  export let image;
  export let permalink;

  // Default empty classNames for maximum customization
  export let classNames = {
    rootClass: "",         // outer wrapper
    imageClass: "",        // blog image
    titleClass: "",        // blog title
    excerptClass: "",      // blog excerpt
    categoryClass: ""      // category button
  };
</script>

<a
  href={permalink}
  class={`block rounded-2xl shadow p-4 bg-white hover:shadow-lg transition ${classNames.rootClass}`}
>
  <!-- Blog Image -->
  <img
    src={image}
    alt={title}
    class={`w-full h-40 object-cover mb-4 rounded-lg ${classNames.imageClass}`}
    on:dragstart={event => event.preventDefault()}
  />

  <!-- Title -->
  <h3 class={`text-lg font-semibold mb-2 ${classNames.titleClass}`}>
    {title}
  </h3>

  <!-- Excerpt -->
  <p class={`text-sm text-gray-600 mb-4 ${classNames.excerptClass}`}>
    {excerpt}
  </p>

  <!-- Category Button -->
  {#if category}
    <button
      class={`rounded-full border cursor-pointer border-[#FF6C2B] hover:bg-secondary transition-all duration-300 hover:text-white text-secondary text-xs px-3 py-1 ${classNames.categoryClass}`}
    >
      {category}
    </button>
  {/if}
</a>
