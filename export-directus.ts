import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

type DirectusRecord = Record<
	string,
	string | number | boolean | Date | null | object
>;

const prisma = new PrismaClient();

const includedTables = [
	'directus_collections',
	'directus_fields',
	'directus_relations',
];

async function exportData() {
	try {
		const directusTables = await prisma.$queryRawUnsafe<
			{ tablename: string }[]
		>(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname='public' 
    AND tablename LIKE '%'
  `);

		const filteredTables = directusTables
			.map(({ tablename }) => tablename)
			.filter((table) => includedTables.includes(table));

		let dataDump = "SET session_replication_role = 'replica';\n";

		for (const tableName of filteredTables) {
			const records: DirectusRecord[] = await prisma.$queryRawUnsafe(
				`SELECT * FROM "${tableName}";`,
			);
			for (const record of records) {
				const columns = Object.keys(record)
					.map((column) => `"${column}"`)
					.join(', ');
				const values = Object.values(record)
					.map((value, index) => {
						const column = Object.keys(record)[index];
						if (
							column === 'uploaded_by' ||
							column === 'modified_by' ||
							column === 'user' ||
							column === 'role' ||
							column === 'parent'
						) {
							return 'NULL';
						}
						if (column === 'id') {
							return 'DEFAULT';
						}
						if (value === null) {
							return 'NULL';
						}
						if (typeof value === 'string') {
							return `'${value.replace(/'/g, "''")}'`;
						} // Handles strings
						if (typeof value === 'object') {
							return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
						} // Handles objects by stringifying
						return value; // Handles other data types appropriately
					})
					.join(', ');
				dataDump += `INSERT INTO "${tableName}" (${columns}) VALUES (${values});\n`;
			}
		}

		dataDump += "SET session_replication_role = 'origin';\n";

		const filePath = path.resolve(
			__dirname,
			'./cms/directus_data/directus_data_export.sql',
		);
		const directory = path.dirname(filePath);
		if (!fs.existsSync(directory)) {
			fs.mkdirSync(directory, { recursive: true });
		}
		fs.writeFileSync(filePath, dataDump);
		console.log('Data export completed.');
	} catch (e) {
		console.error('Error during export:', e);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

void exportData();
