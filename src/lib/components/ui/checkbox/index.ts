import { type Checkbox as CheckboxPrimitive } from 'bits-ui';
import Root from './checkbox.svelte';

type Props = CheckboxPrimitive.Props & {
    checked?: boolean;
};

type Events = CheckboxPrimitive.Events;

export {
    Root,
    type Props,
    type Events,
    //
    Root as Checkbox,
    type Props as CheckboxProps,
    type Events as CheckboxEvents
};
