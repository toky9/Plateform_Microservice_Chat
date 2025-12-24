// prisma/prisma.config.ts

import "dotenv/config";
import { PrismaClient } from "generated/prisma";

export const prisma = new PrismaClient(); // pas besoin de passer url ni datasources
