# Guía de Despliegue en Dokploy

Dokploy es una plataforma que facilita el despliegue de aplicaciones y bases de datos. El proyecto **Zound** ya incluye los archivos `Dockerfile` y `compose.yml` listos para producción. 

Existen dos formas principales de desplegar Zound en Dokploy: usando un entorno **Compose** (recomendado por simplicidad) o desplegando la aplicación y la base de datos por separado.

---

## Método 1: Usar "Compose" (Recomendado)

Esta es la forma más rápida, ya que el archivo `compose.yml` incluido levanta de forma automática tanto la aplicación web como la base de datos PostgreSQL, las conecta entre sí internamente y hace el build de Next.js.

1. Ingresa al panel de administración de tu instancia de Dokploy.
2. Crea un nuevo proyecto si aún no tienes uno.
3. Ve a la pestaña **Compose** y dale a **Create Compose**.
4. Nómbralo (ej. `zound-compose`).
5. En la sección **Source**:
   - Selecciona **Git** o **GitHub** y conecta tu repositorio de Zound.
   - En el **Compose Path**, escribe `compose.yml` (que es el archivo incluido en la raíz de este proyecto).
6. Presiona **Deploy**.

> **Nota:** La configuración predeterminada genera contraseñas y configuraciones automáticas (usuario y contraseña `postgres`). Si deseas usar valores distintos, añade las variables de entorno (`POSTGRES_PASSWORD`, `POSTGRES_USER`, `JWT_SECRET`, etc.) en la pestaña *Environment* antes de deplegar.
> 
> *El puerto de la aplicación por defecto está expuesto en el `3003` tal como lo dicta el Dockerfile.*

---

## Método 2: Despliegue Separado (Application + Database)

Si quieres usar la interfaz gráfica de Dokploy para administrar la base de datos por separado o realizar respaldos manuales de forma más sencilla:

### Paso 1: Crear la Base de Datos PostgreSQL
1. En tu proyecto de Dokploy, ve a **Databases** y selecciona **Create Database -> PostgreSQL**.
2. Asígnale un nombre (ej. `zound-db`) y establece el usuario y contraseña. Dokploy creará la base de datos.
3. Tras desplegarla, entra al panel de la base de datos y copia la URL de conexión interna (Internal Connection URL), normalmente se verá así: `postgresql://user:pass@zound-db:5432/db`.

### Paso 2: Crear la Aplicación
1. Ve a **Applications** y presiona **Create Application**.
2. Nómbrala (ej. `zound-web`).
3. En la sección **Source**, conecta el repositorio de GitHub de tu proyecto.
4. En la sección **Build Type**, selecciona **Docker** (Dokploy detectará automáticamente el archivo `Dockerfile` en la raíz).
5. En la sección **Environment**, añade las siguientes variables críticas:
   - `DATABASE_URL`: Pega la URL de conexión interna de PostgreSQL que copiaste en el Paso 1.
   - `JWT_SECRET`: Ingresa una cadena larga y segura (ej. `mi-clave-super-secreta-para-jwt-123+`).
   - *Cualquier otra variable de entorno obligatoria de la app, como las claves de Google Cloud.*
6. Ve a **Ports** y configura `Container Port` a **3003** (este es el puerto duro dentro del `Dockerfile`). El `Host Port` déjalo expuesto en el puerto al cual conectarás tu dominio en la pestaña *Domains*.
7. Presiona **Deploy**.

> El Dockerfile está programado para ejecutar el comando `npx prisma db push --accept-data-loss` automáticamente antes de arrancar. Por ello, tan pronto la app se conecte por primera vez a la base de datos, creará las tablas necesarias sola y arrancará.
