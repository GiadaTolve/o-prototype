/**
 * Fantasy City Builder — carica mappa, zone, parcellation Watabou.
 */
import FantasyCityBuilder from './FantasyCityBuilder'
import './SvgMapEditor.css'

export default function SvgMapEditor() {
  return (
    <div className="dash-map dash-map--fcb">
      <header className="dash-map__bar">
        <strong>Fantasy City Builder</strong>
        <span>Mappa Giappone · palette Dark Arcane · parcellation</span>
      </header>
      <div className="dash-map__stage dash-map__stage--editor">
        <FantasyCityBuilder />
      </div>
    </div>
  )
}
