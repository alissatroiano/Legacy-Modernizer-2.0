
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { CodeChunk, CopybookField, CloudMapping, GroundingSource, TestResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Utility function to handle exponential backoff for API calls.
 * Specifically targets 503 (Overloaded) and 429 (Rate Limit) errors.
 */
async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    const errorString = error?.toString() || "";
    const isRetryable = errorString.includes("503") || errorString.includes("429") || errorString.includes("overloaded") || errorString.includes("Rate limit");

    if (retries > 0 && isRetryable) {
      console.warn(`API Overloaded or Rate Limited. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
}

export const researchModernEquivalents = async (query: string): Promise<{ research: string, sources: GroundingSource[] }> => {
  const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Identify the industry domain and find the most modern Python libraries and Google Cloud best practices for migrating this legacy module: ${query}. 
    Focus on industry-specific precision (e.g. financial, actuarial, or logistical), high-availability GCP services, and data integrity standards.`,
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
  const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Perform an Autonomous System Audit on this legacy COBOL source code.
    1. Identify the Primary Domain (e.g. Banking, Insurance, Government, Logistics).
    2. Extract a "Mission-Critical Blueprint" defining business capabilities.
    3. Propose a GCP Landing Zone architecture optimized for this specific industry's compliance needs.
    4. Perform deep data archaeology on EBCDIC and record-level storage requirements.
    Code snippet: ${fullCode.substring(0, 8000)}...`,
    config: {
      temperature: 0.1
    }
  }));
  return response.text;
};

export const splitCodeIntoChunks = async (fullCode: string): Promise<{ chunks: { name: string, code: string }[] }> => {
  const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Split the following COBOL source code into logical modules (e.g. Processing, Data Division, Procedures). 
    Ensure modular boundaries respect the underlying business domain logic.
    Return a JSON array of objects with 'name' and 'code' keys.
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
    model: 'gemini-3-pro-preview',
    contents: `
    Act as a GCP Cloud Architect and Senior Python Engineer specializing in critical infrastructure modernization.
    Legacy module: ${chunk.name}.
    INDUSTRY CONTEXT & RESEARCH: ${modernResearch}
    TASK: Deep logic archaeology and modern Python 3.12 implementation.
    Ensure strict functional parity with the original legacy rules while utilizing cloud-native patterns.
    COBOL Source: ${chunk.cobolSource}`,
    config: {
      temperature: 0.1,
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
    throw new Error("Failed to parse module logic response.");
  }
};

export const generateTests = async (pythonCode: string, cobolReference: string): Promise<{ testCode: string, coverageEstimate: number }> => {
  const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate robust Pytest unit tests for this enterprise Python code. 
    Ensure edge cases for the specific business domain and COBOL-parity are covered.
    Python: ${pythonCode}
    COBOL Reference: ${cobolReference}`,
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
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { testCode: "", coverageEstimate: 0 };
  }
};

export const executeValidation = async (pythonCode: string, testCode: string): Promise<TestResult[]> => {
  const response: GenerateContentResponse = await callWithRetry(() => ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Act as a Python Test Executor. Evaluate the implementation against tests.
    IMPLEMENTATION: ${pythonCode}
    TESTS: ${testCode}`,
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
