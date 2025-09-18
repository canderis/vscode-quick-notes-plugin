# Testing Setup

This directory contains unit tests for the VS Code Notes extension using Vitest.

## Running Tests

```bash
# Install dependencies first
npm install

# Run tests once
npm run test:run

# Run tests in watch mode
npm run test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Test Structure

- `setup.ts` - Test configuration and VS Code API mocking
- `extension.test.ts` - Tests for the main extension entry point
- `notesProvider.test.ts` - Tests for the NotesProvider class

## VS Code API Mocking

The tests use a mock implementation of the VS Code API to test extension functionality without requiring a full VS Code environment.
