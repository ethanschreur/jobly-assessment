'use strict';

const request = require('supertest');

const db = require('../db');
const app = require('../app');

const { commonBeforeAll, commonBeforeEach, commonAfterEach, commonAfterAll, u1Token } = require('./_testCommon');

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** POST /companies */

describe('POST /companies', function() {
	const newCompany = {
		handle: 'new',
		name: 'New',
		logoUrl: 'http://new.img',
		description: 'DescNew',
		numEmployees: 10
	};

	test('not ok for non admin users', async function() {
		const resp = await request(app).post('/companies').send(newCompany).set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
		expect(resp.body).toEqual({ error: { message: 'Unauthorized', status: 401 } });
	});

	test('bad request with missing data', async function() {
		const resp = await request(app)
			.post('/companies')
			.send({
				handle: 'new',
				numEmployees: 10
			})
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test('bad request with invalid data', async function() {
		const resp = await request(app)
			.post('/companies')
			.send({
				...newCompany,
				logoUrl: 'not-a-url'
			})
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});
});

/************************************** GET /companies */

describe('GET /companies', function() {
	test('ok for anon', async function() {
		const resp = await request(app).get('/companies');
		expect(resp.body).toEqual({
			companies: [
				{
					handle: 'c1',
					name: 'C1',
					description: 'Desc1',
					numEmployees: 1,
					logoUrl: 'http://c1.img'
				},
				{
					handle: 'c2',
					name: 'C2',
					description: 'Desc2',
					numEmployees: 2,
					logoUrl: 'http://c2.img'
				},
				{
					handle: 'c3',
					name: 'C3',
					description: 'Desc3',
					numEmployees: 3,
					logoUrl: 'http://c3.img'
				}
			]
		});
	});

	test('fails: test next() handler', async function() {
		// there's no normal failure event which will cause this route to fail ---
		// thus making it hard to test that the error-handler works with it. This
		// should cause an error, all right :)
		await db.query('DROP TABLE companies CASCADE');
		const resp = await request(app).get('/companies').set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(500);
	});

	test('filter companies by name', async function() {
		// using nameLike in the query string should filter the companies to only include companies that have
		// that nameLike string in the company name
		const resp = await request(app).get('/companies?nameLike=2');
		expect(resp.statusCode).toEqual(200);
		expect(resp.body.companies.length).toEqual(1);
	});

	test('filter companies by minEmployees', async function() {
		//using minEmployees in the query string should filter the companies to include only the companies that have
		// more than or equal to that number of employees
		const resp = await request(app).get('/companies?minEmployees=2');
		expect(resp.statusCode).toEqual(200);
		expect(resp.body.companies.length).toEqual(2);
	});

	test('filter companies by maxEmployees', async function() {
		//using maxEmployees in the query string should filter the companies to include only the companies that haave
		// less than or equal to that number of employees
		const resp = await request(app).get('/companies?maxEmployees=1');
		expect(resp.statusCode).toEqual(200);
		expect(resp.body.companies.length).toEqual(1);
	});

	test('filter companies using all the filter options', async function() {
		//use nameLike, minEmployees, and maxEmployees to filter the companies
		const resp = await request(app).get('/companies?nameLike=1&minEmployees=1&maxEmployees=2');
		expect(resp.statusCode).toEqual(200);
		expect(resp.body.companies.length).toEqual(1);
	});

	test('test invalid filters', async function() {
		// minEmployees cannot be higher than maxEmployees
		const resp = await request(app).get('/companies?minEmployees=2&maxEmployees=1');
		expect(resp.statusCode).toEqual(400);
		expect(resp.body).toEqual({ error: { message: 'Invalid query string', status: 400 } });
	});
});

/************************************** GET /companies/:handle */

describe('GET /companies/:handle', function() {
	test('works for anon', async function() {
		const resp = await request(app).get(`/companies/c1`);
		expect(resp.body).toEqual({
			company: {
				handle: 'c1',
				name: 'C1',
				description: 'Desc1',
				numEmployees: 1,
				logoUrl: 'http://c1.img'
			}
		});
	});

	test('works for anon: company w/o jobs', async function() {
		const resp = await request(app).get(`/companies/c2`);
		expect(resp.body).toEqual({
			company: {
				handle: 'c2',
				name: 'C2',
				description: 'Desc2',
				numEmployees: 2,
				logoUrl: 'http://c2.img'
			}
		});
	});

	test('not found for no such company', async function() {
		const resp = await request(app).get(`/companies/nope`);
		expect(resp.statusCode).toEqual(404);
	});
});

/************************************** PATCH /companies/:handle */

describe('PATCH /companies/:handle', function() {
	test('doesnt work for users', async function() {
		const resp = await request(app)
			.patch(`/companies/c1`)
			.send({
				name: 'C1-new'
			})
			.set('authorization', `Bearer ${u1Token}`);

		expect(resp.body).toEqual({ error: { message: 'Unauthorized', status: 401 } });
	});

	test('unauth for anon', async function() {
		const resp = await request(app).patch(`/companies/c1`).send({
			name: 'C1-new'
		});
		expect(resp.statusCode).toEqual(401);
	});

	test('not found on no such company', async function() {
		const resp = await request(app)
			.patch(`/companies/nope`)
			.send({
				name: 'new nope'
			})
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test('bad request on handle change attempt', async function() {
		const resp = await request(app)
			.patch(`/companies/c1`)
			.send({
				handle: 'c1-new'
			})
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});

	test('bad request on invalid data', async function() {
		const resp = await request(app)
			.patch(`/companies/c1`)
			.send({
				logoUrl: 'not-a-url'
			})
			.set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});
});

/************************************** DELETE /companies/:handle */

describe('DELETE /companies/:handle', function() {
	test('doesnt works for users', async function() {
		const resp = await request(app).delete(`/companies/c1`).set('authorization', `Bearer ${u1Token}`);
		expect(resp.body).toEqual({ error: { message: 'Unauthorized', status: 401 } });
	});

	test('unauth for anon', async function() {
		const resp = await request(app).delete(`/companies/c1`);
		expect(resp.statusCode).toEqual(401);
	});

	test('not found for no such company', async function() {
		const resp = await request(app).delete(`/companies/nope`).set('authorization', `Bearer ${u1Token}`);
		expect(resp.statusCode).toEqual(401);
	});
});
