/**
 * B2B API v1 — barrel file.
 * Mounted at /api/v1 in index.ts.
 */
import { Hono } from 'hono';
import clients from './clients';
import datasets from './datasets';

const v1 = new Hono();

v1.route('/account', clients);
v1.route('/datasets', datasets);

export default v1;
