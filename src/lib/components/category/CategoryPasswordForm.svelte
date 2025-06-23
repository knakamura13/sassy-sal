<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { Button } from '$lib/components/ui/button';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
    import AlertCircle from 'lucide-svelte/icons/alert-circle';
    import Lock from 'lucide-svelte/icons/lock';

    export let categoryName: string;
    export let error: string = '';
    export let loading: boolean = false;

    let password = '';
    const dispatch = createEventDispatcher<{ submit: { password: string } }>();

    function handleSubmit() {
        if (!password.trim()) {
            return;
        }
        dispatch('submit', { password: password.trim() });
    }

    function handleKeyDown(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            handleSubmit();
        }
    }
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50 px-4">
    <Card class="w-full max-w-md">
        <CardHeader class="text-center">
            <div class="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-200">
                <Lock class="h-6 w-6 text-gray-600" />
            </div>
            <CardTitle class="text-xl font-semibold">Protected Gallery</CardTitle>
            <CardDescription>
                The "{categoryName}" gallery is password protected. Please enter the password to continue.
            </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
            {#if error}
                <div class="flex items-center gap-2 rounded-md bg-red-50 p-3 text-sm text-red-600">
                    <AlertCircle class="h-4 w-4" />
                    <span>{error}</span>
                </div>
            {/if}

            <div class="space-y-2">
                <Label for="password">Password</Label>
                <Input
                    id="password"
                    type="password"
                    bind:value={password}
                    on:keydown={handleKeyDown}
                    placeholder="Enter password"
                    disabled={loading}
                    class="w-full"
                />
            </div>

            <Button on:click={handleSubmit} disabled={!password.trim() || loading} class="w-full">
                {loading ? 'Verifying...' : 'Access Gallery'}
            </Button>
        </CardContent>
    </Card>
</div>

<style>
    /* Add some subtle styling */
    :global(body) {
        background-color: #f9fafb;
    }
</style>
