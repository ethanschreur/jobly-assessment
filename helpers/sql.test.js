const { ExpressError } = require('../expressError');
const { sqlForPartialUpdate } = require('./sql');

describe('sqlForPartialUpdate', function() {
	test('no data', () => {
		expect(() => {
			sqlForPartialUpdate({});
		}).toThrow(ExpressError);
		expect(() => {
			sqlForPartialUpdate({});
		}).toThrow('No data');
	});

	test('with data', () => {
		expect(sqlForPartialUpdate({ name: 'ethan' }, {})).toEqual({ setCols: '"name"=$1', values: [ 'ethan' ] });
	});

	test('with data and column overrides', () => {
		expect(sqlForPartialUpdate({ name: 'ethan' }, { name: 'firstName' })).toEqual({
			setCols: '"firstName"=$1',
			values: [ 'ethan' ]
		});
	});
});
