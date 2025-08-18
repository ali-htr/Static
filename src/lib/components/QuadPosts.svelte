<!-- QuadPosts.svelte -->
<script>
    import BlogCard from "$lib/components/ui/BlogCard.svelte";
    import Repeater from "$lib/components/ui/Repeater.svelte";

    export let cards = [];
    export let data;
    export let fields;
    export let sort;
    export let repeater;
    export let category;
    export let classNames = {};
</script>

<!-- Use Repeater with BlogCard -->
<Repeater
    component={BlogCard}
    items={cards.data}
    hideNavigation={false}
    display="flex"
    direction="ltr"
    componentProps={{ classNames }}
/>
