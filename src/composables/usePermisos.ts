import { computed, ref } from 'vue'
import { apiMock } from '../services/api'
import { useAuth } from './useAuth'
import {
  ROL_USUARIO,
  can,
  canAccess,
  defaultPermissions,
  type Action,
  type ModuleId,
  type RolePermissions,
} from '../router/access'

const LS_PERMISOS = 'uzdi_permisos_v2'

interface Snapshot {
  rol: number
  permisos: RolePermissions
}

function leerSnapshot(): Snapshot | null {
  try {
    const raw = localStorage.getItem(LS_PERMISOS)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<Snapshot>
    if (typeof parsed.rol !== 'number' || !parsed.permisos || typeof parsed.permisos !== 'object') {
      return null
    }
    return { rol: parsed.rol, permisos: parsed.permisos as RolePermissions }
  } catch {
    return null
  }
}

function guardarSnapshot(snapshot: Snapshot): void {
  localStorage.setItem(LS_PERMISOS, JSON.stringify(snapshot))
}

const snapshot = ref<Snapshot | null>(leerSnapshot())
const cargando = ref(false)
const error = ref<string | null>(null)

/** Permisos vigentes para el guard: snapshot de la sesión o matriz por defecto. */
export function permisosVigentes(tppr: number | undefined | null): RolePermissions {
  const actual = tppr ?? ROL_USUARIO
  const snap = snapshot.value
  if (snap && snap.rol === actual) return snap.permisos
  return defaultPermissions(actual)
}

/**
 * Permisos del usuario en sesión. Los cambios hechos en RF-10 se aplican
 * en el siguiente ingreso (se cargan al iniciar sesión y quedan en el snapshot).
 */
export function usePermisos() {
  const { user } = useAuth()

  const tppr = computed(() => (user.value?.['tppr_id'] as number) ?? ROL_USUARIO)
  const permisos = computed<RolePermissions>(() => permisosVigentes(tppr.value))

  function puede(module: ModuleId, action: Action): boolean {
    return can(module, action, tppr.value, permisos.value)
  }

  function visible(module: ModuleId): boolean {
    return canAccess(module, tppr.value, permisos.value)
  }

  /** Carga la matriz vigente del rol y la fija para esta sesión. */
  async function cargar(): Promise<void> {
    cargando.value = true
    error.value = null
    const rol = tppr.value
    try {
      // PENDIENTE BACKEND: GET /api/v1/permisos/:rol con matriz módulo → acciones.
      // Hasta entonces se usa el mock explícitamente, también con backend real.
      const { data } = await apiMock.get<RolePermissions>(`/permisos/${rol}`)
      snapshot.value = { rol, permisos: data }
      guardarSnapshot(snapshot.value)
    } catch {
      const porDefecto = defaultPermissions(rol)
      snapshot.value = { rol, permisos: porDefecto }
      guardarSnapshot(snapshot.value)
      error.value = 'No se pudo cargar la matriz de permisos; se usó la configuración por defecto.'
    } finally {
      cargando.value = false
    }
  }

  function limpiar(): void {
    snapshot.value = null
    localStorage.removeItem(LS_PERMISOS)
  }

  return {
    tppr,
    permisos,
    cargando,
    error,
    puede,
    visible,
    can: puede,
    canAccess: visible,
    moduleVisible: visible,
    cargar,
    limpiar,
  }
}
