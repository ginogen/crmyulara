PRD – CRM para Empresa de Viajes
1. Introducción
Objetivo del Proyecto:
Desarrollar un CRM integral que permita a la empresa de viajes gestionar contactos, leads, presupuestos, tareas y la estructura organizacional (Organización y Sucursales). El sistema debe facilitar la administración de información comercial y operativa, otorgando distintos niveles de acceso según el rol del usuario, y ofreciendo una interfaz intuitiva y responsive.

Alcance:

Gestión de contactos y leads.
Seguimiento y administración de tareas y calendarios.
Control de presupuestos.
Administración jerárquica de organizaciones, sucursales y usuarios.
Interfaz centralizada con módulos diferenciados y controles basados en roles.
2. Público Objetivo
Empresas de viajes que requieran centralizar la gestión comercial y operativa.
Usuarios internos: Agentes de Ventas, Gerentes de Sucursal, Administradores de Organización y SuperAdmin.
3. Arquitectura General y Tecnologías
Frontend:

Next.js: Se utilizará para el desarrollo de una aplicación web basada en React con capacidades de renderizado del lado del servidor (SSR) y generación de páginas estáticas, lo que aportará velocidad y SEO optimizado.
Backend y Base de Datos:

Supabase: Proporcionará un backend como servicio basado en PostgreSQL, incluyendo autenticación, almacenamiento de archivos y funciones en tiempo real para la sincronización de datos.
Autenticación y autorización: Utilizando Supabase Auth, se gestionarán los accesos y la asignación de roles.
Almacenamiento: Para guardar documentos (PDF, DOC, CSV) en el módulo de Contactos.
Realtime/Triggers: Para actualizaciones en tiempo real, por ejemplo, en la bandeja de entrada de notificaciones o actualizaciones de tareas.
Integración y Comunicación:

Conexión directa desde Next.js hacia Supabase mediante sus SDKs, lo que permitirá llamadas seguras a la base de datos y al servicio de autenticación.
API Routes en Next.js para endpoints específicos que requieran lógica personalizada o validaciones adicionales.
4. Estructura de Usuarios y Roles
4.1. Roles Definidos y Permisos
SuperAdmin:

Acceso total a todos los módulos.
Gestión completa en el módulo Administración:
Crear/Actualizar/Eliminar Organizaciones.
Crear/Actualizar/Eliminar Sucursales.
Crear/Actualizar/Eliminar Usuarios a nivel global.
Vista exclusiva para supervisar todas las áreas del CRM.
Administrador Organización:

Acceso a todos los módulos.
Puede gestionar la estructura interna de la organización:
Crear nuevas Sucursales (no puede crear otra organización).
Gestión completa de usuarios dentro de la organización (creación, actualización, eliminación).
Gerente Sucursal:

Acceso a todos los módulos, con limitaciones de creación de estructuras:
Asignado a una única Sucursal.
Puede ver la totalidad de la información de su sucursal.
Gestión de usuarios solo dentro de la sucursal asignada.
Acceso a columnas y filtros ampliados (por ejemplo, ver “Asignado a” en Contactos y Leads).
Agente de Ventas:

Acceso limitado a los módulos:
Dashboard, Contactos, Leads y Bandeja de Entrada.
Solo puede visualizar y gestionar la información que le haya sido asignada (contactos, leads y tareas).
5. Layout y Navegación
5.1. Componentes Globales de la Interfaz
Topbar:

Switcher de Vista: Dropdown que permite al usuario, según su rol, cambiar la vista entre Organización y/o Sucursal.
Search Bar: Barra de búsqueda que filtre tanto en Contactos como en Leads por nombre o email. Al hacer clic en un resultado, se redirige a la ficha correspondiente.
Notificaciones: Icono que muestra las tareas pendientes del día. Al hacer clic, se puede desplegar un listado o acceder a la sección correspondiente.
Sidebar:

Posición superior: Se muestra el logo de la Organización (customizable).
Datos del usuario activo: Nombre y email.
Menú de navegación con íconos para:
Dashboard
Contactos
Leads
Bandeja de Entrada
Presupuestos
Administración (accesible únicamente para SuperAdmin, Administrador Organización y Gerente Sucursal)
Funcionalidad collapsable para optimizar espacio en pantalla.
MainContent:

