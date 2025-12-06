pnpm create next-app@latest gmao
pnpm dlx shadcn@latest init
pnpm dlx shadcn@latest add button alert card dialog field label
pnpm dlx shadcn@latest add input input-group sidebar sonner badge
pnpm dlx shadcn@latest add avatar collapsible pnpm dlx shadcn@latest add
pnpm dlx shadcn@latest add table alert-dialog switch spinner
pnpm add next-themes

pnpm add prisma @types/node @types/pg --save-dev
pnpm add @prisma/client @prisma/adapter-pg pg dotenv

npx prisma init

npx prisma migrate dev --name init

# DÉPLOIEMENT

me guider étape par étape avec détaille, commet déployer mon nextjs app sur VPS Ubuntu (hostinger), l'app utilise une base des données postgres (DATABASE_URL dans .env) avec prismaORM.
DATABASE_URL="postgresql://postgres:root@localhost:5432/next_gmao_db?schema=public"
base des données à créer lors de déploiement.
et aussi utilise pnmp
aussi il faut me donner la configuration qu'il faut faire pour nginx reverse proxy pour gmao.ghalass.com
