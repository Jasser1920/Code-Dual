// Map our application's language strings to Judge0 CE language IDs
export const JUDGE0_LANGUAGE_IDS: Record<string, number> = {
  javascript: 63, // Node.js 12.14.0 (or newer depending on Judge0 image)
  python: 71, // Python 3.8.1
  java: 62, // OpenJDK 13.0.1
  cpp: 54, // GCC 9.2.0
  go: 60, // Go 1.13.5
  rust: 73, // Rust 1.40.0
}
