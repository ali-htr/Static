<script lang="ts">
    export let url: string =
        typeof window !== "undefined" ? window.location.href : "";
    export let title: string = "Check this out!";
    export let text: string = "I found this interesting:";
    export let buttonClass: string =
        "px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700";
    export let menuClass: string =
        "absolute mt-2 w-40 bg-white shadow-lg rounded-lg p-2 z-50";
    export let showLabel: boolean = true;

    let isOpen = false;

    function toggleMenu() {
        isOpen = !isOpen;
    }

    async function shareNative() {
        if (navigator.share) {
            try {
                await navigator.share({ title, text, url });
                return true;
            } catch (err) {
                console.error("Share cancelled:", err);
            }
        }
        return false;
    }

    function encode(u: string) {
        return encodeURIComponent(u);
    }

    const networks = [
        {
            name: "Twitter",
            href: (url: string, text: string) =>
                `https://twitter.com/intent/tweet?url=${encode(url)}&text=${encode(text)}`,
        },
        {
            name: "LinkedIn",
            href: (url: string, text: string) =>
                `https://www.linkedin.com/shareArticle?mini=true&url=${encode(url)}&title=${encode(text)}`,
        },
        {
            name: "Telegram",
            href: (url: string, text: string) =>
                `https://t.me/share/url?url=${encode(url)}&text=${encode(text)}`,
        },
        {
            name: "WhatsApp",
            href: (url: string, text: string) =>
                `https://wa.me/?text=${encode(text)}%20${encode(url)}`,
        },
    ];
</script>

<div class="relative inline-block">
    <button
        class={buttonClass}
        on:click={async () => {
            const handled = await shareNative();
            if (!handled) toggleMenu();
        }}
    >
        📤 {#if showLabel}
            Share
        {/if}
    </button>

    {#if isOpen}
        <div class={menuClass}>
            {#each networks as net}
                <a
                    href={net.href(url, text)}
                    target="_blank"
                    rel="noopener noreferrer"
                    class="block px-3 py-2 rounded hover:bg-gray-100"
                >
                    {net.name}
                </a>
            {/each}
        </div>
    {/if}
</div>
