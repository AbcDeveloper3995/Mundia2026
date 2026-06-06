---
trigger: always_on
---

# **Directrices Globales Frontend**

## **Estándares de Desarrollo para Proyectos React \+ Material UI**

### **Documento Base para Agente Antigravity**

### **Versión**

2.0

### **Fecha**

21 de mayo de 2026

---

# **1\. Objetivo**

Definir reglas globales, estándares técnicos y buenas prácticas de programación aplicables a TODOS los proyectos frontend.

Estas directrices deben ser utilizadas por el agente Antigravity como reglas obligatorias para:

* Generación de código.  
* Arquitectura frontend.  
* Organización del proyecto.  
* Escalabilidad.  
* Mantenibilidad.  
* Legibilidad.  
* Performance.  
* Robustez.  
* Calidad de software.

---

# **2\. Stack tecnológico obligatorio**

# **2.1 Framework principal**

Todos los proyectos deben desarrollarse utilizando:

* React.  
* JavaScript moderno ES6\\+ES6\\+ES6\\+.  
* Material UI.

---

# **2.2 Librerías recomendadas**

## **Estado global**

* Zustand.  
* React Query / TanStack Query.

## **Formularios**

* React Hook Form.  
* Zod.

## **Routing**

* React Router.

## **Animaciones**

* Framer Motion.

---

# **3\. Filosofía de desarrollo**

Todo el código generado debe ser:

* Limpio.  
* Escalable.  
* Modular.  
* Reutilizable.  
* Fácil de mantener.  
* Fácil de leer.  
* Fácil de extender.  
* Autodescriptivo.  
* Desacoplado.  
* Robusto.  
* Consistente.

---

# **4\. Reglas globales obligatorias**

# **4.1 Código limpio**

## **Reglas**

* Escribir código simple y claro.  
* Evitar lógica innecesariamente compleja.  
* Priorizar legibilidad sobre “código inteligente”.  
* Mantener funciones pequeñas.  
* Mantener responsabilidades separadas.  
* Evitar duplicación.  
* Priorizar reutilización.  
* Evitar código muerto.  
* Evitar hardcodear valores.  
* Mantener consistencia.

---

# **4.2 Autodescripción del código**

## **Reglas**

El código debe poder entenderse sin necesidad de explicación externa.

## **Obligatorio**

* Nombres descriptivos.  
* Variables claras.  
* Funciones claras.  
* Componentes descriptivos.  
* Hooks descriptivos.  
* Props descriptivas.  
* Eventos descriptivos.

## **Evitar**

* Nombres genéricos.  
* Variables ambiguas.  
* Abreviaciones innecesarias.

---

# **4.3 Comentarios**

## **Regla obligatoria**

TODO código importante debe incluir comentarios claros.

## **Agregar comentarios especialmente en:**

* Lógica compleja.  
* Transformaciones.  
* Validaciones.  
* Side effects.  
* Hooks personalizados.  
* Algoritmos.  
* Casos edge.  
* Workarounds.  
* Reglas de negocio.

## **Reglas**

* Comentarios claros.  
* Comentarios útiles.  
* Explicar el “por qué”.  
* Evitar comentarios redundantes.

---

# **4.4 Escalabilidad**

## **Reglas**

Todo debe diseñarse pensando en crecimiento futuro.

## **Obligatorio**

* Componentes reutilizables.  
* Arquitectura modular.  
* Separación de responsabilidades.  
* Estructura clara.  
* Features desacopladas.  
* Bajo acoplamiento.  
* Alta cohesión.

---

# **4.5 Robustez**

## **Reglas**

Todo el código debe contemplar:

* Estados edge.  
* Validaciones.  
* Manejo de errores.  
* Estados vacíos.  
* Estados loading.  
* Estados error.  
* Fallbacks.  
* Prevención de crashes.

---

# **5\. Arquitectura frontend**

# **5.1 Arquitectura modular**

