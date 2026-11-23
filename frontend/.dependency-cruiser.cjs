const SIN_PRUEBAS = { pathNot: '\\.spec\\.ts$' };

module.exports = {
  forbidden: [
    {
      name: 'domain-puro',
      severity: 'error',
      from: { path: '^src/app/domain/', ...SIN_PRUEBAS },
      to: { pathNot: '^src/app/domain/' },
    },
    {
      name: 'application-solo-domain',
      severity: 'error',
      from: { path: '^src/app/application/', ...SIN_PRUEBAS },
      to: { pathNot: '^src/app/(domain|application)/' },
    },
    {
      name: 'infrastructure-no-presentation',
      severity: 'error',
      from: { path: '^src/app/infrastructure/', ...SIN_PRUEBAS },
      to: { path: '^src/app/presentation/' },
    },
    {
      name: 'presentation-no-infrastructure',
      severity: 'error',
      from: { path: '^src/app/presentation/', ...SIN_PRUEBAS },
      to: { path: '^src/app/infrastructure/' },
    },
    {
      name: 'di-no-adaptadores',
      severity: 'error',
      from: { path: '^src/app/di/', ...SIN_PRUEBAS },
      to: { path: '^src/app/(infrastructure|presentation)/' },
    },
    {
      name: 'capas-internas-no-importan-composicion',
      severity: 'error',
      from: { path: '^src/app/(domain|application|infrastructure|presentation|di)/', ...SIN_PRUEBAS },
      to: { path: '^src/app/app\\.' },
    },
    {
      name: 'sin-circulares',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.app.json' },
    exclude: { path: '\\.spec\\.ts$' },
  },
};
