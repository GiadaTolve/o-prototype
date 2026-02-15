import { useState, useEffect } from 'react'

/**
 * Hook per rilevare se l'utente sta usando un dispositivo mobile.
 * Usa window.matchMedia per rilevare schermi piccoli e touch capability.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Funzione per controllare se è mobile
    const checkMobile = () => {
      // Controlla la larghezza dello schermo (mobile tipicamente < 768px)
      const isSmallScreen = window.matchMedia('(max-width: 768px)').matches
      
      // Controlla se ha touch capability
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      
      // Controlla user agent per dispositivi mobili comuni
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase())
      
      // È mobile se: schermo piccolo E (touch capability O mobile user agent)
      setIsMobile(isSmallScreen && (hasTouch || isMobileUA))
    }

    // Controlla all'avvio
    checkMobile()

    // Ascolta cambiamenti di dimensione finestra
    window.addEventListener('resize', checkMobile)
    
    // Ascolta cambiamenti di orientamento (per tablet/phone)
    window.addEventListener('orientationchange', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('orientationchange', checkMobile)
    }
  }, [])

  return isMobile
}
