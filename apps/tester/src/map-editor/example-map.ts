/**
 * Stato iniziale — città generata stile Watabou (Bluewood-like).
 */
import { generateWatabouCity } from './city-gen'
import type { MedievalMapDocument } from './map-schema'

export const EXAMPLE_MAP: MedievalMapDocument = generateWatabouCity({
  name: 'Bluewood',
  seed: 329373132,
  density: 0.78,
  width: 1100,
  height: 820,
})
