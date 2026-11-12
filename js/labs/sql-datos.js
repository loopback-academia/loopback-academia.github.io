// Base de datos del laboratorio SQL: el inventario de red de una empresa ficticia (SQLite).
export const ESQUEMA = `
CREATE TABLE sitios (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL UNIQUE,
  ciudad TEXT NOT NULL
);
CREATE TABLE dispositivos (
  id INTEGER PRIMARY KEY,
  hostname TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL CHECK (tipo IN ('router','switch','ap','firewall')),
  modelo TEXT NOT NULL,
  ip_gestion TEXT UNIQUE,
  sitio_id INTEGER NOT NULL REFERENCES sitios(id),
  version_so TEXT,
  alta TEXT
);
CREATE TABLE vlans (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL
);
CREATE TABLE interfaces (
  id INTEGER PRIMARY KEY,
  dispositivo_id INTEGER NOT NULL REFERENCES dispositivos(id),
  nombre TEXT NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('up','down','admin-down')),
  vlan INTEGER REFERENCES vlans(id),
  velocidad_mbps INTEGER
);
CREATE TABLE incidencias (
  id INTEGER PRIMARY KEY,
  dispositivo_id INTEGER NOT NULL REFERENCES dispositivos(id),
  fecha TEXT NOT NULL,
  gravedad INTEGER NOT NULL CHECK (gravedad BETWEEN 1 AND 5),
  descripcion TEXT NOT NULL,
  resuelta INTEGER NOT NULL DEFAULT 0
);`;

export const DATOS = `
INSERT INTO sitios VALUES (1,'Sede central','Santo Domingo'),(2,'Sucursal norte','Santiago'),(3,'Sucursal este','La Romana'),(4,'Centro de datos','Santo Domingo');
INSERT INTO dispositivos VALUES
 (1,'R-SDQ-01','router','ISR4331','10.10.99.1',1,'17.9.4','2023-02-10'),
 (2,'SW-SDQ-CORE','switch','C9300-48P','10.10.99.2',1,'17.9.4','2023-02-10'),
 (3,'SW-SDQ-01','switch','C9200L-24P-4G','10.10.99.11',1,'17.6.5','2023-03-01'),
 (4,'SW-SDQ-02','switch','C9200L-24P-4G','10.10.99.12',1,'17.6.5','2023-03-01'),
 (5,'AP-SDQ-01','ap','C9120AXI','10.10.99.31',1,'17.9.5','2024-01-15'),
 (6,'FW-SDQ-01','firewall','FPR1120','10.10.99.254',1,'7.2.5','2023-02-10'),
 (7,'R-STI-01','router','ISR1111','10.20.99.1',2,'17.3.8','2022-06-20'),
 (8,'SW-STI-01','switch','C2960X-24PS','10.20.99.11',2,'15.2.7','2021-09-05'),
 (9,'SW-STI-02','switch','C2960X-24PS','10.20.99.12',2,'15.2.7','2021-09-05'),
 (10,'AP-STI-01','ap','C9115AXI','10.20.99.31',2,'17.9.5','2024-03-02'),
 (11,'R-LRM-01','router','ISR1111','10.30.99.1',3,'16.12.4','2020-11-11'),
 (12,'SW-LRM-01','switch','C2960X-24PS','10.30.99.11',3,'15.2.7','2020-11-11'),
 (13,'SW-DC-SPINE1','switch','N9K-C9336C','10.40.99.1',4,'10.3.4','2024-05-20'),
 (14,'SW-DC-LEAF1','switch','N9K-C93180YC','10.40.99.11',4,'10.3.4','2024-05-20'),
 (15,'SW-DC-LEAF2','switch','N9K-C93180YC','10.40.99.12',4,'10.3.4','2024-05-20');
INSERT INTO vlans VALUES (10,'VENTAS'),(20,'SOPORTE'),(30,'INVITADOS'),(50,'VOZ'),(99,'GESTION');
INSERT INTO interfaces (dispositivo_id,nombre,estado,vlan,velocidad_mbps) VALUES
 (1,'Gi0/0/0','up',NULL,1000),(1,'Gi0/0/1','up',NULL,1000),(1,'Gi0/0/2','admin-down',NULL,1000),
 (2,'Gi1/0/1','up',99,10000),(2,'Gi1/0/2','up',99,10000),(2,'Gi1/0/3','up',10,1000),(2,'Gi1/0/48','down',NULL,1000),
 (3,'Gi1/0/1','up',10,1000),(3,'Gi1/0/2','up',10,1000),(3,'Gi1/0/3','down',10,1000),(3,'Gi1/0/4','up',50,1000),(3,'Gi1/0/5','admin-down',NULL,1000),
 (4,'Gi1/0/1','up',20,1000),(4,'Gi1/0/2','down',20,1000),(4,'Gi1/0/3','down',30,1000),(4,'Gi1/0/4','up',30,1000),
 (5,'Gi0','up',99,2500),
 (6,'Eth1/1','up',NULL,1000),(6,'Eth1/2','up',NULL,1000),
 (7,'Gi0/0/0','up',NULL,1000),(7,'Gi0/0/1','down',NULL,1000),
 (8,'Fa0/1','up',10,100),(8,'Fa0/2','down',10,100),(8,'Fa0/3','down',20,100),(8,'Fa0/4','up',50,100),(8,'Gi0/1','up',99,1000),
 (9,'Fa0/1','up',20,100),(9,'Fa0/2','up',20,100),(9,'Fa0/3','down',30,100),
 (10,'Gi0','up',99,1000),
 (11,'Gi0/0/0','up',NULL,1000),(11,'Gi0/0/1','down',NULL,1000),
 (12,'Fa0/1','up',10,100),(12,'Fa0/2','down',10,100),(12,'Fa0/3','down',30,100),(12,'Gi0/1','up',99,1000),
 (13,'Eth1/1','up',NULL,100000),(13,'Eth1/2','up',NULL,100000),
 (14,'Eth1/1','up',NULL,25000),(14,'Eth1/49','up',NULL,100000),
 (15,'Eth1/1','up',NULL,25000),(15,'Eth1/49','down',NULL,100000);
INSERT INTO incidencias (dispositivo_id,fecha,gravedad,descripcion,resuelta) VALUES
 (1,'2026-09-02',2,'Caída del enlace con el proveedor',1),
 (3,'2026-09-15',4,'Puerto Gi1/0/3 con errores CRC',0),
 (4,'2026-10-01',3,'Bucle por cable mal conectado en recepción',1),
 (7,'2026-08-21',1,'Router sin respuesta tras corte eléctrico',1),
 (7,'2026-10-12',2,'Enlace WAN con pérdidas del 8 %',0),
 (8,'2026-07-30',5,'Ventilador ruidoso',0),
 (8,'2026-10-20',2,'Switch reiniciándose cada hora',0),
 (11,'2026-09-28',1,'Sucursal este sin conexión',0),
 (11,'2026-10-05',3,'CPU alta por tormenta de broadcast',1),
 (12,'2026-10-06',4,'Puerto Fa0/2 en err-disabled por port security',0),
 (14,'2026-10-18',2,'Pérdida de un enlace hacia el spine',1),
 (15,'2026-11-02',2,'Enlace Eth1/49 caído',0);`;

