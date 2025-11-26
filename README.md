MarakanazoReserves
==================

Proyecto React (Vite) + json-server para simular un backend sencillo.
Incluye:
- Landing (Home)
- Canchas (3 canchas: 2 fútbol, 1 vóley)
- Backend simulado con json-server (server/db.json) para canchas y reservas.

Comandos:
1. Instalar dependencias:
   npm install

2. Levantar frontend:
   npm run dev

3. Levantar backend simulado:
   npm run server
   (json-server correrá en http://localhost:4000)

API endpoints:
- GET  /canchas
- GET  /reservas
- POST /reservas
- DELETE /reservas/:id
