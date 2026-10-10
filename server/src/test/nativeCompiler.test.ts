import { describe, expect, it } from 'vitest';
import path from 'node:path';
import ts from 'typescript';

describe('native Express compiler compatibility', () => {
  it('type-checks security middleware with the native builder resolver', () => {
    const configPath = path.resolve('tsconfig.json');
    const config = ts.readConfigFile(configPath, ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, path.dirname(configPath));
    const host = ts.createCompilerHost(parsed.options);
    // @vercel/node's Express language-service resolver currently omits the
    // NodeNext import resolution mode. This resolves dual packages via require.
    // Keep this narrow characterization alongside the actual native bundle gate.
    host.resolveModuleNames = (names, containingFile) => names.map(name =>
      ts.resolveModuleName(name, containingFile, parsed.options, ts.sys).resolvedModule
    );
    const program = ts.createProgram(parsed.fileNames, parsed.options, host);
    const errors = program.getSemanticDiagnostics().filter(diagnostic =>
      diagnostic.category === ts.DiagnosticCategory.Error
    );
    expect(errors.map(error => `${error.file?.fileName}:${error.code}: ${ts.flattenDiagnosticMessageText(error.messageText, '\n')}`)).toEqual([]);
  });
});
