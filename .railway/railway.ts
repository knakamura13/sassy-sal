import { defineRailway, github, preserve, project, service } from 'railway/iac';

/**
 * Railway infrastructure for sassy-sal, as code.
 * See https://docs.railway.com/infrastructure-as-code
 *
 * This replaces railway.json, which Railway stops reading on 2026-12-01.
 *
 * `railway config apply` manages the whole project, so a resource that is
 * missing from this file is planned for deletion. Add new services and
 * databases here instead of in the dashboard. Variable values stay in Railway:
 * `preserve()` keeps whatever is set there.
 *
 * The project has two environments and this one file is applied to whichever
 * is linked, so every difference between them is keyed on `ctx`:
 * - production deploys `main`, serves sallyjkphoto.com, and sleeps when idle.
 * - development deploys the `dev` branch, has no custom domain, does not
 *   sleep, and keeps the build command from the `dev` branch's old
 *   railway.json (`--immutable` is a Yarn Berry flag; `main` pins Yarn Classic).
 *
 * Not carried over from railway.json:
 * - `build.watchPaths` is not a Railway setting (the key is `watchPatterns`),
 *   so it never took effect and every push deploys. No watch patterns are set.
 * - `deploy.region: us-west1` is a legacy key. Railway's stored multi-region
 *   config places the service in us-west2, and `replicas` below keeps that.
 *
 * Not expressible in this file: the generated `*.up.railway.app` domains.
 */
export default defineRailway((ctx) => {
    const isProduction = ctx.isEnvironment('production');
    if (!isProduction && !ctx.isEnvironment('development')) {
        throw new Error(`.railway/railway.ts defines production and development only, not "${ctx.environment}".`);
    }

    const sassySal = service('sassy-sal', {
        source: github('knakamura13/sassy-sal', { branch: isProduction ? 'main' : 'dev', checkSuites: false }),
        build: {
            builder: 'RAILPACK',
            buildCommand: isProduction
                ? 'yarn install --frozen-lockfile && yarn build'
                : 'yarn install --immutable && yarn build'
        },
        deploy: {
            healthcheckPath: '/',
            healthcheckTimeout: 300,
            restartPolicyType: 'ON_FAILURE',
            restartPolicyMaxRetries: 10,
            sleepApplication: isProduction ? true : undefined
        },
        replicas: { 'us-west2': 1 },
        domains: isProduction ? ['sallyjkphoto.com'] : undefined,
        env: {
            ADMIN_PASSWORD: preserve(),
            BODY_SIZE_LIMIT: preserve(),
            JWT_SECRET: preserve(),
            MAX_REQUEST_SIZE: preserve(),
            NODE_ENV: preserve(),
            REQUEST_BODY_SIZE_LIMIT: preserve(),
            SANITY_API_TOKEN: preserve(),
            VITE_EMAIL_PASSWORD: preserve(),
            VITE_EMAIL_USER: preserve(),
            VITE_SANITY_API_VERSION: preserve(),
            VITE_SANITY_DATASET: preserve(),
            VITE_SANITY_PROJECT_ID: preserve(),
            VITE_USE_CDN: preserve()
        }
    });

    return project('sassy-sal', {
        resources: [sassySal]
    });
});
