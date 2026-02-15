'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api' // Ora punta al file giusto dentro client!

interface CharacterForm {
  surname: string
  bio: string
  avatar: string
  miniAvatar: string
  order: 'MUGEN-TAI' | 'CHISEN-TAI'
  stats: { f: number; c: number; d: number; m: number; e: number }
}

export default function CreateCharacterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState<CharacterForm>({
    surname: '',
    bio: '',
    avatar: '',
    miniAvatar: '',
    order: 'MUGEN-TAI',
    stats: { f: 0, c: 0, d: 0, m: 0, e: 0 }
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleStatChange = (stat: string, value: string) => {
    setFormData({
      ...formData,
      stats: { ...formData.stats, [stat]: Number(value) }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await api.post('/characters/onboarding', formData)
      // Se successo, andiamo alla Dashboard (che esiste già nel tuo albero!)
      router.push('/dashboard') 
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-8 font-sans flex items-center justify-center">
      <div className="max-w-3xl w-full bg-gray-900/50 p-8 rounded-xl border border-gray-800 shadow-2xl">
        <h1 className="text-3xl font-bold mb-6 text-purple-500 border-b border-purple-900 pb-4 text-center">
          IDENTITÀ ANALISTA
        </h1>
        
        {error && <div className="bg-red-900/50 border border-red-700 p-4 mb-6 rounded text-red-200 text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2 uppercase tracking-wide">Cognome</label>
              <input name="surname" value={formData.surname} onChange={handleChange} 
                className="w-full p-3 bg-black border border-gray-700 rounded focus:border-purple-500 outline-none transition-colors" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2 uppercase tracking-wide">Ordine</label>
              <select name="order" value={formData.order} onChange={handleChange}
                className="w-full p-3 bg-black border border-gray-700 rounded focus:border-purple-500 outline-none appearance-none">
                <option value="MUGEN-TAI">Mugen-Tai (Combattimento)</option>
                <option value="CHISEN-TAI">Chisen-Tai (Intelletto)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2 uppercase tracking-wide">Avatar URL (400x350)</label>
              <input name="avatar" value={formData.avatar} onChange={handleChange} placeholder="https://..."
                className="w-full p-3 bg-black border border-gray-700 rounded focus:border-purple-500 outline-none" required />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2 uppercase tracking-wide">Mini-Avatar URL (Icona)</label>
              <input name="miniAvatar" value={formData.miniAvatar} onChange={handleChange} placeholder="https://..."
                className="w-full p-3 bg-black border border-gray-700 rounded focus:border-purple-500 outline-none" required />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2 uppercase tracking-wide">Biografia</label>
            <textarea name="bio" value={formData.bio} onChange={handleChange} rows={4}
              className="w-full p-3 bg-black border border-gray-700 rounded focus:border-purple-500 outline-none" />
          </div>

          <div className="p-6 border border-yellow-900/30 rounded-lg bg-black/40">
            <h3 className="text-xl mb-6 text-yellow-500 font-mono tracking-wider text-center border-b border-yellow-900/30 pb-2">CALIBRAZIONE PARAMETRI</h3>
            <div className="grid grid-cols-5 gap-4 text-center">
              {['f', 'c', 'd', 'm', 'e'].map((stat) => (
                <div key={stat}>
                  <label className="block uppercase font-bold text-gray-500 text-xs mb-2">{stat}</label>
                  <input 
                    type="number" 
                    min="0" max="10" 
                    value={formData.stats[stat as keyof typeof formData.stats]}
                    onChange={(e) => handleStatChange(stat, e.target.value)}
                    className="w-full p-3 bg-gray-900 text-center text-white font-bold border border-gray-700 rounded focus:border-yellow-500 outline-none transition-all"
                  />
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center font-mono">Totale punti consigliato per inizio: 15-20</p>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-4 bg-purple-900 hover:bg-purple-700 text-white font-bold rounded transition-all uppercase tracking-widest border border-purple-800 hover:border-purple-500 shadow-lg shadow-purple-900/20">
            {loading ? 'Inizializzazione...' : 'Conferma Identità'}
          </button>
        </form>
      </div>
    </div>
  )
}