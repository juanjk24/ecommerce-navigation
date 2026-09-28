INSERT INTO categories (name)
VALUES
('Laptops'),
('Celulares'),
('Monitores'),
('Accesorios'),
('Componentes');

INSERT INTO products
(name, description, price, brand, rating, sales_count, stock, category_id)
VALUES
(
    'Laptop Lenovo IdeaPad 5',
    'Laptop para trabajo y programación',
    3200000,
    'Lenovo',
    4.5,
    120,
    15,
    1
),
(
    'Laptop ASUS TUF Gaming',
    'Laptop gaming de alto rendimiento',
    4500000,
    'ASUS',
    4.8,
    250,
    8,
    1
),
(
    'MacBook Air M3',
    'Laptop Apple para productividad y desarrollo',
    5200000,
    'Apple',
    4.9,
    320,
    5,
    1
),
(
    'Samsung Galaxy S24',
    'Celular Android con cámara avanzada',
    2800000,
    'Samsung',
    4.7,
    210,
    12,
    2
),
(
    'iPhone 15',
    'Celular Apple con cámara de 48 MP',
    3900000,
    'Apple',
    4.8,
    280,
    9,
    2
),
(
    'Xiaomi Redmi Note 13',
    'Celular de gran batería y pantalla AMOLED',
    1100000,
    'Xiaomi',
    4.4,
    175,
    20,
    2
),
(
    'Monitor LG UltraGear 27',
    'Monitor gaming QHD de 165 Hz',
    1450000,
    'LG',
    4.6,
    95,
    10,
    3
),
(
    'Monitor Samsung ViewFinity 32',
    'Monitor 4K para trabajo creativo',
    2100000,
    'Samsung',
    4.7,
    80,
    7,
    3
),
(
    'Monitor Dell UltraSharp 24',
    'Monitor IPS para oficina y diseño',
    980000,
    'Dell',
    4.5,
    65,
    14,
    3
),
(
    'Teclado mecánico Logitech G Pro',
    'Teclado compacto para gaming',
    480000,
    'Logitech',
    4.6,
    140,
    18,
    4
),
(
    'Mouse inalámbrico Logitech MX Master 3S',
    'Mouse ergonómico para productividad',
    390000,
    'Logitech',
    4.8,
    190,
    16,
    4
),
(
    'Audífonos Sony WH-1000XM5',
    'Audífonos inalámbricos con cancelación de ruido',
    1350000,
    'Sony',
    4.9,
    230,
    11,
    4
),
(
    'Webcam Logitech C920',
    'Webcam Full HD para videollamadas y streaming',
    320000,
    'Logitech',
    4.5,
    155,
    22,
    4
),
(
    'SSD Kingston NV2 1TB',
    'Unidad SSD NVMe para ampliar almacenamiento',
    360000,
    'Kingston',
    4.7,
    125,
    25,
    5
),
(
    'Memoria RAM Corsair Vengeance 16GB',
    'Memoria DDR5 para equipos de alto rendimiento',
    310000,
    'Corsair',
    4.6,
    100,
    30,
    5
),
(
    'Tarjeta gráfica NVIDIA GeForce RTX 4060',
    'Tarjeta gráfica para gaming en resolución 1080p',
    1650000,
    'NVIDIA',
    4.8,
    88,
    6,
    5
),
(
    'Procesador AMD Ryzen 7 7800X3D',
    'Procesador gaming de ocho núcleos',
    1850000,
    'AMD',
    4.9,
    72,
    8,
    5
),
(
    'Disco externo Seagate 2TB',
    'Almacenamiento externo portátil USB 3.0',
    330000,
    'Seagate',
    4.4,
    115,
    19,
    5
),
(
    'Base refrigerante Cooler Master',
    'Base con ventiladores para laptops gaming',
    220000,
    'Cooler Master',
    4.3,
    60,
    13,
    4
),
(
    'Fuente de poder EVGA 650W',
    'Fuente certificada para equipos gaming',
    420000,
    'EVGA',
    4.5,
    58,
    10,
    5
);