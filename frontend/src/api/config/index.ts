/// <reference types="node" />
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const configDir = dirname(fileURLToPath(import.meta.url))
const frontendRoot = resolve(configDir, '../../..')
const outputPath = resolve(configDir, 'swagger.yaml')

function loadEnvFile(name: string): Record<string, string> {
  const env: Record<string, string> = {}
  try {
    const text = readFileSync(resolve(frontendRoot, name), 'utf8')
    for (const line of text.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
    }
  } catch {
    // optional env file
  }
  return env
}

function backendBaseUrl(): string {
  const fileEnv = { ...loadEnvFile('.env'), ...loadEnvFile('.env.local') }
  const raw =
    process.env.VITE_API_BASE_URL ||
    fileEnv.VITE_API_BASE_URL ||
    'http://localhost:8080'
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `http://${raw}`
  return withProtocol.replace(/\/+$/, '')
}

async function downloadOpenApi() {
  // /docs is Swagger UI HTML. Spec is served at /openapi.yaml (JSON body).
  const url = `${backendBaseUrl()}/openapi.yaml`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(
      `Failed to download OpenAPI from ${url}: ${response.status} ${response.statusText}`,
    )
  }

  const text = await response.text()
  let output = text
  try {
    output = `${JSON.stringify(JSON.parse(text), null, 2)}\n`
  } catch {
    // keep raw YAML
  }

  writeFileSync(outputPath, output)
  console.log(`Wrote OpenAPI spec to ${outputPath}`)
}

await downloadOpenApi()
