import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const email = process.env.ADMIN_SEED_EMAIL || 'mufasa@fixology.io'
  const password = process.env.ADMIN_SEED_PASSWORD || 'admin123'
  const name = process.env.ADMIN_SEED_NAME || 'Mufasa'

  const passwordHash = await bcrypt.hash(password, 12)

  const admin = await prisma.platformAdmin.upsert({
    where: { email },
    update: { name, passwordHash },
    create: {
      email,
      name,
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  })

  // eslint-disable-next-line no-console
  console.log(`Seeded platform admin: ${admin.email} (${admin.role})`)
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

