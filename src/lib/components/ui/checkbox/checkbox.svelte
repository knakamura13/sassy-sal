<script lang="ts">
    import { Checkbox as CheckboxPrimitive } from 'bits-ui';
    import { type Events, type Props } from './index.js';
    import { cn } from '$lib/utils.js';

    type $$Props = Props;
    type $$Events = Events;

    let className: $$Props['class'] = undefined;
    export let checked: $$Props['checked'] = false;
    export let disabled: $$Props['disabled'] = false;
    export let required: $$Props['required'] = false;
    export let name: $$Props['name'] = '';
    export let value: $$Props['value'] = '';
    export { className as class };
</script>

<CheckboxPrimitive.Root
    bind:checked
    {disabled}
    {required}
    {name}
    {value}
    class={cn(
        'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
        className
    )}
    {...$$restProps}
    on:click
>
    <CheckboxPrimitive.Indicator class="flex items-center justify-center text-current">
        <svg
            class="h-4 w-4"
            fill="none"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            viewBox="0 0 24 24"
        >
            <path d="M20 6 9 17l-5-5"></path>
        </svg>
    </CheckboxPrimitive.Indicator>
</CheckboxPrimitive.Root>
