/**
 * El service worker cachea la app para que funcione sin red, pero eso deja a
 * los móviles semanas con la versión del primer día: Chrome solo revisa si hay
 * una nueva cada 24 h y la página no se recarga sola. Aquí forzamos la
 * comprobación en cada visita y recargamos cuando la nueva toma el control.
 */
export function keepAppUpdated(): void {
  if (!('serviceWorker' in navigator)) return

  const hadController = Boolean(navigator.serviceWorker.controller)

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    // en la primera instalación también cambia el controlador: no recargar
    if (hadController) window.location.reload()
  })

  void navigator.serviceWorker.ready
    .then((registration) => registration.update())
    .catch(() => undefined)
}
