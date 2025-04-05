<script lang="ts">
    import { adminMode } from '$lib/stores/adminStore';
</script>

<header class="flex items-center justify-between px-4 md:px-6 h-20 w-full max-w-[50rem] m-auto">
    <a
        href={$adminMode ? '/?admin=true' : '/'}
        class="flex gap-4 items-center cursor-pointer transition-all duration-300 text-gray-500 hover:text-gray-800"
    >
        <h1 class="font-didot text-3xl">sallyjkphoto</h1>
    </a>
</header>
