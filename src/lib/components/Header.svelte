<script lang="ts">
    import { adminMode } from '$lib/stores/adminStore';
    import '$lib/styles/links.scss';
    import Hamburger from './Hamburger.svelte';
    import { onMount } from 'svelte';

    const navLinks = [
        {
            label: 'Work',
            href: '/'
        },
        {
            label: 'Pricing',
            href: '/pricing'
        },
        {
            label: 'About',
            href: '/about'
        },
        {
            label: 'Contact',
            href: '/contact'
        }
    ];

    let isMenuOpen = false;
    let isMobile = false;

    const toggleMenu = () => {
        isMenuOpen = !isMenuOpen;

        // Toggle body scroll
        if (isMenuOpen) {
            document.body.classList.add('no-scroll');
        } else {
            document.body.classList.remove('no-scroll');
        }
    };

    const checkMobile = () => {
        isMobile = window.innerWidth < 768;
    };

    onMount(() => {
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => {
            window.removeEventListener('resize', checkMobile);
            // Ensure scroll is re-enabled when component is destroyed
            document.body.classList.remove('no-scroll');
        };
    });
</script>

<header class="m-auto flex w-full items-center justify-between px-24 py-12 md:px-6">
    <div class="m-auto flex h-11 w-full max-w-[1400px] items-center justify-between">
        <nav class="flex items-center gap-6">
            <a
                href={$adminMode ? '/?admin=true' : '/'}
                class="main-title link link--ascendence font-didot relative flex cursor-pointer items-center gap-4 !text-[32px] !text-[#3f4a49] transition-all duration-300"
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
        </nav>

        <!-- Mobile Navigation Toggle -->
        <div class="flex items-center md:hidden">
            <button class="hamburger-btn" on:click={toggleMenu} aria-label="Toggle menu">
                <Hamburger isActive={isMenuOpen} />
            </button>
        </div>
    </div>
</header>

<!-- Mobile Menu -->
{#if isMobile && isMenuOpen}
    <div class="mobile-menu flex flex-col items-center justify-center">
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
        </nav>
    </div>
{/if}

<style lang="scss">
    @use '$lib/styles/variables' as vars;

    a:hover {
        color: vars.$secondary-color !important;
    }

    header {
        width: 100%;
        box-sizing: border-box;
        padding-top: 2.8vw;
        padding-bottom: 2.8vw;
        padding-left: 6vw;
        padding-right: 6vw;
    }

    .hamburger-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 0.5rem;
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

    :global(body.no-scroll) {
        overflow: hidden;
        position: fixed;
        width: 100%;
    }
</style>
