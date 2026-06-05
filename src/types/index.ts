/** Barrel export for the domain model. Import everything from `@types`. */
export * from './enums';
export * from './Customer';
// Flat data-layer profile. Re-exported by name only — its local union aliases
// (Gender, Diet, MaritalStatus, …) intentionally shadow the enums and must NOT
// leak into the barrel via `export *`.
export type { CustomerProfile } from './CustomerProfile';
export * from './Activity';
export * from './Match';
export * from './Matchmaker';
export * from './Note';
