# Test Suite for Sanity Upload Debugging

This test suite helps diagnose image upload issues in the SvelteKit + Sanity CMS application.

## Quick Diagnosis

Run these commands to quickly identify where upload issues are occurring:

```bash
# Test basic Sanity API permissions
yarn test:run src/tests/sanity-api.test.ts

# Test image URL generation functionality
yarn test:run src/tests/image-url-generation.test.ts

# Test upload API routes (requires dev server running)
yarn test:run src/tests/upload-api.test.ts
```

## Test Results Summary

### ✅ Working Components (Based on our tests)

1. **Sanity API Permissions** - All permissions verified:

    - Environment variables configured correctly
    - API key is valid and not expired
    - Read/write/update/delete permissions working
    - Asset upload permissions working
    - Project: `lwgwqd6k`, Dataset: `production`

2. **Image URL Generation** - All functionality verified:
    - `getImageUrls()` function working correctly
    - `urlFor()` function working correctly
    - Responsive URLs generated with proper sizing
    - Graceful handling of null/undefined inputs

### 🔍 Potential Problem Areas

Since basic Sanity functionality is working, upload failures are likely in these areas:

1. **Frontend Upload Flow**

    - File selection and validation
    - FormData preparation
    - Upload progress tracking
    - Error handling in UI components

2. **API Route Integration**

    - `/api/sanity/upload` endpoint
    - `/api/sanity` document creation endpoint
    - Error handling between client and server

3. **Complex Upload Logic**
    - Gallery component upload processing
    - Optimistic UI updates
    - CDN availability checking
    - Session storage caching

## Debugging Workflow

When upload issues occur:

1. **Run the test suite first**:

    ```bash
    yarn test:run
    ```

2. **Check browser console** for JavaScript errors during upload

3. **Check browser Network tab** for failed HTTP requests

4. **Check server logs** if running in development:

    ```bash
    yarn dev
    ```

5. **Test upload API directly** (with dev server running):
    ```bash
    yarn test:run src/tests/upload-api.test.ts
    ```

## Common Issue Patterns

Based on the code analysis, common upload failure patterns include:

-   **Environment Variable Issues**: Missing or incorrect `VITE_SANITY_PROJECT_ID` or `SANITY_API_TOKEN`
-   **File Size Issues**: Large files timing out or exceeding limits
-   **Network Issues**: Intermittent connectivity problems
-   **Race Conditions**: Multiple uploads happening simultaneously
-   **Memory Issues**: Blob URL memory leaks causing browser slowdown
-   **CDN Timing**: Images uploaded but not immediately available from Sanity CDN

## Next Steps for Debugging

If upload failures persist after confirming basic functionality works:

1. Add more detailed logging to the Gallery component upload process
2. Implement retry logic for failed uploads
3. Add better error messages and user feedback
4. Simplify the upload flow to reduce failure points
5. Add upload progress and cancellation support

## Test Coverage

Current tests cover:

-   ✅ Sanity API authentication and permissions
-   ✅ Image URL generation and transformation
-   ✅ Upload API endpoint functionality
-   ⏱️ Frontend upload component testing (future)
-   ⏱️ End-to-end upload flow testing (future)
