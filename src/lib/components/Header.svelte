<script lang="ts">
    import { adminMode } from '$lib/stores/adminStore';
    import '$lib/styles/links.scss';
</script>

<header class="flex items-center justify-between px-4 md:px-6 h-20 w-full max-w-[50rem] m-auto">
    <nav>
        <a
            href={$adminMode ? '/?admin=true' : '/'}
            class="main-title link link--ascendence font-didot !text-2xl relative flex gap-4 items-center cursor-pointer transition-all duration-300 !text-gray-500 hover:!text-gray-800"
            data-text="sallyjkphoto"
        >
            sallyjkphoto
        </a>
    </nav>

    <nav class="flex items-center gap-6">
        <a href="/" class="link link--zoomies !text-gray-500 hover:!text-gray-800">Work</a>
        <a href="/contact" class="link link--zoomies !text-gray-500 hover:!text-gray-800">Contact</a>
    </nav>
</header>
