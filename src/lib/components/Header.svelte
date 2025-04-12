<script lang="ts">
    import { adminMode } from '$lib/stores/adminStore';
    import '$lib/styles/links.scss';

    const navLinks = [
        {
            label: 'Work',
            href: '/'
        },
        {
            label: 'Contact',
            href: '/contact'
        }
    ];
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

        <nav class="flex items-center gap-6">
            {#each navLinks as link}
                <a href={link.href} class="link link--zoomies !text-[20px] !text-[#3f4a49]">{link.label}</a>
            {/each}
        </nav>
    </div>
</header>

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
</style>
