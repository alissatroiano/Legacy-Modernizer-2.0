
import { TestResult } from "../types";

declare global {
    interface Window {
        loadPyodide: any;
    }
}

let pyodideInstance: any = null;

export const initPyodide = async () => {
    if (pyodideInstance) return pyodideInstance;

    if (!window.loadPyodide) {
        throw new Error("Pyodide script not loaded. Ensure index.html has the CDN script.");
    }

    pyodideInstance = await window.loadPyodide();
    return pyodideInstance;
};

export const runPythonValidation = async (pythonCode: string, testCode: string): Promise<TestResult[]> => {
    const pyodide = await initPyodide();

    const runnerScript = `
import sys
import io
import traceback

# Redirect stdout/stderr to capture it
stdout_capture = io.StringIO()
stderr_capture = io.StringIO()
sys.stdout = stdout_capture
sys.stderr = stderr_capture

# The user code and test code
implementation = """${pythonCode.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"""
tests = """${testCode.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')}"""

results = []

try:
    # Execute implementation
    exec(implementation, globals())
    
    # Simple test runner logic
    # We parse the test code for functions starting with 'test_'
    test_namespace = {}
    exec(implementation + "\\n" + tests, test_namespace)
    
    test_functions = [name for name in test_namespace if name.startsWith('test_')]
    
    for test_name in test_functions:
        try:
            # We assume tests are functions or simple assertions
            test_namespace[test_name]()
            results.append({
                "name": test_name,
                "status": "PASSED",
                "duration": "0.1s"
            })
        except Exception as e:
            results.append({
                "name": test_name,
                "status": "FAILED",
                "message": traceback.format_exc(),
                "duration": "0.1s"
            })
            
except Exception as e:
    results.append({
        "name": "Bootstrap/Syntax check",
        "status": "FAILED",
        "message": traceback.format_exc(),
        "duration": "0s"
    })

results
`;

    try {
        const pyResults = await pyodide.runPythonAsync(runnerScript);
        // Pyodide returns a PyProxy for the list, we convert to JS
        return pyResults.toJs();
    } catch (err) {
        return [{
            name: "Runner Execution",
            status: "FAILED",
            message: String(err),
            duration: "0s"
        }];
    }
};
