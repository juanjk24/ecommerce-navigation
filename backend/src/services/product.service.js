import { pool } from '../config/database.js';

export async function getProducts() {
    const result = await pool.query(`
        SELECT
            p.id,
            p.name,
            p.description,
            p.price,
            p.brand,
            p.rating,
            p.sales_count,
            p.stock,
            c.name AS category
        FROM products p
        LEFT JOIN categories c
            ON c.id = p.category_id
        ORDER BY p.id;
    `);

    return result.rows;
}