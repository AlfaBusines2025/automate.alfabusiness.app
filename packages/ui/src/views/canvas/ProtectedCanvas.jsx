// ProtectedCanvas.jsx
import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Canvas from './index' // Importa el Canvas que se exporta desde index.jsx

// Función para extraer el valor de una cookie
const getCookie = (name) => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop().split(';').shift()
    return null
}

const ProtectedCanvas = () => {
    const location = useLocation()
    const queryParams = new URLSearchParams(location.search)
    const automateId = queryParams.get('automate_id') // Se espera que se mande como parámetro en la URL

    // Obtenemos vendorUid desde las cookies (asegúrate que la cookie se llame "vendorUid")
    const vendorUid = getCookie('vendorUid')

    const [authorized, setAuthorized] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        // Validamos que tengamos tanto vendorUid como automateId
        if (!vendorUid || !automateId) {
            setError('Faltan datos de autenticación.')
            setLoading(false)
            return
        }

        const url = `https://crm.alfabusiness.app/api/${vendorUid}/vendor-settings-automate?automate_id=${automateId}`

        fetch(url)
            .then((response) => response.json())
            .then((data) => {
                if (data.login_automate === true) {
                    setAuthorized(true)
                } else {
                    setAuthorized(false)
                }
                setLoading(false)
            })
            .catch((err) => {
                console.error(err)
                setError(err.message || 'Error al validar la autenticación.')
                setLoading(false)
            })
    }, [vendorUid, automateId])

    if (loading) return <div>Cargando...</div>
    if (error || !authorized) return <div>Acceso no autorizado</div>

    return <Canvas />
}

export default ProtectedCanvas
