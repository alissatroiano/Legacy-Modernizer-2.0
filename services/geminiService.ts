
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { CodeChunk, CopybookField, CloudMapping, GroundingSource, TestResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Utility function to handle exponential backoff for API calls.
 */
async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorString = error?.toString() || "";
    const isRetryable = errorString.includes("503") || errorString.includes("429") || errorString.includes("overloaded");
    
    if (retries > 0 && isRetryable) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 1.5);
    }
    throw error;
  }
}

export const researchModernEquivalents = async (query: string): Promise<{ research: string, sources: GroundingSource[] }> => {
  const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Fast Lookup: Find modern Python libraries and GCP patterns for: ${query}. 
    Focus on high-performance enterprise migration best practices.`,
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
          title: chunk.web.title || "Industry Resource",
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
  // We keep a small thinking budget here as the initial audit sets the "Vibe" for the whole project
  const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Rapid System Audit:
    1. Industry Domain.
    2. Critical Capabilities.
    3. Optimized GCP Target.
    Source: ${fullCode.substring(0, 10000)}...`,
    config: {
      temperature: 0.1,
      // Reduced thinking budget for faster "Vibe" feedback
      thinkingConfig: { thinkingBudget: 2048 }
    }
  }));
  return response.text;
};

export const splitCodeIntoChunks = async (fullCode: string): Promise<{ chunks: { name: string, code: string }[] }> => {
  const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Break this COBOL into logical business modules. Return JSON.
    Code: ${fullCode}`,
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
    return JSON.parse(response.text || '{"chunks": []}');
  } catch (e) {
    return { chunks: [{ name: "Main Core", code: fullCode }] };
  }
};

export const processModuleLogic = async (chunk: CodeChunk, modernResearch: string): Promise<{ 
  pythonSource: string, 
  businessRules: string, 
  copybookStructure: CopybookField[], 
  cloudTargetArchitecture: CloudMapping[] 
}> => {
  const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
    Module: ${chunk.name}.
    Context: ${modernResearch}
    Target: Modern Python 3.12 + GCP native.
    Legacy Logic Preservation is mandatory.
    Source: ${chunk.cobolSource}`,
    config: {
      temperature: 0.1,
      // Thinking budget removed for maximum Vibe speed
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
    throw new Error("Logic recovery failed to parse.");
  }
};

export const generateTests = async (pythonCode: string, cobolReference: string): Promise<{ testCode: string, coverageEstimate: number }> => {
  const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Create Pytest suite for functional parity verification.
    Python: ${pythonCode}
    COBOL: ${cobolReference}`,
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
    contents: `Run virtual tests and return report.
    Code: ${pythonCode}
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
