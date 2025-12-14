import { createContext, useContext, useState, useEffect } from 'react'

const ClientContext = createContext()

export function ClientProvider({ children }) {
  const [selectedClient, setSelectedClient] = useState(null)
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch clients on mount
  useEffect(() => {
    fetchClients()
  }, [])

  const fetchClients = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3001/api/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data)

        // Auto-select first client if none selected
        if (data.length > 0 && !selectedClient) {
          setSelectedClient(data[0])
        }
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    } finally {
      setLoading(false)
    }
  }

  const selectClient = (client) => {
    setSelectedClient(client)
    // Store in localStorage for persistence
    if (client) {
      localStorage.setItem('selectedClientId', client.id)
    } else {
      localStorage.removeItem('selectedClientId')
    }
  }

  // Restore selected client from localStorage on mount
  useEffect(() => {
    const storedClientId = localStorage.getItem('selectedClientId')
    if (storedClientId && clients.length > 0) {
      const client = clients.find(c => c.id === parseInt(storedClientId))
      if (client) {
        setSelectedClient(client)
      }
    }
  }, [clients])

  return (
    <ClientContext.Provider value={{
      selectedClient,
      selectClient,
      clients,
      loading,
      refreshClients: fetchClients
    }}>
      {children}
    </ClientContext.Provider>
  )
}

export function useClient() {
  const context = useContext(ClientContext)
  if (!context) {
    throw new Error('useClient must be used within ClientProvider')
  }
  return context
}
