import { nobl, wait, NoblAborted } from './Nobl';

// Export all to the global window object
Object.assign(window, { nobl, wait, NoblAborted });
