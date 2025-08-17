<script>
    import ProductCard from "$lib/components/ui/ProductCard.svelte";
    import Repeater from "$lib/components/ui/Repeater.svelte";

    export let cards = [];
    export let data;
    export let sale = "false";
    export let mojood = "false";
    export let fields;
    export let sort;
    export let repeater;
    export let category;

    // Custom class names
    export let nameClass = "text-lg font-bold text-blue-500";
    export let brandClass = "text-sm text-gray-500";
    export let priceClass = "text-xl font-bold text-red-600";
    export let regularPriceClass = "line-through text-gray-400";
    export let salePriceClass = "text-green-500";
    export let imageClass = "rounded-md shadow-lg";
</script>

<Repeater
    component={ProductCard}
    items={cards.data}
    hideNavigation={false}
    display="flex"
    direction="ltr"
    {classNames}
/>
