"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const buildRuntimeDatabaseUrl = () => {
    const baseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL || '';
    if (!baseUrl) {
        return baseUrl;
    }
    const url = new URL(baseUrl);
    if (!url.searchParams.has('pgbouncer')) {
        url.searchParams.set('pgbouncer', 'true');
    }
    if (!url.searchParams.has('connection_limit')) {
        url.searchParams.set('connection_limit', '1');
    }
    return url.toString();
};
const prisma = new client_1.PrismaClient({
    datasources: {
        db: {
            url: buildRuntimeDatabaseUrl(),
        },
    },
});
exports.default = prisma;
//# sourceMappingURL=prisma.js.map