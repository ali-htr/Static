<script lang="ts">
    import { Twitter, Linkedin, Send, MessageCircle, Mail } from "lucide-svelte";

    export let url: string =
        typeof window !== "undefined" ? window.location.href : "";
    export let title: string = "Check this out!";
    export let text: string = "I found this interesting:";
    export let buttonClass: string =
        "px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700";
    export let menuClass: string =
        "absolute mt-2 w-48 bg-white shadow-lg rounded-lg p-2 z-50";
    export let itemClass: string =
        "flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-100";
    export let showLabel: boolean = true;
    export let direction: "ltr" | "rtl" = "ltr";

    export type Network = {
        name: string;
        icon?: any; // Component, SVG, emoji, etc.
        href: (url: string, text: string) => string;
    };

    export let networks: Network[] = [
        {
            name: "Twitter",
            icon: Twitter,
            href: (url, text) =>
                `https://twitter.com/intent/tweet?url=${encode(url)}&text=${encode(text)}`,
        },
        {
            name: "LinkedIn",
            icon: Linkedin,
            href: (url, text) =>
                `https://www.linkedin.com/shareArticle?mini=true&url=${encode(url)}&title=${encode(text)}`,
        },
        {
            name: "Telegram",
            icon: Send,
            href: (url, text) =>
                `https://t.me/share/url?url=${encode(url)}&text=${encode(text)}`,
        },
        {
            name: "WhatsApp",
            icon: MessageCircle,
            href: (url, text) =>
                `https://wa.me/?text=${encode(text)}%20${encode(url)}`,
        },
        {
            name: "Email",
            icon: Mail,
            href: (url, text) =>
                `mailto:?subject=${encode(text)}&body=${encode(url)}`,
        },
    ];

    let isOpen = false;

    function toggleMenu() {
        isOpen = !isOpen;
    }

    async function shareNative() {
        if (navigator.share) {
            try {
                await navigator.share({ title, text, url });
                return true;
            } catch {
                return false;
            }
        }
        return false;
    }

    function encode(u: string) {
        return encodeURIComponent(u);
    }

    // Close when clicking outside
    function handleClickOutside(event: MouseEvent) {
        const target = event.target as HTMLElement;
        if (!target.closest(".share-button-wrapper")) {
            isOpen = false;
        }
    }

    if (typeof window !== "undefined") {
        window.addEventListener("click", handleClickOutside);
    }
</script>

<div class="relative inline-block share-button-wrapper" dir={direction}>
    <button
        class={buttonClass}
        aria-expanded={isOpen}
        on:click={async () => {
            const handled = await shareNative();
            if (!handled) toggleMenu();
        }}
    >
        📤 {#if showLabel} Share {/if}
    </button>

    {#if isOpen}
        <div
            class={menuClass}
            style="text-align:{direction === 'rtl' ? 'right' : 'left'}"
        >
            {#each networks as net}
                <a
                    href={net.href(url, text)}
                    target="_blank"
                    rel="noopener noreferrer"
                    class={itemClass}
                >
                    {#if net.icon}
                        <svelte:component this={net.icon} class="w-4 h-4" />
                    {/if}
                    <span>{net.name}</span>
                </a>
            {/each}
        </div>
    {/if}
</div>
