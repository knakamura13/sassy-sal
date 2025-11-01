# Upload Retry Configuration

This project supports configurable retry logic for image uploads to handle network connectivity issues. The retry behavior can be customized using environment variables.

## Environment Variables

All settings have sensible defaults, but can be customized based on your deployment environment.

### Client-Side Variables (VITE\_ prefix)

These variables are used in the browser for client-side uploads:

```bash
# Maximum number of retry attempts (0-10, default: 3)
VITE_UPLOAD_MAX_RETRIES=3

# Initial delay in milliseconds for the first retry (100-5000ms, default: 1000ms)
VITE_UPLOAD_INITIAL_DELAY_MS=1000

# Maximum delay in milliseconds for exponential backoff (1000-30000ms, default: 8000ms)
VITE_UPLOAD_MAX_DELAY_MS=8000

# Upload timeout in milliseconds (5000-300000ms, default: 60000ms)
VITE_UPLOAD_TIMEOUT_MS=60000

# Whether to retry on network errors (true/false, default: true)
VITE_UPLOAD_RETRY_ON_NETWORK_ERRORS=true
```

### Server-Side Variables

These variables are used on the server for server-side upload processing:

```bash
# Maximum number of retry attempts (0-10, default: 3)
UPLOAD_MAX_RETRIES=3

# Initial delay in milliseconds for the first retry (100-5000ms, default: 1000ms)
UPLOAD_INITIAL_DELAY_MS=1000

# Maximum delay in milliseconds for exponential backoff (1000-30000ms, default: 8000ms)
UPLOAD_MAX_DELAY_MS=8000

# Upload timeout in milliseconds (5000-300000ms, default: 60000ms)
UPLOAD_TIMEOUT_MS=60000

# Whether to retry on network errors (true/false, default: true)
UPLOAD_RETRY_ON_NETWORK_ERRORS=true
```

## Default Values

The system uses these sensible defaults if no environment variables are set:

-   **Max Retries**: 3 attempts
-   **Initial Delay**: 1000ms (1 second)
-   **Max Delay**: 8000ms (8 seconds)
-   **Timeout**: 60000ms (60 seconds)
-   **Retry on Network Errors**: true

## Retry Behavior

### Exponential Backoff with Jitter

The retry mechanism uses exponential backoff with jitter to avoid thundering herd problems:

1. **First retry**: ~1 second (with ±25% jitter)
2. **Second retry**: ~2 seconds (with ±25% jitter)
3. **Third retry**: ~4 seconds (with ±25% jitter)
4. **Additional retries**: Capped at max delay setting

### Error Types That Trigger Retries

The system automatically retries these types of errors:

-   `Failed to fetch`
-   `NetworkError`
-   `ERR_NETWORK_CHANGED`
-   Connection-related errors
-   Timeout errors

### Configuration Limits

To prevent misconfigurations, the system enforces these limits:

-   **Max Retries**: 0-10 attempts
-   **Initial Delay**: 100ms-5 seconds
-   **Max Delay**: 1-30 seconds
-   **Timeout**: 5 seconds-5 minutes

## Usage Examples

### High-Traffic Environment

For environments with high upload volumes, you might want more aggressive retries:

```bash
VITE_UPLOAD_MAX_RETRIES=5
VITE_UPLOAD_INITIAL_DELAY_MS=500
VITE_UPLOAD_MAX_DELAY_MS=4000
```

### Slow Network Environment

For environments with slower or less reliable networks:

```bash
VITE_UPLOAD_MAX_RETRIES=5
VITE_UPLOAD_INITIAL_DELAY_MS=2000
VITE_UPLOAD_MAX_DELAY_MS=15000
VITE_UPLOAD_TIMEOUT_MS=120000
```

### Testing Environment

For testing, you might want to disable retries to see failures immediately:

```bash
VITE_UPLOAD_MAX_RETRIES=0
VITE_UPLOAD_RETRY_ON_NETWORK_ERRORS=false
```

## Monitoring

The system logs retry attempts to the console, including:

-   File name and size
-   Retry attempt number
-   Delay before next attempt
-   Error message that triggered the retry

This helps with debugging network issues and tuning retry parameters.
