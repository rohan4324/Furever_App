import { sql } from "drizzle-orm";

export async function up(db: any) {
  await sql`
    ALTER TABLE health_records
    ADD COLUMN severity text CHECK (severity IN ('low', 'medium', 'high')),
    ADD COLUMN attachments text[],
    ADD COLUMN notes text;
  `;
}

export async function down(db: any) {
  await sql`
    ALTER TABLE health_records
    DROP COLUMN severity,
    DROP COLUMN attachments,
    DROP COLUMN notes;
  `;
}
