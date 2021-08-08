'use strict';

/** Routes for jobs. */

const jsonschema = require('jsonschema');
const express = require('express');

const { BadRequestError } = require('../expressError');
const { ensureLoggedIn, ensureAdmin } = require('../middleware/auth');
const Job = require('../models/job');

const router = new express.Router();

/** POST / { job } =>  { job }

 * job should be { title, salary, equity, company_handle }
 *
 * Returns { title, salary, equity, company_handle }
 *
 * Authorization required: login and Admin
 */

router.post('/', ensureLoggedIn, ensureAdmin, async function(req, res, next) {
	try {
		const job = await Job.create(req.body);
		return res.status(201).json({ job });
	} catch (err) {
		return next(err);
	}
});

/** GET /  =>
 *   { jobs: [ { id, title, salary, equity, company_handle }, ...] }
 *
 * Can filter on provided search filters:
 * - title (will find case-insensitive, partial matches)
 * - minSalary
 * - hasEquity 
 *
 * Authorization required: none
 */

router.get('/', async function(req, res, next) {
	try {
		// grab potential filters from the query string and send them as parameters in the model method
		const title = req.query.title;
		const minSalary = req.query.minSalary;
		const hasEquity = req.query.hasEquity;
		const jobs = await Job.findAll(title, minSalary, hasEquity);
		return res.json({ jobs });
	} catch (err) {
		return next(err);
	}
});

/** GET /[ID]  =>  { job }
 *
 *  Job is { title, salary, equity, company_handle }
 *
 * Authorization required: none
 */

router.get('/:ID', async function(req, res, next) {
	try {
		const job = await Job.get(req.params.ID);
		return res.json({ job });
	} catch (err) {
		return next(err);
	}
});

/** PATCH /[ID] { fld1, fld2, ... } => { job }
 *
 * Patches job data.
 *
 * fields can be: { id, title, salary, equity, company_handle }
 *
 * Returns { id, title, salary, equity, company_handle }
 *
 * Authorization required: login and Admin
 */

router.patch('/:ID', ensureLoggedIn, ensureAdmin, async function(req, res, next) {
	try {
		const job = await Job.update(req.params.ID, req.body);
		return res.json({ job });
	} catch (err) {
		return next(err);
	}
});

/** DELETE /[handle]  =>  { deleted: ID }
 *
 * Authorization: login and Admin
 */

router.delete('/:ID', ensureLoggedIn, ensureAdmin, async function(req, res, next) {
	try {
		await Job.remove(req.params.ID);
		return res.json({ deleted: req.params.ID });
	} catch (err) {
		return next(err);
	}
});

module.exports = router;