Área central de la aplicación donde se despliega el contenido del módulo seleccionado.
La vista predeterminada al ingresar al CRM es el Dashboard.
6. Descripción de Módulos y Funcionalidades
6.1. Módulo Dashboard
Objetivo: Proveer una visión rápida del estado del CRM y permitir la gestión de tareas.
Componentes y Funcionalidades:
Cards Informativas:
Mostrar indicadores clave: Leads Totales, Leads Sin Gestión, Interesados, Reservados, Liquidados.
Vista Calendario:
Vistas por día, semana y mes.
Visualización de tareas relacionadas a cada Lead/Contacto.
Tareas clickeables y editables.
Capacidad de mover tareas dentro del calendario (drag & drop).
Tabla de Leads:
Muestra leads asignados, con la visibilidad determinada por el rol:
Agente: Sólo sus leads.
Gerente Sucursal: Leads de todos los agentes de su sucursal.
Administrador Organización: Leads de todas las sucursales de la organización.
SuperAdmin: Todos los leads.
6.2. Módulo Contactos
Objetivo: Gestión y seguimiento detallado de contactos.
Componentes y Funcionalidades:
Filtros Dinámicos:
Dropdowns con búsqueda para: Nombre, Ciudad, Etiqueta, Teléfono, Email y, para Gerente Sucursal y roles superiores, “Asignado A”.
Tabla de Contactos:
Columnas: Nombre, Ciudad, Provincia, Teléfono, Email, Etiqueta y Action Buttons.
Ficha de Contacto (Detalle):
Información completa del contacto.
Secciones en la ficha:
Documentación: Permite subir y almacenar archivos (PDF, DOC, CSV).
Historial: Registro de todas las acciones realizadas sobre el contacto (ediciones, interacciones, etc.).
Notas: Espacio para agregar recordatorios o comentarios que se guardan de forma histórica.
Acciones:
Botón “Editar Contacto” para modificar información.
Botón “GESTION” para abrir un modal que permita cambiar la etiqueta del contacto, utilizando un componente que posibilite la creación de etiquetas con nombre y color personalizado.
6.3. Módulo Leads
Objetivo: Registro y seguimiento de oportunidades de negocio (leads) que luego pueden convertirse en contactos.
Componentes y Funcionalidades:
Tabla de Leads:
Columnas a mostrar:
Número de Consulta (generado dinámicamente)
Nombre Completo
Fecha de Creación
Estado (con los siguientes posibles estados:
Nueva
Asignada
Contactada
Seguida
Interesado
Reservado
Liquidado
Reserva Efectiva)
Asignado A (visible sólo para Gerente Sucursal en adelante)
Origen
Provincia
Teléfono
Cantidad de Pax
Fecha Estimada de Viaje
Acción:
Botón para acceder a la ficha del lead, donde se muestra información detallada.
Dentro de la ficha se debe incluir una opción para convertir un Lead en Contacto.
Filtros Dinámicos:
Dropdowns con búsqueda para filtrar rápidamente.
Para el Gerente Sucursal, un filtro adicional que permita filtrar por Agente.
Reglas de Negocio:
Los leads no se pueden eliminar, solo archivar.
6.4. Módulo Bandeja de Entrada
Objetivo: Centralizar la recepción y gestión de mensajes o notificaciones relacionados con actividades y tareas (se puede expandir para integraciones futuras como correos o chats internos).
Funcionalidades:
Visualización de mensajes entrantes.
Acceso rápido a tareas o interacciones pendientes.
Notificaciones en tiempo real (aprovechando las capacidades en tiempo real de Supabase).
6.5. Módulo Presupuestos
Objetivo: Gestión de cotizaciones y presupuestos de viajes.
Funcionalidades:
Registro de presupuestos asociados a contactos o leads.
Visualización y edición de detalles del presupuesto.
Posibilidad de generar informes o exportar presupuestos a formatos PDF/Excel.
Integración con otros módulos para relacionar presupuestos con tareas y seguimientos.
6.6. Módulo Administración
Objetivo: Gestión de la estructura organizacional y de usuarios.
Componentes y Funcionalidades:
Gestión de Estructuras:
Organización (estructura padre):
Permite asignar un custom_name.
Puede contener una o múltiples Sucursales.
Sucursales:
Gestión de sucursales vinculadas a cada organización.
Gestión de Usuarios:
Asignación de usuarios a organizaciones y sucursales.
Creación, actualización y eliminación de usuarios (según rol, p.ej., SuperAdmin y Administrador Organización tienen mayores permisos que Gerente Sucursal).
Acceso basado en roles:
El módulo Administración es accesible únicamente para:
SuperAdmin
Administrador Organización
Gerente Sucursal
7. Requisitos Funcionales y No Funcionales
7.1. Requisitos Funcionales
Interfaz de Usuario (UI):
Diseño responsive y adaptable a dispositivos de escritorio y móviles.
Comportamientos interactivos: modals, dropdowns, arrastrar y soltar (calendario).
Búsqueda y Filtrado:
Barra de búsqueda global en la Topbar.
Filtros dinámicos en módulos de Contactos y Leads.
Gestión de Documentos:
Subida y almacenamiento seguro de archivos.
Historial y Auditoría:
Registro detallado de acciones en fichas de Contactos y Leads.
Notificaciones y Tareas:
Visualización en tiempo real de tareas pendientes en la Topbar y Dashboard.
7.2. Requisitos No Funcionales
Seguridad:
Autenticación robusta mediante Supabase Auth.
Control de acceso y permisos basado en roles.
Validación y saneamiento de datos en formularios y endpoints.
Rendimiento:
Optimización en carga de páginas con Next.js (SSR/SSG).
Uso eficiente de consultas y real-time updates a través de Supabase.
Escalabilidad:
Arquitectura modular que permita la incorporación de nuevas funcionalidades.
Base de datos escalable (PostgreSQL) y capacidad de almacenamiento en Supabase.
Mantenibilidad:
Código documentado y estructurado.
Tests unitarios y de integración en módulos críticos.
Accesibilidad:
Cumplimiento de estándares WCAG para una experiencia inclusiva.
8. Flujo de Usuario y Casos de Uso
8.1. Inicio de Sesión y Cambio de Vista
Inicio de Sesión:
El usuario ingresa con sus credenciales (verificadas a través de Supabase Auth).
Switcher de Organización/Sucursal:
En función del rol, se muestra un dropdown para cambiar la vista entre diferentes organizaciones o sucursales a las que el usuario tenga acceso.
8.2. Gestión de Contactos y Leads
Búsqueda y Filtros:
El usuario utiliza la barra de búsqueda o los filtros específicos en cada módulo para localizar información.
Acceso a Fichas Detalladas:
Desde la tabla, el usuario hace clic en “Editar” o “Ver Detalle”, abriendo la ficha completa con secciones de documentación, historial y notas.
Conversión de Lead a Contacto:
Dentro del módulo de Leads, se proporciona un botón para convertir un Lead en Contacto, trasladando la información relevante.
8.3. Gestión de Tareas y Calendario
Visualización y Edición:
El usuario accede al Dashboard para ver las tarjetas informativas y el calendario.
Las tareas pueden ser movidas, editadas o actualizadas directamente desde la interfaz del calendario.
8.4. Administración y Gestión de la Estructura
Gestión de Organizaciones y Sucursales:
Los usuarios con permisos (SuperAdmin y Administrador Organización) pueden crear, actualizar o eliminar organizaciones y sucursales.
Gestión de Usuarios:
Creación y asignación de nuevos usuarios con roles específicos, con la posibilidad de editar o eliminar usuarios existentes según permisos.
9. Consideraciones Técnicas y de Implementación
9.1. Integración con Next.js
Routing y Páginas Dinámicas:
Uso del sistema de rutas de Next.js para crear vistas modulares (dashboard, contactos, leads, etc.).
Server-Side Rendering (SSR):
Renderizado inicial de páginas para mejorar SEO y velocidad de carga.
API Routes:
Endpoints personalizados para operaciones críticas, con validación de tokens y permisos.
9.2. Integración con Supabase
Autenticación y Gestión de Sesiones:
Utilización del SDK de Supabase para gestionar sesiones y roles.
Consultas a la Base de Datos:
Uso de Supabase Client para ejecutar consultas en tiempo real y obtener datos actualizados.
Almacenamiento de Archivos:
Configuración de buckets en Supabase Storage para guardar documentación y archivos adjuntos.
Realtime:
Implementación de listeners para actualizaciones en el calendario, notificaciones y cambios en leads/contactos.
9.3. Gestión de Estados y Comunicación
Estado Global de la Aplicación:
Uso de Context API o librerías de manejo de estado (p.ej., Redux) para gestionar la información del usuario, la vista actual y datos filtrados.
Integración con Librerías Externas:
Calendario interactivo (por ejemplo, FullCalendar o similar) para el Dashboard.
Componentes UI para dropdowns, modals y filtros dinámicos.


11. Consideraciones Finales
Escalabilidad y Futuras Mejoras:
El sistema debe estar diseñado para incorporar nuevas funcionalidades, como integración con plataformas de marketing, reportes avanzados o integraciones con sistemas de pago.
Documentación y Soporte:
Se deberá elaborar documentación técnica y guías de usuario para facilitar la adopción y el mantenimiento.
Seguridad y Backup:
Implementar estrategias de backup y recuperación, especialmente para datos críticos de usuarios y transacciones.
Feedback Continuo:
Integrar mecanismos para recibir feedback de los usuarios y realizar mejoras iterativas en el CRM.
Este PRD ofrece una visión integral y detallada del desarrollo del CRM para una empresa de viajes, utilizando Next.js para el frontend y Supabase para el backend. El documento establece claramente las funcionalidades, roles, flujo de usuario, arquitectura técnica y cronograma de desarrollo, asegurando que todas las áreas clave sean cubiertas para lograr un sistema robusto, escalable y fácil de usar.