// ---------------------------------------------------------------- caso detective
// Base de datos del caso «El apagón de la sucursal»: registros de cambios, sesiones SSH, VPN y tarjetas de acceso.
export const ESQUEMA_DETECTIVE = `
CREATE TABLE empleados (
  id INTEGER PRIMARY KEY,
  nombre TEXT NOT NULL,
  departamento TEXT NOT NULL,
  usuario TEXT NOT NULL UNIQUE
);
CREATE TABLE accesos_vpn (
  id INTEGER PRIMARY KEY,
  usuario TEXT NOT NULL,
  fecha_hora TEXT NOT NULL,
  ip_publica TEXT NOT NULL,
  ip_asignada TEXT,
  resultado TEXT NOT NULL CHECK (resultado IN ('ok','fallo'))
);
CREATE TABLE sesiones_ssh (
  id INTEGER PRIMARY KEY,
  usuario TEXT NOT NULL,
  equipo TEXT NOT NULL,
  ip_origen TEXT NOT NULL,
  inicio TEXT NOT NULL,
  fin TEXT
);
CREATE TABLE cambios (
  id INTEGER PRIMARY KEY,
  sesion_id INTEGER NOT NULL REFERENCES sesiones_ssh(id),
  equipo TEXT NOT NULL,
  fecha_hora TEXT NOT NULL,
  comando TEXT NOT NULL
);
CREATE TABLE tarjetas (
  id INTEGER PRIMARY KEY,
  empleado_id INTEGER NOT NULL REFERENCES empleados(id),
  puerta TEXT NOT NULL,
  fecha_hora TEXT NOT NULL
);`;