## **Reglas**

Cada feature debe estar aislada y organizada.

---

# **5.2 Estructura recomendada**

src/ ├── components/ ├── modules/ ├── pages/ ├── layouts/ ├── hooks/ ├── services/ ├── store/ ├── types/ ├── utils/ ├── constants/ ├── theme/ ├── contexts/ ├── providers/ ├── routes/ └── assets/

---

# **5.3 Modularización por feature**

## **Regla obligatoria**

Cada módulo debe contener su propia lógica.

Ejemplo:

modules/ ├── bookings/ │ ├── components/ │ ├── hooks/ │ ├── services/ │ ├── types/ │ ├── validations/ │ ├── utils/ │ └── store/

---

# **6\. Buenas prácticas React**

# **6.1 Componentes**

## **Reglas obligatorias**

* Componentes pequeños.  
* Componentes reutilizables.  
* Una responsabilidad por componente.  
* Evitar componentes gigantes.  
* Separar lógica de UI.  
* Mantener JSX limpio.  
* Evitar lógica compleja dentro del render.

---

# **6.2 Hooks**

## **Reglas**

* Reutilizar lógica mediante hooks.  
* Hooks pequeños.  
* Hooks desacoplados.  
* Un propósito claro.  
* Evitar hooks monolíticos.

---

# **6.3 Estado**

## **Reglas**

* Mantener estado lo más local posible.  
* Evitar estado global innecesario.  
* Separar estado UI de estado de negocio.  
* Evitar prop drilling.

---

# **6.4 Renderizado**

## **Reglas**

* Evitar rerenders innecesarios.  
* Usar memoización cuando aplique.  
* Lazy loading.  
* Code splitting.  
* Suspense cuando sea necesario.

---

# **7\. JavaScript**

# **7.1 Reglas obligatorias**

* Utilizar JavaScript moderno (ES6+).  
* Mantener estructuras claras y predecibles.  
* Validar props correctamente.  
* Validar respuestas API.  
* Mantener hooks bien estructurados.  
* Mantener estados consistentes.  
* Mantener funciones previsibles y claras.  
* Documentar estructuras complejas.  
* Mantener contratos claros entre componentes y servicios.

---

# **7.2 Organización de estructuras**

## **Reglas**

* Centralizar estructuras reutilizables.  
* Evitar duplicación de modelos de datos.  
* Mantener contratos claros entre componentes y servicios.

---

# **8\. Material UI**

# **8.1 Reglas globales**

Todos los proyectos deben usar Material UI como sistema principal de componentes.

---

# **8.2 Theme global**

## **Obligatorio**

Crear un theme centralizado.

Debe contener:

* Typography.  
* Colors.  
* Spacing.  
* Border radius.  
* Shadows.  
* Breakpoints.  
* Component overrides.

---

# **8.3 Componentes personalizados**

## **Reglas**

* Extender Material UI.  
* Crear wrappers reutilizables.  
* Mantener consistencia visual.  
* Evitar estilos repetidos.

---

# **8.4 Styling**

## **Reglas**

* Priorizar sx.  
* Evitar estilos inline repetitivos.  
* Mantener estilos desacoplados.  
* Centralizar estilos reutilizables.

---

# **9\. Formularios**

# **9.1 Reglas**

Todos los formularios deben:

* Tener validaciones.  
* Mostrar errores claros.  
* Tener loading states.  
* Tener disabled states.  
* Manejar errores backend.  
* Ser accesibles.

---

# **9.2 UX formularios**

## **Reglas**

* Inputs claros.  
* Labels visibles.  
* Feedback visual.  
* Validación amigable.  
* Estados consistentes.

---

# **10\. Manejo de errores**

# **10.1 Reglas obligatorias**

Todo flujo debe manejar:

* Loading.  
* Error.  
* Empty.  
* Success.  
* Retry.

---

# **10.2 Logs**

## **Reglas**

