import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

const execAsync = promisify(exec)

interface JudgeResult {
  score: number // 0 to 100
  time: number // execution time in ms
  success: boolean // true if all tests passed
  error: string | null
}

export async function judgeCode(
  code: string,
  language: string
): Promise<JudgeResult> {
  // We mock a test case for Two Sum: the expected output is "[0, 1]"
  const expectedOutput = '[0, 1]'

  const tmpDir = os.tmpdir()
  const fileName = `code_dual_judge_${Date.now()}_${Math.random().toString(36).substring(7)}`

  let stdout = ''
  let stderr = ''
  const startTime = Date.now()

  try {
    if (language === 'javascript') {
      const filePath = path.join(tmpDir, `${fileName}.js`)
      await fs.writeFile(filePath, code)
      const { stdout: out, stderr: err } = await execAsync(`node ${filePath}`)
      stdout = out
      stderr = err
      await fs.unlink(filePath).catch(() => {})
    } else if (language === 'python') {
      const filePath = path.join(tmpDir, `${fileName}.py`)
      await fs.writeFile(filePath, code)
      const { stdout: out, stderr: err } = await execAsync(`python ${filePath}`)
      stdout = out
      stderr = err
      await fs.unlink(filePath).catch(() => {})
    } else {
      return {
        score: 0,
        time: 0,
        success: false,
        error: 'Unsupported language for judging',
      }
    }
  } catch (error: any) {
    stderr = error.stderr || error.message
  }

  const time = Date.now() - startTime

  if (stderr) {
    return { score: 0, time, success: false, error: 'Runtime/Syntax Error' }
  }

  const cleanStdout = stdout.trim()

  if (cleanStdout === expectedOutput) {
    return { score: 100, time, success: true, error: null }
  } else {
    return {
      score: 0,
      time,
      success: false,
      error: `Wrong Answer. Expected ${expectedOutput}, got ${cleanStdout}`,
    }
  }
}
