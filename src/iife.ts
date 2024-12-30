import { Nobl, NoblCancelledError } from './Nobl';

// Export all to the global window object
Object.assign(window, { Nobl, NoblCancelledError });
