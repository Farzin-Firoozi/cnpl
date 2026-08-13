import { defineConfig } from 'orval'

export default defineConfig({
  api: {
    input: {
      target: './src/api/config/swagger.yaml',
    },
    output: {
      target: './src/api/functions',
      schemas: './src/api/models',
      client: 'react-query',
      mode: 'tags',
      clean: true,
      mock: true,
      override: {
        mutator: {
          path: './src/api/mutator/index.ts',
          name: 'mutator',
        },
        fetch: {
          includeHttpResponseReturnType: false,
        },
      },
    },
    hooks: {
      afterAllFilesWrite: ['prettier --write'],
    },
  },
})
