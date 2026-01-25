
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
    contents: `Industry Research: Find modern Python libraries and GCP architectural patterns for: ${query}. 
    Focus on equivalents for:
    1. VSAM/Indexed file handling (e.g., Cloud Spanner, SQLAlchemy primary key indexing).
    2. Sequential file processing (fixed-width parsing, streaming GCS).
    3. Relative file access (Redis, Key-Value data structures).`,
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
          title: chunk.web.title || "Technical Documentation",
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
    contents: `Autonomous System Audit for Modernization:
    Analyze this large codebase of multiple legacy programs:
    1. Logical Topology: Identify all PROGRAM-IDs and their call hierarchies.
    2. File Management: List all SELECT/ASSIGN statements. Categorize them as SEQUENTIAL, INDEXED (VSAM), or RELATIVE.
    3. State Tracking: Note the structure of COMMAREA or LINKAGE SECTION for inter-module communication.
    4. Target Architecture: Propose a GCP-native data persistence strategy that preserves record-level integrity.
    
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
    contents: `Deconstruct this legacy codebase into individual functional modules. 
    MANDATORY GRANULARITY RULE: 
    - Every 'PROGRAM-ID' or distinct '.cbl' source file must be its own module. 
    - Do NOT collapse multiple programs into one module.
    - If there are 29 distinct programs, return 29 objects in the array.
    - Ensure each module includes its corresponding FILE-CONTROL and DATA DIVISION segments.
    
    Return a JSON array of {name, code}.
    Source: ${fullCode.substring(0, 25000)}`,
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
      },
      thinkingConfig: { thinkingBudget: 8192 }
    }
  }));
  
  try {
    const parsed = JSON.parse(response.text || '{"chunks": []}');
    if (parsed.chunks && parsed.chunks.length > 0) return parsed;
    throw new Error("Module splitting failed to identify distinct programs.");
  } catch (e) {
    return { chunks: [{ name: "Main System Core", code: fullCode }] };
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
    Module Modernization Engine: ${chunk.name}
    Grounding Context: ${modernResearch}
    
    LOGIC ARCHAEOLOGY REQUIREMENTS:
    1. FILE ACCESS PARITY:
       - SEQUENTIAL: Implement as generators or Pandas dataframes using fixed-width formatters.
       - INDEXED (VSAM): Implement using a Repository pattern with SQLAlchemy. Primary keys must match COBOL RECORD KEYs.
       - RELATIVE: Implement as keyed lookups (dictionary or Redis).
    2. DATA INTEGRITY: Use Python Type Hints and Pydantic validators to mirror COBOL 'PIC' clauses (e.g., PIC 9(5) becomes a range-validated integer).
    3. PERFORMANCE: Ensure efficient file/DB I/O by implementing COBOL's 'READ NEXT' as indexed database queries.
    4. ERROR HANDLING: Mirror FILE STATUS codes (e.g., 00, 10, 23) using custom Python exceptions for specific database/file errors.
    
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
    throw new Error(`Logic archaeology failed for ${chunk.name}`);
  }
};

export const generateTests = async (pythonCode: string, cobolReference: string): Promise<{ testCode: string, coverageEstimate: number }> => {
  const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Generate a functional parity test suite (Pytest).
    Ensure the tests mock the Data Access Layer to verify that the Python logic handles Sequential/Indexed/Relative file operations identically to the legacy system.
    
    Python Code: ${pythonCode}
    COBOL Reference: ${cobolReference}`,
    config: {
      temperature: 0.1,
      thinkingConfig: { thinkingBudget: 8192 },
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
    contents: `Virtual Parity Verification.
    Return a detailed status for each logical branch test.
    Implementation: ${pythonCode}
    Test Suite: ${testCode}`,
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
