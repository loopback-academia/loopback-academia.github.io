# Activar las cuentas

Se hace una sola vez. Necesitas una cuenta gratuita de [Supabase](https://supabase.com).

> **Nunca** pegues la clave `service_role`/`sb_secret_` de Supabase en `config.json`, en el código ni en GitHub. En la web solo va la clave **publishable** (o `anon`).

## 1. Crear el proyecto de Supabase

1. En supabase.com → **New project**. Elige una región cercana a tus alumnos y una contraseña fuerte para la base de datos.
2. **SQL Editor → New query**: pega todo `supabase/migrations/20261111000000_aula.sql` y pulsa **Run**. Se puede repetir sin problemas.
3. Para el **panel del profesor** (clases con código): en otra consulta, pega `supabase/migrations/20261112000000_profesor.sql` y pulsa **Run**. También se puede repetir. Hasta que lo hagas, la página Clases avisa de que no está activado y el resto de la web funciona igual.
4. Para los **exámenes finales oficiales, los certificados verificables y el panel de administración**: en otra consulta, pega `supabase/migrations/20261116000000_finales.sql` y pulsa **Run** (después de las dos anteriores).
5. Carga el **banco privado de preguntas** del examen final con el archivo `banco_final_datos.sql`. Ese archivo **no está en el repositorio a propósito**: si estuviera, cualquiera podría leer las respuestas. Guárdalo en un lugar privado. Se puede volver a ejecutar para actualizar las preguntas; cada examen usa 25, así que cada área necesita al menos 25 preguntas activas (el panel de administración avisa si faltan). También puedes añadir o desactivar preguntas en **Table Editor → banco_final**.
6. Para darte acceso al **panel de administración** (`admin.html`), activa primero la verificación en dos pasos en tu cuenta de Loopback y ejecuta, con tu correo:
   ```sql
   insert into public.administradores (user_id)
   select id from auth.users where email = 'TU_CORREO' on conflict do nothing;
   ```
   El panel solo muestra cifras agregadas y exige una sesión con el segundo factor verificado. Aparece un enlace en **Tu cuenta**.

Las migraciones se prueban solas en la integración continua contra un PostgreSQL que imita Supabase (`scripts/probar-sql.sh` y `supabase/pruebas/`): permisos de cada usuario, verificación en dos pasos y que nadie lee el progreso de quien no se ha unido a su clase.

## 2. Configurar la autenticación

En **Authentication**:

- **Sign In / Providers → Email**: activado, con **Confirm email** activado.
- **Passwords**: longitud mínima **12**, exigir minúsculas, mayúsculas y números, y activa **Prevent use of leaked passwords** (si tu plan lo incluye).
- **URL Configuration**:
  - *Site URL*: `https://loopback-academia.github.io/`
  - *Redirect URLs*: `https://loopback-academia.github.io/cuenta.html*`
- **Multi-Factor**: deja activado **TOTP** (app de autenticación).
- **Rate Limits**: los valores por defecto están bien; bájalos si ves abuso.
- Recomendado para producción: **SMTP propio** (Emails → SMTP Settings); el correo de prueba de Supabase tiene un límite muy bajo de envíos por hora.

## 3. Conectar la web

En **Project Settings → API** (o **API Keys**) copia la **Project URL** y la clave **publishable** (o `anon`). Ponlas en `config.json`:

```json
"supabaseUrl": "https://TU-PROYECTO.supabase.co",
"supabaseKey": "sb_publishable_…"
```

Después ejecuta `node scripts/paginas.mjs` (regenera `js/config.js` y añade tu proyecto a la CSP) y sube los cambios. Esa clave es pública por diseño: lo que protege los datos es RLS.

## 4. Comprobar

1. Abre la web, **Entrar → Crear cuenta**, confirma el correo.
2. Completa una lección y mira que en **Table Editor → progreso** aparece la fila.
3. En **Tu cuenta**, activa la verificación en dos pasos.
