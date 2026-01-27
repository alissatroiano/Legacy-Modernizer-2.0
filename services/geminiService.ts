
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { CodeChunk, CopybookField, CloudMapping, GroundingSource, TestResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

async function callWithRetry<T>(fn: () => Promise<T>, retries = 5, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorString = error?.toString() || "";
    const isRetryable = errorString.includes("503") || errorString.includes("429") || errorString.includes("overloaded");
    
    if (retries > 0 && isRetryable) {
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
        sources.push({ title: chunk.web.title || "Technical Documentation", uri: chunk.web.uri });
      }
    });
  }

  return { research: response.text || "", sources };
};

export const analyzeLegacyCodebase = async (fullCode: string) => {
  const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Autonomous System Audit:
    Analyze the full legacy system.
    1. Logical Topology: Map all call hierarchies.
    2. File Management: Identify SEQUENTIAL, INDEXED, and RELATIVE access methods.
    3. State Tracking: Note COMMAREA or LINKAGE structures.
    
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
    contents: `MANDATORY DECONSTRUCTION TASK:
    The following input contains multiple legacy source files prefixed with '*> SOURCE_FILE: [filename]'.
    
    CRITICAL INSTRUCTION: 
    - You MUST create exactly ONE module for every 'SOURCE_FILE' marker found. 
    - Do NOT merge files. If there are 29 markers, you MUST return 29 modules.
    - Each module name should match the filename provided in the marker.
    - Preserve all DIVISION and SECTION headers for each file.
    
    Return a JSON array of {name, code}.
    Input: ${fullCode.substring(0, 30000)}`,
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
    throw new Error("Split logic failed to identify program boundaries.");
  } catch (e) {
    return { chunks: [{ name: "System Core", code: fullCode }] };
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
    Module: ${chunk.name}
    Context: ${modernResearch}
    
    REQUIREMENTS:
    1. Handle COBOL file access (Sequential, Indexed, Relative) with modern Python patterns.
    2. Preserve record integrity and PIC clause validation.
    3. Implement Repository patterns for Indexed/VSAM data.
    
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
    contents: `Generate Pytest suite for functional parity.
    Mock File Access Layer to verify Python logic vs COBOL file operations.
    Python: ${pythonCode}
    COBOL: ${cobolReference}`,
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
    Implementation: ${pythonCode}
    Tests: ${testCode}`,
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
