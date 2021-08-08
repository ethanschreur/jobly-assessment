'use strict';

const db = require('../db.js');
const { BadRequestError, NotFoundError } = require('../expressError');
const Job = require('./job.js');
const { commonBeforeAll, commonBeforeEach, commonAfterEach, commonAfterAll } = require('./_testCommon');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe('create', function() {
	const newJob = {
		title: 'new',
		salary: 400000,
		equity: '0.04',
		company_handle: 'c3'
	};

	test('works', async function() {
		const job = await Job.create(newJob);
		expect(job).toEqual(newJob);

		const result = await db.query(
			`SELECT title, salary, equity, company_handle
           FROM jobs
           WHERE title = 'new'`
		);
		expect(result.rows).toEqual([
			{
				title: 'new',
				salary: 400000,
				equity: '0.04',
				company_handle: 'c3'
			}
		]);
	});
});

/************************************** findAll */

describe('findAll', function() {
	test('works: no filter', async function() {
		let jobs = await Job.findAll();
		jobs.map((job) => {
			delete job.id;
		});
		expect(jobs).toEqual([
			{
				company_handle: 'c1',
				equity: '0.01',
				salary: 100000,
				title: 'title1'
			},
			{
				company_handle: 'c2',
				equity: '0.02',
				salary: 200000,
				title: 'title2'
			},
			{
				company_handle: 'c3',
				equity: '0.03',
				salary: 300000,
				title: 'title2'
			}
		]);
	});

	test('works: title filter', async function() {
		let jobs = await Job.findAll('title1');
		jobs.map((job) => {
			delete job.id;
		});
		expect(jobs).toEqual([
			{
				company_handle: 'c1',
				equity: '0.01',
				salary: 100000,
				title: 'title1'
			}
		]);
	});

	test('works: minSalary filter', async function() {
		let jobs = await Job.findAll(undefined, 200000);
		jobs.map((job) => {
			delete job.id;
		});
		expect(jobs).toEqual([
			{
				company_handle: 'c2',
				equity: '0.02',
				salary: 200000,
				title: 'title2'
			},
			{
				company_handle: 'c3',
				equity: '0.03',
				salary: 300000,
				title: 'title2'
			}
		]);
	});

	test('works: hasEquity filter', async function() {
		let jobs = await Job.findAll(undefined, undefined, true);
		jobs.map((job) => {
			delete job.id;
		});
		expect(jobs).toEqual([
			{
				company_handle: 'c1',
				equity: '0.01',
				salary: 100000,
				title: 'title1'
			},
			{
				company_handle: 'c2',
				equity: '0.02',
				salary: 200000,
				title: 'title2'
			},
			{
				company_handle: 'c3',
				equity: '0.03',
				salary: 300000,
				title: 'title2'
			}
		]);
	});
});

/************************************** get */

describe('get', function() {
	test('works', async function() {
		const jobs = await Job.findAll();
		const id = jobs[0].id;
		let job = await Job.get(id);
		delete job.id;
		expect(job).toEqual({
			company_handle: 'c1',
			equity: '0.01',
			salary: 100000,
			title: 'title1'
		});
	});

	test('not found if no such company', async function() {
		try {
			await Job.get(999);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});

/************************************** update */

describe('update', function() {
	const updateData = {
		company_handle: 'new handle',
		equity: '0.05',
		salary: 500000,
		title: 'new title'
	};

	test('works', async function() {
		const jobs = await Job.findAll();
		const id = jobs[0].id;
		let job = await Job.update(id, updateData);
		expect(job).toEqual({
			id,
			company_handle: 'c1',
			equity: '0.05',
			salary: 500000,
			title: 'new title'
		});

		const result = await db.query(
			`SELECT id, title, salary, equity, company_handle
	           FROM jobs
	           WHERE id = ${id}`
		);
		expect(result.rows).toEqual([
			{
				id,
				company_handle: 'c1',
				equity: '0.05',
				salary: 500000,
				title: 'new title'
			}
		]);
	});

	test('not found if no such company', async function() {
		try {
			await Job.update(-1, updateData);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});

	test('bad request with no data', async function() {
		const jobs = await Job.findAll();
		const id = jobs[0].id;
		try {
			await Job.update(id, {});
			fail();
		} catch (err) {
			expect(err instanceof BadRequestError).toBeTruthy();
		}
	});
});

// /************************************** remove */

describe('remove', function() {
	test('works', async function() {
		const jobs = await Job.findAll();
		const id = jobs[0].id;
		await Job.remove(id);
		const res = await db.query(`SELECT id FROM jobs WHERE id=${id}`);
		expect(res.rows.length).toEqual(0);
	});

	test('not found if no such job', async function() {
		try {
			await Job.remove(-1);
			fail();
		} catch (err) {
			expect(err instanceof NotFoundError).toBeTruthy();
		}
	});
});
