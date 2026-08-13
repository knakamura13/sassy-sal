<script lang="ts">
    import { adminMode } from '$lib/stores/adminStore';
    import '$lib/styles/links.scss';
    import Hamburger from './Hamburger.svelte';
    import { onMount, tick } from 'svelte';
    import { afterNavigate } from '$app/navigation';

    const MOBILE_BREAKPOINT = 768;

    const navLinks = [
        { label: 'Work', href: '/' },
        { label: 'About Me', href: '/about-me' }
    ];

    let isMenuOpen = false;
    let isMobile = false;
    let menuEl: HTMLElement | undefined;
    let hamburgerWrap: HTMLElement | undefined;
    $: homeUrl = '/';

    async function toggleMenu() {
        isMenuOpen = !isMenuOpen;
        if (isMenuOpen) {
            const scrollY = window.scrollY;
            document.body.classList.add('no-scroll');
            document.body.style.top = `-${scrollY}px`;
            await tick();
            const firstFocusable = menuEl?.querySelector<HTMLElement>('a[href], button:not([disabled])');
            firstFocusable?.focus();
        } else {
            const scrollY = parseInt(document.body.style.top || '0') * -1;
            document.body.classList.remove('no-scroll');
            document.body.style.top = '';
            window.scrollTo(0, scrollY);
        }
    }

    function closeMenu(restoreScroll = true, restoreFocus = false) {
        if (isMenuOpen) {
            const scrollY = parseInt(document.body.style.top || '0') * -1;
            isMenuOpen = false;
            document.body.classList.remove('no-scroll');
            document.body.style.top = '';
            if (restoreScroll) {
                window.scrollTo(0, scrollY);
            }
            if (restoreFocus) {
                hamburgerWrap?.querySelector<HTMLElement>('button')?.focus();
            }
        }
    }

    function releaseScrollLock() {
        document.body.classList.remove('no-scroll');
        document.body.style.top = '';
    }

    function getMenuCycle(): HTMLElement[] {
        const hamburgerBtn = hamburgerWrap?.querySelector<HTMLElement>('button');
        const inMenu = menuEl
            ? Array.from(menuEl.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')).filter(
                  (el) => el.tabIndex !== -1
              )
            : [];
        return hamburgerBtn ? [hamburgerBtn, ...inMenu] : inMenu;
    }

    function handleKeydown(e: KeyboardEvent) {
        if (!isMenuOpen) return;

        if (e.key === 'Escape') {
            closeMenu(true, true);
            return;
        }

        if (e.key !== 'Tab') return;

        const cycle = getMenuCycle();
        if (cycle.length === 0) return;

        const first = cycle[0];
        const last = cycle[cycle.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (!active || !cycle.includes(active)) {
            e.preventDefault();
            (e.shiftKey ? last : first).focus();
            return;
        }

        if (e.shiftKey && active === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && active === last) {
            e.preventDefault();
            first.focus();
        }
    }

    function checkMobile() {
        const wasMobile = isMobile;
        isMobile = window.innerWidth < MOBILE_BREAKPOINT;
        // Release body scroll lock if leaving mobile breakpoint with menu open
        if (wasMobile && !isMobile && isMenuOpen) {
            isMenuOpen = false;
            releaseScrollLock();
        }
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
    // Skip scroll restore — let SvelteKit handle scroll for the destination page
    afterNavigate(() => {
        closeMenu(false);
    });
</script>

<svelte:window on:keydown={handleKeydown} />

<header class="header">
    <div class="m-auto flex h-11 w-full max-w-[1400px] items-center justify-between gap-2">
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
                    <button type="submit" class="logout-btn link link--zoomies !text-[20px] !text-[#3f4a49]">
                        Logout
                    </button>
                </form>
            {/if}
        </nav>

        <!-- Mobile Navigation Toggle -->
        <div class="ml-2 flex items-center md:hidden" bind:this={hamburgerWrap}>
            <Hamburger isActive={isMenuOpen} on:click={toggleMenu} ariaControls="mobile-menu" />
        </div>
    </div>
</header>

<!-- Mobile Menu -->
{#if isMobile}
    <div
        id="mobile-menu"
        bind:this={menuEl}
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
                    on:click={() => closeMenu(false)}
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
                        class="logout-btn link link--zoomies !text-[20px] !text-[#3f4a49]"
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
        padding-top: max(2.8vw, env(safe-area-inset-top, 0px));
        padding-bottom: 2.8vw;
        padding-inline: max(6vw, env(safe-area-inset-right, 0px), env(safe-area-inset-left, 0px));
    }

    .mobile-menu {
        position: fixed;
        top: 80px;
        left: 0;
        width: 100%;
        height: 100%;
        padding-bottom: max(25dvh, env(safe-area-inset-bottom, 0px));
        padding-inline: max(6vw, env(safe-area-inset-right, 0px), env(safe-area-inset-left, 0px));
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

        &:hover {
            color: vars.$secondary-color !important;
        }
    }
</style>
