pnpm create next-app@latest gmao

pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button scroll-area tabs progress accordion command
pnpm add next-themes

pnpm add prisma @types/node @types/pg --save-dev
pnpm add @prisma/client @prisma/adapter-pg pg dotenv
npx prisma init
npx prisma generate
npx prisma migrate dev --name init

pnpm add @tanstack/react-query
pnpm add @tanstack/react-virtual
pnpm add @tanstack/react-table

pnpm add bcryptjs jsonwebtoken formik yup @hookform/resolvers yup-locales
pnpm add -D @types/jsonwebtoken
pnpm add -D ts-node typescript
pnpm add iron-session
pnpm add @tanstack/react-form
pnpm add recharts
pnpm add -D @types/xlsx
