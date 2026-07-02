import type { FastifyPluginAsync } from 'fastify'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

const execAsync = promisify(exec)

interface ExecuteBody {
  code: string
  languageId: number
  stdin?: string
}

const executeRoutes: FastifyPluginAsync = async (fastify, opts) => {
  fastify.post<{ Body: ExecuteBody }>('/', async (request, reply) => {
    try {
      const { code, languageId, stdin } = request.body

      if (!code || !languageId) {
        return reply
          .status(400)
          .send({ error: 'Code and languageId are required' })
      }

      // LOCAL FALLBACK FOR WINDOWS/WSL2
      // If Judge0 is failing due to Docker/WSL2 cgroups issues, we run JS and Python directly on the host machine.
      // 63 = JavaScript (Node), 71 = Python

      const isLocalFallback = true // Forcing fallback because of Judge0 WSL2 issues

      if (isLocalFallback) {
        let stdout = ''
        let stderr = ''
        let compile_output = ''
        let time = 0

        const startTime = Date.now()
        const tmpDir = os.tmpdir()
        const fileName = `code_dual_${Date.now()}`

        try {
          if (languageId === 63) {
            // JavaScript
            const filePath = path.join(tmpDir, `${fileName}.js`)
            await fs.writeFile(filePath, code)
            const { stdout: out, stderr: err } = await execAsync(
              `node ${filePath}`
            )
            stdout = out
            stderr = err
            await fs.unlink(filePath).catch(() => {})
          } else if (languageId === 71) {
            // Python
            const filePath = path.join(tmpDir, `${fileName}.py`)
            await fs.writeFile(filePath, code)
            const { stdout: out, stderr: err } = await execAsync(
              `python3 ${filePath}`
            )
            stdout = out
            stderr = err
            await fs.unlink(filePath).catch(() => {})
          } else {
            return reply.send({
              stdout: null,
              stderr: null,
              compile_output: `Language ID ${languageId} is not supported by the local fallback. Please use JavaScript or Python for local testing.`,
              time: null,
              memory: null,
              status: 'Unsupported Language (Fallback)',
            })
          }
        } catch (error: any) {
          stderr = error.stderr || error.message
        }

        time = (Date.now() - startTime) / 1000

        return reply.send({
          stdout: stdout || null,
          stderr: stderr || null,
          compile_output: compile_output || null,
          time: time.toString(),
          memory: '15.0', // Mocked memory for fallback
          status: stderr ? 'Runtime Error' : 'Accepted',
        })
      }

      // --- Original Judge0 Code (Disabled for now) ---
      /*
      const judge0Url = process.env.JUDGE0_API_URL || 'http://localhost:2358';
      const submission = {
        source_code: Buffer.from(code).toString('base64'),
        language_id: languageId,
        stdin: stdin ? Buffer.from(stdin).toString('base64') : undefined,
      };

      const response = await fetch(`${judge0Url}/submissions?base64_encoded=true&wait=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submission)
      });

      if (!response.ok) {
        return reply.status(500).send({ error: 'Execution engine error' });
      }

      const result = await response.json();
      
      const decode = (str: string | null) => {
        if (!str) return null;
        return Buffer.from(str, 'base64').toString('utf-8');
      };

      return reply.send({
        stdout: decode(result.stdout),
        stderr: decode(result.stderr),
        compile_output: decode(result.compile_output),
        time: result.time,
        memory: result.memory,
        status: result.status?.description
      });
      */
    } catch (error: any) {
      fastify.log.error(error)
      return reply.status(500).send({ error: 'Internal Server Error' })
    }
  })
}

export default executeRoutes
