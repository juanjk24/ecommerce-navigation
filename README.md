# MareaShop

MareaShop es un prototipo de comercio electrónico que demuestra distintas formas de navegar un catálogo amplio. El catálogo se organiza en una taxonomía y permite buscar productos por categoría y texto, cambiar la estrategia de recorrido, paginar resultados y deshacer o rehacer navegaciones.

El catálogo de demostración se genera en memoria con 2.150 productos, cinco familias, 18 nodos de taxonomía y 12 hojas terminales. No utiliza una base de datos.

## Integrantes

- Fernando Quintero
- Juan Cuellar

## Arquitectura

El proyecto está dividido en una interfaz web y una API:

- **Frontend:** SPA construida con React 19 y Vite. Presenta la taxonomía, el buscador, el selector de estrategia, las migas de pan, los productos paginados, el historial y el benchmark.
- **API:** servicio Node.js con Express que expone los endpoints y traduce las solicitudes HTTP a operaciones del motor de navegación.
- **Motor de navegación:** construye el catálogo, selecciona y ejecuta la estrategia, filtra y pagina los resultados, registra métricas y gestiona el historial.
- **Contrato entre capas:** la interfaz consume JSON a través de la API. El recorrido del catálogo y la selección de estrategias permanecen en el servidor; la SPA no implementa esos algoritmos.

Durante el desarrollo, Vite sirve la interfaz en `http://localhost:5173` y redirige las solicitudes `/api` a Express en `http://127.0.0.1:5050`.

## Patrones de diseño

- **Composite:** representa categorías y productos mediante una estructura común. `CategoryNode` agrupa elementos y `ProductLeaf` representa cada producto.
- **Strategy:** encapsula las distintas formas de recorrer el catálogo para poder seleccionarlas desde la interfaz.
- **Iterator:** entrega los resultados en páginas de 12 productos, en lugar de renderizar todos los productos de una vez.
- **Observer:** publica eventos de navegación con datos como la estrategia, los resultados y el tiempo, que se usan en las trazas y el benchmark.
- **Command:** registra cada salto de navegación y permite deshacerlo o rehacerlo.

## Estrategias de búsqueda

El selector **Ordenar por** permite escoger entre:

- **Ruta guiada:** cuando se selecciona una categoría, restringe el recorrido a esa rama del catálogo.
- **BFS (por niveles):** explora la familia que contiene la categoría recorriendo sus nodos por niveles.
- **DFS (en profundidad):** explora esa familia descendiendo por sus ramas.
- **Barrido lineal:** recorre el inventario completo y sirve como línea base para comparar los recorridos.

Las métricas de la interfaz y del benchmark incluyen coincidencias, tiempo de ejecución, nodos visitados, productos examinados y reducción estimada de clics. Los tiempos dependen del equipo y de la ejecución.

## Tecnologías

- JavaScript con módulos ES
- Node.js
- Express y CORS
- React 19
- Vite
- npm

## Requisitos

- Node.js 20 o posterior
- npm

## Instalar y ejecutar

Desde la raíz del repositorio, instala las dependencias del servidor y del frontend:

```bash
cd prototipo
npm run install:all
```

Luego inicia la API y la SPA juntas:

```bash
npm run dev
```

Abre `http://localhost:5173` en el navegador. La API queda disponible en `http://localhost:5050`; se puede comprobar su estado en `http://localhost:5050/api/health`.

## Ejecutar las pruebas

Desde la carpeta `prototipo/`:

```bash
npm test
```

La suite comprueba la estructura del catálogo, la relación de rendimiento entre el barrido lineal y la ruta guiada, los elementos recorridos, los resultados de los escenarios, la reducción estimada de clics y la operación de deshacer. Al terminar, escribe el resumen de la ejecución en `prototipo/results.json`.

## Estructura principal

```text
prototipo/
├── frontend/          # SPA React y configuración de Vite
├── server/
│   ├── app.js          # API Express
│   ├── catalog.js      # Modelo Composite y catálogo
│   ├── navigator.js    # Motor de navegación y escenarios
│   ├── patterns.js     # Estrategias, Iterator, Observer y Command
│   └── tests.js        # Pruebas automatizadas
├── results.json        # Resultados de la última ejecución de pruebas
└── scripts/dev.js      # Arranque conjunto de API y frontend
```
