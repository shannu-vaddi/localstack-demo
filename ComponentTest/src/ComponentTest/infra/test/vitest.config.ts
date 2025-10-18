import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.component.test.ts'],
    exclude: [...configDefaults.exclude, '**/cdk.out/**'],
    globalSetup: ['./test/global-setup.ts']
  }
});
