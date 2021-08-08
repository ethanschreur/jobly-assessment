'use strict';

const db = require('../db');
const { BadRequestError, NotFoundError } = require('../expressError');
const { sqlForPartialUpdate } = require('../helpers/sql');

/** Related functions for jobs. */

class Job {
	/** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, company_handle }
   *
   * Returns { title, salary, equity, company_handle }
   *
   * Throws BadRequestError if job already in database.
   * */

	static async create({ title, salary, equity, company_handle }) {
		const result = await db.query(
			`INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING title, salary, equity, company_handle`,
			[ title, salary, equity, company_handle ]
		);
		const job = result.rows[0];

		return job;
	}

	/** Find all jobs.
   *
   * Returns [{ id, title, salary, equity, company_handle }, ...]
   * */

	static async findAll(title, minSalary, hasEquity) {
		const jobsRes = await db.query(
			`SELECT 
                  id,
                  title,
                  salary,
                  equity,
                  company_handle
           FROM jobs
           ORDER BY title`
		);

		// if the method parameters used for filtering are defined, filter the jobs accordingly, and return the new list
		let jobs = jobsRes.rows;
		if (title) {
			jobs = jobs.filter((job) => {
				return job.title.toLowerCase().includes(title.toLowerCase());
			});
		}
		if (minSalary) {
			jobs = jobs.filter((job) => {
				return job.salary >= minSalary;
			});
		}
		if (hasEquity) {
			jobs = jobs.filter((job) => {
				return job.equity !== 0;
			});
		}

		return jobs;
	}

	/** Given a job ID, return data about job.
   *
   * Returns { title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   **/

	static async get(ID) {
		const jobRes = await db.query(
			`SELECT
            title,
            salary,
            equity,
            company_handle
           FROM jobs
           WHERE id = $1`,
			[ ID ]
		);

		const job = jobRes.rows[0];

		if (!job) throw new NotFoundError(`No job: ${ID}`);

		return job;
	}

	/** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: {title, salary, equity}
   *
   * Returns { title, salary, equity, company_handle }
   *
   * Throws NotFoundError if not found.
   */

	static async update(ID, data) {
		if (data.id) {
			delete data.id;
		}
		if (data.company_handle) {
			delete data.company_handle;
		}
		const { setCols, values } = sqlForPartialUpdate(data, {});

		const IDVarIdx = '$' + (values.length + 1);

		const querySql = `UPDATE jobs 
                      SET ${setCols} 
                      WHERE id = ${IDVarIdx} 
                      RETURNING id,
                                title, 
                                salary, 
                                equity, 
                                company_handle`;
		const result = await db.query(querySql, [ ...values, ID ]);
		const job = result.rows[0];

		if (!job) throw new NotFoundError(`No job: ${ID}`);

		return job;
	}

	/** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

	static async remove(ID) {
		const result = await db.query(
			`DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
			[ ID ]
		);
		const job = result.rows[0];

		if (!job) throw new NotFoundError(`No job: ${ID}`);
	}
}

module.exports = Job;
