import { WAZA_CATEGORIES, WAZA_CONSISTENCIES } from './wazaTaxonomy'

type Props = {
  /** Campo attivo per l'inserimento tag. */
  activeField: 'desc' | 'effect'
  onActiveFieldChange: (field: 'desc' | 'effect') => void
  onInsertTag: (tagLabel: string) => void
}

export function WazaTaxonomyInsertPanel({ activeField, onActiveFieldChange, onInsertTag }: Props) {
  return (
    <div className="wit-subpanel wit-taxonomy-insert">
      <div className="wit-field">
        <span className="wit-label">Inserisci tag in</span>
        <div className="wit-choice-row">
          {(
            [
              ['desc', 'Descrizione'],
              ['effect', 'Effetto'],
            ] as const
          ).map(([id, label]) => (
            <label key={id} className="wit-choice">
              <input
                type="radio"
                name="wit-taxonomy-target"
                checked={activeField === id}
                onChange={() => onActiveFieldChange(id)}
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
        <p className="wit-hint wit-hint--flush-top">
          Clicca un chip per aggiungere <code className="wit-inline-code">[Tag]</code> al cursore. Fonte:{' '}
          <code className="wit-inline-code">@domain/combat/waza-taxonomy</code> · manuale.
        </p>
      </div>

      <div className="wit-field">
        <span className="wit-label wit-label--block-mt">Consistenze</span>
        <div className="wit-taxonomy-chip-grid">
          {WAZA_CONSISTENCIES.filter((c) => c.implemented).map((c) => (
            <button
              key={c.id}
              type="button"
              className="wit-taxonomy-chip wit-taxonomy-chip--consistency"
              title={c.description}
              onClick={() => onInsertTag(c.tag)}
            >
              [{c.tag}]
            </button>
          ))}
        </div>
      </div>

      <div className="wit-field">
        <span className="wit-label wit-label--block-mt">Categorie</span>
        <div className="wit-taxonomy-chip-grid">
          {WAZA_CATEGORIES.filter((c) => c.implemented).map((c) => (
            <button
              key={c.id}
              type="button"
              className="wit-taxonomy-chip wit-taxonomy-chip--category"
              title={c.description}
              onClick={() => onInsertTag(c.tag)}
            >
              [{c.tag}]
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
