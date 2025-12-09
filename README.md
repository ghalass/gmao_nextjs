pnpm create next-app@latest gmao

pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button scroll-area tabs
pnpm add next-themes

pnpm add prisma @types/node @types/pg --save-dev
pnpm add @prisma/client @prisma/adapter-pg pg dotenv
npx prisma init
npx prisma generate
npx prisma migrate dev --name init

pnpm add @tanstack/react-query

pnpm add bcryptjs jsonwebtoken formik yup @hookform/resolvers yup-locales
pnpm add -D @types/jsonwebtoken
pnpm add -D ts-node typescript
pnpm add iron-session
pnpm add @tanstack/react-form
pnpm add recharts

---

ssh root@147.79.118.72
Gh@l@s2025-1986

./deploy.sh

chmod +x deploy.sh

# POUR CREER UN SUPER USER, ALLEZ A CE LIEN

http://localhost:3000/api/users/create_super_admin
