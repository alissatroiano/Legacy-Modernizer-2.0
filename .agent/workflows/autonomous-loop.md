---
description: How to use and verify the autonomous testing loops
---

// turbo-all
# Autonomous Testing Loop Workflow

This project ensures code integrity by running a real-time verification loop between the Modernizer and a Python execution engine (Pyodide).

## 1. Trigger the Migration
- Upload your COBOL source files via the UI.
- Click **"Initiate Logic Recovery"**.

## 2. Observe the Autonomous Cycle
The system will automatically perform the following steps for each module:
1. **Extraction**: Analyze COBOL and map dependencies.
2. **Implementation**: Generate modern Python 3.12+ code.
3. **Test Generation**: Generate a Pytest-style suite for the logic.
4. **Execution**: Run the Python code and tests in a WASM sandbox.
5. **Validation**: Check results. If failures occur, the system enters the **Self-Healing Loop**.

## 3. Self-Healing Loop Details
- If `runPythonValidation` returns failures, the traceback is sent to Gemini.
- Gemini analyzes the error and the original COBOL source.
- A fixed version is produced and re-executed.
- The loop continues for up to 3 attempts until parity is achieved.

## 4. Manual Verification of the Loop
To verify the loop itself as a developer:
1. Check terminal for `Executing real-time validation` logs.
2. Open the **Validation** tab in the UI to see real Python tracebacks.
3. Verify that the `testResults` property in the state contains actual failure messages during healing attempts.
