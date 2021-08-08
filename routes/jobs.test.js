'use strict';

const request = require('supertest');

const db = require('../db');
const app = require('../app');

const { commonBeforeAll, commonBeforeEach, commonAfterEach, commonAfterAll, u1Token } = require('./_testCommon');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /jobs */

describe('POST /jobs', function() {
	const newJob = {
		title: 'new',
		salary: 400000,
		equity: '0.04',
		company_handle: 'c3'
	};

	test('not ok for non admin users', async function() {
		const resp = await request(app).post('/jobs').send(newJob).set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
		expect(resp.body).toEqual({ error: { message: 'Unauthorized', status: 401 } });
	});

	test('bad request with missing data', async function() {
		const resp = await request(app)
			.post('/jobs')
			.send({
				title: 'new',
				salary: 400000
			})
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test('bad request with invalid data', async function() {
		const resp = await request(app)
			.post('/jobs')
			.send({
				...newJob,
				logoUrl: 'field doesnt exist in table'
			})
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});
});

/************************************** GET /jobs */

describe('GET /jobs', function() {
	test('ok for anon', async function() {
		const resp = await request(app).get('/jobs');
		expect(resp.body.jobs.length).toEqual(3);
	});

	test('fails: test next() handler', async function() {
		// there's no normal failure event which will cause this route to fail ---
		// thus making it hard to test that the error-handler works with it. This
		// should cause an error, all right :)
		await db.query('DROP TABLE jobs CASCADE');
		const resp = await request(app).get('/jobs').set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(500);
	});

	test('filter jobs by title', async function() {
		// using title in the query string should filter the jobs to only include jobs that have
		// that string in the job title
		const resp = await request(app).get('/jobs?title=2');
		expect(resp.statusCode).toEqual(200);
		expect(resp.body.jobs.length).toEqual(1);
	});

	test('filter jobs by minSalary', async function() {
		//using minSalary in the query string should filter the jobs to include only the jobs that have
		// more than or equal to that number for salary
		const resp = await request(app).get('/jobs?minSalary=200000');
		expect(resp.statusCode).toEqual(200);
		expect(resp.body.jobs.length).toEqual(2);
	});

	test('filter jobs by hasEquity', async function() {
		//using hasEquity in the query string should filter the jobs to include only the jobs that offer equity as compensation
		const resp = await request(app).get('/jobs?hasEquity=true');
		expect(resp.statusCode).toEqual(200);
		expect(resp.body.jobs.length).toEqual(3);
	});
});

/************************************** GET /jobs/:ID */

describe('GET /jobs/:ID', function() {
	test('works for anon', async function() {
		const jobsResp = await request(app).get('/jobs');
		const id = jobsResp.body.jobs[0].id;
		const resp = await request(app).get(`/jobs/${id}`);
		expect(resp.body).toEqual({
			job: {
				company_handle: 'c1',
				equity: '0.01',
				salary: 100000,
				title: 'title1'
			}
		});
	});

	test('not found for no such job', async function() {
		const resp = await request(app).get(`/jobs/9999999`);
		expect(resp.statusCode).toEqual(404);
	});
});

/************************************** PATCH /jobs/:ID */

describe('PATCH /jobs/:ID', function() {
	test('doesnt work for users', async function() {
		const resp = await request(app)
			.patch(`/jobs/c1`)
			.send({
				title: 'new-job-title'
			})
			.set('authorization', `Bearer ${u1Token}`);

		expect(resp.body).toEqual({ error: { message: 'Unauthorized', status: 401 } });
	});

	test('unauth for anon', async function() {
		const resp = await request(app).patch(`/jobs/c1`).send({
			title: 'new-job-title'
		});
		expect(resp.statusCode).toEqual(401);
	});

	test('not found on no such jobs', async function() {
		const resp = await request(app)
			.patch(`/jobs/999999`)
			.send({
				title: 'nope-job-title'
			})
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});
});

/************************************** DELETE /jobs/:ID */

describe('DELETE /jobs/:ID', async function() {
	const jobsResp = await request(app).get('/jobs');
	const id = jobsResp.body.jobs[0].id;
	test('doesnt works for users', async function() {
		const resp = await request(app).delete(`/jobs/${id}`).set('authorization', `Bearer ${u1Token}`);
		expect(resp.body).toEqual({ error: { message: 'Unauthorized', status: 401 } });
	});

	test('unauth for anon', async function() {
		const resp = await request(app).delete(`/jobs/${id}`);
		expect(resp.statusCode).toEqual(401);
	});

	test('not found for no such company', async function() {
		const resp = await request(app).delete(`/jobs/${id}`).set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});
});
