<script>
  export let name;
  export let brand;
  export let regular_price;
  export let sale_price;
  export let image;
  export let permalink;

  export let classNames = {
    nameClass: "",
    brandClass: "",
    priceClass: "",
    regularPriceClass: "",
    salePriceClass: "",
    imageClass: "",
  };
</script>

<a
  href={permalink}
  class="block rounded-2xl shadow p-4 bg-white hover:shadow-lg transition"
>
  <img
    src={image}
    alt={name}
    class={`w-full h-40 object-contain mb-4 ${classNames.imageClass}`}
  />
  <h3
    class={`text-base font-semibold line-clamp-2 mb-1 ${classNames.nameClass}`}
  >
    {name}
  </h3>
  <p class={`text-sm text-gray-500 mb-2 ${classNames.brandClass}`}>{brand}</p>
  <div class="flex items-center justify-between">
    <span class={`text-primary font-bold ${classNames.salePriceClass}`}
      >{sale_price}</span
    >
    <span
      class={`text-gray-400 line-through text-sm ${classNames.regularPriceClass}`}
      >{regular_price}</span
    >
  </div>
</a>
