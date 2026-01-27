import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock scrollTo since JSDOM doesn't support it
Element.prototype.scrollTo = vi.fn();
Element.prototype.scrollIntoView = vi.fn();
