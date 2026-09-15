import "dotenv/config";
import bcrypt from "bcryptjs";
import pg from "pg";

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const password = await bcrypt.hash("Password123!", 12);
const client = await pool.connect();

try {
  await client.query("BEGIN");
  const users = {};
  for (const account of [
    ["Admin User", "admin@example.com", "ADMIN"],
    ["Project Manager", "manager@example.com", "MANAGER"],
    ["Developer One", "developer1@example.com", "DEVELOPER"],
    ["Developer Two", "developer2@example.com", "DEVELOPER"],
  ]) {
    const result = await client.query(`
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role
      RETURNING id, email
    `, [account[0], account[1], password, account[2]]);
    users[account[1]] = result.rows[0].id;
  }

  const projectRows = [];
  for (const project of [
    ["E-Commerce Platform", "Customer storefront and order management platform.", "IN_PROGRESS"],
    ["Mobile Banking Application", "Secure mobile banking experience for retail customers.", "PLANNED"],
    ["HR Management System", "Internal people operations and leave management system.", "PLANNED"],
  ]) {
    const result = await client.query(`
      INSERT INTO projects (name, description, start_date, end_date, status, created_by)
      SELECT $1, $2, CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days', $3, $4
      WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = $1::varchar)
      RETURNING id
    `, [project[0], project[1], project[2], users["admin@example.com"]]);
    if (result.rows[0]) projectRows.push(result.rows[0].id);
  }

  if (projectRows.length) {
    await client.query(`
      INSERT INTO tasks (title, description, project_id, assigned_to, status, priority, due_date, created_by)
      VALUES
        ('Build product catalog', 'Implement catalog browsing and product search.', $1, $2, 'IN_PROGRESS', 'HIGH', CURRENT_DATE + INTERVAL '14 days', $3),
        ('Add checkout flow', 'Create the cart and payment handoff experience.', $1, $4, 'TODO', 'URGENT', CURRENT_DATE + INTERVAL '30 days', $3),
        ('Create mobile wireframes', 'Prepare the first banking application wireframes.', $5, $2, 'TODO', 'MEDIUM', CURRENT_DATE + INTERVAL '21 days', $3),
        ('Define leave policy rules', 'Document the initial HR leave workflow rules.', $6, $4, 'TODO', 'LOW', CURRENT_DATE + INTERVAL '45 days', $3)
    `, [projectRows[0], users["developer1@example.com"], users["admin@example.com"], users["developer2@example.com"], projectRows[1], projectRows[2]]);
  }

  await client.query("COMMIT");
  console.log("Seed complete. Test password: Password123!");
} catch (error) {
  await client.query("ROLLBACK");
  console.error("Seed failed:", error);
  process.exitCode = 1;
} finally {
  client.release();
  await pool.end();
}
