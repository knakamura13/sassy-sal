<script lang="ts">
    import { onMount } from 'svelte';

    export let src: string;
    export let alt: string = '';
    export let width: number | undefined = undefined;
    export let height: number | undefined = undefined;
    export let blurDataURL: string | undefined = undefined;
    export let responsive:
        | {
              small: string;
              medium: string;
              large: string;
          }
        | undefined = undefined;
    export let className: string = '';
    export let priority: boolean = false;

    let loaded = false;
    let thisImage: HTMLImageElement;
    let observer: IntersectionObserver;

    onMount(() => {
        if (priority) {
            loaded = true;
            return;
        }

        if ('IntersectionObserver' in window) {
            observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            thisImage.src = src;
                            thisImage.srcset = responsive
                                ? `${responsive.small} 640w, ${responsive.medium} 1080w, ${responsive.large} 1920w`
                                : '';

                            observer.unobserve(thisImage);
                        }
                    });
                },
                {
                    rootMargin: '200px 0px'
                }
            );

            observer.observe(thisImage);
        } else {
            // Fallback for browsers without IntersectionObserver
            loaded = true;
        }

        return () => {
            if (observer) {
                observer.disconnect();
            }
        };
    });

    function onImageLoad() {
        loaded = true;
    }
</script>

<div class="image-container {className}" style="position: relative; overflow: hidden;">
    {#if blurDataURL && !loaded}
        <img
            src={blurDataURL}
            alt=""
            class="blur-image"
            style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; filter: blur(10px); transform: scale(1.1);"
        />
    {/if}

    <img
        bind:this={thisImage}
        src={priority ? src : blurDataURL || ''}
        srcset={priority && responsive
            ? `${responsive.small} 640w, ${responsive.medium} 1080w, ${responsive.large} 1920w`
            : ''}
        sizes="(max-width: 640px) 100vw, (max-width: 1080px) 50vw, 33vw"
        {alt}
        {width}
        {height}
        class="actual-image"
        style="transition: opacity 0.4s ease-in-out; opacity: {loaded ? '1' : '0'};"
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        on:load={onImageLoad}
    />
</div>

<style>
    .image-container {
        position: relative;
        width: 100%;
        height: 100%;
    }

    .actual-image {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
    }
</style>
