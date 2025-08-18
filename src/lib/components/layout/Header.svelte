<!-- Header.svelte -->
<script>
    import { onMount, createEventDispatcher } from "svelte";
    import {
        Search,
        ShoppingCart,
        LogIn,
        Menu,
        ChevronDown,
        ChevronLeft,
        Dot,
        X,
        Sun,
        Moon
    } from "lucide-svelte";

    import { inView } from "$lib/actions/inView.js";
    import { fly } from "svelte/transition";

    const dispatch = createEventDispatcher();

    /* =========================
       CUSTOMIZATION PROPS
       ========================= */

    /** Visibility toggles */
    export let showLogo   = true;
    export let showMenu   = true;
    export let showSearch = true;
    export let showCart   = true;
    export let showLogin  = true;
    export let showThemeToggle = true;   // dark/light button

    /** Branding / logo */
    export let brandingText = "Tadarok";
    export let logoHref     = "/";
    export let mobileLogo = {
        src: "https://tadarokteb.ir/wp-content/uploads/2025/05/A4.jpg",
        alt: "لوگو تدارک"
    };

    /** Data strategy */
    export let useRemoteData = true;            // if false, you can pass your own navbarLinks/itemsInCart
    export let initialNavbarLinks = null;       // [{ text, href, subgroups? }, ...]
    export let initialCartItems  = [];          // [{ quantity, line_total_raw, ... }]

    /** Endpoints (override per project) */
    export let menuEndpoint = "https://tadarokteb.ir/wp-json/sveltewp/header-menu";
    export let cartEndpoint = "https://persiancup.ir/wp-json/sveltewp/cart";
    export let authEndpoint = "https://tadarokteb.ir/wp-json/sveltewp/is-logged-in";

    /** Search config */
    export let searchBaseUrl  = "https://tadarokteb.ir/?s=";
    export let searchPostType = "product";

    /** Class overrides (tailwind utility strings).
        Defaults preserve your current design. Override only what you need. */
    export let classes = {
        rootWrapper: "bg-[#f1efff] dark:bg-[#0b0b10] !md:txs-h-132 txs-h-70",
        innerBar: "!md:txs-pt-61 txs-pt-11 z-90 txs-h-39 bg-transparent flex justify-between w-full !md:txs-px-150 txs-px-30 items-center relative",
        divider: "hidden md:block txs-w-1137 txs-h-1 bg-[#46466D]/10 absolute txs-top-102",
        mobileToggleBtn: "md:hidden txs-w-26 txs-h-26 text-surface font-medium justify-center flex items-center bg-[#F2F2F2] txs-rounded-50",
        brandText: "text-primary hidden md:block font-extrabold txs-fs-20",
        desktopMenuWrap: "items-center justify-around md:flex hidden txs-w-651 relative",
        desktopMenuItem: "transition-all txs-pr-30",
        menuAnchor: "font-regular hover:font-semibold txs-fs-16 text-primary transition-colors duration-300 hover:text-primary flex items-center gap-1",
        megaWrap: "absolute txs-px-10 txs-w-190 txs-rounded-25 txs-pl-40 txs-h-328 top-full right-[-10px] bg-[#F6F6F6] py-2 z-10",
        megaItem: "block txs-rounded-12 txs-py-2 txs-h-30 bg-[#F6F6F6] hover:text-white px-4 txs-py-20 text-primary hover:bg-secondary font-regular hover:font-semibold txs-fs-16 whitespace-nowrap flex items-center justify-between",
        rightIconsWrap: "w-max flex justify-between items-center",
        searchInput: "bg-[#f1efff] dark:bg-[#0b0b10] txs-fs-16 !md:txs-h-39 border-1 border-[#46466D]/30 txs-pr-20 txs-py-4 w-full txs-rounded-150 focus:outline-none focus:ring-0 focus:ring-opacity-0 text-right",
        searchBtn: "txs-w-26 hidden md:flex txs-h-26 z-20 !md:txs-h-32 !md:txs-h-32 text-surface font-medium justify-center flex items-center bg-[#F2F2F2] txs-rounded-50",
        loginBtn: "txs-w-26 hidden md:flex bg-primary text-white txs-h-26 !md:txs-w-32 !md:txs-h-39 !md:txs-w-144 justify-center flex items-center bg-[#F2F2F2] txs-rounded-50",
        loginText: "txs-fs-16 txs-ml-4 hidden md:block text-white font-regular",
        cartBtn: "z-[999] txs-w-26 txs-h-26 cursor-pointer !md:txs-h-32 !md:txs-h-32 text-surface font-medium justify-center flex items-center bg-[#F2F2F2] txs-rounded-50 relative",
        cartBadge: "z-[999] absolute -top-1 -right-1 bg-primary text-white rounded-full px-[6px] text-[10px] font-bold",
        mobilePanelMask: "txs-h-2000 w-full bg-[black]/65 fixed z-40",
        mobilePanel: "md:hidden fixed top-0 right-0 h-screen w-3/4 bg-white dark:bg-[#111] shadow-lg z-50 overflow-y-auto",
        mobileSection: "p-4 txs-pt-40",
    };

    /* =========================
       INTERNAL STATE (kept from your code)
       ========================= */

    let inputValue = "";
    let inputElement;

    let itemsInCart = Array.isArray(initialCartItems) ? initialCartItems : [];
    let itemsQuantity = sumQuantities(itemsInCart);

    let navbarLinks = Array.isArray(initialNavbarLinks) ? initialNavbarLinks : []; // core menu + icons
    let hoveredLink = null;
    let hoveredSubgroup = null;
    let mobileMenuOpen = false;
    let openDetails = [];

    let dokText = "ورود/عضویت";
    let doklink = "/login";

    let loading = true;
    let loadingAuth = true;

    /* Animation opts you already had */
    const duration = "duration-500";
    const easing = "ease-out";
    const translateX = "translate-x-5";
    const translateY = "translate-y-5";

    const inViewOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
        unobserveOnEnter: true
    };

    let visibilityMap = new Map();
    const setVisible = (id, timeOut) => {
        setTimeout(() => {
            if (!visibilityMap.has(id) || !visibilityMap.get(id)) {
                visibilityMap.set(id, true);
                visibilityMap = visibilityMap; // reactivity kick
            }
        }, timeOut * 50);
    };

    /* =========================
       DARK / LIGHT MODE
       ========================= */
    export let persistTheme = true;
    export let themeStorageKey = "color-scheme"; // localStorage key
    // 'light' | 'dark' | 'system'
    export let theme = "system";

    function applyTheme(t) {
        const root = document.documentElement;
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const effective = t === "system" ? (prefersDark ? "dark" : "light") : t;
        root.classList.toggle("dark", effective === "dark");
        if (persistTheme) localStorage.setItem(themeStorageKey, t);
        dispatch("themechange", { theme: t, effective });
    }
    function toggleTheme() {
        theme = theme === "dark" ? "light" : "dark";
        applyTheme(theme);
    }

    /* =========================
       HELPERS (kept from your code)
       ========================= */
    function sumQuantities(dataArray) {
        let totalQuantity = 0;
        if (!Array.isArray(dataArray)) return 0;
        for (const item of dataArray) {
            if (typeof item === "object" && item && "quantity" in item) {
                const q = item.quantity;
                if (typeof q === "number") totalQuantity += q;
            }
        }
        return totalQuantity;
    }
    function calculateTotalPrice(dataArray) {
        let totalPrice = 0;
        if (!Array.isArray(dataArray)) return 0;
        for (const item of dataArray) {
            if (typeof item === "object" && item && "line_total_raw" in item) {
                const v = item.line_total_raw;
                if (typeof v === "number") totalPrice += v;
            }
        }
        return totalPrice;
    }

    function performSearch() {
        const q = inputValue.trim();
        if (!q) return;
        dispatch("search", { query: q });
        const encoded = encodeURIComponent(q);
        const sep = searchBaseUrl.includes("?") ? "&" : "?";
        window.location.href = `${searchBaseUrl}${encoded}${searchPostType ? `${sep}post_type=${searchPostType}` : ""}`;
    }
    function handleKeyDown(event) {
        if (event.key === "Enter") {
            performSearch();
            event.preventDefault();
        }
    }
    function openSearch() {
        inputElement?.focus();
    }
    function handleMouseOver(link) {
        if (link.subgroups) hoveredLink = link;
    }
    function handleMouseLeave() {
        hoveredLink = null;
        hoveredSubgroup = null;
    }
    function handleSubgroupMouseOver(subgroup) {
        if (subgroup.subgroups) hoveredSubgroup = subgroup;
    }
    function handleSubgroupMouseLeave() {
        hoveredSubgroup = null;
    }
    function toggleMobileMenu() {
        mobileMenuOpen = !mobileMenuOpen;
        if (!mobileMenuOpen) openDetails = [];
    }
    function closeMobileMenu() {
        if (mobileMenuOpen) {
            mobileMenuOpen = false;
            openDetails = [];
        }
    }
    function toggleDetails(index) {
        openDetails = openDetails.includes(index)
            ? openDetails.filter((i) => i !== index)
            : [...openDetails, index];
    }
    function toggleSubDetails(parentIndex, index) {
        const key = `${parentIndex}-${index}`;
        openDetails = openDetails.includes(key)
            ? openDetails.filter((i) => i !== key)
            : [...openDetails, key];
    }

    /* =========================
       BUILD NAVBAR LIST
       ========================= */
    function buildNavbarLinks(coreMenu = []) {
        const icons = [];
        if (showSearch) icons.push({ href: "#", icon: "search" });
        if (showCart)   icons.push({ href: "#", icon: "cart" });
        if (showLogin)  icons.push({ text: dokText, href: doklink, icon: "login" });
        if (showThemeToggle) icons.push({ href: "#", icon: "theme" });
        return [...coreMenu, ...icons];
    }

    /* =========================
       DATA LOADING
       ========================= */
    onMount(() => {
        // Theme init
        const stored = persistTheme ? localStorage.getItem(themeStorageKey) : null;
        if (stored) theme = stored;
        applyTheme(theme);
    });

    onMount(async () => {
        if (!useRemoteData) {
            // From props only
            navbarLinks = buildNavbarLinks(Array.isArray(initialNavbarLinks) ? initialNavbarLinks : []);
            itemsInCart = Array.isArray(initialCartItems) ? initialCartItems : [];
            itemsQuantity = sumQuantities(itemsInCart);
            loading = false;
            loadingAuth = false;
            return;
        }

        try {
            // fetch everything in parallel for speed
            const [menuRes, authRes, cartRes] = await Promise.all([
                fetch(menuEndpoint, { credentials: "include" }),
                fetch(authEndpoint, { credentials: "include" }),
                fetch(cartEndpoint, { credentials: "include" }),
            ]);

            const menu = menuRes.ok ? await menuRes.json() : [];
            const auth = authRes.ok ? await authRes.json() : {};
            const cart = cartRes.ok ? await cartRes.json() : [];

            // login text & link
            if (auth?.is_logged_in) {
                if (auth.first_name) {
                    dokText = auth.first_name.length < 7 ? `${auth.first_name} عزیز` : "حساب کاربری";
                } else {
                    dokText = "حساب کاربری";
                }
                doklink = "/my-account";
            } else {
                dokText = "ورود/عضویت";
                doklink = "https://tadarokteb.ir/my-account/";
            }

            // menu + icons
            navbarLinks = buildNavbarLinks(Array.isArray(menu) ? menu : []);

            // cart
            itemsInCart = Array.isArray(cart) ? cart : [];
            itemsQuantity = sumQuantities(itemsInCart);
        } catch (e) {
            console.error("Header init failed:", e);
            // safe fallbacks
            navbarLinks = buildNavbarLinks([
                { href: "/", text: "خانه" }
            ]);
            itemsInCart = [];
            itemsQuantity = 0;
        } finally {
            loading = false;
            loadingAuth = false;
        }
    });
