// ProtectedMinimalLayout.jsx
import React, { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import MinimalLayout from '@/layout/MinimalLayout'

// Función para extraer el valor de una cookie
const getCookie = (name) => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop().split(';').shift()
    return null
}

const ProtectedMinimalLayout = () => {
    const location = useLocation()
    const queryParams = new URLSearchParams(location.search)
    // Se espera que en Canvas se mande automate_id en la query
    const automateId = queryParams.get('automate_id')

    const vendorUid = getCookie('vendorUid')
    const userUid = getCookie('userUid') || '0'

    const [authorized, setAuthorized] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!vendorUid || !automateId) {
            setError('Faltan datos de autenticación.')
            setLoading(false)
            return
        }

        const url = `https://crm.alfabusiness.app/api/${vendorUid}/vendor-settings-automate?automate_id=${automateId}&user_uid=${userUid}`
        fetch(url)
            .then((response) => response.json())
            .then((data) => {
                // Para Canvas y Chatbot se permite si es admin o si login_automate es true
                if (data.is_admin === true || data.login_automate === true) {
                    setAuthorized(true)
                } else {
                    setAuthorized(false)
                }
                setLoading(false)
            })
            .catch((err) => {
                setError(err.message || 'Error al validar la autenticación.')
                setLoading(false)
            })
    }, [vendorUid, automateId, userUid])

    if (loading) return <div>Cargando...</div>
    if (error || !authorized) return <div>Acceso no autorizado</div>

    // Renderiza el MinimalLayout con todas sus rutas hijas
    return (
        <MinimalLayout>
            <Outlet />
        </MinimalLayout>
    )
}

export default ProtectedMinimalLayout
