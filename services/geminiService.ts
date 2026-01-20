
import { GoogleGenAI, Type } from "@google/genai";
import { CodeChunk, CopybookField } from "../types";

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

export const processModuleLogic = async (chunk: CodeChunk): Promise<{ pythonSource: string, businessRules: string, copybookStructure: CopybookField[] }> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `
    Act as a Mainframe Modernization Architect and Senior Python Engineer.
    Review the following COBOL module: ${chunk.name}.
    
    TASK 1: BUSINESS RULE MINING & DATA ARCHAEOLOGY
    - Extract business rules and logic flows.
    - Identify Legacy Data Artifacts:
        * EBCDIC mappings: How are COMP and COMP-3 fields treated? (Map them to Python Decimal/Fixed-point).
        * Copybook Resolution: Parse all record structures (01, 05, etc. levels) and map them to their Python counterparts.
        * File I/O: Map VSAM/Sequential access to modern Repository patterns.
    
    TASK 2: CLEAN-SHEET MODERNIZATION WITH ROBUST ERROR HANDLING
    - Rewrite into modern Python 3.12+ (DDD approach).
    - Use Pydantic for data structures.
    
    TASK 3: DATA STRUCTURE MAPPING (COPYBOOK)
    - Provide a structured list of every field identified in the COBOL (from WORKING-STORAGE or LINKAGE SECTION).
    - Map each field to its specific Python attribute name in the generated code.
    
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
          businessRules: { type: Type.STRING },
          copybookStructure: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                originalField: { type: Type.STRING },
                pythonMapping: { type: Type.STRING },
                dataType: { type: Type.STRING },
                description: { type: Type.STRING }
              },
              required: ['originalField', 'pythonMapping', 'dataType', 'description']
            }
          }
        },
        required: ['pythonSource', 'businessRules', 'copybookStructure']
      }
    }
  });
  
  try {
    return JSON.parse(response.text || '{"pythonSource": "", "businessRules": "", "copybookStructure": []}');
  } catch (e) {
    console.error("Failed to parse module logic", e);
    return { 
      pythonSource: response.text || "", 
      businessRules: "Extraction failed.", 
      copybookStructure: [] 
    };
  }
};

export const generateTests = async (pythonCode: string, cobolReference: string): Promise<{ testCode: string, coverageEstimate: number }> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
    Generate Pytest unit tests for this modern Python implementation of legacy COBOL logic.
    Focus on precision, boundary testing, and error handling for bad data or I/O interruptions.
    
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
