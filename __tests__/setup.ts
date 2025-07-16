import { jest } from '@jest/globals';

process.env.NODE_ENV = 'test';
process.env.META_ACCESS_TOKEN = 'test-access-token';
process.env.META_APP_ID = 'test-app-id';
process.env.META_APP_SECRET = 'test-app-secret';

jest.setTimeout(10000);

beforeEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  jest.restoreAllMocks();
});