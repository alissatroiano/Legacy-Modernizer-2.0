import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import * as gemini from './services/geminiService';

// Mock the gemini service
vi.mock('./services/geminiService', () => ({
    analyzeLegacyCodebase: vi.fn(),
    splitCodeIntoChunks: vi.fn(),
    researchModernEquivalents: vi.fn(),
    processModuleLogic: vi.fn(),
    generateTests: vi.fn(),
    executeValidation: vi.fn(),
}));

describe('App Component', () => {
    it('renders the header and main title', () => {
        render(<App />);
        expect(screen.getByText('Logic Lift AI')).toBeInTheDocument();
        expect(screen.getByText(/Enterprise Mainframe to Modern Logic Recovery/i)).toBeInTheDocument();
    });

    it('shows the upload button', () => {
        render(<App />);
        const uploadButton = screen.getByText('Upload');
        expect(uploadButton).toBeInTheDocument();
    });

    it('initially has an empty source ingestion area', () => {
        render(<App />);
        const textarea = screen.getByPlaceholderText(/Paste COBOL programs or copybooks.../i);
        expect(textarea).toHaveValue('');
    });

    it('updates textarea value when changed', () => {
        render(<App />);
        const textarea = screen.getByPlaceholderText(/Paste COBOL programs or copybooks.../i);
        fireEvent.change(textarea, { target: { value: 'IDENTIFICATION DIVISION.' } });
        expect(textarea).toHaveValue('IDENTIFICATION DIVISION.');
    });

    it('starts migration process when button is clicked', async () => {
        const mockAnalyze = vi.mocked(gemini.analyzeLegacyCodebase).mockResolvedValue('System analysis result');
        const mockSplit = vi.mocked(gemini.splitCodeIntoChunks).mockResolvedValue({
            chunks: [{ name: 'TEST.CBL', code: 'CODE' }]
        });

        render(<App />);

        // Paste code
        const textarea = screen.getByPlaceholderText(/Paste COBOL programs or copybooks.../i);
        fireEvent.change(textarea, { target: { value: 'IDENTIFICATION DIVISION.' } });

        // Click button
        const startButton = screen.getByText(/Deploy Modernization Core/i);
        fireEvent.click(startButton);

        // Check if analyze was called
        await waitFor(() => {
            expect(mockAnalyze).toHaveBeenCalledWith('IDENTIFICATION DIVISION.');
        });

        // Check for success log
        await waitFor(() => {
            expect(screen.getByText(/System topology mapped/i)).toBeInTheDocument();
        });
    });
});
