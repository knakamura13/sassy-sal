<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    export let isActive = false;
    export let ariaControls = 'main-menu';

    const dispatch = createEventDispatcher();
</script>

<button
    class="hamburger"
    class:active={isActive}
    on:click={() => dispatch('click')}
    aria-label="Toggle menu"
    aria-expanded={isActive}
    aria-controls={ariaControls}
    type="button"
>
    <span class="lines">
        <span class="line"></span>
        <span class="line"></span>
        <span class="line"></span>
    </span>
</button>

<style lang="scss">
    @use '../styles/variables' as vars;

    // Local variables
    $hamburger-transition: 0.3s;
    $hamburger-height: 1.125rem;

    .hamburger {
        --hamburger-vertical-gap: 35%;

        height: $hamburger-height;
        width: auto;
        margin: auto;
        cursor: pointer;
        aspect-ratio: 1.5;
        background: transparent;
        border: none;
        padding: 0;

        .lines {
            display: flex;
            flex-direction: column;
            gap: var(--hamburger-vertical-gap);
            position: relative;
            height: 100%;
            width: 100%;
            justify-content: center;
            transition: gap $hamburger-transition;
        }

        .line {
            height: 10%;
            width: 100%;
            margin: 0 0 0 auto;
            background-color: vars.$primary-color;
            opacity: 1;
            transition:
                opacity $hamburger-transition,
                width $hamburger-transition,
                transform $hamburger-transition;

            &:nth-of-type(2) {
                width: 70%;
            }
        }

        &:hover,
        &:focus {
            --hamburger-vertical-gap: 16%;

            .line {
                background-color: vars.$secondary-color;
            }

            .line:nth-of-type(2) {
                width: 0;
                opacity: 0;
            }
        }

        &.active {
            --hamburger-vertical-gap: 0;

            .line {
                &:first-of-type {
                    transform: rotate(-45deg);
                }

                &:nth-of-type(2) {
                    display: none;
                }

                &:last-of-type {
                    margin-top: -6%;
                    transform: rotate(45deg);
                }
            }
        }
    }
</style>
