
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { CodeChunk, CopybookField, CloudMapping, GroundingSource, TestResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Utility function to handle exponential backoff for API calls.
 */
async function callWithRetry<T>(fn: () => Promise<T>, retries = 5, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorString = error?.toString() || "";
    const isRetryable = errorString.includes("503") || errorString.includes("429") || errorString.includes("overloaded");
    
    if (retries > 0 && isRetryable) {
      console.warn(`API Busy. Retrying in ${delay}ms... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export const researchModernEquivalents = async (query: string): Promise<{ research: string, sources: GroundingSource[] }> => {
  const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Industry Research: Find modern Python libraries and GCP architectural patterns for migrating legacy: ${query}. 
    Specifically look for equivalents to COBOL file handling (VSAM, Indexed, Sequential) and CICS transaction patterns.`,
    config: {
      tools: [{ googleSearch: {} }]
    }
  }));

  const sources: GroundingSource[] = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks) {
    chunks.forEach((chunk: any) => {
      if (chunk.web) {
        sources.push({
          title: chunk.web.title || "Technical Resource",
          uri: chunk.web.uri
        });
      }
    });
  }

  return {
    research: response.text || "",
    sources: sources
  };
};

export const analyzeLegacyCodebase = async (fullCode: string) => {
  const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Perform an Autonomous Deep Audit on this legacy codebase (29+ files potentially).
    1. Identify the core domain and logical boundaries.
    2. Map out the File Access patterns (Sequential, Indexed/VSAM, Relative).
    3. Define the Global State/Communication Area (COMMAREA) dependencies.
    4. Propose a GCP architecture (Cloud Spanner, SQL, or GCS) based on the observed data access.
    
    Source Digest: ${fullCode.substring(0, 15000)}...`,
    config: {
      temperature: 0.1,
      thinkingConfig: { thinkingBudget: 16384 }
    }
  }));
  return response.text;
};

export const splitCodeIntoChunks = async (fullCode: string): Promise<{ chunks: { name: string, code: string }[] }> => {
  const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Deconstruct this large legacy codebase into high-fidelity logical modules. 
    Crucial: Do not aggregate unrelated files. Each major COBOL program or subprogram should be its own module.
    Ensure 'FILE SECTION' and 'WORKING-STORAGE' context is preserved or noted for each module.
    Return a comprehensive JSON array.
    Code: ${fullCode.substring(0, 20000)}`,
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
  }));
  
  try {
    const parsed = JSON.parse(response.text || '{"chunks": []}');
    if (parsed.chunks && parsed.chunks.length > 0) return parsed;
    throw new Error("Empty chunks returned");
  } catch (e) {
    return { chunks: [{ name: "Core Module", code: fullCode }] };
  }
};

export const processModuleLogic = async (chunk: CodeChunk, modernResearch: string): Promise<{ 
  pythonSource: string, 
  businessRules: string, 
  copybookStructure: CopybookField[], 
  cloudTargetArchitecture: CloudMapping[] 
}> => {
  const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `
    Target: Modern Python 3.12 Enterprise Implementation.
    Module: ${chunk.name}.
    Context: ${modernResearch}
    
    MANDATORY REQUIREMENTS:
    1. FILE ACCESS: Map COBOL file modes (Sequential, Indexed, Relative) to appropriate Python persistence patterns (e.g. Pandas for Seq, SQLAlchemy/SQL for Indexed/VSAM).
    2. DATA INTEGRITY: Implement specific data validation for record formats and PIC clauses.
    3. STATE: Map COMMAREA or LINKAGE SECTION to FastAPI/Flask session or parameter objects.
    4. PARITY: Ensure every 'IF', 'PERFORM', and 'EVALUATE' block is logically represented.
    
    Source: ${chunk.cobolSource}`,
    config: {
      temperature: 0.1,
      thinkingConfig: { thinkingBudget: 16384 },
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
          },
          cloudTargetArchitecture: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                legacyComponent: { type: Type.STRING },
                gcpService: { type: Type.STRING },
                rationale: { type: Type.STRING }
              },
              required: ['legacyComponent', 'gcpService', 'rationale']
            }
          }
        },
        required: ['pythonSource', 'businessRules', 'copybookStructure', 'cloudTargetArchitecture']
      }
    }
  }));
  
  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    throw new Error(`Logic Archaeology failed for ${chunk.name}`);
  }
};

export const generateTests = async (pythonCode: string, cobolReference: string): Promise<{ testCode: string, coverageEstimate: number }> => {
  const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Synthesize a rigorous Pytest suite for functional parity verification.
    The tests MUST mock the File Access layer to verify that Python correctly handles what was previously COBOL file operations.
    Python: ${pythonCode}
    COBOL Reference: ${cobolReference}`,
    config: {
      temperature: 0.1,
      thinkingConfig: { thinkingBudget: 4096 },
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
  }));
  
  try {
    return JSON.parse(response.text || '{"testCode": "", "coverageEstimate": 0}');
  } catch (e) {
    return { testCode: "", coverageEstimate: 0 };
  }
};

export const executeValidation = async (pythonCode: string, testCode: string): Promise<TestResult[]> => {
  const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Execute this virtual validation cycle.
    IMPLEMENTATION: ${pythonCode}
    TEST SUITE: ${testCode}`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            status: { type: Type.STRING, enum: ['PASSED', 'FAILED'] },
            message: { type: Type.STRING },
            duration: { type: Type.STRING }
          },
          required: ['name', 'status', 'duration']
        }
      }
    }
  }));

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    return [];
  }
};
