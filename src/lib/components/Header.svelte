<script lang="ts">
    import { adminMode } from '$lib/stores/adminStore';
    import '$lib/styles/links.scss';
    import Hamburger from './Hamburger.svelte';
    import { onMount } from 'svelte';
    import { afterNavigate } from '$app/navigation';

    const MOBILE_BREAKPOINT = 768;

    const navLinks = [
        { label: 'Work', href: '/' },
        { label: 'About Me', href: '/about-me' }
    ];

    let isMenuOpen = false;
    let isMobile = false;
    $: homeUrl = '/';

    function toggleMenu() {
        isMenuOpen = !isMenuOpen;
        if (isMenuOpen) {
            const scrollY = window.scrollY;
            document.body.classList.add('no-scroll');
            document.body.style.top = `-${scrollY}px`;
        } else {
            const scrollY = parseInt(document.body.style.top || '0') * -1;
            document.body.classList.remove('no-scroll');
            document.body.style.top = '';
            window.scrollTo(0, scrollY);
        }
    }

    function closeMenu() {
        if (isMenuOpen) {
            const scrollY = parseInt(document.body.style.top || '0') * -1;
            isMenuOpen = false;
            document.body.classList.remove('no-scroll');
            document.body.style.top = '';
            window.scrollTo(0, scrollY);
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (isMenuOpen && e.key === 'Escape') {
            closeMenu();
        }
    }

    function checkMobile() {
        isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    }

    let resizeTimer: ReturnType<typeof setTimeout>;
    function debouncedCheckMobile() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(checkMobile, 100);
    }

    onMount(() => {
        checkMobile();
        window.addEventListener('resize', debouncedCheckMobile);

        return () => {
            window.removeEventListener('resize', debouncedCheckMobile);
            clearTimeout(resizeTimer);
            document.body.classList.remove('no-scroll');
            document.body.style.top = '';
        };
    });

    // Close menu on any navigation (logo click, back/forward, programmatic nav)
    afterNavigate(() => {
        closeMenu();
    });
</script>

<svelte:window on:keydown={handleKeydown} />

<header class="header">
    <div class="m-auto flex h-11 w-full max-w-[1400px] items-center justify-between">
        <nav aria-label="Home" class="flex items-center gap-6">
            <a
                href={homeUrl}
                class="main-title link link--ascendance font-didot relative flex cursor-pointer items-center gap-4 !text-[32px] !text-[#3f4a49] transition-all duration-300"
                data-text="sallyjkphoto"
            >
                sallyjkphoto
            </a>
        </nav>

        <!-- Desktop Navigation -->
        <nav aria-label="Main navigation" class="hidden items-center gap-6 md:flex">
            {#each navLinks as link}
                <a
                    href={link.href}
                    class="link link--zoomies !text-[20px] !text-[#3f4a49]"
                    data-sveltekit-preload-data="hover"
                >
                    {link.label}
                </a>
            {/each}

            {#if $adminMode}
                <form action="/admin?/logout" method="POST">
                    <button type="submit" class="logout-btn link link--zoomies !text-[20px] !text-[#d19177]">
                        Logout
                    </button>
                </form>
            {/if}
        </nav>

        <!-- Mobile Navigation Toggle -->
        <div class="flex items-center md:hidden">
            <Hamburger isActive={isMenuOpen} on:click={toggleMenu} ariaControls="mobile-menu" />
        </div>
    </div>
</header>

<!-- Mobile Menu -->
{#if isMobile}
    <div
        id="mobile-menu"
        class="mobile-menu flex flex-col items-center justify-center"
        class:mobile-menu--open={isMenuOpen}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile navigation menu"
        aria-hidden={!isMenuOpen}
        inert={!isMenuOpen ? true : undefined}
    >
        <nav aria-label="Mobile navigation" class="flex flex-col items-center gap-6 py-6">
            {#each navLinks as link}
                <a
                    href={link.href}
                    class="link link--zoomies !text-[20px] !text-[#3f4a49]"
                    data-sveltekit-preload-data="hover"
                    on:click={closeMenu}
                    tabindex={isMenuOpen ? 0 : -1}
                >
                    {link.label}
                </a>
            {/each}

            <!-- Admin Logout in Mobile Menu -->
            {#if $adminMode}
                <form action="/admin?/logout" method="POST">
                    <button
                        type="submit"
                        class="logout-btn link link--zoomies !text-[20px] !text-[#d19177]"
                        tabindex={isMenuOpen ? 0 : -1}
                    >
                        Logout
                    </button>
                </form>
            {/if}
        </nav>
    </div>
{/if}

<style lang="scss">
    @use '../styles/variables' as vars;

    a:hover {
        color: vars.$secondary-color !important;
    }

    .header {
        width: 100%;
        box-sizing: border-box;
        padding: 2.8vw 6vw;
    }

    .mobile-menu {
        position: fixed;
        top: 80px;
        left: 0;
        width: 100%;
        height: 100%;
        padding-bottom: 25vh;
        background-color: white;
        z-index: 100;
        opacity: 0;
        transform: translateY(20px);
        pointer-events: none;
        transition: opacity 0.35s ease, transform 0.35s ease;
        overscroll-behavior: contain;
    }

    .mobile-menu--open {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
    }

    .logout-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-family: inherit;
        padding: 0;
    }
</style>
