import { outputFile } from 'fs-extra';
import path from 'node:path';

export async function writeProjectFile(
  outputDir: string,
  relativePath: string,
  content: string
): Promise<void> {
  const fullPath = path.join(outputDir, relativePath);
  await outputFile(fullPath, content, 'utf-8');
}
