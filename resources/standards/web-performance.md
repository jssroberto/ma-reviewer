## Rendimiento

En este apartado se especifican las buenas prácticas a seguir para garantizar un rendimiento adecuando tanto en frontend como en backend. 
    
### Prácticas de rendimiento Frontend (JS/TS)

Objetivo: asegurar tiempos de carga rápidos, minimizar trabajo en el main thread, y entregar una UX fluida validada por Lighthouse.

#### Metas numéricas

Core Web Vitals

* LCP (Largest Contentful Paint): ≤ 2.5 s
* INP (Interaction to Next Paint): ≤ 200 ms
* CLS (Cumulative Layout Shift): ≤ 0.10
    
Métricas de Lighthouse
* FCP (First Contentful Paint): ≤ 1.8 s
* TBT (Total Blocking Time): ≤ 200 ms
* Speed Index: ≤ 3.4 s

Nota: LCP/INP/CLS son prioridad (impactan ranking y UX). TBT es un buen proxy de INP en Ligthhouse.

#### Validación con Lighthouse (cómo medir)

Revisar con Chrome DevTools → Lighthouse (modo móvil/escritorio dependiendo de la naturaleza del proyecto), seleccionando las opciones de: Performance, Best Practices de manera obligataria, la opción de Accesibility podrá ser requerida dependiendo de las particularidades del proyecto.

Umbrales objetivo: 
* Performance ≥ 90
* Best Practices ≥ 90
* Accessibility ≥ 90
* SEO ≥ 90


**IMPORTANTE: ningún merge a main (producción o UAT según corresponda) si no se consiguen los umbrales objetivo en Lighthouse**

**Overview de aspectos a considerar**
    
| Práctica                                  | Qué significa                          | Acción para cumplir                                                                                         |
| ----------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Elimina JS/CSS no utilizado**           | Bundle con código muerto               | Activa tree-shaking, `splitChunks`, revisa imports, CSS purge                                               |
| **Evita recursos que bloquean el render** | CSS/JS críticos bloquean FCP           | `defer` scripts, critical CSS inline, `media`/`preload`                                                     |
| **Imágenes de formato next-gen**          | PNG/JPEG pesados                       | Convertir a WebP/AVIF (+ compresión)                                                                        |
| **Serve images in proper size**           | Imágenes más grandes que su contenedor | `srcset`/`sizes`, generar variantes responsivas                                                             |
| **Preload key requests**                  | Recursos LCP tardan en comenzar        | `<link rel="preload">` de LCP/Fonts críticos                                                                |
| **Reduce TBT**                            | Mucho trabajo en main thread           | Menos JS, dividir tareas, Web Workers, lazy hydration                                                       |
| **Evitar cambios de layout (CLS)**        | Saltos de contenido                    | Reservar espacio (`width/height`/`aspect-ratio`), carga de fuentes con `swap`, anuncios con contenedor fijo |
| **Usar `font-display`**                   | Bloqueo de texto                       | `font-display: swap/optional`                                                                               |
| **Minimiza el tamaño de la carga**        | Payload inicial alto                   | Code splitting, compresión, cache, quitar librerías pesadas                                                 |


#### Buenas prácticas por categoría
    
En esta sección se describe más a detalle las buenas prácticas que se tienen que llevar a acabo para mantener un rendimiento óptimo en nuestros sistemas.

Estas prácticas pueden revisarse en mayor profundidad en la documentación oficial de: 
    
**Carga y red**

* HTTP/2+ / HTTP/3 habilitado.
* Compresión: Brotli (estático) o Gzip; prioridad a Brotli.
* Cache-Control: Estáticos versionados: `cache-control: public, max-age=31536000, immutable.`
* HTML: `no-store` o `max-age` corto.
* Preconexiones: rel=preconnect a orígenes críticos (CDN, APIs).
* Preload de recursos críticos:
* LCP (imagen/hero):
``` html
<link rel="preload" as="image" href="/hero.webp" imagesrcset="..." imagesizes="..." fetchpriority="high">
```

* Fuentes críticas: `rel="preload" as="font" type="font/woff2"` crossorigin.
* DNS Prefetch para terceros si aplica (rel=dns-prefetch).

**JavaScript (tamaño y ejecución)**

* Code splitting por ruta (lazy routes/componentes).
* Árbol sacudido (tree-shaking) y eliminar JS/CSS no usado (bundle analyzer).
* Evitar tareas largas en main thread (> 50 ms): dividir trabajo, usar Web Workers si hay CPU-bound.
* Defer/async en scripts no críticos; evitar document.write.
* Terceros: cargar async/defer, limitar librerías pesadas; auditar impacto.
* Polyfills: sólo los necesarios (target navegadores soporte del proyecto).

**Imágenes**

* Formatos modernos: WebP/AVIF (fallback si hace falta).
* Responsive: srcset + sizes; nunca una sola imagen gigante.
* Lazy loading en contenido no LCP: loading="lazy" + decoding="async".
* Dimensiones fijas para evitar CLS: width/height o CSS aspect-ratio.
* Sprite/inline sólo para íconos muy pequeños; preferir SVG optimizado.

