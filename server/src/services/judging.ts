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
  // We mock a test case for Two Sum: the expected output is "[0,1]" (stripped)
  const expectedOutput = '[0,1]'

  const tmpDir = os.tmpdir()
  const fileName = `code_dual_judge_${Date.now()}_${Math.random().toString(36).substring(7)}`

  let stdout = ''
  let stderr = ''
  const startTime = Date.now()

  try {
    if (language === 'javascript') {
      const filePath = path.join(tmpDir, `${fileName}.js`)
      // Automatically run the test case for Two Sum
      const wrappedCode = `${code}

// --- TEST RUNNER ---
const _test_result = twoSum([2, 7, 11, 15], 9);
console.log(JSON.stringify(_test_result).replace(/\\s/g, ''));`
      await fs.writeFile(filePath, wrappedCode)
      const { stdout: out } = await execAsync(`node ${filePath}`)
      // Only get the last line of output (in case they used console.log)
      const lines = out.trim().split('\n')
      stdout = lines[lines.length - 1] || ''
      await fs.unlink(filePath).catch(() => {})
    } else if (language === 'python') {
      const filePath = path.join(tmpDir, `${fileName}.py`)
      const wrappedCode = `${code}

# --- TEST RUNNER ---
_test_res = twoSum([2, 7, 11, 15], 9)
print(str(_test_res).replace(" ", ""))
`
      await fs.writeFile(filePath, wrappedCode)
      const { stdout: out } = await execAsync(`python ${filePath}`)
      const lines = out.trim().split('\n')
      stdout = lines[lines.length - 1] || ''
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
    let cleanErr = typeof stderr === 'string' ? stderr : String(stderr)

    // Clean up internal paths so they don't confuse the user
    if (language === 'javascript') {
      const jsPath = path.join(tmpDir, `${fileName}.js`).replace(/\\/g, '\\\\')
      cleanErr = cleanErr.replace(new RegExp(jsPath, 'g'), 'main.js')
    } else if (language === 'python') {
      const pyPath = path.join(tmpDir, `${fileName}.py`).replace(/\\/g, '\\\\')
      cleanErr = cleanErr.replace(new RegExp(pyPath, 'g'), 'main.py')
    }

    // If it was just a warning from Node (and exec didn't fail), ignore it!
    // But if we caught it in the catch block above, then it's a real failure.
    // Wait, let's just return it as error to be safe, but only if it's long enough to be an error
    // Actually, any stderr from an explicit throw will be caught.
    const shortErr = cleanErr.split('\n').slice(0, 4).join('\n').trim()
    return {
      score: 0,
      time,
      success: false,
      error: `Runtime Error:\n${shortErr}`,
    }
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
