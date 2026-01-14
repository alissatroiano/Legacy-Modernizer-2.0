
import { GoogleGenAI, Type } from "@google/genai";
import { CodeChunk } from "../types";

// Always use the API key directly from the environment variable as per guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeLegacyCodebase = async (fullCode: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze this COBOL banking system source code. Provide a high-level architecture overview, identify key business entities, and suggest an incremental migration strategy to Python. 
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
    contents: `Split the following COBOL source code into logical functional modules (e.g., File Definitions, Transaction Logic, Report Generation). 
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

export const translateChunk = async (chunk: CodeChunk) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `
    Act as a senior software architect specializing in Mainframe Modernization.
    Translate the following COBOL module to modern, scalable Python 3.12+.
    
    Guidelines:
    1. Use modern patterns (FastAPI style if applicable, Pydantic for data validation, or SQLAlchemy for database logic).
    2. Ensure business logic is strictly preserved.
    3. Include high-quality docstrings and type hints.
    4. Ensure the output is clean, readable, and PEP8 compliant.
    
    COBOL Module Name: ${chunk.name}
    COBOL Source:
    ${chunk.cobolSource}
    `,
    config: {
      temperature: 0.1,
      thinkingConfig: { thinkingBudget: 8000 }
    }
  });
  return response.text;
};

export const generateTests = async (pythonCode: string, cobolReference: string) => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `
    Generate comprehensive Pytest unit tests for the following Python code, ensuring it handles the edge cases described or implied in the original COBOL logic.
    
    Original COBOL Logic Reference:
    ${cobolReference}
    
    Python Code:
    ${pythonCode}
    `,
    config: {
      temperature: 0.1
    }
  });
  return response.text;
};