</script>

<!-- Wrap the main content (same structure / classes preserved, now theme-aware & prop-driven) -->
<div class={classes.rootWrapper}>
    <div class={classes.innerBar}>
        <div class={classes.divider}></div>

        <!-- Mobile Menu Button -->
        <button
            aria-label="toggle mobile menu"
            on:click={toggleMobileMenu}
            class={classes.mobileToggleBtn}
        >
            {#if mobileMenuOpen}
                <X class="txs-w-12 txs-pl-10 text-black" />
            {:else}
                <Menu class="md:txs-w-12 txs-w-20 text-black" />
            {/if}
        </button>

        <div class="txs-w-666 flex items-center">
            {#if showLogo}
            <a editablelink="d02d607a9d416e49c1119b5be82fb5c4" href={logoHref} class={classes.brandText}>
                {brandingText}
            </a>
            {/if}

            <!-- Desktop Navbar -->
            {#if showMenu}
            <div class={classes.desktopMenuWrap}>
                {#each navbarLinks as link, parentIndex}
                    <div
                        class="{classes.desktopMenuItem} {duration} {easing} {visibilityMap.get(link) ? 'opacity-100 translate-x-0 translate-y-0' : `opacity-0 ${translateX} ${translateY}`}"
                        use:inView={inViewOptions}
                        on:enterView={() => setVisible(link, parentIndex)}
                    >
                        {#if link.subgroups?.length > 0}
                            <div class="shop-menu-container" on:mouseover={() => handleMouseOver(link)} on:mouseleave={handleMouseLeave}>
                                <a href={link.href} class={classes.menuAnchor}>
                                    {link.text}
                                    <ChevronDown class="txs-w-15 txs-h-15" />
                                </a>

                                {#if hoveredLink === link}
                                    <div class={classes.megaWrap} style="border-radius:  0 calc(25*var(--tx)) calc(25*var(--tx)) 0 ;">
                                        {#each link.subgroups as subgroup, index}
                                            {#if subgroup.subgroups?.length > 0}
                                                <div class="group" on:mouseover={() => handleSubgroupMouseOver(subgroup)} on:mouseleave={handleSubgroupMouseLeave}>
                                                    <a href={subgroup.href}
                                                       class="block txs-rounded-12 txs-py-2 txs-h-30 bg-[#F6F6F6] {hoveredSubgroup === subgroup ? 'bg-secondary text-white' : ''} hover:text-white px-4 txs-py-20 text-primary hover:bg-secondary font-regular hover:font-semibold txs-fs-16 whitespace-nowrap flex items-center justify-between">
                                                        <div class="flex items-center">{subgroup.text}</div>
                                                        <ChevronLeft class="txs-w-15 txs-h-15 text-primary group-hover:text-white" />
                                                    </a>

                                                    {#if hoveredSubgroup === subgroup}
                                                        <div class="absolute txs-h-328 flex items-start justify-start overflow-y-auto txs-w-400 top-0 right-full bg-white dark:bg-[#1a1a1a] py-2 z-20"
                                                             style="margin-right: calc(-10*var(--tx)); border-radius:  calc(25*var(--tx)) 0 0 calc(25*var(--tx)) ;">
                                                            <div class="txs-rounded-50 columns-2 txs-pt-10">
                                                                {#each subgroup.subgroups as subSubgroup}
                                                                    <a href={subSubgroup.href} class="block text-center px-4 txs-py-10 text-primary hover:text-primary font-regular hover:font-semibold txs-fs-16 whitespace-nowrap flex items-center">
                                                                        <Dot class="txs-w-15 txs-h-15 text-primary" />
                                                                        {subSubgroup.text}
                                                                    </a>
                                                                {/each}
                                                            </div>
                                                        </div>
                                                    {:else}
                                                        <div class="absolute txs-rounded-25 txs-h-328 flex flex-col items-start justify-start overflow-y-auto txs-w-400 top-0 right-full bg-white dark:bg-[#1a1a1a] py-2 z-10"
                                                             style="margin-right: calc(-10*var(--tx));border-radius:  calc(25*var(--tx)) 0 0 calc(25*var(--tx)) ;">
                                                            <div class="txs-rounded-50"></div>
                                                        </div>
                                                    {/if}
                                                </div>
                                            {:else}
                                                <a href={subgroup.href} class="block px-4 txs-py-10 text-primary hover:text-primary font-regular hover:font-semibold txs-fs-16 whitespace-nowrap flex items-center justify-between">
                                                    {subgroup.text}
                                                </a>
                                            {/if}
                                        {/each}
                                    </div>
                                {/if}
                            </div>
                        {:else if !link.icon}
                            <a href={link.href} class="font-regular hover:font-semibold txs-fs-16 text-primary transition-colors duration-300 hover:text-primary">{link.text}</a>
                        {/if}
                    </div>
                {/each}
            </div>
            {/if}
        </div>

        <!-- Right icons -->
        <div class={classes.rightIconsWrap}>
            {#each navbarLinks as link}
                {#if link.icon === "search" && showSearch}
                    <div class="relative txs-w-267 !md:txs-h-39 txs-ml-10">
                        <div class="items-center hidden md:flex left-0 absolute txs-w-267 z-10 transition-width duration-300 ease-in-out">
                            <input
                                type="text"
                                bind:this={inputElement}
                                bind:value={inputValue}
                                on:keydown={handleKeyDown}
                                placeholder="جست و جو"
                                class={classes.searchInput}
                            />
                            <button aria-label="جستجو" on:click={openSearch} class="txs-w-26 txs-left-5 absolute txs-h-26 z-20 !md:txs-h-32 !md:txs-h-32 text-surface font-medium justify-center flex items-center txs-rounded-50">
                                <Search class="txs-w-20 text-primary" />
                            </button>
                        </div>
                        <button aria-label="جستجو" on:click={performSearch} class={classes.searchBtn}>
                            <Search class="txs-w-12 text-black" />
                        </button>
                    </div>

                {:else if link.icon === "login" && showLogin}
                    <a aria-label="ورود" href={doklink} class={classes.loginBtn}>
                        <span class={classes.loginText}>{dokText}</span>
                        <svg width="16" height="9" viewBox="0 0 16 9" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M0.646446 4.85355C0.451184 4.65829 0.451184 4.34171 0.646446 4.14645L3.82843 0.964466C4.02369 0.769204 4.34027 0.769204 4.53553 0.964466C4.7308 1.15973 4.7308 1.47631 4.53553 1.67157L1.70711 4.5L4.53553 7.32843C4.7308 7.52369 4.7308 7.84027 4.53553 8.03553C4.34027 8.2308 4.02369 8.2308 3.82843 8.03553L0.646446 4.85355ZM16 5H1V4H16V5Z" fill="white"/>
                        </svg>
                    </a>

                {:else if link.icon === "cart" && showCart}
                    <div class="relative txs-mx-10 z-[999] cursor-pointer">
                        <button
                            aria-label="سبد خرید"
                            on:click={() => (window.location = "https://tadarokteb.ir/cart/")}
                            class={classes.cartBtn}
                        >
                            <ShoppingCart class="z-[999] txs-w-12 text-black" />
                            {#if itemsQuantity > 0}
                                <span class={classes.cartBadge}>{itemsQuantity}</span>
                            {/if}
                        </button>
                    </div>

                {:else if link.icon === "theme" && showThemeToggle}
                    <button aria-label="toggle color scheme" class="txs-w-26 hidden md:flex txs-h-26 justify-center items-center bg-[#F2F2F2] txs-rounded-50"
                            on:click={toggleTheme}>
                        {#if (theme === "dark") || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches)}
                            <Moon class="txs-w-12" />
                        {:else}
                            <Sun class="txs-w-12" />
                        {/if}}
                    </button>
                {/if}
            {/each}
        </div>

        <!-- Mobile Menu (Hidden on desktop) -->
        {#if mobileMenuOpen}
            <div class={classes.mobilePanelMask}></div>
            <div
                in:fly={{ x: 500, duration: 300 }}
                out:fly={{ x: 500, duration: 300 }}
                class={classes.mobilePanel}
                on:click|stopPropagation
                on:keydown|stopPropagation
            >
                <div class="absolute flex items-center justif-center p-4">
                    <a editablelink="19171eff48fe671374c533d148f8b523" href="/">
                        <img static="8cb75e9c2b046f5b8f582ae17bf93b54" loading="lazy" src={mobileLogo.src} alt={mobileLogo.alt} class="txs-w-96 !md:txs-mr-0 !md:txs-w-131" />
                    </a>
                </div>
                <!-- close button -->
                <div class="flex items-center justify-end pl-4 pt-4">
                    <button aria-label="close mobile menu" on:click|stopPropagation={closeMobileMenu}>
                        <X class="txs-w-18 txs-h-18 text-gray-700 hover:text-black" />
                    </button>
                </div>

                <!-- Mobile Menu Links -->
                <div class={classes.mobileSection}>
                    {#each navbarLinks as link, parentIndex}
                        {#if link.subgroups?.length > 0}
                            <details class="mb-2 border-b border-gray-200 dark:border-gray-700"
                                     open={openDetails.includes(parentIndex)}
                                     on:toggle={() => toggleDetails(parentIndex)}>
                                <summary class="py-2 cursor-pointer text-primary font-regular hover:font-semibold flex justify-between items-center txs-fs-16">
                                    {link.text}
                                    {#if openDetails.includes(parentIndex)}
                                        <ChevronDown class="txs-w-14 txs-h-14" />
                                    {:else}
                                        <ChevronLeft class="txs-w-14 txs-h-14" />
                                    {/if}
                                </summary>
                                <div class="pl-4">
                                    {#each link.subgroups as subgroup, index}
                                        {#if subgroup.subgroups}
                                            <details class="mb-2"
                                                     open={openDetails.includes(`${parentIndex}-${index}`)}
                                                     on:toggle={() => toggleSubDetails(parentIndex, index)}>
                                                <summary class="py-2 cursor-pointer text-primary flex justify-between items-center txs-fs-10">
                                                    {subgroup.text}
                                                    {#if openDetails.includes(`${parentIndex}-${index}`)}
                                                        <ChevronDown class="txs-w-12 txs-h-12" />
                                                    {:else}
                                                        <ChevronLeft class="txs-w-12 txs-h-12" />
                                                    {/if}
                                                </summary>
                                                <div class="pl-4">
                                                    {#each subgroup.subgroups as subSubgroup}
                                                        <a href={subSubgroup.href} class="block py-2 text-primary txs-fs-9 txs-pr-10" on:click={closeMobileMenu}>
                                                            {subSubgroup.text}
                                                        </a>
                                                    {/each}
                                                </div>
                                            </details>
                                        {:else}
                                            <a href={subgroup.href} class="block py-2 text-primary txs-fs-10" on:click={closeMobileMenu}>
                                                {subgroup.text}
                                            </a>
                                        {/if}
                                    {/each}
                                </div>
                            </details>
                        {:else if !link.icon}
                            <a href={link.href} class="block py-2 text-primary font-regular hover:font-semibold border-b border-gray-200 dark:border-gray-700 txs-fs-16" on:click={closeMobileMenu}>
                                {link.text}
                            </a>
                        {/if}
                    {/each}
                </div>
            </div>
        {/if}
    </div>

    <div class="click-outside-catcher" on:click|self={closeMobileMenu}></div>
</div>

<style>
    .click-outside-catcher {
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        z-index: -1;
    }
    ::-webkit-scrollbar { width: 6px; }
    ::-webkit-scrollbar-track { background: #f0f0f0; padding: 2px; border-radius: 3px; }
    ::-webkit-scrollbar-thumb { background: #020202; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: #ff6633; }
</style>