export const DATOS_DETECTIVE = `
INSERT INTO empleados VALUES
 (1,'Paula Gómez','Redes','pgomez'),(2,'Luis Rosario','Redes','lrosario'),(3,'Marta Fernández','Soporte','mfernandez'),
 (4,'Carlos Peña','Soporte','cpena'),(5,'Ana Batista','Sistemas','abatista'),(6,'Jorge Martínez','Redes','jmartinez'),
 (7,'Rosa Valdez','Contabilidad','rvaldez'),(8,'Pedro Santos','Ventas','psantos');
INSERT INTO accesos_vpn (usuario,fecha_hora,ip_publica,ip_asignada,resultado) VALUES
 ('lrosario','2026-11-07 08:02:11','190.166.20.14','10.99.0.11','ok'),
 ('jmartinez','2026-11-07 09:15:40','148.101.7.88','10.99.0.12','ok'),
 ('pgomez','2026-11-07 10:01:05','190.166.33.201','10.99.0.13','ok'),
 ('cpena','2026-11-07 14:22:19','152.166.4.9','10.99.0.14','ok'),
 ('admin','2026-11-08 01:40:02','185.220.101.47',NULL,'fallo'),('admin','2026-11-08 01:40:09','185.220.101.47',NULL,'fallo'),
 ('admin','2026-11-08 01:40:15','185.220.101.47',NULL,'fallo'),('admin','2026-11-08 01:40:22','185.220.101.47',NULL,'fallo'),
 ('mfernandez','2026-11-08 01:48:31','185.220.101.47',NULL,'fallo'),('mfernandez','2026-11-08 01:48:37','185.220.101.47',NULL,'fallo'),
 ('mfernandez','2026-11-08 01:48:44','185.220.101.47',NULL,'fallo'),
 ('pgomez','2026-11-08 02:01:10','185.220.101.47',NULL,'fallo'),('pgomez','2026-11-08 02:01:16','185.220.101.47',NULL,'fallo'),
 ('pgomez','2026-11-08 02:01:23','185.220.101.47',NULL,'fallo'),('pgomez','2026-11-08 02:01:29','185.220.101.47',NULL,'fallo'),
 ('pgomez','2026-11-08 02:01:36','185.220.101.47',NULL,'fallo'),('pgomez','2026-11-08 02:01:42','185.220.101.47',NULL,'fallo'),
 ('pgomez','2026-11-08 02:09:12','185.220.101.47','10.99.0.23','ok'),
 ('lrosario','2026-11-08 07:55:03','190.166.20.14','10.99.0.11','ok'),
 ('jmartinez','2026-11-08 08:20:47','148.101.7.88','10.99.0.12','ok');
INSERT INTO sesiones_ssh VALUES
 (4460,'admin-red','R-SDQ-01','10.99.0.11','2026-11-07 08:10:00','2026-11-07 08:40:12'),
 (4461,'admin-red','SW-SDQ-01','10.99.0.12','2026-11-07 09:20:31','2026-11-07 09:31:02'),
 (4462,'admin-red','SW-STI-01','10.99.0.13','2026-11-07 10:05:44','2026-11-07 10:20:10'),
 (4463,'soporte','SW-SDQ-02','10.10.20.15','2026-11-07 15:02:00','2026-11-07 15:05:30'),
 (4471,'admin-red','SW-STI-01','10.99.0.23','2026-11-08 02:12:58','2026-11-08 02:15:01'),
 (4472,'admin-red','R-STI-01','10.99.0.11','2026-11-08 08:01:13','2026-11-08 09:12:44');
INSERT INTO cambios (sesion_id,equipo,fecha_hora,comando) VALUES
 (4460,'R-SDQ-01','2026-11-07 08:12:40','ntp server 10.10.99.5'),
 (4461,'SW-SDQ-01','2026-11-07 09:25:02','interface gi1/0/7'),(4461,'SW-SDQ-01','2026-11-07 09:25:10','switchport access vlan 10'),
 (4462,'SW-STI-01','2026-11-07 10:12:15','interface fa0/4'),(4462,'SW-STI-01','2026-11-07 10:12:30','description Telefono recepcion'),
 (4471,'SW-STI-01','2026-11-08 02:13:40','configure terminal'),(4471,'SW-STI-01','2026-11-08 02:14:05','no vlan 20'),
 (4471,'SW-STI-01','2026-11-08 02:14:31','no logging host 10.10.99.50'),(4471,'SW-STI-01','2026-11-08 02:14:50','end'),
 (4472,'R-STI-01','2026-11-08 08:05:00','show logging'),(4472,'SW-STI-01','2026-11-08 08:40:21','vlan 20');
INSERT INTO tarjetas (empleado_id,puerta,fecha_hora) VALUES
 (1,'Entrada principal','2026-11-07 08:55:12'),(1,'Salida principal','2026-11-07 18:31:40'),
 (2,'Entrada principal','2026-11-07 07:58:03'),(2,'Salida principal','2026-11-07 17:02:11'),
 (6,'Entrada principal','2026-11-07 09:01:50'),(6,'Salida principal','2026-11-07 18:05:33'),
 (3,'Entrada principal','2026-11-07 08:30:00'),(3,'Salida principal','2026-11-07 17:30:22'),
 (2,'Entrada principal','2026-11-08 07:50:41'),(1,'Entrada principal','2026-11-08 09:10:07');`;
