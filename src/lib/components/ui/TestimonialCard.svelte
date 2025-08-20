<script lang="ts">
    export let id: string | number = "";
    export let content: string = "This is a testimonial text.";
    export let authorName: string = "John Doe";
    export let authorTitle: string = "CEO, Company";
    export let avatarUrl: string = "";
    export let rating: number | null = null; // 1–5 or null

    // Direction
    export let direction: "ltr" | "rtl" = "ltr";

    // Avatar options
    export let avatarSize: number = 60;
    export let avatarShape: "circle" | "square" = "circle";
    export let avatarBorder: string = "2px solid #e5e7eb";

    // Class customizations
    export let wrapperClass: string =
        "bg-white p-6 rounded-2xl shadow hover:shadow-lg transition flex flex-col items-center";
    export let avatarClass: string = "";
    export let contentClass: string =
        "text-gray-600 text-base leading-relaxed mt-4 text-center";
    export let nameClass: string = "text-lg font-semibold mt-4 text-center";
    export let titleClass: string = "text-sm text-gray-500 text-center mt-1";
    export let ratingWrapperClass: string = "flex justify-center gap-1 mt-2";
    export let starClass: string = "";

    // Rating customization
    export let showRating: boolean = true;
    export let starSize: number = 18;
    export let starFilledColor: string = "#fbbf24"; // amber-400
    export let starEmptyColor: string = "#e5e7eb"; // gray-200
    export let starIcon: string = "★"; // could replace with custom svg
</script>

<div class={`${wrapperClass}`} dir={direction}>
    {#if avatarUrl}
        <img
            src={avatarUrl}
            alt={authorName}
            class={avatarClass}
            style="
                width: {avatarSize}px;
                height: {avatarSize}px;
                border: {avatarBorder};
                border-radius: {avatarShape === 'circle' ? '50%' : '0'};
                object-fit: cover;
            "
        />
    {/if}

    <p class={contentClass}>{content}</p>

    <p class={nameClass}>{authorName}</p>
    <p class={titleClass}>{authorTitle}</p>

    {#if rating && showRating}
        <div class={ratingWrapperClass}>
            {#each Array(5) as _, i}
                <span
                    class={starClass}
                    style="
                        font-size: {starSize}px;
                        color: {i < rating ? starFilledColor : starEmptyColor};
                    "
                >
                    {starIcon}
                </span>
            {/each}
        </div>
    {/if}

    <slot />
</div>
