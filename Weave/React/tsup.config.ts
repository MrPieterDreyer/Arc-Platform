import { arcTsup } from '../../tsup.base';

// Two entries: the framework-agnostic schema barrel (`index`) and the
// client-only barrel (`client`) that Plan 05 fills with the error boundary.
// The client barrel imports `client-only`, so importing `@weave/react`
// server-side never pulls React client code into a Server Component, and
// importing the client barrel server-side fails loudly. tsup auto-externalizes
// `client-only` (a runtime dependency), preserving the guard import in output.
export default arcTsup({
  entry: {
    index: 'src/index.ts',
    client: 'src/client/index.ts',
  },
});
