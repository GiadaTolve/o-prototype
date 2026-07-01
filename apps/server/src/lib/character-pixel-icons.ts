/** Payload pixel-icon per chat / scheda (allineato al client `PixelIcons`). */
export type CharacterPixelIcons = {
  ruolo?: string[]
  ordine?: string[]
  premioSpeciale?: string[]
}

const VALID_RUOLI = new Set(['admin', 'moderatore', 'capo-shinigami', 'shinigami'])

type UiMeta = {
  roleIcon?: string
  orderIcon?: string
  premioSpeciale?: string
}

export function buildCharacterPixelIcons(
  meta: UiMeta | null | undefined,
  order?: string | null,
): CharacterPixelIcons | undefined {
  const pixelIcons: CharacterPixelIcons = {}
  const roleIcon = (meta?.roleIcon ?? '').toLowerCase()
  if (roleIcon && VALID_RUOLI.has(roleIcon)) {
    pixelIcons.ruolo = [roleIcon]
  }

  const orderIcon = (meta?.orderIcon ?? '').toLowerCase()
  if (orderIcon === 'mugen-tai' || orderIcon === 'chisen-tai') {
    pixelIcons.ordine = [orderIcon]
  } else if (order === 'MUGEN-TAI') {
    pixelIcons.ordine = ['mugen-tai']
  } else if (order === 'CHISEN-TAI') {
    pixelIcons.ordine = ['chisen-tai']
  }

  const premio = meta?.premioSpeciale?.trim()
  if (premio) {
    pixelIcons.premioSpeciale = [premio]
  }

  return Object.keys(pixelIcons).length > 0 ? pixelIcons : undefined
}
