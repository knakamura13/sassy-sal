<script lang="ts">
    import { adminMode } from '$lib/stores/adminStore';
    import '$lib/styles/links.scss';
    import Hamburger from './Hamburger.svelte';
    import { onMount } from 'svelte';

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
        document.body.classList.toggle('no-scroll', isMenuOpen);
    }

    function checkMobile() {
        isMobile = window.innerWidth < MOBILE_BREAKPOINT;
    }

    onMount(() => {
        checkMobile();
        window.addEventListener('resize', checkMobile);

        return () => {
            window.removeEventListener('resize', checkMobile);
            document.body.classList.remove('no-scroll');
        };
    });
</script>

<header class="header">
    <div class="m-auto flex h-11 w-full max-w-[1400px] items-center justify-between">
        <nav class="flex items-center gap-6">
            <a
                href={homeUrl}
                class="main-title link link--ascendance font-didot relative flex cursor-pointer items-center gap-4 !text-[32px] !text-[#3f4a49] transition-all duration-300"
                data-text="sallyjkphoto"
            >
                sallyjkphoto
            </a>
        </nav>

        <!-- Desktop Navigation -->
        <nav class="hidden items-center gap-6 md:flex">
            {#each navLinks as link}
                <a href={link.href} class="link link--zoomies !text-[20px] !text-[#3f4a49]">{link.label}</a>
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
{#if isMobile && isMenuOpen}
    <div id="mobile-menu" class="mobile-menu flex flex-col items-center justify-center" role="navigation">
        <nav class="flex flex-col items-center gap-6 py-6">
            {#each navLinks as link}
                <a
                    href={link.href}
                    class="link link--zoomies !text-[20px] !text-[#3f4a49]"
                    on:click={() => (isMenuOpen = false)}
                >
                    {link.label}
                </a>
            {/each}

            <!-- Admin Logout in Mobile Menu -->
            {#if $adminMode}
                <form action="/admin?/logout" method="POST">
                    <button type="submit" class="logout-btn link link--zoomies !text-[20px] !text-[#d19177]">
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
        animation: slideDown 0.5s ease-out;
    }

    .logout-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-family: inherit;
        padding: 0;
    }

    @keyframes slideDown {
        from {
            transform: translateY(50px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
</style>
