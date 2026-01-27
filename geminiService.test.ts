import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as geminiService from './services/geminiService';

const { mockGenerateContent } = vi.hoisted(() => {
    return { mockGenerateContent: vi.fn() };
});

vi.mock('@google/genai', () => {
    return {
        GoogleGenAI: vi.fn().mockImplementation(function () {
            return {
                models: {
                    generateContent: mockGenerateContent
                },
                getGenerativeModel: () => ({
                    generateContent: mockGenerateContent
                })
            };
        }),
        Type: {
            OBJECT: 'OBJECT',
            ARRAY: 'ARRAY',
            STRING: 'STRING',
            INTEGER: 'INTEGER'
        }
    };
});

describe('geminiService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Default mock implementation
        mockGenerateContent.mockResolvedValue({
            text: "{}",
            candidates: [{
                groundingMetadata: {
                    groundingChunks: [
                        { web: { title: "Test Source", uri: "http://test.com" } }
                    ]
                }
            }]
        });
    });

    it('researchModernEquivalents returns research text and sources', async () => {
        const result = await geminiService.researchModernEquivalents('COBOL VSAM');
        expect(result).toHaveProperty('research');
        expect(result.sources).toHaveLength(1);
    });

    it('analyzeLegacyCodebase returns analysis text', async () => {
        mockGenerateContent.mockResolvedValueOnce({
            text: "Analysis result",
            candidates: []
        });
        const analysis = await geminiService.analyzeLegacyCodebase('IDENTIFICATION DIVISION.');
        expect(analysis).toBe('Analysis result');
    });

    it('splitCodeIntoChunks handles content splitting', async () => {
        mockGenerateContent.mockResolvedValueOnce({
            text: JSON.stringify({ chunks: [{ name: 'TEST.CBL', code: 'CODE' }] }),
            candidates: []
        });
        const result = await geminiService.splitCodeIntoChunks('*> SOURCE_FILE: TEST.CBL\nCODE');
        expect(result.chunks).toHaveLength(1);
        expect(result.chunks[0].name).toBe('TEST.CBL');
    });

    it('processModuleLogic returns structured python logic', async () => {
        mockGenerateContent.mockResolvedValueOnce({
            text: JSON.stringify({
                pythonSource: 'print("hello")',
                businessRules: 'Rule 1',
                copybookStructure: [],
                cloudTargetArchitecture: []
            }),
            candidates: []
        });
        const chunk = { id: '1', name: 'TEST.CBL', cobolSource: 'CODE', status: 'PENDING' as const, complexity: 1 };
        const result = await geminiService.processModuleLogic(chunk, 'Research');
        expect(result.pythonSource).toBe('print("hello")');
    });

    it('generateTests returns test code and coverage', async () => {
        mockGenerateContent.mockResolvedValueOnce({
            text: JSON.stringify({ testCode: 'def test(): pass', coverageEstimate: 80 }),
            candidates: []
        });
        const result = await geminiService.generateTests('Python content', 'COBOL content');
        expect(result.testCode).toBe('def test(): pass');
        expect(result.coverageEstimate).toBe(80);
    });

    it('executeValidation returns an array of results', async () => {
        mockGenerateContent.mockResolvedValueOnce({
            text: JSON.stringify([{ name: 'Test 1', status: 'PASSED', duration: '10ms' }]),
            candidates: []
        });
        const result = await geminiService.executeValidation('Python', 'Test');
        expect(result).toHaveLength(1);
        expect(result[0].status).toBe('PASSED');
    });
});
