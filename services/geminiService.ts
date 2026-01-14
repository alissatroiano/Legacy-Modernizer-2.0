
import { GoogleGenAI, Type } from "@google/genai";
import { CodeChunk } from "../types";

// Always use the API key directly from the environment variable as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeLegacyCodebase = async (fullCode: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze this COBOL banking system source code. 
    1. Extract a "System Blueprint" that defines every high-level business capability.
    2. Identify key domain entities and their relationships.
    3. Suggest a microservices-oriented rewrite strategy.
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
    Focus on functional boundaries (e.g., Ledger Updates, Interest Calculation, KYC Validation).
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
    Act as a Business Analyst and Senior Architect. 
    Review the following COBOL module: ${chunk.name}.
    
    TASK 1: BUSINESS RULE MINING
    Extract all underlying business rules, data validations, and logic flows. 
    Describe them in human-readable, plain English for a product owner. 
    Ignore legacy hardware constraints; focus on functional intent.
    
    TASK 2: CLEAN-SHEET MODERNIZATION
    Rewrite this logic into modern Python 3.12+ using a Domain-Driven Design (DDD) approach.
    Use Pydantic for models and type safety.
    
    COBOL Source:
    ${chunk.cobolSource}
    `,
    config: {
      temperature: 0.1,
      thinkingConfig: { thinkingBudget: 12000 }, // High budget for deep rule extraction
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
    Generate Pytest unit tests based on the extracted business logic and original COBOL source.
    Ensure edge cases from the legacy system are covered.
    
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
