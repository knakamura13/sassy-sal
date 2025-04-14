<script lang="ts">
    import { adminMode } from '$lib/stores/adminStore';
    import '$lib/styles/links.scss';
    import { fade } from 'svelte/transition';
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

    // Responsive menu state
    let menuOpen = false;
    let isMobile = false;

    function toggleMenu() {
        menuOpen = !menuOpen;
        if (menuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    function handleResize() {
        isMobile = window.innerWidth < 768;
        if (!isMobile && menuOpen) {
            menuOpen = false;
            document.body.style.overflow = '';
        }
    }

    onMount(() => {
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
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

        <!-- Mobile Hamburger Menu Button -->
        <button
            class="z-20 flex flex-col justify-center gap-2 md:hidden"
            on:click={toggleMenu}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        >
            <span
                class={`hamburger-line transition-transform duration-300 ${menuOpen ? 'translate-y-[7px] rotate-45' : ''}`}
            ></span>
            <span
                class={`hamburger-line transition-transform duration-300 ${menuOpen ? '-translate-y-[7px] -rotate-45' : ''}`}
            ></span>
        </button>
    </div>
</header>

<!-- Full-screen Mobile Menu -->
{#if menuOpen}
    <div
        class="fixed inset-0 z-10 flex flex-col items-center justify-center bg-white"
        transition:fade={{ duration: 300 }}
    >
        <nav class="flex flex-col items-center gap-8">
            {#each navLinks as link}
                <a href={link.href} class="link link--zoomies !text-[28px] !text-[#3f4a49]" on:click={toggleMenu}>
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
        position: relative;
        z-index: 20;
    }

    .hamburger-line {
        width: 28px;
        height: 2px;
        background-color: #3f4a49;
        display: block;
    }
</style>
