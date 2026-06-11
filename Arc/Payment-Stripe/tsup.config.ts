import { arcTsup } from '../../tsup.base';

export default arcTsup({
  entry: ['src/index.ts', 'src/server.ts', 'src/client.tsx'],
});