**Fuentes**

* Subconjunto (subsetting) para reducir peso.
* Preload de la/las familias críticas.
* font-display: swap o optional para evitar retrasos de texto.
* Evitar cambios de layout (CLS) por late-loading de fuentes (usa métricas similares o fallback equilibrado).

**Renderizado y CSS**

* CSS crítico inline (critical CSS) para Above-the-Fold, resto defer o media apropiado.
* Evitar @import en CSS (usa bundler).
* Reducir DOM excesivo (Lighthouse marca >1500 nodos como riesgo).
* Evitar layout thrashing: agrupar lecturas y escrituras al DOM; usar transform/opacity para animaciones (GPU).

**Datos y API**

* Batching de peticiones cuando sea posible.
* Revalidación: ETag/Last-Modified; stale-while-revalidate donde encaje.
* Prefetch condicional (hover/viewport) de datos de próxima ruta.
* Evitar bloqueo por waterfalls iniciales (encadenamientos de fetch innecesarios).

## Anexo

Referencias y documentación utilizada en la elaboración de los estándares de Media Aérea.
    
### Referencias

#### Django (Python)

* Django Official Documentation – Code Style
* PEP 8 – Style Guide for Python Code
* PEP 20 – The Zen of Python
* Django REST Framework – API Guide & Conventions
* Python Logging – Official Library Docs

#### Laravel (PHP)

* Laravel Official Documentation – Coding Style & Conventions
* PSR-1 – Basic Coding Standard (PHP-FIG)
* PSR-12 – Extended Coding Style Guide (PHP-FIG)
* Laravel – Eloquent ORM Official Docs
* Laravel – Routing Documentation
* Laravel – Validation


#### JavaScript / TypeScript

* ECMAScript Language Specification (ECMA-262)
* TypeScript Handbook – Official Docs (Microsoft)
* JavaScript Style Guide – Google
* Airbnb JavaScript Style Guide
* ESLint – Official Documentation
* Prettier – Official Documentation
* MDN Web Docs – JavaScript
* MDN Web Docs – TypeScript Reference


#### Prácticas transversales

* GitHub – Conventional Commits Specification
* Google Developer Style Guide
* W3C – Accessibility Guidelines (WCAG 2.1)
* OWASP Cheat Sheet Series – Secure Coding Practices
* ISO/IEC 25010 – Software Product Quality Model

#### IETF (Internet Engineering Task Force)

* [RFC 9113 – Hypertext Transfer Protocol Version 2 (HTTP/2)](https://datatracker.ietf.org/doc/html/rfc9113)
* [RFC 9114 – Hypertext Transfer Protocol Version 3 (HTTP/3)](https://datatracker.ietf.org/doc/html/rfc9114)
* [RFC 7932 – Brotli Compressed Data Format](https://datatracker.ietf.org/doc/html/rfc7932)

Define los estándares oficiales para la comunicación cliente-servidor moderna (HTTP/2 y HTTP/3) y los formatos de compresión (Brotli) utilizados en la optimización del tráfico web.

#### W3C – World Wide Web Consortium

* [Resource Hints – Preload, Prefetch, Preconnect, DNS-Prefetch (Working Draft)](https://www.w3.org/TR/resource-hints/)
* [HTML Living Standard – Link Types (preload, prefetch, dns-prefetch)](https://html.spec.whatwg.org/multipage/links.html#link-type-preload)

Establece las prácticas recomendadas para la carga anticipada de recursos y la optimización del rendimiento mediante resource hints definidos en el estándar HTML.

#### Google Chrome Developers


* [Lighthouse Overview](https://developer.chrome.com/docs/lighthouse/overview/)
* [Lighthouse Performance Scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring/)
* [Core Web Vitals](https://web.dev/vitals/)

Documentación oficial sobre las herramientas de auditoría de rendimiento, accesibilidad y SEO utilizadas para la medición de métricas críticas (LCP, INP, CLS) y su integración continua.

#### MDN Web Docs

* [HTTP Headers](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers)
* [HTTP Compression (Using Brotli and Gzip)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Compression)
* [Cache-Control Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control)
* [Vary Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Vary)

Base de documentación mantenida por Mozilla, utilizada como referencia internacional para el uso correcto de cabeceras HTTP, políticas de caché y compresión de respuestas.

Web.dev – Performance Guide

* [Web.dev / Fast – Make the Web Faster](https://web.dev/fast/)
* [Web Performance Optimization Fundamentals](https://web.dev/learn/performance/)
* [Measure Performance with Lighthouse and PageSpeed Insights](https://web.dev/measure-performance/)

Guía oficial de Google Web.dev que detalla las mejores prácticas modernas para optimización del rendimiento web, medición con Lighthouse y cumplimiento de los Core Web Vitals.