* Logs claros.  
* Logs útiles.  
* Evitar console.log innecesarios.  
* Mantener debugging limpio.

---

# **11\. APIs y servicios**

# **11.1 Reglas**

* Centralizar llamadas API.  
* Separar lógica HTTP.  
* Manejar errores globalmente.  
* Normalizar respuestas.  
* Evitar fetches duplicados.

---

# **11.2 Services**

## **Regla obligatoria**

Toda comunicación externa debe vivir en:

services/

Nunca directamente dentro de componentes.

---

# **12\. Performance**

# **12.1 Reglas obligatorias**

* Optimizar renders.  
* Lazy loading.  
* Virtualización cuando aplique.  
* Optimizar imágenes.  
* Evitar cálculos innecesarios.  
* Evitar renders masivos.

---

# **12.2 Objetivo**

La aplicación debe sentirse:

* Fluida.  
* Rápida.  
* Reactiva.  
* Moderna.

---

# **13\. UI/UX**

# **13.1 Diseño**

Todos los proyectos deben verse:

* Modernos.  
* Profesionales.  
* Limpios.  
* Consistentes.  
* Responsivos.  
* Escalables.

---

# **13.2 Responsive Design**

## **Reglas**

* Mobile first.  
* Sin overflows.  
* Layouts fluidos.  
* Excelente UX móvil.

---

# **13.3 Accesibilidad**

## **Reglas**

* HTML semántico.  
* Navegación teclado.  
* Contraste correcto.  
* Labels correctos.  
* Focus visibles.

---

# **14\. Convenciones globales**

# **14.1 Naming**

## **Reglas**

* camelCase variables.  
* PascalCase componentes.  
* Hooks iniciando con use.  
* Nombres descriptivos.  
* Eventos claros.

---

# **14.2 Archivos**

## **Reglas**

* Un componente por archivo.  
* Un propósito por archivo.  
* Evitar archivos gigantes.  
* Máxima separación.

---

# **14.3 Imports**

## **Reglas**

* Imports ordenados.  
* Evitar imports circulares.  
* Utilizar aliases.

---

# **15\. Calidad de código**

# **15.1 Herramientas obligatorias**

* ESLint.  
* Prettier.  
* Husky.  
* Lint staged.

---

# **15.2 Testing**

## **Recomendado**

* Vitest.  
* React Testing Library.

---

# **16\. Filosofía final**

Todo proyecto debe sentirse:

* Profesional.  
* Escalable.  
* Robusto.  
* Ordenado.  
* Fácil de mantener.  
* Fácil de entender.  
* Bien estructurado.  
* Premium.

---

# **17\. Reglas absolutas**

## **SIEMPRE**

* Usar React.  
* Usar JavaScript moderno (ES6+).  
* Usar Material UI.  
* Escribir comentarios útiles.  
* Priorizar clean code.  
* Priorizar escalabilidad.  
* Priorizar modularidad.  
* Priorizar reutilización.  
* Priorizar legibilidad.  
* Priorizar robustez.  
* Priorizar separación de responsabilidades.

---

## **NUNCA**

* Crear componentes gigantes.  
* Duplicar lógica.  
* Usar estructuras ambiguas o inconsistentes.  
* Mezclar lógica y UI.  
* Hardcodear datos.  
* Ignorar errores.  
* Ignorar loading states.  
* Ignorar edge cases.  
* Crear código acoplado.  
* Crear archivos desordenados.  
* Crear lógica difícil de mantener.

---

# **18\. Resultado esperado**

Todo código generado por el agente Antigravity debe tener estándares profesionales de frontend moderno.

El resultado final debe producir aplicaciones:

* Limpias.  
* Robustas.  
* Escalables.  
* Bien organizadas.  
* Fácilmente mantenibles.  
* Visualmente consistentes.  
* Técnicamente sólidas.  
* Preparadas para crecimiento futuro.  
* Fáciles de entender por cualquier desarrollador.

