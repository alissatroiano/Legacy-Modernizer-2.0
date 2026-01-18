
import { GoogleGenAI, Type } from "@google/genai";
import { CodeChunk } from "../types";

// Always use the API key directly from the environment variable as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeLegacyCodebase = async (fullCode: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze this COBOL banking system source code with deep mainframe awareness.
    1. Extract a "System Blueprint" defining business capabilities.
    2. Identify specific legacy data patterns:
       - EBCDIC encoding requirements (e.g., COMP, COMP-3 packed decimals).
       - Copybook dependencies and shared record structures.
       - File Access Methods (VSAM, QSAM, Indexed files).
    3. Suggest a modernization strategy that handles these data-integrity critical patterns.
    Code snippet: ${fullCode.substring(0, 10000)}...`,
    config: {
      temperature: 0.2,
      thinkingConfig: { thinkingBudget: 4000 }
    }
  });
  return response.text;
};

export const splitCodeIntoChunks = async (fullCode: string): Promise<{ chunks: { name: string, code: string }[] }> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Split the following COBOL source code into logical business modules. 
    Keep Copybook definitions and FD (File Description) sections with the logic that uses them.
    Return a JSON array of objects with 'name' and 'code' keys.
    Code:
    ${fullCode}`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          chunks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                code: { type: Type.STRING }
              },
              required: ['name', 'code']
            }
          }
        },
        required: ['chunks']
      }
    }
  });
  
  try {
    return JSON.parse(response.text || '{"chunks": []}');
  } catch (e) {
    console.error("Failed to parse chunks", e);
    return { chunks: [{ name: "Main Module", code: fullCode }] };
  }
};

export const processModuleLogic = async (chunk: CodeChunk): Promise<{ pythonSource: string, businessRules: string }> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `
    Act as a Mainframe Modernization Architect.
    Review the following COBOL module: ${chunk.name}.
    
    TASK 1: BUSINESS RULE MINING & DATA ARCHAEOLOGY
    - Extract business rules and logic flows.
    - Identify Legacy Data Artifacts:
        * EBCDIC mappings: How are COMP and COMP-3 fields treated? (Map them to Python Decimal/Fixed-point).
        * Copybook Resolution: If COPY statements exist, infer the record structure.
        * File I/O: Map VSAM/Sequential access to modern SQLAlchemy or File Stream patterns.
    - Describe these in plain English for a non-technical stakeholder.
    
    TASK 2: CLEAN-SHEET MODERNIZATION
    - Rewrite into modern Python 3.12+ (DDD approach).
    - Use Pydantic for data structures, ensuring precision for banking math (no floats for currency!).
    - Abstract legacy file handling into clean Repository patterns.
    
    COBOL Source:
    ${chunk.cobolSource}
    `,
    config: {
      temperature: 0.1,
      thinkingConfig: { thinkingBudget: 12000 },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          pythonSource: { type: Type.STRING },
          businessRules: { type: Type.STRING }
        },
        required: ['pythonSource', 'businessRules']
      }
    }
  });
  
  try {
    return JSON.parse(response.text || '{"pythonSource": "", "businessRules": ""}');
  } catch (e) {
    console.error("Failed to parse module logic", e);
    return { pythonSource: response.text || "", businessRules: "Extraction failed. See technical source for logic." };
  }
};

export const generateTests = async (pythonCode: string, cobolReference: string): Promise<{ testCode: string, coverageEstimate: number }> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
    Generate Pytest unit tests for this modern Python implementation of legacy COBOL logic.
    Focus on:
    1. Precision verification for decimal/banking math.
    2. Boundary testing for record structures previously defined in Copybooks.
    3. Mocking legacy file I/O (VSAM/Sequential) to ensure logic is storage-agnostic.
    
    Python Code:
    ${pythonCode}
    
    COBOL Reference:
    ${cobolReference}
    `,
    config: {
      temperature: 0.1,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          testCode: { type: Type.STRING },
          coverageEstimate: { type: Type.INTEGER }
        },
        required: ['testCode', 'coverageEstimate']
      }
    }
  });
  
  try {
    return JSON.parse(response.text || '{"testCode": "", "coverageEstimate": 0}');
  } catch (e) {
    return { testCode: response.text || "", coverageEstimate: 0 };
  }
};
