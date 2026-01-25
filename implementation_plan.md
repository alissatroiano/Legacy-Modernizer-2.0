# Implementation Plan - Autonomous Testing Loops

The goal is to ensure the LegacyLink Modernizer verifies its generated Python code through real, autonomous testing loops. Currently, the system uses "simulated" validation via Gemini. We will upgrade this to a real execution engine using Pyodide (Python in the browser) and enhance the self-healing cycle.

## User Review Required

> [!IMPORTANT]
> This plan introduces Pyodide as a client-side dependency to execute Python code directly in the browser. This allows for real functional verification without a backend.

- **Dependency**: Pyodide (via CDN)
- **Security**: Python code will run in a WASM sandbox in the user's browser.

## Proposed Changes

### 1. Infrastructure & Execution
- **`index.html`**: Add Pyodide CDN script.
- **`services/pythonRunner.ts`** (NEW): Create a service to:
    - Initialize the Pyodide environment.
    - Execute modernized Python code against generated Pytest-style tests.
    - Capture real stdout, stderr, and tracebacks.

### 2. Service Layer
- **`services/geminiService.ts`**: 
    - Update `executeValidation` to optionally use the real runner.
    - Refine `selfHealPythonCode` to accept real tracebacks for better accuracy.

### 3. Application Logic
- **`App.tsx`**:
    - Update the `processNextChunk` loop to use the real `pythonRunner`.
    - Enhance logs to show real-time test execution results (Passed/Failed with real error messages).
    - Increase `MAX_HEALING_ATTEMPTS` to 3 for better convergence.

### 4. UI/UX Enhancements
- **Validation Tab**: Show a "Live Console" output from the Python runner.
- **Status Indicators**: Distinguish between "Simulated Parity" and "Verified Parity".

## Verification Plan

### Automated Tests
- I will create a small test suite in `tests/modernizer.test.ts` (using Vitest, if I add it) or a standalone script to verify the self-healing loop logic.

### Manual Verification
1. Upload a sample COBOL snippet.
2. Run the migration.
3. Observe the "Autonomous Testing Loop" in action.
4. Verify that the Python code is actually executed and healed if it fails.
