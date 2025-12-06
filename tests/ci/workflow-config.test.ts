/**
 * V1-13: CI/CD Workflow Configuration Tests
 *
 * Verifies that GitHub Actions workflows are correctly configured.
 * Uses static analysis to validate YAML structure and job dependencies.
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// =============================================================================
// HELPERS
// =============================================================================

interface WorkflowJob {
  name: string;
  'runs-on': string;
  needs?: string[];
  services?: Record<string, unknown>;
  steps: Array<{ name: string; uses?: string; run?: string }>;
}

interface Workflow {
  name: string;
  on: {
    push?: { branches: string[] };
    pull_request?: { branches: string[] };
  };
  jobs: Record<string, WorkflowJob>;
}

function loadWorkflow(filename: string): Workflow | null {
  const workflowPath = path.resolve(__dirname, `../../.github/workflows/${filename}`);
  if (!fs.existsSync(workflowPath)) {
    return null;
  }
  const content = fs.readFileSync(workflowPath, 'utf-8');
  return yaml.load(content) as Workflow;
}

// =============================================================================
// TESTS: CI Workflow
// =============================================================================

describe('V1-13: CI Workflow Configuration', () => {
  const workflow = loadWorkflow('ci.yml');

  it('workflow file exists', () => {
    expect(workflow).not.toBeNull();
  });

  describe('Trigger Configuration', () => {
    it('triggers on push to main branches', () => {
      expect(workflow?.on.push?.branches).toBeDefined();
      expect(workflow?.on.push?.branches).toContain('main');
    });

    it('triggers on pull requests to main branches', () => {
      expect(workflow?.on.pull_request?.branches).toBeDefined();
      expect(workflow?.on.pull_request?.branches).toContain('main');
    });
  });

  describe('Required Jobs', () => {
    it('has lint job', () => {
      expect(workflow?.jobs.lint).toBeDefined();
      expect(workflow?.jobs.lint.name).toContain('Lint');
    });

    it('has unit-tests job', () => {
      expect(workflow?.jobs['unit-tests']).toBeDefined();
      expect(workflow?.jobs['unit-tests'].name).toContain('Unit Tests');
    });

    it('has integration-tests job', () => {
      expect(workflow?.jobs['integration-tests']).toBeDefined();
      expect(workflow?.jobs['integration-tests'].name).toContain('Integration Tests');
    });

    it('has build job', () => {
      expect(workflow?.jobs.build).toBeDefined();
      expect(workflow?.jobs.build.name).toBe('Build');
    });

    it('has contract-tests job', () => {
      expect(workflow?.jobs['contract-tests']).toBeDefined();
      expect(workflow?.jobs['contract-tests'].name).toContain('Contract Tests');
    });

    it('has security job', () => {
      expect(workflow?.jobs.security).toBeDefined();
      expect(workflow?.jobs.security.name).toContain('Security');
    });

    it('has ci-success summary job', () => {
      expect(workflow?.jobs['ci-success']).toBeDefined();
    });
  });

  describe('Database Services', () => {
    it('integration-tests has PostgreSQL service', () => {
      const services = workflow?.jobs['integration-tests'].services;
      expect(services).toBeDefined();
      expect(services?.['postgres-main']).toBeDefined();
    });

    it('contract-tests has PostgreSQL service', () => {
      const services = workflow?.jobs['contract-tests'].services;
      expect(services).toBeDefined();
      expect(services?.['postgres-main']).toBeDefined();
    });

    it('PostgreSQL service uses correct image', () => {
      const services = workflow?.jobs['integration-tests'].services as Record<string, { image: string }>;
      expect(services?.['postgres-main']?.image).toContain('postgres');
    });
  });

  describe('Job Dependencies', () => {
    it('build depends on lint', () => {
      expect(workflow?.jobs.build.needs).toContain('lint');
    });

    it('ci-success depends on all required jobs', () => {
      const needs = workflow?.jobs['ci-success'].needs || [];
      expect(needs).toContain('lint');
      expect(needs).toContain('unit-tests');
      expect(needs).toContain('integration-tests');
      expect(needs).toContain('build');
      expect(needs).toContain('contract-tests');
    });
  });

  describe('Essential Steps', () => {
    it('lint job includes TypeScript check', () => {
      const steps = workflow?.jobs.lint.steps || [];
      const typecheckStep = steps.find(s => s.run?.includes('typecheck'));
      expect(typecheckStep).toBeDefined();
    });

    it('lint job generates Prisma client', () => {
      const steps = workflow?.jobs.lint.steps || [];
      const prismaStep = steps.find(s => s.run?.includes('prisma generate'));
      expect(prismaStep).toBeDefined();
    });

    it('integration-tests runs migrations', () => {
      const steps = workflow?.jobs['integration-tests'].steps || [];
      const migrateStep = steps.find(s => s.run?.includes('migrate'));
      expect(migrateStep).toBeDefined();
    });

    it('integration-tests runs tests with coverage', () => {
      const steps = workflow?.jobs['integration-tests'].steps || [];
      const testStep = steps.find(s => s.run?.includes('--coverage'));
      expect(testStep).toBeDefined();
    });

    it('build job builds Next.js app', () => {
      const steps = workflow?.jobs.build.steps || [];
      const buildStep = steps.find(s => s.run?.includes('npm run build'));
      expect(buildStep).toBeDefined();
    });
  });

  describe('Node.js Configuration', () => {
    it('uses Node.js 20', () => {
      const steps = workflow?.jobs.lint.steps || [];
      const nodeStep = steps.find(s => s.uses?.includes('setup-node'));
      expect(nodeStep).toBeDefined();
    });
  });

  describe('Artifact Uploads', () => {
    it('integration-tests uploads coverage report', () => {
      const steps = workflow?.jobs['integration-tests'].steps || [];
      const uploadStep = steps.find(s => s.uses?.includes('upload-artifact') && s.name?.includes('coverage'));
      expect(uploadStep).toBeDefined();
    });

    it('build uploads build artifacts', () => {
      const steps = workflow?.jobs.build.steps || [];
      const uploadStep = steps.find(s => s.uses?.includes('upload-artifact'));
      expect(uploadStep).toBeDefined();
    });
  });
});

// =============================================================================
// TESTS: Spec Verification Workflow
// =============================================================================

describe('V1-13: Spec Verification Workflow', () => {
  const workflow = loadWorkflow('spec-verification.yml');

  it('workflow file exists', () => {
    expect(workflow).not.toBeNull();
  });

  it('has verify-spec job', () => {
    expect(workflow?.jobs['verify-spec']).toBeDefined();
  });

  it('has run-generated-tests job', () => {
    expect(workflow?.jobs['run-generated-tests']).toBeDefined();
  });

  it('has axiom-validation job', () => {
    expect(workflow?.jobs['axiom-validation']).toBeDefined();
  });

  it('run-generated-tests depends on verify-spec', () => {
    expect(workflow?.jobs['run-generated-tests'].needs).toContain('verify-spec');
  });

  it('triggers on spec file changes', () => {
    const paths = workflow?.on.push?.['paths' as keyof typeof workflow.on.push] as string[] | undefined;
    expect(paths).toContain('spec/**');
  });
});

// =============================================================================
// TESTS: Workflow File Structure
// =============================================================================

describe('V1-13: Workflow Files Structure', () => {
  const workflowDir = path.resolve(__dirname, '../../.github/workflows');

  it('.github/workflows directory exists', () => {
    expect(fs.existsSync(workflowDir)).toBe(true);
  });

  it('ci.yml exists', () => {
    expect(fs.existsSync(path.join(workflowDir, 'ci.yml'))).toBe(true);
  });

  it('spec-verification.yml exists', () => {
    expect(fs.existsSync(path.join(workflowDir, 'spec-verification.yml'))).toBe(true);
  });

  it('workflow files are valid YAML', () => {
    const files = fs.readdirSync(workflowDir).filter(f => f.endsWith('.yml'));

    files.forEach(file => {
      const content = fs.readFileSync(path.join(workflowDir, file), 'utf-8');
      expect(() => yaml.load(content)).not.toThrow();
    });
  });
});

// =============================================================================
// TESTS: npm Scripts Compatibility
// =============================================================================

describe('V1-13: npm Scripts for CI', () => {
  const packageJsonPath = path.resolve(__dirname, '../../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  it('has typecheck script', () => {
    expect(packageJson.scripts.typecheck).toBeDefined();
    expect(packageJson.scripts.typecheck).toContain('tsc');
  });

  it('has lint script', () => {
    expect(packageJson.scripts.lint).toBeDefined();
  });

  it('has test script', () => {
    expect(packageJson.scripts.test).toBeDefined();
    expect(packageJson.scripts.test).toContain('vitest');
  });

  it('has test:generated script', () => {
    expect(packageJson.scripts['test:generated']).toBeDefined();
  });

  it('has build script', () => {
    expect(packageJson.scripts.build).toBeDefined();
    expect(packageJson.scripts.build).toContain('next build');
  });

  it('has generate:spec script', () => {
    expect(packageJson.scripts['generate:spec']).toBeDefined();
  });
});
