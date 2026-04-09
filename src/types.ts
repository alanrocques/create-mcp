export type Language = 'typescript' | 'python';
export type Transport = 'stdio' | 'http';
export type AuthMethod = 'none' | 'oauth' | 'apikey';
export type DeployTarget = 'none' | 'docker' | 'cloudflare' | 'lambda';
export type Feature = 'tools' | 'resources' | 'prompts' | 'sampling';

export interface ProjectConfig {
  name: string;
  language: Language;
  transport: Transport;
  auth: AuthMethod;
  deploy: DeployTarget;
  features: Feature[];
  outputDir: string;
}
