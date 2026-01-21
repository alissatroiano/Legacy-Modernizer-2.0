
import { GoogleGenAI, Type } from "@google/genai";
import { CodeChunk, CopybookField, CloudMapping, GroundingSource, TestResult } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Uses Search Grounding to find the latest industry standards for mainframe migration.
 */
export const researchModernEquivalents = async (query: string): Promise<{ research: string, sources: GroundingSource[] }> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Find the most modern Python libraries and Google Cloud best practices for: ${query}. 
    Focus on financial services, mainframe modernization, and data integrity.`,
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  const sources: GroundingSource[] = [];
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (chunks) {
    chunks.forEach((chunk: any) => {
      if (chunk.web) {
        sources.push({
          title: chunk.web.title || "Web Resource",
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
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze this COBOL banking system source code for a Google Cloud Platform (GCP) migration.
    1. Extract a "System Blueprint" defining business capabilities.
    2. Propose a GCP Landing Zone architecture.
    3. Perform deep data archaeology on EBCDIC and VSAM requirements.
    Code snippet: ${fullCode.substring(0, 10000)}...`,
    config: {
      temperature: 0.1,
      thinkingConfig: { thinkingBudget: 32768 }
    }
  });
  return response.text;
};

export const splitCodeIntoChunks = async (fullCode: string): Promise<{ chunks: { name: string, code: string }[] }> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Split the following COBOL source code into logical business modules. 
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
    return { chunks: [{ name: "Main Module", code: fullCode }] };
  }
};

export const processModuleLogic = async (chunk: CodeChunk, modernResearch: string): Promise<{ 
  pythonSource: string, 
  businessRules: string, 
  copybookStructure: CopybookField[], 
  cloudTargetArchitecture: CloudMapping[] 
}> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `
    Act as a GCP Cloud Architect and Senior Python Engineer.
    COBOL module: ${chunk.name}.
    MODERN CONTEXT: ${modernResearch}
    TASK: Deep logic archaeology, Python 3.12+ implementation, and GCP artifact mapping.
    COBOL Source: ${chunk.cobolSource}`,
    config: {
      temperature: 0.1,
      thinkingConfig: { thinkingBudget: 32768 },
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
  });
  
  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { 
      pythonSource: response.text || "", 
      businessRules: "Extraction failed.", 
      copybookStructure: [],
      cloudTargetArchitecture: []
    };
  }
};

export const generateTests = async (pythonCode: string, cobolReference: string): Promise<{ testCode: string, coverageEstimate: number }> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate Pytest unit tests for this Python code based on COBOL logic.
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
  });
  
  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { testCode: response.text || "", coverageEstimate: 0 };
  }
};

/**
 * Simulates the execution of the generated Python tests against the implementation.
 */
export const executeValidation = async (pythonCode: string, testCode: string): Promise<TestResult[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Act as a Python Test Executor. Evaluate the following Python implementation against its unit tests.
    IMPLEMENTATION:
    ${pythonCode}
    
    TESTS:
    ${testCode}
    
    Provide a detailed report of which tests pass and which fail. Simulate a realistic 'pytest' run.`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'Test function name' },
            status: { type: Type.STRING, enum: ['PASSED', 'FAILED'] },
            message: { type: Type.STRING, description: 'Optional error message or description' },
            duration: { type: Type.STRING, description: 'Execution time e.g. "0.02s"' }
          },
          required: ['name', 'status', 'duration']
        }
      }
    }
  });

  try {
    return JSON.parse(response.text || '[]');
  } catch (e) {
    return [];
  }
};
