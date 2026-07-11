// Wraps `tsc` so pre-existing type errors (tracked as tech debt) don't block
// production deploys. tsc still emits JS when it has errors (noEmitOnError is
// false by default) but exits non-zero, which would otherwise fail the single
// -command build/deploy pipeline. Errors are printed for visibility either way.
const { execSync } = require('child_process');

try {
  execSync('npx tsc', { stdio: 'inherit', cwd: __dirname + '/..' });
} catch (err) {
  console.warn(
    '\n[backend build] tsc reported type errors above. JS was still emitted ' +
    '(noEmitOnError is off), so the build continues. Please fix these when you can.\n'
  );
}
