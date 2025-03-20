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
    // automate_id es opcional en Canvas/Chatbot
    const automateId = queryParams.get('automate_id')
    console.log('cgl: automateId:', automateId)

    const vendorUid = getCookie('vendorUid')
    const userUid = getCookie('userUid') || '0'
    console.log('cgl: vendorUid:', vendorUid)
    console.log('cgl: userUid:', userUid)

    const [authorized, setAuthorized] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        console.log('cgl: Iniciando ProtectedMinimalLayout useEffect')
        if (!vendorUid) {
            console.log('cgl: Falta vendorUid')
            setError('Faltan datos de autenticación.')
            setLoading(false)
            return
        }

        let url = `https://crm.alfabusiness.app/api/${vendorUid}/vendor-settings-automate?user_uid=${userUid}`
        if (automateId) {
            url += `&automate_id=${automateId}`
        }
        console.log('cgl: URL de autenticación:', url)

        fetch(url)
            .then((response) => {
                console.log('cgl: Respuesta fetch:', response)
                return response.json()
            })
            .then((data) => {
                console.log('cgl: Datos recibidos:', data)
                // Para Canvas/Chatbot se permite si es admin o si login_automate es true
                if (data.is_admin === true || data.login_automate === true) {
                    console.log('cgl: Autorizado (is_admin true o login_automate true)')
                    setAuthorized(true)
                } else {
                    console.log('cgl: No autorizado (no se cumple ninguna condición)')
                    setAuthorized(false)
                }
                setLoading(false)
            })
            .catch((err) => {
                console.error('cgl: Error en fetch:', err)
                setError(err.message || 'Error al validar la autenticación.')
                setLoading(false)
            })
    }, [vendorUid, automateId, userUid])

    console.log('cgl: Estado final - loading:', loading, 'error:', error, 'authorized:', authorized)

    if (loading) return <div>Cargando...</div>
    if (error || !authorized) return <div>Acceso no autorizado</div>

    return (
        <MinimalLayout>
            <Outlet />
        </MinimalLayout>
    )
}

export default ProtectedMinimalLayout
